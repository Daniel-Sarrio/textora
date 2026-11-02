// Registro, login y logout. Usa API_URL definido en api.js.
// La sesión va en una cookie HttpOnly: aquí no se guarda ningún token.
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const formLogin = document.getElementById("form-login");
const formRegistro = document.getElementById("form-registro");
const botonLogout = document.getElementById("boton-logout");

async function peticionAuth(ruta, opciones = {}) {
    const respuesta = await fetch(`${API_URL}/auth/${ruta}`, {
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        ...opciones,
    });
    const datos = await respuesta.json().catch(() => ({}));

    if (!respuesta.ok) {
        throw new Error(datos.error || "Error inesperado");
    }

    return datos;
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

// Gestiona los dos formularios sin duplicar la lógica.
function manejarFormulario(form, ruta, validar) {
    form.addEventListener("submit", async function (evento) {
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
            await peticionAuth(ruta, {
                method: "POST",
                body: JSON.stringify({
                    name: campos.name,
                    email: campos.email,
                    password: campos.password,
                }),
            });

            form.reset();
            window.location.replace("catalogo.html");
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
    botonLogout.disabled = true;

    try {
        await peticionAuth("logout", { method: "POST" });
        window.location.replace("index.html");
    } catch (error) {
        console.error("No se ha podido cerrar la sesión", error);
        botonLogout.disabled = false;
    }
}

// Solo muestra el catálogo después de comprobar la sesión.
async function comprobarAccesoCatalogo() {
    try {
        const { user } = await peticionAuth("me");
        document.getElementById("nombre-usuario").textContent = user.name;
        document.body.hidden = false;
        return true;
    } catch (error) {
        window.location.replace("index.html");
        return false;
    }
}

// Si ya hay sesión, no tiene sentido volver al login o al registro.
async function redirigirUsuarioAutenticado() {
    try {
        await peticionAuth("me");
        window.location.replace("catalogo.html");
    } catch (error) {
        // Sin sesión: permanece en la página de autenticación.
    }
}

if (formLogin) {
    manejarFormulario(formLogin, "login", validarLogin);
    redirigirUsuarioAutenticado();
}

if (formRegistro) {
    manejarFormulario(formRegistro, "register", validarRegistro);
    redirigirUsuarioAutenticado();
}

if (botonLogout) {
    botonLogout.addEventListener("click", cerrarSesion);
}
