import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  imports: [ReactiveFormsModule, RouterLink],
  selector: 'app-login',
  styleUrl: './login.css',
  templateUrl: './login.html',
})
export class Login {
  private auth = inject(AuthService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  form = inject(FormBuilder).nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', Validators.required],
  });

  error = signal('');
  submitting = signal(false);

  submit() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.error.set('Enter your email and password.');
      return;
    }
    this.submitting.set(true);
    this.error.set('');
    const { email, password } = this.form.getRawValue();

    this.auth.login(email, password).subscribe({
      next: () => this.router.navigateByUrl(this.returnUrl()),
      error: (err) => {
        this.error.set(err.error?.error ?? 'Something went wrong. Try again.');
        this.submitting.set(false);
      },
    });
  }

  /**
   * Where to go after logging in: ?returnUrl=/books/123 from pages like book details,
   * otherwise the account page. Only paths on this site are allowed, so a link can't
   * send someone to another website after they log in.
   */
  private returnUrl(): string {
    const url = this.route.snapshot.queryParamMap.get('returnUrl');
    return url && url.startsWith('/') && !url.startsWith('//') ? url : '/account';
  }
}
