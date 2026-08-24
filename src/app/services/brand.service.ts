import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { environment } from '../../environments/environment';

export interface Brand {
  id: number;
  name: string;
  imageUrl?: string;
}

@Injectable({
  providedIn: 'root'
})
export class BrandService {

  private http = inject(HttpClient);

  private apiUrl =
    `${environment.apiBaseUrl}/Brands`;


  getBrands(): Observable<Brand[]> {

    return this.http.get<Brand[]>(
      this.apiUrl
    );

  }


  getBrand(id: number): Observable<Brand> {

    return this.http.get<Brand>(
      `${this.apiUrl}/${id}`
    );

  }

}