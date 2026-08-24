import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class CategoryService {

  private http = inject(HttpClient);

  private apiUrl = 'https://localhost:7256/api/categories';


getCategoriesMenu(): Observable<any> {
  return this.http.get<any>(
    `${this.apiUrl}/menu`
  );
}
getAllCategories(): Observable<any> {
  return this.http.get<any>(
    `${this.apiUrl}`
  );
}
}