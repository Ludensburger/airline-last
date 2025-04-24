import { Component, OnInit } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Router } from '@angular/router';
import { environment } from '../../../environments/environment';
import {
  Observable,
  expand,
  reduce,
  EMPTY,
  catchError,
  throwError,
} from 'rxjs';

interface Flight {
  id: number;
  schedule: {
    id: number;
    flight_number: string;
    departure_city: { id: number; code: string; name: string };
    arrival_city: { id: number; code: string; name: string };
    departure_city_id: number;
    arrival_city_id: number;
    typical_departure_time: string;
    typical_arrival_time: string;
    operating_days: string[];
    total_seats: number;
    economy_seats: number;
    business_seats: number;
    first_seats: number;
  };
  departure_time: string;
  arrival_time: string;
  economy_seats_available: number;
  business_seats_available: number;
  first_seats_available: number;
  economy_price: string;
  business_price: string;
  first_price: string;
  total_available_seats: number;
  is_full: boolean;
}

interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

interface City {
  id: number;
  code: string;
  name: string;
  country?: { id: number; name: string };
}

@Component({
  selector: 'app-search-flight',
  standalone: true,
  imports: [CommonModule, FormsModule],
  providers: [DatePipe],
  templateUrl: './search-flight.component.html',
  styleUrl: './search-flight.component.css',
})
export class SearchFlightComponent implements OnInit {
  submitted: boolean = false;
  tripType: 'round-trip' | 'one-way' = 'round-trip';
  from: number | null = null; // Store departure city ID
  to: number | null = null; // Store arrival city ID
  fromCity: string = ''; // Store departure city name for display
  toCity: string = ''; // Store arrival city name for display
  departDate: string = '';
  returnDate: string = '';
  flightClass: string = 'Economy';
  passengerCount: number = 1;
  availableFlights: Flight[] = [];
  cities: City[] = [];
  isLoadingFlights: boolean = false;
  isLoadingCities: boolean = false;
  error: string | null = null;
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient, private router: Router) {}

  ngOnInit(): void {
    this.loadAllCities();
  }

  private fetchCitiesPage(url: string): Observable<PaginatedResponse<City>> {
    console.log('Requesting cities page with URL:', url);
    return this.http.get<PaginatedResponse<City>>(url).pipe(
      catchError((err) => {
        console.error('Error loading a page of cities:', err);
        this.error = 'Failed to load city data. Please try again later.';
        this.isLoadingCities = false;
        return throwError(() => new Error('Failed to load city data page.'));
      })
    );
  }

  loadAllCities(): void {
    this.isLoadingCities = true;
    this.error = null;
    this.cities = [];
    const initialUrl = `${this.apiUrl}/cities/?page_size=100`;

    this.fetchCitiesPage(initialUrl)
      .pipe(
        expand((response) =>
          response.next ? this.fetchCitiesPage(response.next) : EMPTY
        ),
        reduce((acc, response) => acc.concat(response.results), [] as City[])
      )
      .subscribe({
        next: (allCities) => {
          this.cities = allCities;
          console.log('All cities loaded:', this.cities);
          this.isLoadingCities = false;
        },
        error: (err) => {
          console.error('Failed to load all cities:', err);
          this.isLoadingCities = false;
        },
      });
  }

  loadFlights(): void {
    this.isLoadingFlights = true;
    this.error = null;
    this.availableFlights = [];
    this.submitted = true;

    let params = new HttpParams();
    if (this.from) {
      params = params.set('departure_city_id', this.from.toString());
    }
    if (this.to) {
      params = params.set('arrival_city_id', this.to.toString());
    }
    if (this.departDate) {
      params = params.set('departure_date', this.departDate);
    }
    if (this.passengerCount > 0) {
      params = params.set('passenger_count', this.passengerCount.toString());
    }
    if (this.flightClass) {
      params = params.set('flight_class', this.flightClass);
    }

    const searchUrl = `${this.apiUrl}/flights/search/`;
    console.log(
      'Searching flights with URL:',
      searchUrl,
      'Params:',
      params.toString()
    );

    this.http
      .get<PaginatedResponse<Flight>>(searchUrl, { params: params })
      .subscribe({
        next: (data) => {
          this.availableFlights = data.results.filter(
            (flight) => !flight.is_full
          );
          console.log('Flights loaded:', this.availableFlights);
          if (this.availableFlights.length === 0 && this.submitted) {
            this.error = 'No flights match your search criteria.';
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

  onDepartureCityInput(): void {
    const selectedDepartureName = this.fromCity;
    const foundCity = this.cities.find(
      (city) =>
        city.name === selectedDepartureName ||
        city.code === selectedDepartureName
    );
    this.from = foundCity ? foundCity.id : null; // Store the City ID
    console.log(
      'Departure city input:',
      selectedDepartureName,
      'ID set to:',
      this.from
    );
    this.onDepartureCityChange();
  }

  onArrivalCityInput(): void {
    const selectedArrivalName = this.toCity;
    const foundCity = this.cities.find(
      (city) =>
        city.name === selectedArrivalName || city.code === selectedArrivalName
    );
    this.to = foundCity ? foundCity.id : null; // Store the City ID
    console.log(
      'Arrival city input:',
      selectedArrivalName,
      'ID set to:',
      this.to
    );
  }

  onDepartureCityChange(): void {
    console.log(`Departure city changed. New 'from' value: ${this.from}`);
    console.log(`Current 'to' value before check: ${this.to}`);
    if (this.to !== null && this.to === this.from) {
      console.log(`Match found! Resetting 'to' city from ${this.to} to null.`);
      this.to = null;
      this.toCity = '';
    } else {
      console.log(`No match or 'to' is null. No reset needed.`);
    }
  }

  searchFlights(): void {
    console.log('Search button clicked. Current criteria:', {
      tripType: this.tripType,
      fromCityId: this.from,
      toCityId: this.to,
      departDate: this.departDate,
      returnDate: this.returnDate,
      flightClass: this.flightClass,
      passengerCount: this.passengerCount,
    });
    this.loadFlights();
  }

  getTodayDate(): string {
    const today = new Date();
    const month = (today.getMonth() + 1).toString().padStart(2, '0');
    const day = today.getDate().toString().padStart(2, '0');
    return `${today.getFullYear()}-${month}-${day}`;
  }

  selectFlight(flight: Flight): void {
    console.log('Selected flight:', flight);
    this.router.navigate(['/booking'], {
      state: {
        flight: flight,
        passengerCount: this.passengerCount,
        flightClass: this.flightClass,
      },
    });
  }

  // Helper function to filter cities for the arrival dropdown
  get arrivalCities(): City[] {
    return this.cities.filter((city) => city.id !== this.from);
  }
}
