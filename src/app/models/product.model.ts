import { Brand } from "./brand.model";
import { SubCategory } from "./subCategory.model";



export interface Product {
  id: number;
 nameEn: string;
  nameAr: string;
  isInStock:boolean;
  descriptionEn?: string | null;
descriptionAr?: string | null;
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
export interface ProductFilterValue {
  searchName: string;
  categoryId: number | null;
  subCategoryId: number | null;
  brandId: number | null;
  offers: boolean;
}