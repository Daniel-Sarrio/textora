// Navegación del catálogo por familias y subfamilias.
const selectorFamilia = document.getElementById("selector-familia");
const selectorSubfamilia = document.getElementById("selector-subfamilia");

let familias = [];

function convertirFamiliasEnArray(datos) {
    if (Array.isArray(datos)) {
        return datos;
    }

    if (datos && typeof datos === "object") {
        return Object.values(datos);
    }

    return [];
}

function mostrarFamilias() {
    selectorFamilia.innerHTML = '<option value="">Selecciona una familia</option>';

    for (const familia of familias) {
        const opcion = document.createElement("option");
        opcion.value = familia.refFamilia;
        opcion.textContent = familia.descripcion;
        selectorFamilia.appendChild(opcion);
    }

    selectorFamilia.disabled = false;
}

function actualizarSubfamilias() {
    const idFamilia = selectorFamilia.value;
    const familiaSeleccionada = familias.find(function (familia) {
        return familia.refFamilia === idFamilia;
    });

    selectorSubfamilia.innerHTML = "";
    mostrarEstadoProductos("Selecciona una subfamilia para ver sus productos");

    if (!familiaSeleccionada || !Array.isArray(familiaSeleccionada.subfamilias)) {
        const opcion = document.createElement("option");
        opcion.value = "";
        opcion.textContent = "Selecciona primero una familia";
        selectorSubfamilia.appendChild(opcion);
        selectorSubfamilia.disabled = true;
        return;
    }

    const opcionInicial = document.createElement("option");
    opcionInicial.value = "";
    opcionInicial.textContent = "Selecciona una subfamilia";
    selectorSubfamilia.appendChild(opcionInicial);

    for (const subfamilia of familiaSeleccionada.subfamilias) {
        const opcion = document.createElement("option");
        opcion.value = subfamilia.refsubfamilia;
        opcion.textContent = subfamilia.descripcion;
        selectorSubfamilia.appendChild(opcion);
    }

    selectorSubfamilia.disabled = familiaSeleccionada.subfamilias.length === 0;
}

async function cargarProductos() {
    const idSubfamilia = selectorSubfamilia.value;

    if (!idSubfamilia) {
        mostrarEstadoProductos("Selecciona una subfamilia para ver sus productos");
        return;
    }

    mostrarEstadoProductos("Cargando productos...");

    try {
        const productos = await obtenerProductosPorSubfamilia(idSubfamilia);
        mostrarProductos(productos);
        activarEnlacesProductos(productos);
    } catch (error) {
        console.error("No se han podido cargar los productos", error);
        mostrarEstadoProductos("No se han podido cargar los productos");
    }
}

function abrirDetalleProducto(producto) {
    // Se conserva la imagen del listado como alternativa si el detalle no trae galería.
    sessionStorage.setItem("productoSeleccionado", JSON.stringify(producto));
    window.location.href = `producto.html?id=${encodeURIComponent(producto.refProducto)}`;
}

function activarEnlacesProductos(productos) {
    const tarjetas = document.querySelectorAll(".tarjeta-producto");

    tarjetas.forEach(function (tarjeta, indice) {
        const producto = productos[indice];

        tarjeta.tabIndex = 0;
        tarjeta.setAttribute("role", "link");
        tarjeta.setAttribute("aria-label", `Ver ${producto.descripcion}`);

        tarjeta.addEventListener("click", function () {
            abrirDetalleProducto(producto);
        });

        tarjeta.addEventListener("keydown", function (evento) {
            if (evento.key === "Enter" || evento.key === " ") {
                evento.preventDefault();
                abrirDetalleProducto(producto);
            }
        });
    });
}

async function iniciarCatalogo() {
    const tieneAcceso = await comprobarAccesoCatalogo();

    if (!tieneAcceso) {
        return;
    }

    try {
        const datos = await obtenerFamilias();
        familias = convertirFamiliasEnArray(datos);

        if (familias.length === 0) {
            selectorFamilia.innerHTML = '<option value="">No hay familias disponibles</option>';
            mostrarEstadoProductos("No hay familias disponibles");
            return;
        }

        mostrarFamilias();
        restaurarSeleccionCatalogo();
    } catch (error) {
        console.error("No se han podido cargar las familias", error);
        selectorFamilia.innerHTML = '<option value="">Error al cargar familias</option>';
        mostrarEstadoProductos("No se han podido cargar las familias");
    }
}

function restaurarSeleccionCatalogo() {
    const familiaGuardada = sessionStorage.getItem("familiaCatalogo");
    const subfamiliaGuardada = sessionStorage.getItem("subfamiliaCatalogo");
    const existeFamilia = Array.from(selectorFamilia.options).some(function (opcion) {
        return opcion.value === familiaGuardada;
    });

    if (!existeFamilia) {
        mostrarEstadoProductos("Selecciona una familia y una subfamilia");
        return;
    }

    selectorFamilia.value = familiaGuardada;
    actualizarSubfamilias();

    const existeSubfamilia = Array.from(selectorSubfamilia.options).some(function (opcion) {
        return opcion.value === subfamiliaGuardada;
    });

    if (existeSubfamilia) {
        selectorSubfamilia.value = subfamiliaGuardada;
        cargarProductos();
    }
}

selectorFamilia.addEventListener("change", function () {
    sessionStorage.setItem("familiaCatalogo", selectorFamilia.value);
    sessionStorage.removeItem("subfamiliaCatalogo");
    actualizarSubfamilias();
});

selectorSubfamilia.addEventListener("change", function () {
    sessionStorage.setItem("subfamiliaCatalogo", selectorSubfamilia.value);
    cargarProductos();
});

iniciarCatalogo();
