"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.productRouter = void 0;
const express_1 = require("express");
const product_service_1 = require("./product.service");
exports.productRouter = (0, express_1.Router)();
const productService = new product_service_1.ProductService();
exports.productRouter.get('/barcode/:barcode', async (req, res) => {
    try {
        const { barcode } = req.params;
        const product = await productService.getProductByBarcode(barcode);
        if (!product) {
            return res.status(404).json({
                found: false,
                message: 'Product not found in database. Please photograph the nutrition label for OCR analysis.',
            });
        }
        return res.json({ found: true, product });
    }
    catch (err) {
        return res.status(500).json({ error: err.message || 'Error looking up barcode' });
    }
});
exports.productRouter.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const product = await productService.getProductById(id);
        if (!product) {
            return res.status(404).json({ error: 'Product not found' });
        }
        return res.json(product);
    }
    catch (err) {
        return res.status(500).json({ error: err.message || 'Error looking up product' });
    }
});
exports.productRouter.get('/', async (req, res) => {
    try {
        const query = req.query.q || '';
        const products = await productService.searchProducts(query);
        return res.json(products);
    }
    catch (err) {
        return res.status(500).json({ error: err.message || 'Error searching products' });
    }
});
