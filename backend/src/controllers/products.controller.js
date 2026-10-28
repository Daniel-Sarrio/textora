const estelaService = require("../services/estela.service");

const VALID_ID = /^[A-Za-z0-9._-]{1,64}$/;

function hasUnexpectedQuery(req) {
  return Object.keys(req.query).length > 0;
}

function validateRequest(req, res, needsId = false) {
  if (hasUnexpectedQuery(req)) {
    res.status(400).json({ error: "No se admiten parámetros de consulta" });
    return false;
  }

  if (needsId && !VALID_ID.test(req.params.id)) {
    res.status(400).json({ error: "Identificador no válido" });
    return false;
  }

  return true;
}

function sendServiceError(error, res) {
  if (error.code === "ESTELA_TIMEOUT") {
    return res.status(504).json({ error: "ES-TELA no respondió a tiempo" });
  }

  if (error.code === "ESTELA_NOT_FOUND") {
    return res.status(404).json({ error: "Recurso no encontrado" });
  }

  if (error.code?.startsWith("ESTELA_")) {
    return res.status(502).json({ error: "No se pudo consultar ES-TELA" });
  }

  throw error;
}

function createHandler(serviceMethod, needsId = false) {
  return async (req, res) => {
    if (!validateRequest(req, res, needsId)) {
      return;
    }

    try {
      const data = needsId
        ? await serviceMethod(req.params.id)
        : await serviceMethod();
      res.json(data);
    } catch (error) {
      sendServiceError(error, res);
    }
  };
}

module.exports = {
  getFamilies: createHandler(estelaService.getFamilies),
  getProductsBySubfamily: createHandler(
    estelaService.getProductsBySubfamily,
    true,
  ),
  getProduct: createHandler(estelaService.getProduct, true),
  getArticle: createHandler(estelaService.getArticle, true),
  getStocks: createHandler(estelaService.getStocks),
};
