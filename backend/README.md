# Backend de TEXORA

Backend Express que actúa como intermediario entre el catálogo de TEXORA y la API de ES-TELA. Las credenciales nunca se envían al navegador.

## Configuración

Requiere Node.js 20.6 o posterior.

1. Copia `.env.example` como `.env` dentro de `backend/`.
2. Completa `ES_TELA_CLIENT` y `ES_TELA_API_KEY` con tus credenciales.
3. Completa `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER` y `DB_PASSWORD` con la conexión local de PostgreSQL. Para la base creada en pgAdmin, `DB_NAME` debe ser `texora_db`.
4. Ajusta `CORS_ORIGIN` al origen exacto del frontend (admite varios separados por comas). El valor de ejemplo corresponde a Live Server en el puerto 5500, tanto con `localhost` como con `127.0.0.1`.
5. Ejecuta `npm install` si todavía no están instaladas las dependencias.

## Ejecución

```bash
npm start
```

El servidor solo empieza a escuchar después de comprobar que PostgreSQL responde y que la conexión apunta a `texora_db`. Las credenciales de la base de datos no se muestran en los logs.

El esquema mínimo de referencia está documentado en `database/schema.sql`. No es necesario volver a ejecutarlo si las tablas ya existen.

Durante el desarrollo, con reinicio automático:

```bash
npm run dev
```

## Conexión con el frontend

El backend solo expone la API: no sirve los archivos del frontend. Por eso, abrir `http://localhost:3000` en el navegador devuelve `{"error":"Endpoint no encontrado"}`, y es el comportamiento esperado.

1. Arranca el backend (`npm start` o `npm run dev` dentro de `backend/`).
2. Abre el frontend con Live Server ("Go Live"), que lo sirve en `http://localhost:5500`. El archivo `.vscode/settings.json` de la raíz del proyecto fija `frontend/` como raíz de Live Server; sin él, la raíz sería `texora/`, que no tiene `index.html`, y el navegador mostraría `Cannot GET /`.
3. El frontend llama a la API mediante la constante `API_URL` de `frontend/js/api.js` (`http://localhost:3000/api`). Si cambias `PORT` en el `.env`, actualiza también esa constante.
4. El origen del frontend debe coincidir exactamente con uno de los valores de `CORS_ORIGIN` (separados por comas). Live Server puede abrir la página como `http://localhost:5500` o como `http://127.0.0.1:5500`, y el navegador los trata como orígenes distintos, por eso el `.env` incluye los dos. Si no coincide, el backend responde `403 Origen no permitido`.

Para comprobar que el backend está activo, abre `http://localhost:3000/health`, que debe devolver `{"status":"ok"}`.

## Endpoints

- `GET /health`
- `GET /api/familias`
- `GET /api/subfamilias/:id/productos`
- `GET /api/productos/:id`
- `GET /api/articulos/:id`
- `GET /api/stocks`

Los endpoints no aceptan parámetros de consulta. Para ejecutar las pruebas básicas sin realizar llamadas reales a ES-TELA:

```bash
npm test
```
