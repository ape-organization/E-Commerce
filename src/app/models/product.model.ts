import { Brand } from "./brand.model";
import { SubCategory } from "./subCategory.model";



export interface Product {
  id: number;
  name: string;
  isInStock:boolean;
  description?: string | null;

  price: number;

  discountPercentage: number;

  stockQuantity: number;

  imageUrl?: string | null;

  brandId: number | null;

  brand?: Brand | null;

  // Keep this if some old code still uses it
  brandName?: string | null;

  subCategories: SubCategory[];
}