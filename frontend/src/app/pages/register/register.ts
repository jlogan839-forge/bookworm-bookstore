import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  imports: [ReactiveFormsModule, RouterLink],
  selector: 'app-register',
  styleUrl: './register.css',
  templateUrl: './register.html',
})
export class Register {
  private auth = inject(AuthService);
  private router = inject(Router);

  form = inject(FormBuilder).nonNullable.group({
    name: ['', Validators.required],
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(8)]],
  });

  error = signal('');
  submitting = signal(false);

  submit() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.error.set('Fill in every field. Passwords need at least 8 characters.');
      return;
    }
    this.submitting.set(true);
    this.error.set('');
    const { name, email, password } = this.form.getRawValue();

    this.auth.register(name, email, password).subscribe({
      next: () => this.router.navigate(['/account']),
      error: (err) => {
        this.error.set(err.error?.error ?? 'Something went wrong. Try again.');
        this.submitting.set(false);
      },
    });
  }
}