import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class ApiService {
  private readonly http = inject(HttpClient);
  readonly base = environment.apiUrl;

  get<T>(path: string) {
    return this.http.get<T>(`${this.base}${path}`);
  }
  post<T, B = unknown>(path: string, body: B) {
    return this.http.post<T>(`${this.base}${path}`, body);
  }
  put<T, B = unknown>(path: string, body: B) {
    return this.http.put<T>(`${this.base}${path}`, body);
  }
  delete<T>(path: string) {
    return this.http.delete<T>(`${this.base}${path}`);
  }
}
