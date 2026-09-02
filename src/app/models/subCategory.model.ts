export interface SubCategory {
  id: number;
   nameEn: string;
  nameAr: string;
  categoryId: number;
  categoryNameEn: string;
  categoryNameAr: string;
}
export interface SubCategoryFilter {
  id: number;
  nameEn: string;
  nameAr: string;
  categoryId?: number;
}