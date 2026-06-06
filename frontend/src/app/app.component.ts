import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { CommonModule } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';
import { SegmentListComponent } from './components/segment-list.component';

@Component({
  selector: 'app-root',
  template: `
    <header class="app-header">
      <div class="header-content">
        <h1>🧩 Drift Happens</h1>
        <p>Dynamic Segment Management System</p>
      </div>
    </header>

    <nav class="app-nav">
      <a href="#/" class="nav-link">Dashboard</a>
      <a href="#/segments" class="nav-link">Segments</a>
      <a href="#/customers" class="nav-link">Customers</a>
      <a href="#/simulator" class="nav-link">Simulator</a>
    </nav>

    <main class="app-main">
      <router-outlet></router-outlet>
    </main>

    <footer class="app-footer">
      <p>&copy; 2026 Drift Happens. All rights reserved.</p>
    </footer>
  `,
  styles: [`
    :host {
      display: flex;
      flex-direction: column;
      min-height: 100vh;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
    }

    .app-header {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 2rem;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
    }

    .header-content h1 {
      margin: 0 0 0.5rem 0;
      font-size: 2rem;
    }

    .header-content p {
      margin: 0;
      opacity: 0.9;
    }

    .app-nav {
      background: #f8f9fa;
      padding: 1rem;
      display: flex;
      gap: 1rem;
      border-bottom: 1px solid #dee2e6;
      flex-wrap: wrap;
    }

    .nav-link {
      color: #495057;
      text-decoration: none;
      padding: 0.5rem 1rem;
      border-radius: 4px;
      transition: background 0.2s;
    }

    .nav-link:hover {
      background: #e9ecef;
    }

    .app-main {
      flex: 1;
      overflow-y: auto;
    }

    .app-footer {
      background: #f8f9fa;
      border-top: 1px solid #dee2e6;
      padding: 1rem;
      text-align: center;
      color: #6c757d;
      font-size: 0.9rem;
    }
  `],
  standalone: true,
  imports: [RouterOutlet, CommonModule, HttpClientModule, SegmentListComponent],
})
export class AppComponent {
  title = 'Drift Happens';
}
