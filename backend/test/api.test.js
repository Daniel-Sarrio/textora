const assert = require("node:assert/strict");
const { after, before, beforeEach, test } = require("node:test");
const { createApp } = require("../server");

let server;
let baseUrl;
let requestedUrl;

const originalFetch = global.fetch;
const originalClient = process.env.ES_TELA_CLIENT;
const originalApiKey = process.env.ES_TELA_API_KEY;
const request = (...args) => originalFetch(...args);

before(async () => {
  process.env.ES_TELA_CLIENT = "test-client";
  process.env.ES_TELA_API_KEY = "test-secret";

  server = createApp({
    CORS_ORIGIN: "http://localhost:5500",
    RATE_LIMIT_MAX: "100",
  }).listen(0);

  await new Promise((resolve) => server.once("listening", resolve));
  baseUrl = `http://127.0.0.1:${server.address().port}`;
});

beforeEach(() => {
  requestedUrl = undefined;
  global.fetch = async (url) => {
    requestedUrl = url;

    return new Response(
      JSON.stringify({
        id: "P-1",
        nombre: "Tejido",
        coste: 12,
        detalle: { precio_compra: 9, color: "azul" },
      }),
      { status: 200, headers: { "Content-Type": "application/json" } },
    );
  };
});

after(async () => {
  global.fetch = originalFetch;

  if (originalClient === undefined) delete process.env.ES_TELA_CLIENT;
  else process.env.ES_TELA_CLIENT = originalClient;

  if (originalApiKey === undefined) delete process.env.ES_TELA_API_KEY;
  else process.env.ES_TELA_API_KEY = originalApiKey;

  await new Promise((resolve, reject) =>
    server.close((error) => (error ? reject(error) : resolve())),
  );
});

test("expone el estado de salud sin datos internos", async () => {
  const response = await request(`${baseUrl}/health`);

  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), { status: "ok" });
});

const endpointCases = [
  ["/api/familias", "es/familias"],
  [
    "/api/subfamilias/F04S351/productos",
    "es/productosEnSubfamilia/F04S351",
  ],
  ["/api/productos/P-1", "es/producto/P-1"],
  ["/api/articulos/A-1", "es/articulo/A-1"],
  ["/api/stocks", "es/stocks"],
];

for (const [endpoint, upstreamRoute] of endpointCases) {
  test(`traduce ${endpoint} al recurso previsto de ES-TELA`, async () => {
    const response = await request(`${baseUrl}${endpoint}`);
    const body = await response.json();
    const upstreamUrl = new URL(requestedUrl);

    assert.equal(response.status, 200);
    assert.equal(upstreamUrl.searchParams.get("r"), upstreamRoute);
    assert.equal(upstreamUrl.searchParams.get("cli"), "test-client");
    assert.equal(upstreamUrl.searchParams.get("apikey"), "test-secret");
    assert.deepEqual(body, {
      id: "P-1",
      nombre: "Tejido",
      detalle: { color: "azul" },
    });
  });
}

test("rechaza identificadores y parámetros no previstos", async () => {
  const invalidId = await request(`${baseUrl}/api/productos/id%20invalido`);
  const unexpectedQuery = await request(
    `${baseUrl}/api/familias?apikey=otra`,
  );

  assert.equal(invalidId.status, 400);
  assert.equal(unexpectedQuery.status, 400);
  assert.equal(requestedUrl, undefined);
});

test("restringe CORS al origen configurado", async () => {
  const denied = await request(`${baseUrl}/api/familias`, {
    headers: { Origin: "https://example.com" },
  });

  assert.equal(denied.status, 403);
  assert.equal(denied.headers.get("access-control-allow-origin"), null);
  assert.equal(requestedUrl, undefined);
});

test("no revela los detalles de un fallo de ES-TELA", async () => {
  global.fetch = async () =>
    new Response(JSON.stringify({ apikey: "filtrada", detalle: "interno" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });

  const response = await request(`${baseUrl}/api/stocks`);

  assert.equal(response.status, 502);
  assert.deepEqual(await response.json(), {
    error: "No se pudo consultar ES-TELA",
  });
});
