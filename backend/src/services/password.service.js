const crypto = require("node:crypto");
const { promisify } = require("node:util");

const scrypt = promisify(crypto.scrypt);
const KEY_LENGTH = 64;

// Formato guardado en password_hash: "scrypt$<salt>$<hash>" (ambos en hex).
async function hashPassword(password) {
  const salt = crypto.randomBytes(16);
  const hash = await scrypt(password, salt, KEY_LENGTH);

  return `scrypt$${salt.toString("hex")}$${hash.toString("hex")}`;
}

async function verifyPassword(password, storedHash) {
  const [algorithm, saltHex, hashHex] = String(storedHash).split("$");

  if (algorithm !== "scrypt" || !saltHex || !hashHex) {
    return false;
  }

  const expected = Buffer.from(hashHex, "hex");
  const actual = await scrypt(password, Buffer.from(saltHex, "hex"), expected.length);

  return crypto.timingSafeEqual(actual, expected);
}

module.exports = { hashPassword, verifyPassword };
