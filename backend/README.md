# Backend de TEXORA

Backend Express que actúa como intermediario entre el catálogo de TEXORA y la API de ES-TELA. Las credenciales nunca se envían al navegador.

## Configuración

Requiere Node.js 20.6 o posterior.

1. Copia `.env.example` como `.env` dentro de `backend/`.
2. Completa `ES_TELA_CLIENT` y `ES_TELA_API_KEY` con tus credenciales.
3. Ajusta `CORS_ORIGIN` al origen exacto del frontend. El valor de ejemplo corresponde a Live Server en el puerto 5500.
4. Ejecuta `npm install` si todavía no están instaladas las dependencias.

## Ejecución

```bash
npm start
```

Durante el desarrollo, con reinicio automático:

```bash
npm run dev
```

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
