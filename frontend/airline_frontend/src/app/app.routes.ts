import { Routes } from '@angular/router';
import { BookingComponent } from './pages/booking/booking.component';
import { LoginComponent } from './pages/login/login.component';
import { RegisterComponent } from './pages/register/register.component';
import { HeroComponent } from './pages/hero/hero.component';
import { FlightsComponent } from './pages/flights/flights.component'; // Import the FlightsComponent

export const routes: Routes = [
  { path: '', component: HeroComponent },
  { path: 'book', component: BookingComponent, canActivate: [] }, // Example guard
  { path: 'login', component: LoginComponent },
  { path: 'register', component: RegisterComponent },
  { path: 'flights', component: FlightsComponent }, // Route definition exists

  // --- ADD THIS ROUTE ---
  {
    path: 'bookings', // The path used in router.navigate
  },
  // --- END OF ADDED ROUTE ---

  // Add other routes here
  { path: '**', redirectTo: '' }, // Wildcard route
];
