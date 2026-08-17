export interface SubCategory {
  id: number;
  name: string;
  categoryId: number;
  categoryName?: string;
}

export interface Product {
  id: number;
  name: string;
  description?: string | null;
  price: number;
  stockQuantity: number;
  imageUrl?: string | null;

  subCategories: SubCategory[];
}