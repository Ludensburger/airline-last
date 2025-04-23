import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common'; // Import CommonModule
import { FlightService } from '../../services/flight.service'; // Adjust path if needed
import { HttpErrorResponse } from '@angular/common/http';
import { RouterLink } from '@angular/router'; // Import RouterLink

@Component({
  selector: 'app-flights',
  standalone: true, // Add standalone: true
  imports: [CommonModule, RouterLink], // Add CommonModule and RouterLink
  templateUrl: './flights.component.html',
  styleUrls: ['./flights.component.css'], // Corrected property name
})
export class FlightsComponent implements OnInit {
  flights: any[] = []; // To store the list of flights
  isLoading = false;
  error: string | null = null;

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
}
