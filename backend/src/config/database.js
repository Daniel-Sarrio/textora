const { Pool } = require("pg");

const DEFAULT_DATABASE_PORT = 5432;
const CONNECTION_TIMEOUT_MS = 5_000;

function parseDatabasePort(value) {
  const port = Number.parseInt(value, 10);

  if (!Number.isInteger(port) || port < 1 || port > 65_535) {
    throw new Error("DB_PORT no es válido");
  }

  return port;
}

function createDatabasePool(env = process.env) {
  return new Pool({
    host: env.DB_HOST,
    port: parseDatabasePort(env.DB_PORT || DEFAULT_DATABASE_PORT),
    database: env.DB_NAME,
    user: env.DB_USER,
    password: env.DB_PASSWORD,
    ssl: env.DB_SSL === "true" ? { rejectUnauthorized: true } : false,
    max: 10,
    idleTimeoutMillis: 10_000,
    connectionTimeoutMillis: CONNECTION_TIMEOUT_MS,
  });
}

async function checkDatabaseConnection(pool, expectedDatabase) {
  try {
    const result = await pool.query(
      "SELECT current_database() AS database_name",
    );

    if (result.rows[0]?.database_name !== expectedDatabase) {
      throw new Error("Base de datos inesperada");
    }

    return result.rows[0].database_name;
  } catch (error) {
    throw new Error("No se pudo conectar con PostgreSQL");
  }
}

module.exports = { createDatabasePool, checkDatabaseConnection };
