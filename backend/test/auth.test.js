const assert = require("node:assert/strict");
const { after, before, test } = require("node:test");
const { createApp } = require("../server");

let server;
let baseUrl;
const users = [];

// Pool falso en memoria: imita las tres consultas SQL que usa auth.controller.
const fakeDatabase = {
  async query(sql, params) {
    if (sql.includes("INSERT INTO users")) {
      if (users.some((u) => u.email === params[1])) {
        throw Object.assign(new Error("duplicado"), { code: "23505" });
      }
      const user = { id: users.length + 1, name: params[0], email: params[1], password_hash: params[2] };
      users.push(user);
      return { rows: [user] };
    }
    if (sql.includes("WHERE LOWER(email)")) {
      return { rows: users.filter((u) => u.email === params[0]) };
    }
    return { rows: users.filter((u) => u.id === params[0]) };
  },
};

const post = (path, body, cookie) =>
  fetch(`${baseUrl}/api/auth/${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...(cookie && { Cookie: cookie }) },
    body: JSON.stringify(body),
  });
const sessionCookie = (res) => res.headers.get("set-cookie").split(";")[0];

before(async () => {
  const app = createApp({ CORS_ORIGIN: "http://localhost:5500", RATE_LIMIT_MAX: "100" });
  app.locals.database = fakeDatabase;
  server = app.listen(0);
  await new Promise((resolve) => server.once("listening", resolve));
  baseUrl = `http://127.0.0.1:${server.address().port}`;
});

after(() => new Promise((resolve) => server.close(resolve)));

test("registro, sesión, logout y login", async () => {
  const registro = await post("register", { name: "Ana", email: "Ana@Test.com", password: "secreta123" });
  assert.equal(registro.status, 201);
  assert.match(registro.headers.get("set-cookie"), /HttpOnly/);
  assert.equal(users[0].email, "ana@test.com");
  assert.ok(users[0].password_hash.startsWith("scrypt$"));
  assert.ok(!users[0].password_hash.includes("secreta123"));
  assert.equal((await registro.json()).user.password_hash, undefined);

  const cookie = sessionCookie(registro);
  const me = await fetch(`${baseUrl}/api/auth/me`, { headers: { Cookie: cookie } });
  assert.equal(me.status, 200);
  assert.equal((await me.json()).user.name, "Ana");

  assert.equal((await post("logout", {}, cookie)).status, 200);
  const trasLogout = await fetch(`${baseUrl}/api/auth/me`, { headers: { Cookie: cookie } });
  assert.equal(trasLogout.status, 401);

  const login = await post("login", { email: "ana@test.com", password: "secreta123" });
  assert.equal(login.status, 200);
  assert.equal((await post("login", { email: "ana@test.com", password: "incorrecta1" })).status, 401);
  assert.equal((await post("login", { email: "nadie@test.com", password: "secreta123" })).status, 401);
});

test("rechaza datos inválidos y emails duplicados", async () => {
  assert.equal((await post("register", { name: "A", email: "x@y.com", password: "secreta123" })).status, 400);
  assert.equal((await post("register", { name: "Ana", email: "mal", password: "secreta123" })).status, 400);
  assert.equal((await post("register", { name: "Ana", email: "b@y.com", password: "corta" })).status, 400);
  assert.equal((await post("register", { name: "Ana", email: "ana@test.com", password: "secreta123" })).status, 409);
});

test("las rutas privadas exigen sesión", async () => {
  assert.equal((await fetch(`${baseUrl}/api/auth/me`)).status, 401);
});
