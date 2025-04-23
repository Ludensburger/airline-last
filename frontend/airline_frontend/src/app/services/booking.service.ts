import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root',
})
export class BookingService {
  private apiUrl = 'http://127.0.0.1:8000/api/bookings/'; // Primary endpoint
  private apiUrlByFlightNumber =
    'http://127.0.0.1:8000/bookings/add-by-flight-number/'; // Fallback endpoint

  constructor(private http: HttpClient, private authService: AuthService) {}

  private getHeaders(): HttpHeaders {
    const token = this.authService.getToken();
    if (!token) {
      return new HttpHeaders({ 'Content-Type': 'application/json' });
    }
    return new HttpHeaders({
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    });
  }

  // Method to create a new booking using the primary endpoint
  createBooking(bookingData: any): Observable<any> {
    return this.http.post<any>(this.apiUrl, bookingData, {
      headers: this.getHeaders(),
    });
  }

  // Method to create a new booking using the flight number endpoint
  createBookingByFlightNumber(bookingData: any): Observable<any> {
    return this.http.post<any>(this.apiUrlByFlightNumber, bookingData, {
      headers: this.getHeaders(),
    });
  }

  // Optional: Method to get user's bookings
  getMyBookings(): Observable<any[]> {
    const token = this.authService.getToken();
    if (!token) {
      return new Observable((observer) => {
        observer.error('Authentication token not found.');
        observer.complete();
      });
    }
    const headers = new HttpHeaders({
      Authorization: `Bearer ${token}`,
    });
    // Assuming your backend has an endpoint like /api/bookings/my/
    return this.http.get<any[]>(`${this.apiUrl}my/`, { headers: headers });
  }

  // Add other methods as needed (e.g., getBookingById, cancelBooking)
}
