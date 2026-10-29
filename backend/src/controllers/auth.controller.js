const { COOKIE_NAME, readSessionId } = require("../middleware/auth.middleware");
const { hashPassword, verifyPassword } = require("../services/password.service");
const {
  SESSION_DURATION_MS,
  createSession,
  destroySession,
} = require("../services/session.service");

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const UNIQUE_VIOLATION = "23505";
// Hash falso para tardar lo mismo cuando el email no existe.
const DUMMY_HASH = `scrypt$${"0".repeat(32)}$${"0".repeat(128)}`;

function publicUser(row) {
  return { id: row.id, name: row.name, email: row.email };
}

function setSessionCookie(res, sessionId) {
  res.cookie(COOKIE_NAME, sessionId, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: SESSION_DURATION_MS,
    path: "/",
  });
}

function validateRegistration({ name, email, password }) {
  if (typeof name !== "string" || name.trim().length < 2 || name.trim().length > 100) {
    return "El nombre debe tener entre 2 y 100 caracteres";
  }

  if (typeof email !== "string" || email.trim().length > 254 || !EMAIL_PATTERN.test(email.trim())) {
    return "El email no es válido";
  }

  if (typeof password !== "string" || password.length < 8 || password.length > 128) {
    return "La contraseña debe tener entre 8 y 128 caracteres";
  }

  return null;
}

async function register(req, res, next) {
  try {
    const body = req.body || {};
    const validationError = validateRegistration(body);

    if (validationError) {
      return res.status(400).json({ error: validationError });
    }

    const passwordHash = await hashPassword(body.password);
    const result = await req.app.locals.database.query(
      `INSERT INTO users (name, email, password_hash)
       VALUES ($1, $2, $3)
       RETURNING id, name, email`,
      [body.name.trim(), body.email.trim().toLowerCase(), passwordHash],
    );
    const user = result.rows[0];

    setSessionCookie(res, createSession(user.id));
    res.status(201).json({ user: publicUser(user) });
  } catch (error) {
    if (error.code === UNIQUE_VIOLATION) {
      return res.status(409).json({ error: "Ya existe una cuenta con ese email" });
    }

    next(error);
  }
}

async function login(req, res, next) {
  try {
    const { email, password } = req.body || {};

    if (typeof email !== "string" || typeof password !== "string" || !email || !password) {
      return res.status(400).json({ error: "Introduce email y contraseña" });
    }

    const result = await req.app.locals.database.query(
      `SELECT id, name, email, password_hash
       FROM users
       WHERE LOWER(email) = $1`,
      [email.trim().toLowerCase()],
    );
    const user = result.rows[0];
    const valid = await verifyPassword(password, user ? user.password_hash : DUMMY_HASH);

    if (!user || !valid) {
      return res.status(401).json({ error: "Email o contraseña incorrectos" });
    }

    setSessionCookie(res, createSession(user.id));
    res.json({ user: publicUser(user) });
  } catch (error) {
    next(error);
  }
}

function logout(req, res) {
  const sessionId = readSessionId(req);

  if (sessionId) {
    destroySession(sessionId);
  }

  res.clearCookie(COOKIE_NAME, { path: "/" });
  res.json({ ok: true });
}

// Ruta privada: devuelve los datos del usuario autenticado.
async function me(req, res, next) {
  try {
    const result = await req.app.locals.database.query(
      "SELECT id, name, email FROM users WHERE id = $1",
      [req.userId],
    );

    if (!result.rows[0]) {
      destroySession(req.sessionId);
      return res.status(401).json({ error: "Debes iniciar sesión" });
    }

    res.json({ user: publicUser(result.rows[0]) });
  } catch (error) {
    next(error);
  }
}

module.exports = { register, login, logout, me };
