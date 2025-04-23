import { Component, OnInit } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { BookingService } from '../../services/booking.service';
import { AuthService } from '../../services/auth.service';
import { HttpErrorResponse } from '@angular/common/http';

@Component({
  selector: 'app-booking',
  standalone: true,
  imports: [CommonModule, FormsModule],
  providers: [DatePipe],
  templateUrl: './booking.component.html',
  styleUrls: ['./booking.component.css'],
})
export class BookingComponent implements OnInit {
  selectedFlight: any = null;
  passengerName: string = '';
  passengerEmail: string = '';
  flightClass: string = 'Economy';
  passengerCount: number = 1;

  isLoading = false;
  error: string | null = null;
  successMessage: string | null = null;

  constructor(
    private router: Router,
    private bookingService: BookingService,
    private authService: AuthService,
    private datePipe: DatePipe
  ) {}

  ngOnInit(): void {
    const state = history.state;
    this.selectedFlight = state?.flight;
    this.passengerCount = state?.passengerCount ?? 1;
    this.flightClass = state?.flightClass ?? 'Economy';

    if (!this.selectedFlight) {
      console.warn(
        'No flight data found in history.state. Cannot proceed with booking.'
      );
      this.error = 'Flight details missing. Please search again.';
    } else {
      console.log('Booking component received state:', {
        flight: this.selectedFlight,
        passengerCount: this.passengerCount,
        flightClass: this.flightClass,
      });
    }

    if (!this.authService.isAuthenticated()) {
      console.warn('User not authenticated. Redirecting to login.');
      this.router.navigate(['/login'], {
        queryParams: { returnUrl: this.router.url },
      });
    }
  }

  submitBooking(): void {
    if (
      !this.selectedFlight?.schedule?.flight_number ||
      !this.selectedFlight?.departure_time
    ) {
      this.error =
        'Selected flight data is incomplete (missing flight number or departure time).';
      return;
    }
    if (!this.passengerName || !this.passengerEmail) {
      this.error = 'Please fill in all required passenger details.';
      return;
    }
    if (this.passengerCount < 1) {
      this.error = 'Invalid passenger count.';
      return;
    }

    this.isLoading = true;
    this.error = null;
    this.successMessage = null;

    let departureDateStr = '';
    try {
      const departureDate = new Date(this.selectedFlight.departure_time);
      departureDateStr =
        this.datePipe.transform(departureDate, 'yyyy-MM-dd') || '';
      if (!departureDateStr) {
        throw new Error('Could not format departure date');
      }
    } catch (e) {
      console.error(
        'Error parsing or formatting departure date:',
        this.selectedFlight.departure_time,
        e
      );
      this.error = 'Invalid flight departure date format.';
      this.isLoading = false;
      return;
    }

    const bookingData = {
      flight_number: this.selectedFlight.schedule.flight_number,
      departure_date: departureDateStr,
      seats_booked: this.passengerCount,
      seat_class: this.flightClass.toLowerCase(), // Send as lowercase ('economy', 'business', 'first')
    };

    console.log(
      'Submitting booking data to add-by-flight-number:',
      bookingData // Verify lowercase in console
    );

    this.bookingService.createBookingByFlightNumber(bookingData).subscribe({
      next: (response) => {
        console.log('Booking successful:', response);
        this.isLoading = false;
        this.successMessage = 'Booking confirmed successfully!';
        setTimeout(() => this.router.navigate(['/bookings']), 2000);
      },
      error: (err: HttpErrorResponse) => {
        console.error('Booking failed:', err);
        this.isLoading = false;
        if (err.status === 401 || err.status === 403) {
          this.error = 'Authentication failed. Please log in again.';
          this.authService.logout();
          this.router.navigate(['/login']);
        } else {
          let backendError = 'Booking failed. Please try again.';
          if (err.error) {
            if (typeof err.error === 'string') {
              backendError = err.error;
            } else if (err.error.detail) {
              backendError = err.error.detail;
            } else if (err.error.non_field_errors) {
              backendError = err.error.non_field_errors.join(' ');
            } else if (typeof err.error === 'object') {
              const messages = Object.entries(err.error)
                .map(
                  ([key, value]) =>
                    `${key}: ${Array.isArray(value) ? value.join(', ') : value}`
                )
                .join('; ');
              if (messages) backendError = messages;
            }
          } else if (err.message) {
            backendError = err.message;
          }
          this.error = backendError;
        }
      },
      complete: () => {
        this.isLoading = false;
      },
    });
  }

  resetForm(): void {
    this.passengerName = '';
    this.passengerEmail = '';
    this.flightClass = 'Economy';
  }
}
