import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AdminService } from '../../../core/services/admin.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-manage-questions',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './manage-questions.component.html'
})
export class ManageQuestionsComponent implements OnInit {
  private adminService = inject(AdminService);
  questions: any[] = [];
  isLoading = false;

  ngOnInit() {
    this.loadQuestions();
  }

  loadQuestions() {
    this.isLoading = true;
    this.adminService.getQuestions().subscribe({
      next: (res) => {
        this.questions = res.data;
        this.isLoading = false;
      },
      error: () => this.isLoading = false
    });
  }

  deleteQuestion(id: string) {
    Swal.fire({
      title: 'Are you sure?',
      text: "This question will be permanently removed!",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#4F46E5',
      cancelButtonColor: '#F43F5E',
      confirmButtonText: 'Yes, delete it!'
    }).then((result) => {
      if (result.isConfirmed) {
        this.adminService.deleteQuestion(id).subscribe({
          next: () => {
            Swal.fire('Deleted!', 'Question has been removed.', 'success');
            this.loadQuestions();
          }
        });
      }
    });
  }
}
