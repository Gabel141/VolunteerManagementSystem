import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

@Component({
  selector: 'app-login-page',
  imports: [ReactiveFormsModule],
  templateUrl: './login-page.html',
  styleUrl: './login-page.css',
})
export class LoginPage {
  
  fb = inject(FormBuilder);
  router = inject(Router);
  authService = inject(AuthService);

  errorMessage: string | null = null;

  form = this.fb.nonNullable.group({
    email: ['', Validators.required],
    password: ['', Validators.required],
  });



  onSubmit(): void {
    console.log('register');
    const rawForm = this.form.getRawValue()
    this.authService
      .login(rawForm.email, rawForm.password)
      .subscribe({
        next: () => {
        this.router.navigateByUrl('/');
        },
        error: (err) => {
          this.errorMessage = err.code;
        }

    })
  }

}
