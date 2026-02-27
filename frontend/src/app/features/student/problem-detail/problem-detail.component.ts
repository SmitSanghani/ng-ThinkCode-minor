import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import Swal from 'sweetalert2';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { StudentService, ProblemDetail } from '../../../core/services/student.service';
import { MonacoEditorModule } from 'ngx-monaco-editor-v2';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';

@Component({
  selector: 'app-problem-detail',
  standalone: true,
  imports: [CommonModule, RouterLink, MonacoEditorModule, FormsModule],
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

  // Panel toggle state
  leftCollapsed: boolean = false;
  rightCollapsed: boolean = false;
  consoleExpanded: boolean = false;
  consoleCollapsed: boolean = false;
  editorBodyCollapsed: boolean = false;
  get windowHeight(): number { return window.innerHeight; }

  private editorInstance: any = null;

  // Execution & Submission State
  isExecuting: boolean = false;
  isSubmitting: boolean = false;
  isAskingAI: boolean = false;
  canSubmit: boolean = false;
  executionResult: any = null;
  submissionResult: any = null;
  aiFeedback: any = null;
  latestGrade: string | null = null;

  // Chat Mentor State
  showAIPanel: boolean = false;
  isThreeColumn: boolean = false;
  chatMessages: any[] = [];
  chatInput: string = '';
  selectedResultTab: number = 0;

  toggleThreeColumn() {
    this.isThreeColumn = !this.isThreeColumn;
    this.showAIPanel = this.isThreeColumn;

    if (this.isThreeColumn) {
      this.leftPanelWidth = 25; // Narrower description
      this.chatPanelWidth = 25; // Right chat panel

      // Auto-start chat with first analysis if empty
      if (this.chatMessages.length === 0) {
        this.askAI();
      }
    } else {
      this.leftPanelWidth = 45; // Restore split
    }

    this.refreshEditorLayout();
  }

  askAI() {
    if (!this.problem || !this.studentCode || this.isAskingAI) return;

    this.isAskingAI = true;
    this.showAIPanel = true;
    this.cdr.detectChanges();

    this.studentService.getAIFeedback(this.problem.id, this.studentCode, this.chatMessages).subscribe({
      next: (res) => {
        const feedback = res.data;
        this.aiFeedback = feedback;

        // Add to chat history
        this.chatMessages.push({
          role: 'assistant',
          grade: feedback.grade,
          explanation: feedback.explanation,
          hints: feedback.improvementHints,
          time: new Date()
        });

        this.isAskingAI = false;
        this.cdr.detectChanges();
        this.scrollToBottom();
      },
      error: (err) => {
        console.error('AI Feedback error:', err);
        this.isAskingAI = false;
        this.cdr.detectChanges();
      }
    });
  }

  sendChatMessage() {
    if (!this.chatInput.trim() || this.isAskingAI) return;

    const userMsg = this.chatInput.trim();
    this.chatMessages.push({
      role: 'user',
      content: userMsg,
      time: new Date()
    });
    this.chatInput = '';

    this.isAskingAI = true;
    this.cdr.detectChanges();
    this.scrollToBottom();

    // Context-aware chat using history
    this.studentService.getAIFeedback(this.problem!.id, this.studentCode, this.chatMessages).subscribe({
      next: (res) => {
        const feedback = res.data;
        this.chatMessages.push({
          role: 'assistant',
          grade: feedback.grade,
          explanation: feedback.explanation,
          hints: feedback.improvementHints,
          time: new Date()
        });
        this.isAskingAI = false;
        this.cdr.detectChanges();
        this.scrollToBottom();
      },
      error: () => {
        this.isAskingAI = false;
        this.cdr.detectChanges();
      }
    });
  }

  copiedMessageIndex: number | null = null;
  copiedEditor: boolean = false;

  copyEditorCode() {
    if (!this.studentCode) return;
    navigator.clipboard.writeText(this.studentCode).then(() => {
      this.copiedEditor = true;
      this.cdr.detectChanges();
      setTimeout(() => {
        this.copiedEditor = false;
        this.cdr.detectChanges();
      }, 2000);
    });
  }
  copyToClipboard(text: string, index: number) {
    navigator.clipboard.writeText(text).then(() => {
      this.copiedMessageIndex = index;
      this.cdr.detectChanges();

      setTimeout(() => {
        if (this.copiedMessageIndex === index) {
          this.copiedMessageIndex = null;
          this.cdr.detectChanges();
        }
      }, 2000);
    });
  }

  editingMessageIndex: number | null = null;
  editInput: string = '';

  editMessage(msg: any, index: number) {
    if (msg.role !== 'user') return;
    this.editingMessageIndex = index;
    this.editInput = msg.content;
  }

  cancelEdit() {
    this.editingMessageIndex = null;
    this.editInput = '';
  }

  saveEdit(index: number) {
    if (!this.editInput.trim() || this.isAskingAI) return;

    // Update the message content
    this.chatMessages[index].content = this.editInput.trim();

    // Remove all messages AFTER this one
    this.chatMessages.splice(index + 1);

    this.editingMessageIndex = null;
    this.isAskingAI = true;
    this.cdr.detectChanges();
    this.scrollToBottom();

    this.studentService.getAIFeedback(this.problem!.id, this.studentCode, this.chatMessages).subscribe({
      next: (res) => {
        const feedback = res.data;
        this.chatMessages.push({
          role: 'assistant',
          grade: feedback.grade,
          explanation: feedback.explanation,
          hints: feedback.improvementHints,
          time: new Date()
        });
        this.isAskingAI = false;
        this.cdr.detectChanges();
        this.scrollToBottom();
      },
      error: () => {
        this.isAskingAI = false;
        this.cdr.detectChanges();
      }
    });
  }

  scrollToBottom() {
    setTimeout(() => {
      const container = document.getElementById('chat-container');
      if (container) {
        container.scrollTop = container.scrollHeight;
      }
    }, 50);
  }

  closeAIPanel() {
    this.showAIPanel = false;
    this.isThreeColumn = false;
    this.leftPanelWidth = 45;
    this.refreshEditorLayout();
  }

  // Resizable Console Panel (vertical)
  outputPanelHeight: number = 250;
  private isResizing: boolean = false;
  private resizeStartY: number = 0;
  private resizeStartHeight: number = 250;
  private boundMouseMove = this.onResizeMouseMove.bind(this);
  private boundMouseUp = this.stopResize.bind(this);

  // Resizable Side Panels (horizontal)
  leftPanelWidth: number = 45;
  chatPanelWidth: number = 25;
  private isHorizontalResizing: boolean = false;
  private isChatResizing: boolean = false;
  private hResizeStartX: number = 0;
  private hResizeStartWidth: number = 45;

  private boundHMouseMove = this.onHorizontalResizeMouseMove.bind(this);
  private boundHMouseUp = this.stopHorizontalResize.bind(this);

  private boundChatMouseMove = this.onChatResizeMouseMove.bind(this);
  private boundChatMouseUp = this.stopChatResize.bind(this);

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
    quickSuggestions: true,
    autoClosingBrackets: 'always' as const,
    autoClosingQuotes: 'always' as const,
    formatOnType: true,
    formatOnPaste: true,
    cursorSmoothCaretAnimation: 'on' as const,
    smoothScrolling: true,
    mouseWheelZoom: true
  };

  monacoError: { line: number; message: string } | null = null;

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

        // Set Default starter code
        this.studentCode = res.functionSignature || '// Start coding here...';

        // 🟢 Fetch Latest Submission to pre-fill editor
        this.studentService.getLatestSubmission(res.id).subscribe({
          next: (subRes) => {
            if (subRes && subRes.success && subRes.data && subRes.data.code) {
              this.studentCode = subRes.data.code;
            } else if (res.functionSignature) {
              this.studentCode = res.functionSignature;
            } else {
              this.studentCode = '// Start coding here...';
            }

            this.detectLanguage(this.studentCode);

            // 🟦 Fetch Chat History
            this.studentService.getChatHistory(res.id).subscribe({
              next: (chatRes) => {
                if (chatRes.success && chatRes.data) {
                  this.chatMessages = chatRes.data;
                }
                this.isLoading = false;
                this.refreshEditorLayout();
                this.cdr.detectChanges();
                this.scrollToBottom();
              },
              error: () => {
                this.isLoading = false;
                this.cdr.detectChanges();
              }
            });
          },
          error: () => {
            this.studentCode = res.functionSignature || '// Start coding here...';
            this.detectLanguage(this.studentCode);
            this.isLoading = false;
            this.cdr.detectChanges();
          }
        });

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
      Swal.fire({
        title: 'Reset Code?',
        text: 'This will replace your current code with the original function signature.',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#3b82f6',
        cancelButtonColor: '#94a3b8',
        confirmButtonText: 'Yes, reset it!',
        cancelButtonText: 'Cancel',
        background: '#1e293b',
        color: '#f8fafc'
      }).then((result) => {
        if (result.isConfirmed) {
          this.studentCode = this.problem!.functionSignature || '';
          this.cdr.detectChanges();
          this.showToast('success', 'Code reset successfully');
        }
      });
    }
  }

  private showToast(icon: 'success' | 'error' | 'warning' | 'info', title: string) {
    const Toast = Swal.mixin({
      toast: true,
      position: 'top-end',
      showConfirmButton: false,
      timer: 3000,
      timerProgressBar: true,
      didOpen: (toast) => {
        toast.onmouseenter = Swal.stopTimer;
        toast.onmouseleave = Swal.resumeTimer;
      }
    });

    Toast.fire({
      icon: icon,
      title: title
    });
  }

  // --- Utility for Formatting Test Cases ---
  formatTestCaseInput(input: any): string {
    if (input === null || input === undefined) return 'No input provided';

    let obj = input;
    if (typeof input === 'string') {
      try {
        obj = JSON.parse(input);
      } catch (e) {
        return input;
      }
    }

    // If it's an object (and not an array), format as "key = value, key = value"
    if (typeof obj === 'object' && obj !== null && !Array.isArray(obj)) {
      return Object.entries(obj)
        .map(([key, value]) => `${key} = ${JSON.stringify(value)}`)
        .join(', ');
    }

    // Otherwise return as compact JSON (standard for arrays/primitives)
    return JSON.stringify(obj);
  }

  /**
   * Safe output formatter — only treats `undefined` as N/A.
   * 0, false, null, "" are all valid outputs and must be shown as-is.
   */
  safeOutput(value: any): any {
    return value === undefined ? 'N/A' : value;
  }

  copySolution() {
    if (this.problem?.referenceSolution) {
      navigator.clipboard.writeText(this.problem.referenceSolution).then(() => {
        this.showToast('success', 'Solution copied to clipboard!');
      });
    }
  }

  runCode() {
    if (!this.problem || !this.studentCode || this.isExecuting) return;

    this.isExecuting = true;
    this.executionResult = null;
    this.activeEditorTab = 'result';
    this.latestGrade = null; // Reset previous grade
    this.cdr.detectChanges();

    // 1. Execute the code
    this.studentService.executeCode(this.problem.id, this.studentCode, this.selectedLanguage).subscribe({
      next: (res) => {
        this.executionResult = res;
        this.canSubmit = res.canSubmit || false;
        this.isExecuting = false;

        if (res.syntaxError) {
          this.showToast('error', 'Compilation Error');
          this.latestGrade = 'Needs Fix';
        } else if (res.summary?.allPassed) {
          this.showToast('success', 'Test cases passed!');
        } else {
          this.showToast('info', 'Check execution results');
        }

        // 2. Fetch AI Grading in parallel (if not already asking)
        if (!this.isAskingAI) {
          this.getAIGradeOnly();
        }

        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Execution error:', err);
        this.executionResult = {
          success: false,
          message: err.error?.message || 'Code execution failed due to an internal error.',
        };
        this.isExecuting = false;
        this.canSubmit = false;
        this.cdr.detectChanges();
      }
    });
  }

  // Silent helper to just get the grade/explanation without opening the full chat panel unless requested
  private getAIGradeOnly() {
    if (!this.problem) return;
    this.isAskingAI = true;
    this.studentService.getAIFeedback(this.problem.id, this.studentCode, []).subscribe({
      next: (res) => {
        const feedback = res.data;
        this.latestGrade = feedback.grade;
        this.aiFeedback = {
          grade: feedback.grade,
          explanation: feedback.explanation
        };
        this.isAskingAI = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.isAskingAI = false;
        this.cdr.detectChanges();
      }
    });
  }

  submitCode() {
    if (!this.problem || !this.studentCode || this.isSubmitting || !this.canSubmit) return;

    this.isSubmitting = true;
    this.submissionResult = null;
    this.cdr.detectChanges();

    this.studentService.submitSolution(this.problem.id, this.studentCode).subscribe({
      next: (res) => {
        this.isSubmitting = false;
        const result = res.data;

        // Capture Grade from submission
        if (result.grade) {
          this.latestGrade = result.grade;
          this.aiFeedback = {
            grade: result.grade,
            explanation: result.explanation
          };
        }

        if (result.status === 'Accepted') {
          Swal.fire({
            title: 'Accepted!',
            text: `🎉 Congratulations! Grade: ${result.grade || 'A'}. Your solution passed all test cases.`,
            icon: 'success',
            confirmButtonColor: '#3b82f6',
            background: '#1e293b',
            color: '#f8fafc'
          }).then(() => {
            this.router.navigate(['/student/problems']);
          });
        } else {
          Swal.fire({
            title: result.status,
            text: `${result.passedCount} / ${result.totalTests} test cases passed. Grade: ${result.grade || 'Needs Fix'}`,
            icon: 'error',
            confirmButtonColor: '#3b82f6',
            background: '#1e293b',
            color: '#f8fafc'
          }).then(() => {
            this.router.navigate(['/student/problems']);
          });
        }
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Submission error:', err);
        this.showToast('error', err.error?.message || 'Failed to submit solution.');
        this.isSubmitting = false;
        this.cdr.detectChanges();
      }
    });
  }

  // --- Better Panel Toggles with Resize Refresh ---
  toggleEditorBody() {
    this.editorBodyCollapsed = !this.editorBodyCollapsed;
    // If we hide editor, make sure console is not collapsed
    if (this.editorBodyCollapsed) this.consoleCollapsed = false;
    this.refreshEditorLayout();
  }

  toggleConsoleCollapse() {
    this.consoleCollapsed = !this.consoleCollapsed;
    if (this.consoleCollapsed) {
      this.consoleExpanded = false;
    } else {
      // If we show console, make sure editor isn't full-screen hidden
      if (this.editorBodyCollapsed && !this.leftCollapsed) this.editorBodyCollapsed = false;
    }
    this.refreshEditorLayout();
  }

  toggleConsoleExpand() {
    this.consoleExpanded = !this.consoleExpanded;
    if (this.consoleExpanded) {
      this.consoleCollapsed = false;
      this.editorBodyCollapsed = false; // Don't hide editor, just make console big
    }
    this.refreshEditorLayout();
  }

  // --- Real Maximize Logic for the Square Buttons ---
  maximizeDescription() {
    // If already maximized, restore (show right panel)
    if (this.rightCollapsed) {
      this.rightCollapsed = false;
    } else {
      // Maximize: show left, hide right
      this.leftCollapsed = false;
      this.rightCollapsed = true;
    }
    this.refreshEditorLayout();
  }

  maximizeEditor() {
    // If already maximized, restore (show left and console)
    const isFull = this.leftCollapsed && !this.rightCollapsed && this.consoleCollapsed;
    if (isFull) {
      this.leftCollapsed = false;
      this.consoleCollapsed = false;
    } else {
      // Maximize: hide left, hide console, show editor
      this.leftCollapsed = true;
      this.rightCollapsed = false;
      this.consoleCollapsed = true;
      this.editorBodyCollapsed = false;
    }
    this.refreshEditorLayout();
  }

  maximizeConsole() {
    // If already maximized, restore (show left and editor)
    const isFull = this.leftCollapsed && !this.rightCollapsed && this.editorBodyCollapsed;
    if (isFull) {
      this.leftCollapsed = false;
      this.editorBodyCollapsed = false;
    } else {
      // Maximize: hide left, hide editor, show console
      this.leftCollapsed = true;
      this.rightCollapsed = false;
      this.editorBodyCollapsed = true;
      this.consoleCollapsed = false;
      this.consoleExpanded = false; // console is flex-1 anyway when editor is hidden
    }
    this.refreshEditorLayout();
  }

  private refreshEditorLayout() {
    // Monaco needs a resize event to recalculate its width/height when containers change
    setTimeout(() => {
      window.dispatchEvent(new Event('resize'));
      this.cdr.detectChanges();
    }, 100);
  }

  private showError(msg: string) {
    this.hasError = true;
    this.errorMessage = msg;
    this.isLoading = false;
    this.cdr.detectChanges();
  }

  // --- Resizable Console Panel (vertical) ---
  startResize(event: MouseEvent) {
    event.preventDefault();
    this.isResizing = true;
    this.resizeStartY = event.clientY;
    this.resizeStartHeight = this.outputPanelHeight;
    // Add global class to prevent interaction/lag during drag
    document.body.classList.add('resizing-vertical');
    document.addEventListener('mousemove', this.boundMouseMove);
    document.addEventListener('mouseup', this.boundMouseUp);
  }

  private _rafV: number | null = null;
  private onResizeMouseMove(event: MouseEvent) {
    if (!this.isResizing) return;
    if (this._rafV) return; // already a frame queued
    this._rafV = requestAnimationFrame(() => {
      const delta = this.resizeStartY - event.clientY;
      this.outputPanelHeight = Math.min(Math.max(this.resizeStartHeight + delta, 80), window.innerHeight * 0.7);
      this.cdr.detectChanges();
      this._rafV = null;
    });
  }

  private stopResize() {
    this.isResizing = false;
    document.body.classList.remove('resizing-vertical');
    if (this._rafV) { cancelAnimationFrame(this._rafV); this._rafV = null; }
    document.removeEventListener('mousemove', this.boundMouseMove);
    document.removeEventListener('mouseup', this.boundMouseUp);
    this.refreshEditorLayout(); // Final refresh when done
  }

  // --- Resizable Side Panels (horizontal) ---
  startHorizontalResize(event: MouseEvent) {
    event.preventDefault();
    this.isHorizontalResizing = true;
    this.hResizeStartX = event.clientX;
    this.hResizeStartWidth = this.leftPanelWidth;
    // Add global class to prevent interaction/lag during drag
    document.body.classList.add('resizing-horizontal');
    document.addEventListener('mousemove', this.boundHMouseMove);
    document.addEventListener('mouseup', this.boundHMouseUp);
  }

  private _rafH: number | null = null;
  private onHorizontalResizeMouseMove(event: MouseEvent) {
    if (!this.isHorizontalResizing) return;
    if (this._rafH) return; // already a frame queued
    this._rafH = requestAnimationFrame(() => {
      const delta = event.clientX - this.hResizeStartX;
      const newWidthPct = this.hResizeStartWidth + (delta / window.innerWidth) * 100;
      this.leftPanelWidth = Math.min(Math.max(newWidthPct, 25), 70);
      this.cdr.detectChanges();
      this._rafH = null;
    });
  }

  private stopHorizontalResize() {
    this.isHorizontalResizing = false;
    document.body.classList.remove('resizing-horizontal');
    if (this._rafH) { cancelAnimationFrame(this._rafH); this._rafH = null; }
    document.removeEventListener('mousemove', this.boundHMouseMove);
    document.removeEventListener('mouseup', this.boundHMouseUp);
    this.refreshEditorLayout(); // Final refresh when done
  }

  // --- Resizable Chat Panel (horizontal) ---
  startChatResize(event: MouseEvent) {
    event.preventDefault();
    this.isChatResizing = true;
    this.hResizeStartX = event.clientX;
    this.hResizeStartWidth = this.chatPanelWidth;
    document.body.classList.add('resizing-horizontal');
    document.addEventListener('mousemove', this.boundChatMouseMove);
    document.addEventListener('mouseup', this.boundChatMouseUp);
  }

  private onChatResizeMouseMove(event: MouseEvent) {
    if (!this.isChatResizing) return;
    const delta = this.hResizeStartX - event.clientX;
    const newWidthPct = this.hResizeStartWidth + (delta / window.innerWidth) * 100;
    this.chatPanelWidth = Math.min(Math.max(newWidthPct, 20), 40);
    this.cdr.detectChanges();
  }

  private stopChatResize() {
    this.isChatResizing = false;
    document.body.classList.remove('resizing-horizontal');
    document.removeEventListener('mousemove', this.boundChatMouseMove);
    document.removeEventListener('mouseup', this.boundChatMouseUp);
    this.refreshEditorLayout();
  }

  onEditorInit(editor: any) {
    this.editorInstance = editor;

    // Listen for model markers (syntax errors)
    const monaco = (window as any).monaco;
    if (monaco) {
      // 1. Mandatory JS Validation
      monaco.languages.typescript.javascriptDefaults.setDiagnosticsOptions({
        noSemanticValidation: false,
        noSyntaxValidation: false,
        diagnosticCodesToIgnore: [1108]
      });

      // 2. Strict Mode Enable (VS Code like - adjusted for JS)
      monaco.languages.typescript.javascriptDefaults.setCompilerOptions({
        target: monaco.languages.typescript.ScriptTarget.ES2020,
        allowNonTsExtensions: true,
        moduleResolution: monaco.languages.typescript.ModuleResolutionKind.NodeJs,
        module: monaco.languages.typescript.ModuleKind.CommonJS,
        checkJs: true,
        strict: false,
        noImplicitAny: false,
      });

      // Clear banner early on change to feel more responsive
      this.editorInstance.onDidChangeModelContent(() => {
        if (this.monacoError) {
          this.monacoError = null;
          this.cdr.detectChanges();
        }
      });

      monaco.editor.onDidChangeMarkers(() => {
        const model = editor.getModel();
        if (!model) return;

        const markers = monaco.editor.getModelMarkers({ resource: model.uri });
        // Sort markers by line number so we always show the FIRST error in the banner
        const errors = markers
          .filter((m: any) => m.severity === monaco.MarkerSeverity.Error)
          .sort((a: any, b: any) => a.startLineNumber - b.startLineNumber);

        if (errors.length > 0) {
          this.monacoError = {
            line: errors[0].startLineNumber,
            message: errors[0].message
          };
        } else {
          this.monacoError = null;
        }
        this.cdr.detectChanges();
      });
    }

    // Force layout update after init
    setTimeout(() => {
      editor.layout();
      this.cdr.detectChanges();
    }, 100);
  }
}
