# api/views/booking_views.py
from rest_framework import viewsets, permissions, generics, serializers
from ..models.booking import Booking
from ..serializers.booking_serializers import BookingSerializer
from rest_framework import status
from rest_framework.views import APIView
from rest_framework.response import Response
from ..models.flight import FlightInstance, FlightSchedule
from rest_framework.permissions import IsAuthenticated, AllowAny
from datetime import datetime
from django.db import transaction # Import transaction
from django.db.models import F     # Import F

class BookingViewSet(viewsets.ModelViewSet):
    serializer_class = BookingSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        if self.request.user.is_superuser:
            return Booking.objects.all()
        return Booking.objects.filter(user=self.request.user)


class AddBookingView(generics.CreateAPIView):
    serializer_class = BookingSerializer
    permission_classes = [permissions.IsAuthenticated]

    @transaction.atomic # Wrap the creation logic in an atomic transaction
    def perform_create(self, serializer):
        # Get validated data
        flight_id = serializer.validated_data['flight'].id # Get ID first
        seats = serializer.validated_data['seats_booked']
        seat_class = serializer.validated_data.get('seat_class', 'economy')

        # Lock the flight row for update to prevent race conditions
        try:
            # Re-fetch the flight instance within the transaction and lock it
            flight = FlightInstance.objects.select_for_update().get(id=flight_id)
        except FlightInstance.DoesNotExist:
             # Should not happen if serializer validation passed, but good practice
            raise serializers.ValidationError("Flight not found during transaction.")

        # Re-check availability within the transaction using the locked row
        available_seats = 0
        if seat_class == 'economy':
            available_seats = flight.economy_seats_available
        elif seat_class == 'business':
            available_seats = flight.business_seats_available
        elif seat_class == 'first':
            available_seats = flight.first_seats_available

        if seats > available_seats:
            # This check prevents overbooking even if validation passed slightly earlier
            raise serializers.ValidationError({
                "seats_booked": f"Not enough available seats in {seat_class.capitalize()} class after locking. Only {available_seats} left."
            })

        # Save the booking instance first (calculates price via model's save)
        booking = serializer.save(user=self.request.user) # Price is calculated here

        # Decrement using F() expression for atomic database update
        if seat_class == 'economy':
            FlightInstance.objects.filter(id=flight.id).update(economy_seats_available=F('economy_seats_available') - seats)
        elif seat_class == 'business':
            FlightInstance.objects.filter(id=flight.id).update(business_seats_available=F('business_seats_available') - seats)
        elif seat_class == 'first':
            FlightInstance.objects.filter(id=flight.id).update(first_seats_available=F('first_seats_available') - seats)

        # No need to call flight.save() after using update() with F()
        
        
class AddBookingByFlightNumberView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    @transaction.atomic # Wrap in transaction
    def post(self, request):
        flight_number = request.data.get('flight_number')
        departure_date_str = request.data.get('departure_date') # Expecting YYYY-MM-DD
        seats_requested = request.data.get('seats_booked')
        seat_class = request.data.get('seat_class', 'economy')

        # --- Input Validation ---
        if not all([flight_number, departure_date_str, seats_requested]):
             return Response({"error": "Flight number, departure date, and seats booked are required"}, status=status.HTTP_400_BAD_REQUEST)
        try:
            seats_requested = int(seats_requested) # Ensure seats is an integer
            if seats_requested <= 0:
                 raise ValueError("Seats booked must be positive.")
        except (ValueError, TypeError):
             return Response({"error": "Invalid value for seats booked."}, status=status.HTTP_400_BAD_REQUEST)
        try:
            departure_date = datetime.strptime(departure_date_str, '%Y-%m-%d').date()
        except ValueError:
            return Response({"error": "Invalid date format. Use YYYY-MM-DD."}, status=status.HTTP_400_BAD_REQUEST)
        # --- End Input Validation ---

        try:
            # Find and lock the specific flight instance for that day
            flight_instance = FlightInstance.objects.select_for_update().filter(
                schedule__flight_number=flight_number,
                departure_time__date=departure_date
            ).first()

            if not flight_instance:
                return Response({"error": f"No flight {flight_number} found departing on {departure_date_str}"}, status=status.HTTP_404_NOT_FOUND)

        except Exception as e: # Catch potential database errors too
            return Response({"error": f"Error finding or locking flight: {str(e)}"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        # --- Re-check availability within the transaction using the locked row ---
        available_seats = 0
        if seat_class == 'economy':
            available_seats = flight_instance.economy_seats_available
        elif seat_class == 'business':
            available_seats = flight_instance.business_seats_available
        elif seat_class == 'first':
            available_seats = flight_instance.first_seats_available

        if seats_requested > available_seats:
             return Response({
                "seats_booked": f"Not enough available seats in {seat_class.capitalize()} class after locking. Only {available_seats} left."
            }, status=status.HTTP_400_BAD_REQUEST)
        # --- End Availability Check ---

        # Prepare data for the serializer (use locked instance ID)
        booking_data = {
            'flight_id': flight_instance.id,
            'seats_booked': seats_requested,
            'seat_class': seat_class
        }

        serializer = BookingSerializer(data=booking_data, context={'request': request})
        # Use raise_exception=True to automatically return 400 on validation errors
        if serializer.is_valid(raise_exception=True):
            # Save booking (price calculation happens in model save)
            booking = serializer.save(user=self.request.user)

            # Decrement using F() expression
            # Use validated data from serializer where possible
            seats = serializer.validated_data['seats_booked']
            s_class = serializer.validated_data.get('seat_class', 'economy')

            if s_class == 'economy':
                FlightInstance.objects.filter(id=flight_instance.id).update(economy_seats_available=F('economy_seats_available') - seats)
            elif s_class == 'business':
                FlightInstance.objects.filter(id=flight_instance.id).update(business_seats_available=F('business_seats_available') - seats)
            elif s_class == 'first':
                FlightInstance.objects.filter(id=flight_instance.id).update(first_seats_available=F('first_seats_available') - seats)

            # No need for flight_instance.save() here

            return Response(serializer.data, status=status.HTTP_201_CREATED)
        # Note: This part is technically unreachable if raise_exception=True
        # return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class BookingDetailView(generics.RetrieveAPIView):
    queryset = Booking.objects.all()
    serializer_class = BookingSerializer
    permission_classes = [permissions.IsAuthenticated]
