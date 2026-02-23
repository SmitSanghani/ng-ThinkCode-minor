import { Component, Input, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../../../core/services/auth.service';

@Component({
  selector: 'app-plan-badge',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './plan-badge.component.html',
  styleUrls: ['./plan-badge.component.css']
})
export class PlanBadgeComponent {
  @Input() plan: string = 'Free';

  private authService = inject(AuthService);

  getBadgeClass() {
    return {
      'badge-free': this.plan === 'Free',
      'badge-basic': this.plan === 'Basic',
      'badge-premium': this.plan === 'Premium'
    };
  }

  getIconClass() {
    return {
      'bi-person-fill': this.plan === 'Free',
      'bi-award-fill': this.plan === 'Basic',
      'bi-gem': this.plan === 'Premium'
    };
  }

  onUpgrade() {
    // Open upgrade modal or navigate to payment
    console.log('Open Upgrade Modal');
  }
}
