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
  styleUrls: ['./booking.component.css'], // Make sure to include the CSS
})
export class BookingComponent implements OnInit {
  selectedFlight: any = null;
  passengerNames: string[] = [];
  passengerEmail: string = '';
  flightClass: string = 'Economy';
  passengerCount: number = 1;
  confirmationId: string = ''; // Add confirmationId

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

    this.passengerNames = Array(this.passengerCount).fill('');

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

  getPassengerArray(): number[] {
    return Array(this.passengerCount);
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
    if (this.passengerNames.some((name) => !name.trim())) {
      this.error = 'Please fill in the full name for all passengers.';
      return;
    }
    if (!this.passengerEmail) {
      this.error = "Please enter the lead passenger's email address.";
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
      seat_class: this.flightClass.toLowerCase(),
      passenger_details: this.passengerNames.map((name, index) => ({
        name: name.trim(),
        is_lead: index === 0,
        email: index === 0 ? this.passengerEmail : null,
      })),
    };

    console.log('Submitting booking data with passenger details:', bookingData);

    this.bookingService.createBookingByFlightNumber(bookingData).subscribe({
      next: (response) => {
        console.log('Booking successful:', response);
        this.generateConfirmationId(); // Generate ID on successful submission
        this.isLoading = false;
        this.successMessage = 'E-Ticket Generated!';
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
    this.passengerNames = Array(this.passengerCount).fill('');
    this.passengerEmail = '';
    this.flightClass = 'Economy';
  }

  navigateToBookings(): void {
    this.router.navigate(['/bookings']);
  }

  generateConfirmationId(): void {
    const flightNumber = this.selectedFlight?.schedule?.flight_number || '000';
    const departureCityCode =
      this.selectedFlight?.schedule?.departure_city?.code || 'XXX';
    const arrivalCityCode =
      this.selectedFlight?.schedule?.arrival_city?.code || 'YYY';
    const date = new Date(this.selectedFlight?.departure_time || Date.now());
    const formattedDate = `${date.getFullYear()}${(date.getMonth() + 1)
      .toString()
      .padStart(2, '0')}${date.getDate().toString().padStart(2, '0')}`;
    const randomPart = Math.floor(1000 + Math.random() * 9000);

    this.confirmationId = `${flightNumber}-${departureCityCode}-${arrivalCityCode}-${formattedDate}-${randomPart}`;
  }
}
