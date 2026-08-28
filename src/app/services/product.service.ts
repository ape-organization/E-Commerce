import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Product } from '../models/product.model';
import { environment } from '../../environments/environment';
import { PagedResponse } from '../models/PagedResponse.model';

@Injectable({
  providedIn: 'root'
})
export class ProductService {
  private apiUrl = environment.apiBaseUrl; // Adjust base URL as needed

  constructor(private http: HttpClient) {}

getProducts(
  page: number = 1,
  categoryId: number | null = null,
  subCategoryId: number | null = null,
  brandId: number | null = null,
  offers: boolean = false
) {
  let params = new HttpParams()
    .set('page', page);

  if (categoryId !== null) {
    params = params.set(
      'categoryId',
      categoryId
    );
  }

  if (subCategoryId !== null) {
    params = params.set(
      'subCategoryId',
      subCategoryId
    );
  }

  if (brandId !== null) {
    params = params.set(
      'brandId',
      brandId
    );
  }

  if (offers) {
    params = params.set(
      'offers',
      'true'
    );
  }

  return this.http.get<PagedResponse<Product>>(
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
