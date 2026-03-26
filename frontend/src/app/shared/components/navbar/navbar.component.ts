import { Component, inject, Signal, ElementRef, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { User } from '../../../core/models/user.model';
import { ChatStateService } from '../../../core/services/chat-state.service';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive],
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.css']
})
export class NavbarComponent {
  private authService = inject(AuthService);
  private router = inject(Router);
  private el = inject(ElementRef);
  public chatService = inject(ChatStateService);

  user: Signal<User | null> = this.authService.currentUser as Signal<User | null>;
  unreadCount = this.chatService.unreadCount;
  showDropdown = false;
  showMobileMenu = false;
  showNotifications = false;
  isScrolled = false;

  toggleNotification(event: Event) {
    event.stopPropagation();
    this.showNotifications = !this.showNotifications;
    if (this.showNotifications) {
      this.showDropdown = false;
    }
  }

  openStudentChat(student: any) {
    // Navigate to users management and open chat
    this.router.navigate(['/admin/users']);
    this.chatService.toggleChat({ id: student.id, name: student.name });
    this.showNotifications = false;
  }

  toggleMobileMenu() {
    this.showMobileMenu = !this.showMobileMenu;
    if (this.showMobileMenu) {
      this.showDropdown = false;
    }
  }

  toggleChat() {
    this.chatService.toggleChat();
    this.showMobileMenu = false;
  }

  @HostListener('document:click', ['$event'])
  onClickOutside(event: Event) {
    if (!this.el.nativeElement.contains(event.target)) {
      this.showDropdown = false;
      this.showMobileMenu = false;
      this.showNotifications = false;
    }
  }

  @HostListener('document:keydown.escape')
  onEscapePress() {
    this.showDropdown = false;
    this.showMobileMenu = false;
    this.showNotifications = false;
  }

  @HostListener('window:scroll')
  onWindowScroll() {
    this.isScrolled = window.scrollY > 20;
  }

  toggleDropdown(event: Event) {
    event.stopPropagation();
    this.showDropdown = !this.showDropdown;
  }

  logout() {
    this.authService.logout();
    this.showDropdown = false;
  }
}
