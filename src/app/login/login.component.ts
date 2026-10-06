import { Component } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent {

  email = '';
  password = '';

  constructor(
    private router: Router
  ) {}

  login(): void {
    if (!this.email || !this.password) {
      return;
    }

    // TODO: Replace with real authentication
    localStorage.setItem('clipflow_logged_in', 'true');

    this.router.navigate(['/upload']);
  }

  loginWithGoogle(): void {
    // TODO: Implement Google OAuth
    console.log('Google login');
  }
}