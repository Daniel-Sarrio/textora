const { getSession } = require("../services/session.service");

const COOKIE_NAME = "texora_sid";

function readSessionId(req) {
  const header = req.get("cookie") || "";

  for (const part of header.split(";")) {
    const [name, ...value] = part.trim().split("=");

    if (name === COOKIE_NAME) {
      return value.join("=");
    }
  }

  return null;
}

// Protege las rutas privadas: deja el id del usuario en req.userId.
function requireAuth(req, res, next) {
  const sessionId = readSessionId(req);
  const session = sessionId && getSession(sessionId);

  if (!session) {
    return res.status(401).json({ error: "Debes iniciar sesión" });
  }

  req.sessionId = sessionId;
  req.userId = session.userId;
  next();
}

module.exports = { COOKIE_NAME, readSessionId, requireAuth };
