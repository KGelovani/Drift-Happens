import { Component, OnInit, OnDestroy } from '@angular/core';
import { SegmentService } from '../../services/segment.service';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

@Component({
  selector: 'app-segment-list',
  template: `
    <div class="segment-container">
      <h1>📊 Segments Management</h1>
      
      <div class="toolbar">
        <button class="btn btn-primary" (click)="openCreateSegmentModal()">
          ➕ Create New Segment
        </button>
      </div>

      <div class="segments-grid" *ngIf="segments.length > 0">
        <div *ngFor="let segment of segments" class="segment-card">
          <div class="segment-header">
            <h3>{{ segment.name }}</h3>
            <span class="segment-type" [class.dynamic]="segment.type === 'DYNAMIC'">
              {{ segment.type }}
            </span>
          </div>
          
          <p class="segment-description">{{ segment.description }}</p>
          
          <div class="segment-stats">
            <div class="stat">
              <span class="label">Members:</span>
              <span class="value">{{ segment.memberCount }}</span>
            </div>
            <div class="stat">
              <span class="label">Status:</span>
              <span class="value" [class.active]="segment.isActive">
                {{ segment.isActive ? '✅ Active' : '❌ Inactive' }}
              </span>
            </div>
          </div>

          <div class="segment-actions">
            <button class="btn btn-sm btn-info" (click)="viewSegmentDetails(segment.id)">
              👁️ View
            </button>
            <button class="btn btn-sm btn-warning" (click)="evaluateSegment(segment.id)">
              🔄 Evaluate
            </button>
            <button class="btn btn-sm btn-danger" (click)="deleteSegment(segment.id)">
              🗑️ Delete
            </button>
          </div>
        </div>
      </div>

      <div *ngIf="segments.length === 0" class="empty-state">
        <p>No segments found. Create one to get started!</p>
      </div>
    </div>
  `,
  styles: [`
    .segment-container {
      padding: 2rem;
      max-width: 1200px;
      margin: 0 auto;
    }

    h1 {
      margin-bottom: 2rem;
      color: #333;
    }

    .toolbar {
      margin-bottom: 2rem;
    }

    .btn {
      padding: 0.5rem 1rem;
      border: none;
      border-radius: 4px;
      cursor: pointer;
      font-size: 1rem;
    }

    .btn-primary {
      background: #007bff;
      color: white;
    }

    .btn-sm {
      padding: 0.25rem 0.75rem;
      font-size: 0.85rem;
      margin: 0.25rem;
    }

    .btn-info {
      background: #17a2b8;
      color: white;
    }

    .btn-warning {
      background: #ffc107;
      color: black;
    }

    .btn-danger {
      background: #dc3545;
      color: white;
    }

    .segments-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
      gap: 1.5rem;
    }

    .segment-card {
      border: 1px solid #ddd;
      border-radius: 8px;
      padding: 1.5rem;
      background: #fff;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
      transition: transform 0.2s;
    }

    .segment-card:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 8px rgba(0,0,0,0.15);
    }

    .segment-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 1rem;
    }

    .segment-header h3 {
      margin: 0;
      color: #333;
    }

    .segment-type {
      padding: 0.25rem 0.75rem;
      border-radius: 12px;
      font-size: 0.8rem;
      font-weight: bold;
    }

    .segment-type.dynamic {
      background: #d4edda;
      color: #155724;
    }

    .segment-description {
      color: #666;
      font-size: 0.9rem;
      margin-bottom: 1rem;
    }

    .segment-stats {
      display: flex;
      gap: 1rem;
      margin-bottom: 1rem;
      padding: 1rem;
      background: #f8f9fa;
      border-radius: 4px;
    }

    .stat {
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
    }

    .stat .label {
      font-size: 0.8rem;
      color: #666;
      text-transform: uppercase;
    }

    .stat .value {
      font-weight: bold;
      color: #333;
      font-size: 1.2rem;
    }

    .stat .value.active {
      color: #28a745;
    }

    .segment-actions {
      display: flex;
      gap: 0.5rem;
      flex-wrap: wrap;
    }

    .empty-state {
      text-align: center;
      padding: 3rem;
      color: #999;
    }
  `],
})
export class SegmentListComponent implements OnInit, OnDestroy {
  segments: any[] = [];
  private destroy$ = new Subject<void>();

  constructor(private segmentService: SegmentService) {}

  ngOnInit(): void {
    this.loadSegments();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadSegments(): void {
    this.segmentService
      .getAllSegments()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (segments) => {
          this.segments = segments;
        },
        error: (error) => {
          console.error('Error loading segments:', error);
        },
      });
  }

  viewSegmentDetails(id: string): void {
    console.log('View segment details:', id);
    // Navigate to detail view
  }

  evaluateSegment(id: string): void {
    this.segmentService
      .evaluateSegment(id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (deltas) => {
          console.log('Segment evaluated, deltas:', deltas);
          this.loadSegments(); // Refresh list
        },
        error: (error) => {
          console.error('Error evaluating segment:', error);
        },
      });
  }

  deleteSegment(id: string): void {
    if (confirm('Are you sure you want to delete this segment?')) {
      this.segmentService
        .deleteSegment(id)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: () => {
            this.loadSegments();
          },
          error: (error) => {
            console.error('Error deleting segment:', error);
          },
        });
    }
  }

  openCreateSegmentModal(): void {
    console.log('Open create segment modal');
    // Show modal
  }
}
