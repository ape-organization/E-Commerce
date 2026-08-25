import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class CategoryService {

  private http = inject(HttpClient);

  private apiUrl = environment.apiBaseUrl+'/categories';


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