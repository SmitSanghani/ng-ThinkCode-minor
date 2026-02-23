import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AdminService } from '../../../core/services/admin.service';

@Component({
  selector: 'app-admin-overview',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './overview.component.html'
})
export class AdminOverviewComponent implements OnInit {
  private adminService = inject(AdminService);

  ngOnInit() {
    // We'll fetch real data here later
  }
}
