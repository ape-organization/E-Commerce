import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { CreateOrderRequest } from '../models/order.model';

@Injectable({
  providedIn: 'root'
})
export class OrderService {

  private http = inject(HttpClient);

  private readonly apiUrl = 'https://localhost:7256/api/orders';

  createOrder(
    order: any
  ): Observable<any> {

    return this.http.post<any>(
      this.apiUrl,
      order
    );
  }
}