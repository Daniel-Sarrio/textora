// Registro, login y logout. Usa API_URL definido en api.js.
// La sesión va en una cookie HttpOnly: aquí no se guarda ningún token.
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const seccionAuth = document.getElementById("seccion-auth");
const formLogin = document.getElementById("form-login");
const formRegistro = document.getElementById("form-registro");
const usuarioActivo = document.getElementById("usuario-activo");
const usuarioAnonimo = document.getElementById("usuario-anonimo");

async function peticionAuth(ruta, opciones = {}) {
    const respuesta = await fetch(`${API_URL}/auth/${ruta}`, {
        credentials: "include", // envía y recibe la cookie de sesión
        headers: { "Content-Type": "application/json" },
        ...opciones,
    });
    const datos = await respuesta.json().catch(() => ({}));

    if (!respuesta.ok) {
        throw new Error(datos.error || "Error inesperado");
    }

    return datos;
}

function mostrarUsuario(usuario) {
    const identificado = Boolean(usuario);

    // textContent evita inyectar HTML con el nombre del usuario.
    document.getElementById("nombre-usuario").textContent = usuario ? usuario.name : "";
    usuarioActivo.hidden = !identificado;
    usuarioAnonimo.hidden = identificado;
    seccionAuth.hidden = true;
}

function mostrarFormulario(form) {
    seccionAuth.hidden = false;
    formLogin.hidden = form !== formLogin;
    formRegistro.hidden = form !== formRegistro;
    form.querySelector(".error").textContent = "";
    form.querySelector("input").focus();
}

function validarLogin({ email, password }) {
    if (!EMAIL_REGEX.test(email)) return "Introduce un email válido";
    if (!password) return "Introduce tu contraseña";
    return null;
}

function validarRegistro({ name, email, password, password2 }) {
    if (name.length < 2) return "El nombre debe tener al menos 2 caracteres";
    if (!EMAIL_REGEX.test(email)) return "Introduce un email válido";
    if (password.length < 8) return "La contraseña debe tener al menos 8 caracteres";
    if (password !== password2) return "Las contraseñas no coinciden";
    return null;
}

// Gestiona el envío de un formulario: valida, llama a la API y muestra errores.
function manejarFormulario(form, ruta, validar) {
    form.addEventListener("submit", async (evento) => {
        evento.preventDefault();

        const mensaje = form.querySelector(".error");
        const boton = form.querySelector("button[type=submit]");
        const campos = Object.fromEntries(new FormData(form));

        campos.name = (campos.name || "").trim();
        campos.email = campos.email.trim();

        const errorValidacion = validar(campos);
        if (errorValidacion) {
            mensaje.textContent = errorValidacion;
            return;
        }

        boton.disabled = true;
        mensaje.textContent = "";

        try {
            const { user } = await peticionAuth(ruta, {
                method: "POST",
                body: JSON.stringify({
                    name: campos.name,
                    email: campos.email,
                    password: campos.password,
                }),
            });

            form.reset();
            mostrarUsuario(user);
        } catch (error) {
            mensaje.textContent = error.message === "Failed to fetch"
                ? "No se pudo conectar con el servidor"
                : error.message;
        } finally {
            boton.disabled = false;
        }
    });
}

async function cerrarSesion() {
    try {
        await peticionAuth("logout", { method: "POST" });
    } catch (error) {
        console.error(error);
    }

    mostrarUsuario(null);
}

// Al cargar la página, comprueba si ya hay una sesión activa.
async function comprobarSesion() {
    try {
        const { user } = await peticionAuth("me");
        mostrarUsuario(user);
    } catch (error) {
        mostrarUsuario(null);
    }
}

document.getElementById("boton-mostrar-login")
    .addEventListener("click", () => mostrarFormulario(formLogin));
document.getElementById("boton-mostrar-registro")
    .addEventListener("click", () => mostrarFormulario(formRegistro));
document.getElementById("boton-logout").addEventListener("click", cerrarSesion);

manejarFormulario(formLogin, "login", validarLogin);
manejarFormulario(formRegistro, "register", validarRegistro);
comprobarSesion();
