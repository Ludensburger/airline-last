import { ApplicationConfig } from '@angular/core';
import { provideRouter, Routes } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';

// Import your components
import { LoginComponent } from './pages/login/login.component';
import { RegisterComponent } from './pages/register/register.component';
import { HeroComponent } from './pages/hero/hero.component';
import { SearchFlightComponent } from './pages/search-flight/search-flight.component';
// --- Ensure this import is correct ---
import { ProfileComponent } from './pages/profile/profile.component';
import { BookingComponent } from './pages/booking/booking.component';
import { FlightsComponent } from './pages/flights/flights.component';

// Define your application routes here
const appRoutes: Routes = [
  { path: '', component: HeroComponent },
  { path: 'search', component: SearchFlightComponent },
  // --- Ensure this component reference is correct ---
  { path: 'profile', component: ProfileComponent },
  { path: 'login', component: LoginComponent },
  { path: 'register', component: RegisterComponent },
  { path: 'booking', component: BookingComponent },
  { path: 'flights', component: FlightsComponent }, // Example route for flights

  // ... other routes
];

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(appRoutes),
    provideHttpClient(),
    // ... other providers
  ],
};
