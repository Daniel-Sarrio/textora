const BASE_URL = "https://www.es-tela.com/api/";
const DEFAULT_TIMEOUT_MS = 8_000;

const SENSITIVE_FIELDS = new Set([
  "apikey",
  "api_key",
  "cost",
  "coste",
  "costeproveedor",
  "coste_proveedor",
  "costoproveedor",
  "costo_proveedor",
  "preciocompra",
  "precio_compra",
  "preciocoste",
  "precio_coste",
  "ultimocoste",
  "ultimo_coste",
]);

function createServiceError(code) {
  const error = new Error(code);
  error.code = code;
  return error;
}

function getTimeout() {
  const parsed = Number.parseInt(process.env.ES_TELA_TIMEOUT_MS, 10);

  return Number.isInteger(parsed) && parsed >= 1_000 && parsed <= 15_000
    ? parsed
    : DEFAULT_TIMEOUT_MS;
}

function sanitizeResponse(value) {
  if (Array.isArray(value)) {
    return value.map(sanitizeResponse);
  }

  if (!value || typeof value !== "object") {
    return value;
  }

  return Object.fromEntries(
    Object.entries(value)
      .filter(([key]) => {
        const normalizedKey = key.toLowerCase().replace(/[^a-z0-9]/g, "");

        return (
          !SENSITIVE_FIELDS.has(key.toLowerCase()) &&
          !normalizedKey.includes("coste") &&
          !normalizedKey.includes("costo") &&
          normalizedKey !== "cost" &&
          !normalizedKey.includes("preciocompra")
        );
      })
      .map(([key, item]) => [key, sanitizeResponse(item)]),
  );
}

async function requestEstela(route) {
  const client = process.env.ES_TELA_CLIENT?.trim();
  const apiKey = process.env.ES_TELA_API_KEY?.trim();

  if (!client || !apiKey) {
    throw createServiceError("ESTELA_CONFIGURATION");
  }

  const url = new URL(BASE_URL);
  url.searchParams.set("r", route);
  url.searchParams.set("cli", client);
  url.searchParams.set("apikey", apiKey);

  let response;

  try {
    response = await fetch(url, {
      method: "GET",
      headers: { Accept: "application/json" },
      signal: AbortSignal.timeout(getTimeout()),
    });
  } catch (error) {
    if (error.name === "TimeoutError" || error.name === "AbortError") {
      throw createServiceError("ESTELA_TIMEOUT");
    }

    throw createServiceError("ESTELA_UNAVAILABLE");
  }

  if (response.status === 404) {
    throw createServiceError("ESTELA_NOT_FOUND");
  }

  if (!response.ok) {
    throw createServiceError("ESTELA_RESPONSE_ERROR");
  }

  const contentType = response.headers.get("content-type") || "";

  if (!contentType.toLowerCase().includes("application/json")) {
    throw createServiceError("ESTELA_INVALID_RESPONSE");
  }

  try {
    return sanitizeResponse(await response.json());
  } catch (error) {
    throw createServiceError("ESTELA_INVALID_RESPONSE");
  }
}

module.exports = {
  getFamilies: () => requestEstela("es/familias"),
  getProductsBySubfamily: (id) =>
    requestEstela(`es/productosEnSubfamilia/${id}`),
  getProduct: (id) => requestEstela(`es/producto/${id}`),
  getArticle: (id) => requestEstela(`es/articulo/${id}`),
  getStocks: () => requestEstela("es/stocks"),
  sanitizeResponse,
};
