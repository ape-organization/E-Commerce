import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { environment } from '../../environments/environment';
import { Brand } from '../models/brand.model';



@Injectable({
  providedIn: 'root'
})
export class SliderService {

  private http = inject(HttpClient);

  private apiUrl =
    `${environment.apiBaseUrl}/slider`;


  getSliders(): Observable<any> {

    return this.http.get<any>(
      this.apiUrl
    );

  }


}