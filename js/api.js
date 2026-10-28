// Función para obtener los productos de la API
async function obtenerProductos() {

    const url = new URL("https://www.es-tela.com/api/");

    url.searchParams.set("r", "es/productosEnSubfamilia/F04S351");
    url.searchParams.set("cli", window.TEXORA_CONFIG.cliente);
    url.searchParams.set("apikey", window.TEXORA_CONFIG.apiKey);

    try {

        // Petición a la API
        const respuesta = await fetch(url);

        if (!respuesta.ok) {
            throw new Error("Error HTTP: " + respuesta.status);
        }

        // Convertimos la respuesta a JSON
        const productos = await respuesta.json();

        // Mostramos los productos por consola
        console.log(productos);

        // Mostramos el JSON en la página
        document.getElementById("productos").textContent =
            JSON.stringify(productos, null, 2);

    } catch (error) {

    console.error("Error al obtener productos:", error);

    document.getElementById("productos").textContent =
        "Error: " + error.message;

}
}

// Ejecutamos la función
obtenerProductos();