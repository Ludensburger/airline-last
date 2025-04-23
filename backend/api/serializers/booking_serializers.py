# api/serializers/booking_serializers.py
from rest_framework import serializers
from ..models.booking import Booking, Payment
from .flight_serializers import FlightInstanceSerializer
from ..models.flight import FlightInstance


class BookingSerializer(serializers.ModelSerializer):
    flight_details = FlightInstanceSerializer(read_only=True, source='flight')
    flight_id = serializers.PrimaryKeyRelatedField(
        queryset=FlightInstance.objects.all(),
        source='flight',
        write_only=True
    )
    booking_id = serializers.IntegerField(read_only=True, source='id')
    user = serializers.HiddenField(default=serializers.CurrentUserDefault())
    # Add seat_class, make it writable
    seat_class = serializers.ChoiceField(choices=Booking.SEAT_CLASS_CHOICES, default='economy')

    class Meta:
        model = Booking
        fields = [
            'booking_id',
            'flight_details', # Read-only representation of the flight
            'flight_id',      # Writable field to link the flight
            'seats_booked',
            'seat_class',     # Added seat class selection
            'booking_date',
            'total_price',    # Read-only, calculated on save
            'status',
            'user'            # Hidden, automatically set
        ]
        read_only_fields = ['booking_date', 'total_price', 'status', 'booking_id']

    def validate(self, data):
        """
        Check if enough seats are available for the chosen class.
        """
        flight = data.get('flight')
        seats_requested = data.get('seats_booked')
        seat_class = data.get('seat_class', 'economy') # Default to economy if not provided

        if not flight or not seats_requested:
             # Let standard field validation handle missing fields
            return data

        available_seats = 0
        if seat_class == 'economy':
            available_seats = flight.economy_seats_available
        elif seat_class == 'business':
            available_seats = flight.business_seats_available
        elif seat_class == 'first':
            available_seats = flight.first_seats_available

        if seats_requested > available_seats:
            raise serializers.ValidationError({
                "seats_booked": f"Not enough available seats in {seat_class.capitalize()} class. Only {available_seats} left."
            })

        return data
        
    # def to_representation(self, instance):
    #     """
    #     Restructure the response for better clarity between booking and flight details
    #     """
    #     # First get the default representation
    #     representation = super().to_representation(instance)
        
    #     # Extract flight details
    #     flight_data = representation.pop('flight', {})
        
    #     # Rename flight ID if it exists
    #     if 'id' in flight_data:
    #         flight_data['flight_id'] = flight_data.pop('id')
        
    #     # Restructure the response
    #     return {
    #         "booking": {
    #             "booking_id": representation['id'],  # Renamed from 'id' to 'booking_id'
    #             "user": instance.user.id, 
    #             "seats_booked": representation['seats_booked'],
    #             "total_price": representation['total_price'],
    #             "status": representation['status'],
    #             "booking_date": representation['booking_date']
    #         },
    #         "flight": flight_data
    #     }   


class PaymentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Payment
        fields = '__all__'