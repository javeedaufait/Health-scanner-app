import { Product } from '@health-scanner/shared';

export interface IProductProvider {
  name: string;
  findByBarcode(barcode: string): Promise<Product | null>;
  findById(id: string): Promise<Product | null>;
  searchByName(query: string, limit?: number): Promise<Product[]>;
}
