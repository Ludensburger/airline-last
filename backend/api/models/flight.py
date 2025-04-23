# airline/models/flight.py
from django.db import models
from .location import City
from decimal import Decimal
from datetime import timedelta

class FlightSchedule(models.Model):
    flight_number = models.CharField(max_length=10, unique=True)
    departure_city = models.ForeignKey(City, on_delete=models.PROTECT, related_name='departures')
    arrival_city = models.ForeignKey(City, on_delete=models.PROTECT, related_name='arrivals')
    typical_departure_time = models.TimeField()
    typical_arrival_time = models.TimeField()
    typical_arrival_time = models.DurationField(default=timedelta(hours=2)) # Use DurationField, add a default
    operating_days = models.CharField(max_length=7)  # e.g., "MTWTFSS"
    total_seats = models.PositiveIntegerField(default=180)
    economy_seats = models.PositiveIntegerField(default=120)
    business_seats = models.PositiveIntegerField(default=20)
    first_seats = models.PositiveIntegerField(default=10)

    def __str__(self):
        return f"{self.flight_number}: {self.departure_city.code} → {self.arrival_city.code}"

class FlightInstance(models.Model):
    schedule = models.ForeignKey(FlightSchedule, on_delete=models.CASCADE)
    departure_time = models.DateTimeField()
    arrival_time = models.DateTimeField()
    
    economy_seats_available = models.PositiveIntegerField(default=0)
    business_seats_available = models.PositiveIntegerField(default=0)
    first_seats_available = models.PositiveIntegerField(default=0)



   # Add prices per class
    economy_price = models.DecimalField(max_digits=10, decimal_places=2, default=Decimal('150.00'))
    business_price = models.DecimalField(max_digits=10, decimal_places=2, default=Decimal('400.00'))
    first_price = models.DecimalField(max_digits=10, decimal_places=2, default=Decimal('800.00'))

    def save(self, *args, **kwargs):
        # Initialize available seats from schedule if creating new instance
        if not self.pk:
            self.economy_seats_available = self.schedule.economy_seats
            self.business_seats_available = self.schedule.business_seats
            self.first_seats_available = self.schedule.first_seats
        super().save(*args, **kwargs)

    @property
    def total_available_seats(self):
        return self.economy_seats_available + self.business_seats_available + self.first_seats_available

    @property
    def is_full(self):
        return self.total_available_seats <= 0

    def __str__(self):
        return f"{self.schedule.flight_number} - {self.departure_time.strftime('%Y-%m-%d %H:%M')}"
