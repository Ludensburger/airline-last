# api/serializers/flight_serializers.py
from rest_framework import serializers
from ..models.flight import FlightSchedule, FlightInstance
from .location_serializers import CitySerializer
from ..models.location import City

class FlightScheduleSerializer(serializers.ModelSerializer):
    departure_city = CitySerializer(read_only=True)
    arrival_city = CitySerializer(read_only=True)
    # You might need PrimaryKeyRelatedFields for writing if you allow creating/updating schedules via serializer
    # departure_city_id = serializers.PrimaryKeyRelatedField(queryset=City.objects.all(), source='departure_city', write_only=True)
    # arrival_city_id = serializers.PrimaryKeyRelatedField(queryset=City.objects.all(), source='arrival_city', write_only=True)


    class Meta:
        model = FlightSchedule
        fields = [
            'id', 'flight_number',
            'departure_city', # Nested representation for reading
            'arrival_city',   # Nested representation for reading
            'departure_city_id', # ID field for reference
            'arrival_city_id',   # ID field for reference
            'typical_departure_time',
            'typical_arrival_time', # This should be the DurationField
            'operating_days',
            'total_seats', 'economy_seats', 'business_seats', 'first_seats',
            # Add writeable fields if needed:
            # 'departure_city_id', 'arrival_city_id'
        ]

class FlightInstanceSerializer(serializers.ModelSerializer):
    schedule = FlightScheduleSerializer(read_only=True) # Embed schedule details
    total_available_seats = serializers.IntegerField(read_only=True)
    is_full = serializers.BooleanField(read_only=True)

    class Meta:
        model = FlightInstance
        fields = [
            'id', 'schedule', 'departure_time', 'arrival_time',
            'economy_seats_available', 'business_seats_available', 'first_seats_available',
            'economy_price', 'business_price', 'first_price',
            'total_available_seats', 'is_full'
        ]
        # Add formatting for datetime fields if desired
        extra_kwargs = {
            'departure_time': {'format': '%Y-%m-%d %H:%M'},
            'arrival_time': {'format': '%Y-%m-%d %H:%M'},
        }
