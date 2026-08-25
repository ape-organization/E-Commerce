import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Client } from '../models/client.model';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class ClientService {

  private http = inject(HttpClient);

  private readonly apiUrl = environment.apiBaseUrl+'/clients';

  getByPhone(phone: string): Observable<Client> {
    return this.http.get<Client>(
      `${this.apiUrl}/by-phone/${phone}`
    );
  }
}