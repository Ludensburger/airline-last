import { Component, OnInit } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
// Import HttpParams along with HttpClient
import { HttpClient, HttpParams } from '@angular/common/http';
import { Router } from '@angular/router';
import { environment } from '../../../environments/environment'; // Adjusted path to environment variable
import {
  Observable,
  expand,
  reduce,
  EMPTY,
  catchError,
  throwError,
} from 'rxjs'; // Import RxJS operators

interface Flight {
  id: number;
  schedule: {
    id: number; // Schedule ID
    flight_number: string;
    departure_city: { id: number; code: string; name: string };
    arrival_city: { id: number; code: string; name: string };
    departure_city_id: number; // Added ID
    arrival_city_id: number; // Added ID
    typical_departure_time: string;
    typical_arrival_time: string; // Duration string
    operating_days: string[];
    total_seats: number;
    economy_seats: number;
    business_seats: number;
    first_seats: number;
  };
  departure_time: string; // ISO format string or formatted string
  arrival_time: string; // ISO format string or formatted string
  economy_seats_available: number;
  business_seats_available: number;
  first_seats_available: number;
  economy_price: string; // Decimal as string
  business_price: string; // Decimal as string
  first_price: string; // Decimal as string
  total_available_seats: number;
  is_full: boolean;
}

interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[]; // The actual data array
}

interface City {
  id: number;
  code: string;
  name: string;
  country?: { id: number; name: string }; // Nested country object if included
}

@Component({
  selector: 'app-search-flight',
  standalone: true,
  // Remove deprecated HttpClientModule. HttpClient is available via provideHttpClient() in app config.
  imports: [CommonModule, FormsModule],
  providers: [DatePipe],
  templateUrl: './search-flight.component.html',
  styleUrl: './search-flight.component.css',
})
export class SearchFlightComponent implements OnInit {
  submitted: boolean = false;
  tripType: 'round-trip' | 'one-way' = 'round-trip';
  from: number | null = null;
  to: number | null = null;
  departDate: string = '';
  returnDate: string = '';
  flightClass: string = 'Economy'; // Default value
  passengerCount: number = 1; // Default value
  availableFlights: Flight[] = [];
  cities: City[] = [];
  isLoadingFlights: boolean = false;
  isLoadingCities: boolean = false;
  error: string | null = null;
  // Use environment variable for API URL
  private apiUrl = environment.apiUrl; // Use environment.apiUrl

  constructor(private http: HttpClient, private router: Router) {} // Inject Router

  ngOnInit(): void {
    this.loadAllCities(); // Call the new function to load all cities
    // Optionally load all flights initially, or wait for search criteria
    // this.loadFlights(); // Uncomment if you want to load all flights on init
  }

  /**
   * Fetches a single page of cities.
   * @param url The URL to fetch cities from (including pagination parameters).
   */
  private fetchCitiesPage(url: string): Observable<PaginatedResponse<City>> {
    console.log('Requesting cities page with URL:', url);
    return this.http.get<PaginatedResponse<City>>(url).pipe(
      catchError((err) => {
        console.error('Error loading a page of cities:', err);
        this.error = 'Failed to load city data. Please try again later.';
        this.isLoadingCities = false; // Ensure loading state is reset on error
        return throwError(() => new Error('Failed to load city data page.')); // Propagate error
      })
    );
  }

  /**
   * Fetches all pages of cities recursively using RxJS operators.
   */
  loadAllCities(): void {
    this.isLoadingCities = true;
    this.error = null;
    this.cities = []; // Clear existing cities
    const initialUrl = `${this.apiUrl}/cities/?page_size=100`; // Start with a larger page size

    this.fetchCitiesPage(initialUrl)
      .pipe(
        expand((response) => {
          // If there's a next page URL, fetch it; otherwise, complete.
          return response.next ? this.fetchCitiesPage(response.next) : EMPTY;
        }),
        // Accumulate results from all pages.
        reduce((acc, response) => acc.concat(response.results), [] as City[])
      )
      .subscribe({
        next: (allCities) => {
          this.cities = allCities;
          console.log('All cities loaded:', this.cities);
          this.isLoadingCities = false;
        },
        error: (err) => {
          // Error handling is done within fetchCitiesPage, but log final error if needed
          console.error('Failed to load all cities:', err);
          // Error message is already set in fetchCitiesPage
          this.isLoadingCities = false;
        },
      });
  }

  /**
   * Fetches flights based on search criteria.
   */
  loadFlights(): void {
    this.isLoadingFlights = true;
    this.error = null;
    this.availableFlights = []; // Clear previous results
    this.submitted = true; // Mark that a search has been attempted

    // --- Build Search Parameters ---
    let params = new HttpParams();
    if (this.from) {
      params = params.set('departure_city_id', this.from.toString());
    }
    if (this.to) {
      params = params.set('arrival_city_id', this.to.toString());
    }
    if (this.departDate) {
      // Ensure date is in YYYY-MM-DD format if backend expects it
      params = params.set('departure_date', this.departDate);
    }
    // Add passenger count and flight class
    if (this.passengerCount > 0) {
      params = params.set('passenger_count', this.passengerCount.toString());
    }
    if (this.flightClass) {
      params = params.set('flight_class', this.flightClass);
    }
    // Note: Handling returnDate for round-trip might require a different endpoint
    // or two separate API calls depending on backend implementation.
    // This example only searches based on departure date.

    const searchUrl = `${this.apiUrl}/flights/search/`;
    console.log(
      'Searching flights with URL:',
      searchUrl,
      'Params:',
      params.toString()
    );

    // Assuming the search endpoint is also paginated, but for simplicity,
    // we'll fetch the first page here. Implement pagination similar to loadAllCities if needed.
    this.http
      .get<PaginatedResponse<Flight>>(searchUrl, { params: params }) // Pass params object
      .subscribe({
        next: (data) => {
          // Filter out flights where is_full is true (Frontend fallback)
          // Ideally, the backend should filter based on passenger_count and class availability.
          this.availableFlights = data.results.filter(
            (flight) => !flight.is_full
          );
          console.log(
            'Flights loaded (filtered for is_full):',
            this.availableFlights
          );

          if (this.availableFlights.length === 0 && this.submitted) {
            console.log(
              'No available (non-full) flights found for the given criteria.'
            );
            this.error = 'No flights match your search criteria.'; // More specific message
          }
          this.isLoadingFlights = false;
        },
        error: (err) => {
          console.error('Error loading flights:', err);
          if (err.status === 404) {
            this.error = 'No flights match your search criteria.';
          } else {
            this.error =
              'Failed to load flight data. Please check your search criteria or try again later.';
          }
          this.isLoadingFlights = false;
        },
      });
  }

  /**
   * Handles changes to the departure city selection.
   * Resets the arrival city if it's the same as the new departure city.
   */
  onDepartureCityChange(): void {
    console.log(`Departure city changed. New 'from' value: ${this.from}`);
    console.log(`Current 'to' value before check: ${this.to}`);
    if (this.to !== null && this.to === this.from) {
      console.log(`Match found! Resetting 'to' city from ${this.to} to null.`);
      this.to = null; // Reset arrival city
    } else {
      console.log(`No match or 'to' is null. No reset needed.`);
    }
    // Also reset return date if depart date is cleared or changed? (Optional)
  }

  /**
   * Triggered when the search form is submitted.
   */
  searchFlights(): void {
    console.log('Search button clicked. Current criteria:');
    console.log({
      tripType: this.tripType,
      fromCityId: this.from,
      toCityId: this.to,
      departDate: this.departDate,
      returnDate: this.returnDate, // Still logged, but not used in current search logic
      flightClass: this.flightClass,
      passengerCount: this.passengerCount,
    });
    // Call loadFlights to perform the search based on current form values
    this.loadFlights();
  }

  /**
   * Gets today's date in YYYY-MM-DD format for min attribute of date inputs.
   */
  getTodayDate(): string {
    const today = new Date();
    const month = (today.getMonth() + 1).toString().padStart(2, '0');
    const day = today.getDate().toString().padStart(2, '0');
    return `${today.getFullYear()}-${month}-${day}`;
  }

  /**
   * Navigates to the booking page with the selected flight's data,
   * passenger count, and flight class.
   * @param flight The flight object selected by the user.
   */
  selectFlight(flight: Flight): void {
    console.log('Selected flight:', flight);
    // Navigate to the booking route and pass the flight object, passenger count, and class
    this.router.navigate(['/booking'], {
      state: {
        flight: flight,
        passengerCount: this.passengerCount,
        flightClass: this.flightClass,
      },
    });
  }
}
