import { Router, Request, Response } from 'express';
import { ProductService } from './product.service';

export const productRouter = Router();
const productService = new ProductService();

productRouter.get('/barcode/:barcode', async (req: Request, res: Response) => {
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
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Error looking up barcode' });
  }
});

productRouter.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const product = await productService.getProductById(id);
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }
    return res.json(product);
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Error looking up product' });
  }
});

productRouter.get('/', async (req: Request, res: Response) => {
  try {
    const query = (req.query.q as string) || '';
    const products = await productService.searchProducts(query);
    return res.json(products);
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Error searching products' });
  }
});
