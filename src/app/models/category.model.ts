import { SubCategory } from "./subCategory.model";

export interface Category {
  id: number;
  name: string;
  imageUrl?: string;
    subCategories?: SubCategory[];

}