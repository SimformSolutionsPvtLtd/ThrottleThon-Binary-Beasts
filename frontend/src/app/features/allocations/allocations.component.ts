import { Component, signal } from '@angular/core';
import { DragDropModule, CdkDragDrop, moveItemInArray, transferArrayItem } from '@angular/cdk/drag-drop';
import { MatCardModule } from '@angular/material/card';

interface DevCard {
  id: string;
  name: string;
  pct: number;
}

@Component({
  selector: 'ss-allocations',
  standalone: true,
  imports: [DragDropModule, MatCardModule],
  template: `
    <h1 class="text-2xl font-semibold mb-4">Allocations</h1>
    <div class="grid grid-cols-3 gap-4">
      <div>
        <h3 class="font-semibold mb-2">Bench</h3>
        <div
          cdkDropList
          #bench="cdkDropList"
          [cdkDropListData]="benchSig()"
          [cdkDropListConnectedTo]="[a, b]"
          (cdkDropListDropped)="drop($event)"
          class="min-h-40 bg-gray-50 p-2 rounded space-y-2"
        >
          @for (d of benchSig(); track d.id) {
            <mat-card cdkDrag class="p-2">{{ d.name }}</mat-card>
          }
        </div>
      </div>
      <div>
        <h3 class="font-semibold mb-2">Project A</h3>
        <div
          cdkDropList
          #a="cdkDropList"
          [cdkDropListData]="aSig()"
          [cdkDropListConnectedTo]="[bench, b]"
          (cdkDropListDropped)="drop($event)"
          class="min-h-40 bg-gray-50 p-2 rounded space-y-2"
        >
          @for (d of aSig(); track d.id) {
            <mat-card cdkDrag class="p-2">{{ d.name }} — {{ d.pct }}%</mat-card>
          }
        </div>
      </div>
      <div>
        <h3 class="font-semibold mb-2">Project B</h3>
        <div
          cdkDropList
          #b="cdkDropList"
          [cdkDropListData]="bSig()"
          [cdkDropListConnectedTo]="[bench, a]"
          (cdkDropListDropped)="drop($event)"
          class="min-h-40 bg-gray-50 p-2 rounded space-y-2"
        >
          @for (d of bSig(); track d.id) {
            <mat-card cdkDrag class="p-2">{{ d.name }} — {{ d.pct }}%</mat-card>
          }
        </div>
      </div>
    </div>
  `,
})
export class AllocationsComponent {
  readonly benchSig = signal<DevCard[]>([
    { id: '1', name: 'Falcon-1', pct: 0 },
    { id: '2', name: 'Falcon-2', pct: 0 },
  ]);
  readonly aSig = signal<DevCard[]>([{ id: '3', name: 'Falcon-3', pct: 80 }]);
  readonly bSig = signal<DevCard[]>([]);

  drop(e: CdkDragDrop<DevCard[]>) {
    if (e.previousContainer === e.container) {
      moveItemInArray(e.container.data, e.previousIndex, e.currentIndex);
    } else {
      transferArrayItem(e.previousContainer.data, e.container.data, e.previousIndex, e.currentIndex);
    }
  }
}
