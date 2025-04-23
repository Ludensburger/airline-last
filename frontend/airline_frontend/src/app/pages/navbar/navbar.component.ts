import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { Observable } from 'rxjs'; // Import Observable

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.css'],
})
export class NavbarComponent {
  // Expose the observable directly to the template
  isAuthenticated$: Observable<boolean>;

  constructor(private authService: AuthService, private router: Router) {
    // Assign the observable from the service
    this.isAuthenticated$ = this.authService.isAuthenticated$;
  }

  // No need for the isAuthenticated() method here anymore for the template

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']); // Keep navigation here
  }
}
