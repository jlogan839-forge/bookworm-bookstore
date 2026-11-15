import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface Recommendation {
  isbn: string;
  title: string;
  author: string;
  reason: string;
}

export interface AssistantAnswer {
  reply: string;
  recommendations: Recommendation[];
}

@Injectable({ providedIn: 'root' })
export class AssistantService {
  private http = inject(HttpClient);
  private api = `${environment.apiUrl}/assistant`;

  ask(message: string): Observable<AssistantAnswer> {
    return this.http.post<AssistantAnswer>(this.api, { message });
  }
}