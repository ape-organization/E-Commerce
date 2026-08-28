import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Product } from '../models/product.model';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class ProductService {
  private apiUrl = environment.apiBaseUrl; // Adjust base URL as needed

  constructor(private http: HttpClient) {}

 getProducts(
  categoryId?: number | null,
  subCategoryId?: number | null,
  brandId?: number | null,
  offers?: boolean
): Observable<Product[]> {

  let params = new HttpParams();

  if (categoryId != null) {
    params = params.set(
      'categoryId',
      categoryId
    );
  }

  if (subCategoryId != null) {
    params = params.set(
      'subCategoryId',
      subCategoryId
    );
  }

  if (brandId != null) {
    params = params.set(
      'brandId',
      brandId
    );
  }

  if (offers === true) {
    params = params.set(
      'offers',
      'true'
    );
  }

  return this.http.get<Product[]>(
    `${this.apiUrl}/products`,
    { params }
  );
}

  getProduct(id: number): Observable<any> {
    return this.http.get<Product>(`${this.apiUrl}/${id}`);
  }

  addProduct(product: FormData): Observable<any> {
    return this.http.post<Product>(this.apiUrl, product);
  }

  updateProduct(id: number, product: FormData): Observable<void> {
    return this.http.put<void>(`${this.apiUrl}/${id}`, product);
  }

  deleteProduct(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
  getProductsByIds(productIds: number[]): Observable<Product[]> {

  return this.http.post<Product[]>(
    `${this.apiUrl}/products/cart`,
    {
      productIds
    }
  );

}
}
