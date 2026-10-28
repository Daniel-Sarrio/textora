const express = require("express");
const controller = require("../controllers/products.controller");

const router = express.Router();

router.get("/familias", controller.getFamilies);
router.get("/subfamilias/:id/productos", controller.getProductsBySubfamily);
router.get("/productos/:id", controller.getProduct);
router.get("/articulos/:id", controller.getArticle);
router.get("/stocks", controller.getStocks);

module.exports = router;
