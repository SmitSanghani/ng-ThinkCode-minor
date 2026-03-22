import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NavbarComponent } from '../../../shared/components/navbar/navbar.component';
import { FooterComponent } from '../../../shared/components/footer/footer.component';

@Component({
  selector: 'app-faqs',
  standalone: true,
  imports: [CommonModule, NavbarComponent, FooterComponent],
  templateUrl: './faqs.component.html',
  styleUrls: ['./faqs.component.css']
})
export class FAQsComponent {
  faqs = [
    {
      question: 'What is ThinkCode?',
      answer: 'ThinkCode is a premier hands-on coding platform designed to help students and developers master data structures, algorithms, and technical interview skills through practice and simulation.',
      open: true
    },
    {
      question: 'How do the mock interviews work?',
      answer: 'Our mock interviews simulate real-world technical interview environments with live video, real-time code sharing, and AI-powered performance analysis to give you the most realistic experience possible.',
      open: false
    },
    {
      question: 'Are there company-specific preparation paths?',
      answer: 'Yes! We offer curated problem sets and interview tracks specifically designed for top tech giants like Google, Amazon, Meta, and Microsoft.',
      open: false
    },
    {
      question: 'Can I track my progress over time?',
      answer: 'Absolutely. ThinkCode provides detailed analytics, heatmaps of your activity, and a comprehensive dashboard to monitor your improvement and identify areas needing more focus.',
      open: false
    },
    {
      question: 'Is there a free tier available?',
      answer: 'Yes, we offer a generous free tier that includes access to daily challenges and a wide range of standard practice problems to get you started.',
      open: false
    }
  ];

  toggleFAQ(index: number) {
    this.faqs[index].open = !this.faqs[index].open;
  }
}
