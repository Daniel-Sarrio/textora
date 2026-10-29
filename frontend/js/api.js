// El frontend se sirve con Live Server (puerto 5500) y el backend escucha en el 3000.
const API_URL = "http://localhost:3000/api";

async function obtenerProductos() {
    try {
        const respuesta = await fetch(
            `${API_URL}/subfamilias/F04S351/productos`
        );

        if (!respuesta.ok) {
            throw new Error("Error al obtener productos");
        }

        const productos = await respuesta.json();

        console.log(productos);

        document.getElementById("productos").textContent =
            JSON.stringify(productos, null, 2);

    } catch (error) {
        console.error(error);

        document.getElementById("productos").textContent =
            "No se han podido cargar los productos";
    }
}

obtenerProductos();