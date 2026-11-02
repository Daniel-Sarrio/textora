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
    } catch (error) {
        console.error("No se han podido cargar los productos", error);
        mostrarEstadoProductos("No se han podido cargar los productos");
    }
}

async function iniciarCatalogo() {
    try {
        const datos = await obtenerFamilias();
        familias = convertirFamiliasEnArray(datos);

        if (familias.length === 0) {
            selectorFamilia.innerHTML = '<option value="">No hay familias disponibles</option>';
            mostrarEstadoProductos("No hay familias disponibles");
            return;
        }

        mostrarFamilias();
        mostrarEstadoProductos("Selecciona una familia y una subfamilia");
    } catch (error) {
        console.error("No se han podido cargar las familias", error);
        selectorFamilia.innerHTML = '<option value="">Error al cargar familias</option>';
        mostrarEstadoProductos("No se han podido cargar las familias");
    }
}

selectorFamilia.addEventListener("change", actualizarSubfamilias);
selectorSubfamilia.addEventListener("change", cargarProductos);

iniciarCatalogo();
