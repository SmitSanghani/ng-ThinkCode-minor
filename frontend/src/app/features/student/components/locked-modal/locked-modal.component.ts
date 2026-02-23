import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-locked-modal',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './locked-modal.component.html',
  styleUrls: ['./locked-modal.component.css']
})
export class LockedModalComponent {
  @Input() reason: string = '';
  @Output() close = new EventEmitter<void>();

  onClose() {
    this.close.emit();
  }
}
