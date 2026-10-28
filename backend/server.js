const express = require("express");
const productsRouter = require("./src/routes/products.routes");

const DEFAULT_PORT = 3000;
const DEFAULT_ORIGIN = "http://localhost:5500";
const DEFAULT_RATE_LIMIT = 100;
const RATE_WINDOW_MS = 60_000;

function parsePositiveInteger(value, fallback, maximum = Number.MAX_SAFE_INTEGER) {
  const parsed = Number.parseInt(value, 10);

  return Number.isInteger(parsed) && parsed > 0
    ? Math.min(parsed, maximum)
    : fallback;
}

function createCorsMiddleware(allowedOrigin) {
  return (req, res, next) => {
    const origin = req.get("origin");

    if (origin && origin !== allowedOrigin) {
      return res.status(403).json({ error: "Origen no permitido" });
    }

    if (origin) {
      res.set("Access-Control-Allow-Origin", allowedOrigin);
      res.set("Vary", "Origin");
    }

    res.set("Access-Control-Allow-Methods", "GET, OPTIONS");
    res.set("Access-Control-Allow-Headers", "Content-Type");
    res.set("Access-Control-Max-Age", "600");

    if (req.method === "OPTIONS") {
      return res.sendStatus(204);
    }

    next();
  };
}

function createRateLimitMiddleware(maxRequests) {
  const clients = new Map();

  return (req, res, next) => {
    const now = Date.now();
    const key = req.ip;
    const current = clients.get(key);

    if (!current || current.resetAt <= now) {
      clients.set(key, { count: 1, resetAt: now + RATE_WINDOW_MS });
      return next();
    }

    current.count += 1;

    if (current.count > maxRequests) {
      res.set("Retry-After", String(Math.ceil((current.resetAt - now) / 1000)));
      return res.status(429).json({ error: "Demasiadas peticiones" });
    }

    next();
  };
}

function createApp(env = process.env) {
  const app = express();
  const allowedOrigin = env.CORS_ORIGIN || DEFAULT_ORIGIN;
  const maxRequests = parsePositiveInteger(
    env.RATE_LIMIT_MAX,
    DEFAULT_RATE_LIMIT,
    10_000,
  );

  app.disable("x-powered-by");
  app.set("trust proxy", false);

  app.use((req, res, next) => {
    res.set("X-Content-Type-Options", "nosniff");
    res.set("X-Frame-Options", "DENY");
    res.set("Referrer-Policy", "no-referrer");
    res.set("Cache-Control", "no-store");
    next();
  });
  app.use(createCorsMiddleware(allowedOrigin));
  app.use(createRateLimitMiddleware(maxRequests));

  app.get("/health", (req, res) => {
    res.json({ status: "ok" });
  });
  app.use("/api", productsRouter);

  app.use((req, res) => {
    res.status(404).json({ error: "Endpoint no encontrado" });
  });

  app.use((error, req, res, next) => {
    if (res.headersSent) {
      return next(error);
    }

    console.error("Error interno no controlado");
    res.status(500).json({ error: "Error interno del servidor" });
  });

  return app;
}

function validateEnvironment(env) {
  const missing = ["ES_TELA_CLIENT", "ES_TELA_API_KEY"].filter(
    (name) => !env[name]?.trim(),
  );

  if (missing.length > 0) {
    throw new Error(`Faltan variables de entorno: ${missing.join(", ")}`);
  }
}

function startServer(env = process.env) {
  validateEnvironment(env);
  const port = parsePositiveInteger(env.PORT, DEFAULT_PORT, 65_535);
  const app = createApp(env);

  return app.listen(port, () => {
    console.log(`TEXORA backend disponible en http://localhost:${port}`);
  });
}

if (require.main === module) {
  try {
    startServer();
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}

module.exports = { createApp, startServer, validateEnvironment };
