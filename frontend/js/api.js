// El frontend se sirve con Live Server (puerto 5500) y el backend escucha en el 3000.
const API_URL = "http://localhost:3000/api";

async function obtenerFamilias() {
    const respuesta = await fetch(`${API_URL}/familias`);

    if (!respuesta.ok) {
        throw new Error("Error al obtener las familias");
    }

    return await respuesta.json();
}

async function obtenerProductosPorSubfamilia(idSubfamilia) {
    const respuesta = await fetch(
        `${API_URL}/subfamilias/${encodeURIComponent(idSubfamilia)}/productos`
    );

    if (!respuesta.ok) {
        throw new Error("Error al obtener productos");
    }

    return await respuesta.json();
}

function crearTarjetaProducto(producto) {
    const tarjeta = document.createElement("article");
    tarjeta.className = "tarjeta-producto";

    const imagen = document.createElement("img");
    imagen.className = "imagen-producto";
    imagen.src = producto.img_ppal_med || producto.img_ppal_min;
    imagen.alt = producto.descripcion || "Producto textil";
    imagen.loading = "lazy";

    // Si falla la imagen mediana, se prueba con la miniatura.
    imagen.addEventListener("error", function () {
        if (producto.img_ppal_min && imagen.src !== producto.img_ppal_min) {
            imagen.src = producto.img_ppal_min;
        } else {
            imagen.hidden = true;
        }
    });

    const informacion = document.createElement("div");
    informacion.className = "informacion-producto";

    const descripcion = document.createElement("h3");
    descripcion.textContent = producto.descripcion || "Producto sin descripción";

    const referencia = document.createElement("p");
    referencia.className = "referencia-producto";
    referencia.textContent = "Ref. " + producto.refProducto;

    informacion.append(descripcion, referencia);
    tarjeta.append(imagen, informacion);

    return tarjeta;
}

function mostrarProductos(productos) {
    const catalogo = document.getElementById("productos");
    const estado = document.getElementById("estado-productos");

    catalogo.innerHTML = "";

    if (!Array.isArray(productos) || productos.length === 0) {
        estado.hidden = false;
        estado.textContent = "No hay productos disponibles";
        return;
    }

    for (const producto of productos) {
        const tarjeta = crearTarjetaProducto(producto);
        catalogo.appendChild(tarjeta);
    }

    estado.hidden = true;
}

function mostrarEstadoProductos(mensaje) {
    const catalogo = document.getElementById("productos");
    const estado = document.getElementById("estado-productos");

    catalogo.innerHTML = "";
    estado.hidden = false;
    estado.textContent = mensaje;
}
