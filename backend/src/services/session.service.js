const crypto = require("node:crypto");

const SESSION_DURATION_MS = 7 * 24 * 60 * 60 * 1000;

// Las sesiones viven en memoria: se pierden al reiniciar el servidor,
// así no hace falta crear ninguna tabla nueva en PostgreSQL.
const sessions = new Map();

function createSession(userId) {
  const sessionId = crypto.randomBytes(32).toString("hex");

  sessions.set(sessionId, { userId, expiresAt: Date.now() + SESSION_DURATION_MS });

  return sessionId;
}

function getSession(sessionId) {
  const session = sessions.get(sessionId);

  if (!session) {
    return null;
  }

  if (session.expiresAt <= Date.now()) {
    sessions.delete(sessionId);
    return null;
  }

  return session;
}

function destroySession(sessionId) {
  sessions.delete(sessionId);
}

module.exports = {
  SESSION_DURATION_MS,
  createSession,
  getSession,
  destroySession,
};
