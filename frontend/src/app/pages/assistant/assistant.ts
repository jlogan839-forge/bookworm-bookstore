import { Component, inject, signal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AssistantAnswer, AssistantService } from '../../services/assistant.service';

interface ChatTurn {
  question: string;
  answer: AssistantAnswer | null;
  error: string;
}

@Component({
  imports: [ReactiveFormsModule, RouterLink],
  selector: 'app-assistant',
  styleUrl: './assistant.css',
  templateUrl: './assistant.html',
})
export class Assistant {
  private assistant = inject(AssistantService);

  form = inject(FormBuilder).nonNullable.group({ question: '' });
  turns = signal<ChatTurn[]>([]);
  loading = signal(false);
  error = signal('');

  send() {
    const question = this.form.getRawValue().question.trim();
    if (!question) {
      this.error.set('Type a question first.');
      return;
    }
    this.error.set('');
    this.loading.set(true);
    this.form.reset();

    this.assistant.ask(question).subscribe({
      next: (answer) => {
        this.turns.update((t) => [...t, { question, answer, error: '' }]);
        this.loading.set(false);
      },
      error: (err: HttpErrorResponse) => {
        const message = err.error?.error ?? 'Something went wrong. Try again.';
        this.turns.update((t) => [...t, { question, answer: null, error: message }]);
        this.loading.set(false);
      },
    });
  }
}