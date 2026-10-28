const assert = require("node:assert/strict");
const { test } = require("node:test");
const {
  createDatabasePool,
  checkDatabaseConnection,
} = require("../src/config/database");
const { validateEnvironment } = require("../server");

const validEnvironment = {
  ES_TELA_CLIENT: "test-client",
  ES_TELA_API_KEY: "test-api-key",
  DB_HOST: "localhost",
  DB_PORT: "5432",
  DB_NAME: "texora_db",
  DB_USER: "postgres",
  DB_PASSWORD: "test-password",
};

test("crea el pool con límites y datos de conexión configurados", () => {
  const pool = createDatabasePool(validEnvironment);

  assert.equal(pool.options.host, "localhost");
  assert.equal(pool.options.port, 5432);
  assert.equal(pool.options.database, "texora_db");
  assert.equal(pool.options.max, 10);

  return pool.end();
});

test("comprueba que la conexión apunta a texora_db", async () => {
  const pool = {
    query: async (query) => {
      assert.equal(query, "SELECT current_database() AS database_name");
      return { rows: [{ database_name: "texora_db" }] };
    },
  };

  const databaseName = await checkDatabaseConnection(pool, "texora_db");

  assert.equal(databaseName, "texora_db");
});

test("rechaza una conexión a otra base sin revelar detalles", async () => {
  const pool = {
    query: async () => ({ rows: [{ database_name: "postgres" }] }),
  };

  await assert.rejects(
    checkDatabaseConnection(pool, "texora_db"),
    { message: "No se pudo conectar con PostgreSQL" },
  );
});

test("exige las variables de PostgreSQL", () => {
  assert.throws(
    () =>
      validateEnvironment({
        ES_TELA_CLIENT: "test-client",
        ES_TELA_API_KEY: "test-api-key",
      }),
    /DB_HOST/,
  );

  assert.doesNotThrow(() => validateEnvironment(validEnvironment));
});
