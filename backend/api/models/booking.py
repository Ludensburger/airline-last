# airline/models/booking.py
from django.db import models
from .auth import CustomerUser
from .flight import FlightInstance

from decimal import Decimal

class Booking(models.Model):
    
    SEAT_CLASS_CHOICES = [
        ('economy', 'Economy'),
        ('business', 'Business'),
        ('first', 'First Class'),
    ]
    STATUS_CHOICES = [
        ('confirmed', 'Confirmed'),
        ('cancelled', 'Cancelled'),
        ('completed', 'Completed'),
    ]
    
    flight = models.ForeignKey(FlightInstance, on_delete=models.PROTECT)
    user = models.ForeignKey(CustomerUser, on_delete=models.CASCADE)
    seats_booked = models.PositiveIntegerField()
    seat_class = models.CharField(max_length=10, choices=SEAT_CLASS_CHOICES, default='economy') # Added seat class
    booking_date = models.DateTimeField(auto_now_add=True)
    total_price = models.DecimalField(max_digits=10, decimal_places=2, blank=True, null=True) # Calculated on save
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='confirmed')

    def get_price_for_class(self):
        """Get the price based on the selected seat class."""
        if self.seat_class == 'business':
            return self.flight.business_price
        elif self.seat_class == 'first':
            return self.flight.first_price
        else: # Default to economy
            return self.flight.economy_price

    def calculate_total_price(self):
        """Calculate total price based on flight class price, seats booked, fees, and taxes."""
        if not self.flight or not self.seats_booked:
            return Decimal('0.00')

        price_per_seat = self.get_price_for_class()
        base_total = price_per_seat * self.seats_booked

        # Add booking fee (flat fee per booking)
        booking_fee = Decimal('25.00')

        # Add taxes (e.g., 10%)
        tax_rate = Decimal('0.10')
        taxes = base_total * tax_rate

        return base_total + booking_fee + taxes

    def save(self, *args, **kwargs):
        # Calculate total price before saving
        self.total_price = self.calculate_total_price()
        super().save(*args, **kwargs) # Save the booking first

    def __str__(self):
        return f"Booking {self.id} for {self.user.username} on {self.flight}"

class Payment(models.Model):
    booking = models.OneToOneField(Booking, on_delete=models.CASCADE)
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    payment_date = models.DateTimeField(auto_now_add=True)
    payment_method = models.CharField(max_length=50)
    transaction_id = models.CharField(max_length=100, unique=True)
    status = models.CharField(max_length=20)