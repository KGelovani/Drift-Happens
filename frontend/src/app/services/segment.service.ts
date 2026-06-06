import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class SegmentService {
  private apiUrl = '/api/segments';

  constructor(private http: HttpClient) {}

  getAllSegments(): Observable<any[]> {
    return this.http.get<any[]>(this.apiUrl);
  }

  getSegment(id: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/${id}`);
  }

  createSegment(payload: any): Observable<any> {
    return this.http.post(this.apiUrl, payload);
  }

  evaluateSegment(id: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/${id}/evaluate`, {});
  }

  getSegmentMembers(
    id: string,
    limit: number = 100,
    offset: number = 0,
  ): Observable<any> {
    return this.http.get(`${this.apiUrl}/${id}/members`, {
      params: { limit: limit.toString(), offset: offset.toString() },
    });
  }

  getSegmentDeltas(id: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/${id}/deltas`);
  }

  deleteSegment(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}
