import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { StudentService, ProblemDetail } from '../../../core/services/student.service';
import { NavbarComponent } from '../../../shared/components/navbar/navbar.component';
import { MonacoEditorModule } from 'ngx-monaco-editor-v2';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';

@Component({
  selector: 'app-problem-detail',
  standalone: true,
  imports: [CommonModule, RouterLink, NavbarComponent, MonacoEditorModule, FormsModule],
  templateUrl: './problem-detail.component.html',
  styleUrls: ['./problem-detail.component.css']
})
export class ProblemDetailComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private studentService = inject(StudentService);
  private router = inject(Router);
  private sanitizer = inject(DomSanitizer);
  private cdr = inject(ChangeDetectorRef);

  // States
  problem: ProblemDetail | null = null;
  constraintsList: string[] = [];
  sampleTestCases: any[] = [];
  isLoading: boolean = true;
  hasError: boolean = false;
  isNotFound: boolean = false;
  isLocked: boolean = false;
  errorMessage: string = '';

  // Tab Management
  activeTab: string = 'description';
  activeEditorTab: string = 'testcase';

  // Editor State
  studentCode: string = '';
  selectedLanguage: string = 'javascript';

  editorOptions = {
    theme: 'vs-dark',
    language: 'javascript',
    fontSize: 14,
    fontFamily: "'Fira Code', 'Cascadia Code', 'Source Code Pro', monospace",
    minimap: { enabled: false },
    automaticLayout: true,
    padding: { top: 16, bottom: 16 },
    readOnly: false,
    scrollBeyondLastLine: false,
    lineNumbers: 'on',
    roundedSelection: false,
    cursorStyle: 'line',
    autoIndent: 'full' as const,
    wordWrap: 'on' as const,
    scrollbar: {
      vertical: 'visible' as const,
      horizontal: 'visible' as const,
      useShadows: false,
      verticalHasArrows: false,
      horizontalHasArrows: false,
      verticalScrollbarSize: 10,
      horizontalScrollbarSize: 10
    },
    suggestOnTriggerCharacters: true,
    acceptSuggestionOnEnter: 'on' as const,
    snippetSuggestions: 'top' as const,
    quickSuggestions: true
  };

  safeDescription: SafeHtml = '';

  ngOnInit() {
    this.route.params.subscribe(params => {
      const id = params['id'];
      if (id) {
        this.loadProblem(id);
      } else {
        this.showError('Problem ID is missing.');
      }
    });
  }

  loadProblem(id: string) {
    this.isLoading = true;
    this.hasError = false;
    this.isNotFound = false;
    this.cdr.detectChanges();

    this.studentService.getProblemById(id).subscribe({
      next: (res: ProblemDetail) => {
        if (!res) {
          this.isNotFound = true;
          this.isLoading = false;
          this.cdr.detectChanges();
          return;
        }

        this.problem = res;
        this.safeDescription = this.sanitizer.bypassSecurityTrustHtml(res.description || '');

        // Safely parse constraints into an array
        this.constraintsList = [];
        if (res.constraints) {
          if (Array.isArray(res.constraints)) {
            this.constraintsList = res.constraints;
          } else if (typeof res.constraints === 'string') {
            try {
              // Try to parse if it was saved as a JSON string array
              const parsed = JSON.parse(res.constraints);
              if (Array.isArray(parsed)) {
                this.constraintsList = parsed;
              } else {
                // Fallback: split by comma if comma separated
                this.constraintsList = res.constraints.split(',').map(s => s.trim());
              }
            } catch (e) {
              // Fallback to strict comma splitting
              this.constraintsList = res.constraints.split(',').map(s => s.trim());
            }
          }
        }

        // Properly assign Test Cases from the backend's robust sampleTestCases logic
        if (Array.isArray(res.sampleTestCases) && res.sampleTestCases.length > 0) {
          this.sampleTestCases = res.sampleTestCases;
        } else if (res.testCases && Array.isArray(res.testCases)) {
          // Absolute fallback if backend didn't send sampleTestCases
          const filtered = res.testCases.filter((tc: any) => tc.isSample);
          this.sampleTestCases = filtered.length > 0 ? filtered : res.testCases.slice(0, 2);
        }

        // Robust Code Injection: 
        // We set the code and then notify the editor via a small timeout 
        // to ensure the Monaco instance is ready to render the new content.
        const initialCode = res.functionSignature || '// Start coding here...';
        this.studentCode = initialCode;

        // Auto-detect language
        this.detectLanguage(initialCode);

        this.isLoading = false;

        // Force a re-render cycle
        setTimeout(() => {
          this.cdr.detectChanges();
        }, 100);
      },
      error: (err) => {
        console.error('Error loading problem:', err);
        if (err.status === 404) {
          this.isNotFound = true;
        } else {
          this.hasError = true;
          this.errorMessage = err.error?.message || "Failed to load problem details.";
        }
        this.isLoading = false;
        this.cdr.detectChanges();
      }
    });
  }

  private detectLanguage(code: string) {
    if (code.includes('public class') || code.includes('import java')) {
      this.onLanguageChange('java');
    } else if (code.includes('def ') || code.includes('import ')) {
      this.onLanguageChange('python');
    } else {
      this.onLanguageChange('javascript');
    }
  }

  onLanguageChange(lang: string) {
    this.selectedLanguage = lang;
    this.editorOptions = { ...this.editorOptions, language: lang };
    this.cdr.detectChanges();
  }

  resetCode() {
    if (this.problem) {
      if (confirm('Are you sure you want to reset your code to the starter signature?')) {
        this.studentCode = this.problem.functionSignature || '';
        this.cdr.detectChanges();
      }
    }
  }

  // --- Utility for Formatting Test Cases ---
  formatTestCaseInput(input: any): string {
    if (input === null || input === undefined) return 'No input provided';

    // If it's a string, try parsing it to see if it's JSON, otherwise return as is
    if (typeof input === 'string') {
      try {
        const parsed = JSON.parse(input);
        return JSON.stringify(parsed);
      } catch (e) {
        return input;
      }
    }

    // Return as compact JSON (handles arrays and objects)
    return JSON.stringify(input);
  }

  runCode() {
    this.activeEditorTab = 'result';
    console.log('Running code...', this.studentCode);
    // Logic for running code via backend
  }

  submitCode() {
    this.activeEditorTab = 'result';
    console.log('Submitting code...', this.studentCode);
    // Logic for submitting code via backend
  }

  private showError(msg: string) {
    this.hasError = true;
    this.errorMessage = msg;
    this.isLoading = false;
    this.cdr.detectChanges();
  }
}
