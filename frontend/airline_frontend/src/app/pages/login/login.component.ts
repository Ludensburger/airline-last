import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router'; // Import Router and RouterModule
import { AuthService } from '../../services/auth.service'; // Adjust path if needed
import { HttpErrorResponse } from '@angular/common/http'; // Import HttpErrorResponse

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule], // Add RouterModule
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css'],
})
export class LoginComponent {
  username = '';
  password = '';
  error: string | null = null;
  isLoading = false;

  constructor(private authService: AuthService, private router: Router) {}

  login(): void {
    this.isLoading = true;
    this.error = null;
    console.log('Login attempt:', this.username);

    const credentials = {
      username: this.username,
      password: this.password,
    };

    // Call AuthService login method
    this.authService.login(credentials).subscribe({
      next: (response) => {
        // The tap operator in AuthService already handles setting the token
        // and updating the auth state. We just need to navigate.
        console.log('Login successful, navigating home.');
        this.isLoading = false;
        this.router.navigate(['/']); // Navigate home on success
      },
      error: (err: HttpErrorResponse) => {
        console.error('Login failed:', err);
        // Try to get a specific error message from the backend response
        this.error =
          err.error?.detail ||
          err.error?.message ||
          err.error?.error ||
          'Invalid username or password.';
        this.isLoading = false;
      },
      complete: () => {
        // Optional: Ensure loading is stopped even if error handling misses something
        this.isLoading = false;
      },
    });
  }
}
