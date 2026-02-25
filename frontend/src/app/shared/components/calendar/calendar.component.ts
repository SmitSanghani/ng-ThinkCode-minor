import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
    selector: 'app-calendar',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './calendar.component.html',
    styleUrls: ['./calendar.component.css']
})
export class CalendarComponent implements OnInit {
    currentDate: Date = new Date();
    daysInMonth: number[] = [];
    startDay: number = 0;
    monthName: string = '';
    year: number = 0;

    ngOnInit() {
        this.generateCalendar();
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
