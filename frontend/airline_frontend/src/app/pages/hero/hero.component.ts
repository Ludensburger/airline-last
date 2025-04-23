import { Component } from '@angular/core';
import { CommonModule } from '@angular/common'; // Import CommonModule if you use NgIf, NgFor, etc. in your template
import { SearchFlightComponent } from '../../pages/search-flight/search-flight.component'; // Adjusted the path to the correct location

@Component({
  selector: 'app-hero',
  standalone: true,
  imports: [CommonModule, SearchFlightComponent], // Add SearchFlightComponent to the imports array
  templateUrl: './hero.component.html',
  styleUrl: './hero.component.css',
})
export class HeroComponent {}
