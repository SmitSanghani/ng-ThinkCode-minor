import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AdminService } from '../../../core/services/admin.service';

@Component({
    selector: 'app-admin-statistics',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './statistics.component.html'
})
export class StatisticsComponent implements OnInit {
    private adminService = inject(AdminService);

    ngOnInit() {
        // Analytics data loading logic
    }
}
