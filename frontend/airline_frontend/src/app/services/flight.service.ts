import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class FlightService {
  private apiUrl = `${environment.apiUrl}/flights`; // Adjust if your API endpoint is different

  constructor(private http: HttpClient) { }

  // Method to get all available flights (adjust endpoint if needed)
  getAllFlights(): Observable<any[]> {
    // Assuming your backend endpoint for all flights is /api/flights/
    return this.http.get<any[]>(`${this.apiUrl}/`);
  }

  // Add other flight-related methods here (like searchFlights) if needed
}