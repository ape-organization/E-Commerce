import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { CreateOrderRequest } from '../models/order.model';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class OrderService {

  private http = inject(HttpClient);

  private readonly apiUrl = environment.apiBaseUrl+'/orders';

  createOrder(
    order: any
  ): Observable<any> {

    return this.http.post<any>(
      this.apiUrl,
      order
    );
  }
}