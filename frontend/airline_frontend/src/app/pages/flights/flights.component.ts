import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common'; // Import CommonModule
import { FlightService } from '../../services/flight.service'; // Adjust path if needed
import { HttpErrorResponse } from '@angular/common/http';
import { RouterLink } from '@angular/router'; // Import RouterLink
import { FormsModule } from '@angular/forms'; // Import FormsModule

@Component({
  selector: 'app-flights',
  standalone: true, // Add standalone: true
  imports: [CommonModule, RouterLink, FormsModule], // Add FormsModule
  templateUrl: './flights.component.html',
  styleUrls: ['./flights.component.css'], // Corrected property name
})
export class FlightsComponent implements OnInit {
  flights: any[] = []; // To store the list of flights
  filteredFlights: any[] = []; // To store the filtered list
  isLoading = false;
  error: string | null = null;
  searchTerm: string = ''; // To store the value from the search bar

  constructor(private flightService: FlightService) {} // Inject FlightService

  ngOnInit(): void {
    this.loadFlights();
  }

  loadFlights(): void {
    this.isLoading = true;
    this.error = null;
    this.flightService.getAllFlights().subscribe({
      next: (data: any) => {
        this.flights = data.results; // Assign the 'results' array
        this.filteredFlights = [...this.flights]; // Initialize filtered flights
        this.isLoading = false;
        console.log('Flights loaded (results array):', this.flights);
      },
      error: (err: HttpErrorResponse) => {
        console.error('Error loading flights:', err);
        this.error = 'Failed to load flights. Please try again later.';
        if (err.status === 404) {
          this.error = 'No flights found.';
        }
        this.isLoading = false;
      },
      complete: () => {
        this.isLoading = false;
      },
    });
  }

  filterFlights(): void {
    this.filteredFlights = this.flights.filter((flight) => {
      const searchTermLower = this.searchTerm.toLowerCase();
      const flightNumber = flight.schedule?.flight_number?.toLowerCase() || '';
      const fromCityName =
        flight.schedule?.departure_city?.name?.toLowerCase() || '';
      const toCityName =
        flight.schedule?.arrival_city?.name?.toLowerCase() || '';

      return (
        flightNumber.includes(searchTermLower) ||
        fromCityName.includes(searchTermLower) ||
        toCityName.includes(searchTermLower)
      );
    });
  }
}
