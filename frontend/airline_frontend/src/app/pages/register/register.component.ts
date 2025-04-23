import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { HttpErrorResponse } from '@angular/common/http'; // Import HttpErrorResponse

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.css'],
})
export class RegisterComponent {
  username = '';
  email = '';
  password = '';
  passwordConfirm = '';
  error: string | null = null;
  isLoading = false;

  constructor(private authService: AuthService, private router: Router) {}

  register(): void {
    this.isLoading = true;
    this.error = null;

    if (this.password !== this.passwordConfirm) {
      this.error = 'Passwords do not match.';
      this.isLoading = false;
      return;
    }

    // Prepare user data for the service
    const registrationData = {
      username: this.username,
      email: this.email,
      password: this.password,
    };

    console.log('Register attempt with data:', registrationData);

    // Call the AuthService register method
    this.authService.register(registrationData).subscribe({
      next: (response) => {
        console.log('Registration successful:', response);
        this.isLoading = false;
        // Navigate to login page after successful registration
        this.router.navigate(['/login']);
        // Optionally: Show a success message before navigating
      },
      error: (err: HttpErrorResponse) => {
        console.error('Registration failed:', err);
        // Try to get a specific error message from the backend response
        this.error =
          err.error?.message ||
          err.error?.error ||
          'Registration failed. Please try again.';
        this.isLoading = false;
      },
      complete: () => {
        // Optional: Code to run after success or error, regardless of outcome
        this.isLoading = false; // Ensure loading is stopped
      },
    });
  }
}
