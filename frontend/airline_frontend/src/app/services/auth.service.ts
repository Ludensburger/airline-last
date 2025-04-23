import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, tap } from 'rxjs'; // Import BehaviorSubject, Observable, tap

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private apiUrl = 'http://127.0.0.1:8000/auth'; // Adjust as needed
  // Use a BehaviorSubject to hold the current auth state
  // Initialize based on token presence (or initial check)
  private isAuthenticatedSubject = new BehaviorSubject<boolean>(
    this.hasToken()
  );
  // Expose the state as an observable
  public isAuthenticated$: Observable<boolean> =
    this.isAuthenticatedSubject.asObservable();

  constructor(private http: HttpClient) {
    console.log(
      'AuthService Initialized. Initial auth state:',
      this.isAuthenticatedSubject.value
    );
  }

  // Example login method - adapt to your actual API call
  login(credentials: any): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/login/`, credentials).pipe(
      tap((response) => {
        // *** Look for 'access' token from the backend response ***
        if (response && response.access) {
          localStorage.setItem('authToken', response.access); // Store the access token
          this.isAuthenticatedSubject.next(true); // Update auth state
          console.log('Login successful, auth state updated to true');
        } else {
          console.error('Login response did not contain an access token.');
          this.isAuthenticatedSubject.next(false); // Ensure state is false if login fails
        }
      })
    );
  }

  // Example register method - adapt as needed
  register(userInfo: any): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/register/`, userInfo).pipe(
      tap((response) => {
        // *** Process the registration response to log the user in ***
        if (response && response.access) {
          localStorage.setItem('authToken', response.access); // Store the access token
          this.isAuthenticatedSubject.next(true); // Update auth state
          console.log(
            'Registration successful and user logged in, auth state updated to true'
          );
        } else {
          // Handle cases where registration might succeed but not return tokens immediately,
          // or if the response structure is different than expected.
          console.warn(
            'Registration completed, but no access token found in response. User not logged in automatically.'
          );
          // Do not change auth state here if registration doesn't auto-login
        }
      })
    );
  }

  logout(): void {
    localStorage.removeItem('authToken');
    this.isAuthenticatedSubject.next(false); // Update auth state
    console.log('Logout successful, auth state updated to false');
    // No navigation here, let the component handle it
  }

  // Check if a token exists (basic check)
  private hasToken(): boolean {
    const token = localStorage.getItem('authToken'); // Use 'authToken' consistently
    const has = !!token;
    console.log('AuthService: hasToken check:', has);
    return has;
  }

  // Optional: Keep the synchronous method if needed elsewhere,
  // but it reads the *current* value from the subject.
  isAuthenticated(): boolean {
    console.log(
      'AuthService: isAuthenticated() sync check called, returning:',
      this.isAuthenticatedSubject.value
    ); // Keep this log if you want
    return this.isAuthenticatedSubject.value;
  }

  getToken(): string | null {
    return localStorage.getItem('authToken'); // Use 'authToken' consistently
  }
}
