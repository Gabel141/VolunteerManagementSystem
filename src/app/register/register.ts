import { HttpClient } from '@angular/common/http';
import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

@Component({
  selector: 'app-register',
  imports: [ReactiveFormsModule],
  templateUrl: './register.html',
  styleUrl: './register.css',
})
export class Register {

  fb = inject(FormBuilder);
  router = inject(Router);
  authService = inject(AuthService);

  errorMessage: string | null = null;

  form = this.fb.nonNullable.group({
    username: ['', Validators.required],
    email: ['', Validators.required],
    password: ['', Validators.required],
  });

  onSubmit(): void {
    console.log('register');
    const rawForm = this.form.getRawValue()
    this.authService
      .register(rawForm.email, rawForm.username, rawForm.password)
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
