import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Auth } from '@angular/fire/auth';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { Router } from '@angular/router';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './login-page.html',
  styleUrls: ['./login-page.css']
})
export class LoginPage {
  email = '';
  password = '';
  loading = false;
  error = '';

  constructor(private auth: Auth, private router: Router) {}

  async onSignIn(): Promise<void> {
    this.error = '';
    if (!this.email || !this.password) {
      this.error = 'Please enter email and password.';
      return;
    }

    this.loading = true;
    try {
      await signInWithEmailAndPassword(this.auth, this.email, this.password);
      await this.router.navigate(['/events']);
    } catch (err: any) {
      this.error = err?.message ?? 'Sign-in failed.';
    } finally {
      this.loading = false;
    }
  }
}
