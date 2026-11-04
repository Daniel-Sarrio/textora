// Ficha de producto y variantes reales de ES-TELA.
const ID_VALIDO = /^[A-Za-z0-9._-]{1,64}$/;

const estadoDetalle = document.getElementById("estado-detalle");
const detalleProducto = document.getElementById("detalle-producto");
const selectorTalla = document.getElementById("selector-talla");
const selectorColor = document.getElementById("selector-color");
const estadoVariante = document.getElementById("estado-variante");
const datosArticulo = document.getElementById("datos-articulo");

let articulos = [];

async function pedirDatos(ruta) {
    const respuesta = await fetch(`${API_URL}${ruta}`, {
        credentials: "include",
    });

    if (respuesta.status === 401) {
        window.location.replace("index.html");
        throw new Error("Sesión no válida");
    }

    if (!respuesta.ok) {
        throw new Error("No se pudieron obtener los datos");
    }

    return await respuesta.json();
}

function obtenerImagenes(datos) {
    if (!datos || typeof datos !== "object") {
        return [];
    }

    const imagenes = [];

    for (const imagen of Object.values(datos)) {
        if (imagen && (imagen.url_med || imagen.url_min)) {
            imagenes.push(imagen);
        }
    }

    return imagenes;
}

function mostrarImagenPrincipal(url, descripcion) {
    const imagen = document.getElementById("imagen-principal");
    const sinImagen = document.getElementById("sin-imagen");

    if (!url) {
        imagen.hidden = true;
        sinImagen.hidden = false;
        return;
    }

    imagen.hidden = false;
    sinImagen.hidden = true;
    imagen.src = url;
    imagen.alt = descripcion;
}

function mostrarGaleria(producto) {
    const contenedor = document.getElementById("miniaturas-producto");
    let imagenes = obtenerImagenes(producto.imagenes);

    if (imagenes.length === 0 && Array.isArray(producto.colores)) {
        for (const color of producto.colores) {
            imagenes = imagenes.concat(obtenerImagenes(color.imagenes));
        }
    }

    let productoGuardado = null;

    try {
        productoGuardado = JSON.parse(
            sessionStorage.getItem("productoSeleccionado") || "null"
        );
    } catch (error) {
        sessionStorage.removeItem("productoSeleccionado");
    }

    if (imagenes.length === 0 && productoGuardado?.refProducto === producto.refProducto) {
        imagenes.push({
            url_med: productoGuardado.img_ppal_med,
            url_min: productoGuardado.img_ppal_min,
        });
    }

    contenedor.innerHTML = "";
    const primeraImagen = imagenes[0];
    mostrarImagenPrincipal(
        primeraImagen && (primeraImagen.url_med || primeraImagen.url_min),
        producto.descripcion || "Producto textil"
    );

    for (const imagen of imagenes) {
        const boton = document.createElement("button");
        const miniatura = document.createElement("img");
        const urlGrande = imagen.url_med || imagen.url_min;

        boton.type = "button";
        boton.className = "boton-miniatura";
        boton.setAttribute("aria-label", "Ver otra imagen del producto");
        miniatura.src = imagen.url_min || urlGrande;
        miniatura.alt = "";
        boton.appendChild(miniatura);
        boton.addEventListener("click", function () {
            mostrarImagenPrincipal(urlGrande, producto.descripcion || "Producto textil");
        });
        contenedor.appendChild(boton);
    }
}

function agregarDatoProducto(lista, titulo, valor) {
    if (!valor) {
        return;
    }

    const termino = document.createElement("dt");
    const descripcion = document.createElement("dd");
    termino.textContent = titulo;
    descripcion.textContent = valor;
    lista.append(termino, descripcion);
}

function copiarContenidoSeguro(nodo, destino) {
    const etiquetasPermitidas = [
        "P", "BR", "STRONG", "EM", "UL", "OL", "LI",
        "TABLE", "THEAD", "TBODY", "TR", "TH", "TD",
    ];

    if (nodo.nodeType === Node.TEXT_NODE) {
        destino.appendChild(document.createTextNode(nodo.textContent));
        return;
    }

    if (nodo.nodeType !== Node.ELEMENT_NODE) {
        return;
    }

    if (!etiquetasPermitidas.includes(nodo.tagName)) {
        for (const hijo of nodo.childNodes) {
            copiarContenidoSeguro(hijo, destino);
        }
        return;
    }

    const elemento = document.createElement(nodo.tagName.toLowerCase());

    for (const hijo of nodo.childNodes) {
        copiarContenidoSeguro(hijo, elemento);
    }

    destino.appendChild(elemento);
}

function mostrarDescripcionProducto(descripcion) {
    const contenedor = document.getElementById("descripcion-producto");
    contenedor.replaceChildren();

    if (!descripcion) {
        return;
    }

    const documento = new DOMParser().parseFromString(descripcion, "text/html");

    for (const nodo of documento.body.childNodes) {
        copiarContenidoSeguro(nodo, contenedor);
    }
}

function mostrarInformacionProducto(producto) {
    document.title = `${producto.descripcion || "Producto"} - TEXORA`;
    document.getElementById("nombre-producto").textContent =
        producto.descripcion || producto.titulo || "Producto textil";
    document.getElementById("referencia-detalle").textContent =
        `Ref. ${producto.refProducto}`;
    mostrarDescripcionProducto(producto.descripcionLarga);

    const categoria = [producto.descFamilia, producto.descSubfamilia]
        .filter(Boolean)
        .join(" · ");
    document.getElementById("categoria-producto").textContent = categoria;

    const lista = document.getElementById("datos-producto");
    lista.innerHTML = "";
    agregarDatoProducto(lista, "Composición", producto.descComposicion);
    agregarDatoProducto(lista, "Acabado", producto.descAcabado);

    mostrarGaleria(producto);
}

async function cargarArticulos(producto) {
    if (!producto.refArticulosHijos || typeof producto.refArticulosHijos !== "object") {
        return [];
    }

    const referencias = [...new Set(Object.values(producto.refArticulosHijos))]
        .filter(function (referencia) {
            return ID_VALIDO.test(String(referencia));
        });
    const resultado = [];

    // Cada artículo indica la combinación real de talla y color.
    for (const referencia of referencias) {
        try {
            const articulo = await pedirDatos(
                `/articulos/${encodeURIComponent(referencia)}`
            );

            if (articulo.refProductoPadre === producto.refProducto) {
                resultado.push(articulo);
            }
        } catch (error) {
            console.error("No se ha podido cargar un artículo", error);
        }
    }

    return resultado;
}

function obtenerOpcionesUnicas(lista, campoId, campoNombre) {
    const opciones = [];

    for (const articulo of lista) {
        const id = articulo[campoId];
        const yaExiste = opciones.some(function (opcion) {
            return opcion.id === id;
        });

        if (id && !yaExiste) {
            opciones.push({ id: id, nombre: articulo[campoNombre] || id });
        }
    }

    return opciones;
}

function rellenarSelector(selector, opciones, mensaje) {
    selector.innerHTML = "";

    const opcionInicial = document.createElement("option");
    opcionInicial.value = "";
    opcionInicial.textContent = mensaje;
    selector.appendChild(opcionInicial);

    for (const opcion of opciones) {
        const elemento = document.createElement("option");
        elemento.value = opcion.id;
        elemento.textContent = opcion.nombre;
        selector.appendChild(elemento);
    }

    selector.disabled = opciones.length === 0;
}

function prepararVariantes() {
    const tallas = obtenerOpcionesUnicas(articulos, "refTalla", "descTalla");
    const colores = obtenerOpcionesUnicas(articulos, "refColor", "descColor");

    document.getElementById("grupo-talla").hidden = tallas.length === 0;
    document.getElementById("grupo-color").hidden = colores.length === 0;
    rellenarSelector(selectorTalla, tallas, "Selecciona una talla");

    if (tallas.length === 0) {
        rellenarSelector(selectorColor, colores, "Selecciona un color");
    } else {
        rellenarSelector(selectorColor, [], "Selecciona primero una talla");
    }

    if (articulos.length === 0) {
        estadoVariante.textContent = "No hay variantes disponibles en este momento";
    } else if (tallas.length === 0 && colores.length === 0 && articulos.length === 1) {
        consultarVariante(articulos[0].refArticulo);
    }
}

function actualizarColores() {
    const talla = selectorTalla.value;
    datosArticulo.hidden = true;

    if (!talla) {
        rellenarSelector(selectorColor, [], "Selecciona primero una talla");
        estadoVariante.textContent = "Selecciona una variante para consultar su disponibilidad";
        return;
    }

    const articulosDeTalla = articulos.filter(function (articulo) {
        return articulo.refTalla === talla;
    });
    const colores = obtenerOpcionesUnicas(articulosDeTalla, "refColor", "descColor");

    if (colores.length === 0 && articulosDeTalla.length === 1) {
        consultarVariante(articulosDeTalla[0].refArticulo);
        return;
    }

    rellenarSelector(selectorColor, colores, "Selecciona un color");
    estadoVariante.textContent = "Selecciona un color para consultar la variante";
}

function buscarArticuloSeleccionado() {
    return articulos.find(function (articulo) {
        const coincideTalla = !selectorTalla.value || articulo.refTalla === selectorTalla.value;
        const coincideColor = !selectorColor.value || articulo.refColor === selectorColor.value;
        return coincideTalla && coincideColor;
    });
}

async function consultarVariante(referencia) {
    if (!ID_VALIDO.test(String(referencia))) {
        estadoVariante.textContent = "La variante seleccionada no es válida";
        return;
    }

    datosArticulo.hidden = true;
    estadoVariante.textContent = "Consultando disponibilidad...";

    try {
        const articulo = await pedirDatos(
            `/articulos/${encodeURIComponent(referencia)}`
        );
        const precio = Number(articulo.pvp);
        const disponible = Number(articulo.disponible) > 0;

        document.getElementById("precio-articulo").textContent = Number.isFinite(precio)
            ? new Intl.NumberFormat("es-ES", {
                style: "currency",
                currency: "EUR",
            }).format(precio)
            : "Precio no disponible";
        document.getElementById("stock-articulo").textContent = disponible
            ? "Disponible"
            : "Agotado";
        document.getElementById("stock-articulo").className = disponible
            ? "stock-articulo disponible"
            : "stock-articulo agotado";
        document.getElementById("referencia-articulo").textContent =
            `Artículo ${articulo.refArticulo}`;

        datosArticulo.hidden = false;
        estadoVariante.textContent = "";
    } catch (error) {
        console.error("No se ha podido consultar la variante", error);
        estadoVariante.textContent = "No se ha podido consultar esta variante";
    }
}

function seleccionarColor() {
    if (!selectorColor.value) {
        datosArticulo.hidden = true;
        estadoVariante.textContent = "Selecciona un color para consultar la variante";
        return;
    }

    const articulo = buscarArticuloSeleccionado();

    if (articulo) {
        consultarVariante(articulo.refArticulo);
    }
}

function volverAlCatalogo() {
    if (document.referrer.includes("catalogo.html")) {
        window.history.back();
    } else {
        window.location.href = "catalogo.html";
    }
}

async function iniciarDetalle() {
    const tieneAcceso = await comprobarAccesoCatalogo();

    if (!tieneAcceso) {
        return;
    }

    const parametros = new URLSearchParams(window.location.search);
    const referencia = parametros.get("id");

    if (!referencia || !ID_VALIDO.test(referencia)) {
        estadoDetalle.textContent = "La referencia del producto no es válida";
        return;
    }

    try {
        const producto = await pedirDatos(
            `/productos/${encodeURIComponent(referencia)}`
        );

        if (producto.refProducto !== referencia) {
            throw new Error("El producto recibido no coincide con la referencia");
        }

        mostrarInformacionProducto(producto);
        articulos = await cargarArticulos(producto);
        prepararVariantes();
        estadoDetalle.hidden = true;
        detalleProducto.hidden = false;
    } catch (error) {
        console.error("No se ha podido cargar el producto", error);
        estadoDetalle.textContent = "No se ha podido cargar el producto";
    }
}

selectorTalla.addEventListener("change", actualizarColores);
selectorColor.addEventListener("change", seleccionarColor);
document.getElementById("boton-volver").addEventListener("click", volverAlCatalogo);

iniciarDetalle();
