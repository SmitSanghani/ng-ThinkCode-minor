import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { StudentService } from '../../../core/services/student.service';

@Component({
    selector: 'app-calendar',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './calendar.component.html',
    styleUrls: ['./calendar.component.css']
})
export class CalendarComponent implements OnInit {
    private studentService = inject(StudentService);

    currentDate: Date = new Date();
    daysInMonth: number[] = [];
    startDay: number = 0;
    monthName: string = '';
    year: number = 0;
    solvedThisMonth: number = 0;
    allSubmissions: any[] = [];

    ngOnInit() {
        this.loadSubmissions();
        this.generateCalendar();
    }

    loadSubmissions() {
        this.studentService.getMySubmissions().subscribe({
            next: (res) => {
                this.allSubmissions = res.data || res.submissions || [];
                this.updateSolvedCount();
            },
            error: (err) => {
                console.error('Error loading submissions for calendar:', err);
            }
        });
    }

    updateSolvedCount() {
        if (!this.allSubmissions.length) return;

        const year = this.currentDate.getFullYear();
        const month = this.currentDate.getMonth();

        // Count unique problems solved in this month
        const solvedProblems = new Set();
        this.allSubmissions.forEach(sub => {
            const status = sub.status ? sub.status.toLowerCase() : '';
            if (status === 'accepted' || status === 'solved') {
                const dateVal = sub.submittedAt || sub.createdAt || sub.date;
                if (dateVal) {
                    const subDate = new Date(dateVal);
                    if (subDate.getFullYear() === year && subDate.getMonth() === month) {
                        solvedProblems.add(sub.question?._id || sub.question?.id || sub.question || sub.problemId);
                    }
                }
            }
        });

        this.solvedThisMonth = solvedProblems.size;
    }

    generateCalendar() {
        const year = this.currentDate.getFullYear();
        const month = this.currentDate.getMonth();
        this.year = year;
        this.monthName = this.currentDate.toLocaleString('default', { month: 'long' });

        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);

        this.startDay = firstDay.getDay(); // 0 (Sun) to 6 (Sat)
        this.daysInMonth = Array.from({ length: lastDay.getDate() }, (_, i) => i + 1);
        this.updateSolvedCount();
    }

    isToday(day: number): boolean {
        const today = new Date();
        return day === today.getDate() &&
            this.currentDate.getMonth() === today.getMonth() &&
            this.currentDate.getFullYear() === today.getFullYear();
    }

    prevMonth() {
        this.currentDate.setMonth(this.currentDate.getMonth() - 1);
        this.generateCalendar();
    }

    nextMonth() {
        this.currentDate.setMonth(this.currentDate.getMonth() + 1);
        this.generateCalendar();
    }
}
