import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { environment } from '../../environments/environment';
import { OtpVerificationResponse, SendOtpResponse } from '../models/otp.model';




@Injectable({
  providedIn: 'root'
})
export class OtpService {

  private http = inject(HttpClient);

  private apiUrl =
    `${environment.apiBaseUrl}/Sms`;


  verifyOtp(request:any): Observable<any> {

    return  this.http
      .post<OtpVerificationResponse>(
        `${environment.apiBaseUrl}/Sms/verify-otp`,
        request)

  }


  sendOtp(request: any): Observable<any> {

    return  this.http
      .post<SendOtpResponse>(
        `${environment.apiBaseUrl}/Sms/send-otp`,
        request
      )

  }

}