import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class DeltaNotificationService {
  private deltaSubject = new BehaviorSubject<any[]>([]);
  public delta$ = this.deltaSubject.asObservable();

  constructor() {
    this.initWebSocket();
  }

  private initWebSocket(): void {
    // Connect to WebSocket or Server-Sent Events for real-time delta updates
    // This is a placeholder - would connect to backend in production
    console.log('Delta notification service initialized');
  }

  addDelta(delta: any): void {
    const currentDeltas = this.deltaSubject.value;
    this.deltaSubject.next([...currentDeltas, delta]);
  }

  clearDeltas(): void {
    this.deltaSubject.next([]);
  }
}
