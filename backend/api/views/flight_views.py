# api/views/flight_views.py
from rest_framework import viewsets, permissions, generics
from rest_framework.decorators import action
from rest_framework.response import Response
from ..models.flight import FlightInstance
from ..serializers.flight_serializers import FlightInstanceSerializer
from ..services.search_flight import FlightSearchService
from rest_framework.permissions import AllowAny

class FlightViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = FlightInstance.objects.all()
    serializer_class = FlightInstanceSerializer
    permission_classes = [permissions.IsAuthenticated]

    @action(detail=False, methods=['get'])
    def search(self, request):
        departure_city = request.query_params.get('departure')
        arrival_city = request.query_params.get('arrival')
        date = request.query_params.get('date')
        max_price = request.query_params.get('max_price')

        queryset = self.get_queryset()

        if departure_city:
            queryset = queryset.filter(schedule__departure_city=departure_city)
        if arrival_city:
            queryset = queryset.filter(schedule__arrival_city=arrival_city)
        if date:
            queryset = queryset.filter(departure_time__date=date)
        if max_price:
            queryset = queryset.filter(base_price__lte=max_price)

        page = self.paginate_queryset(queryset)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)

        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)

# New class-based views for listing all flights, adding a new flight, retrieving flight details, and searching for flights
class AllFlightsView(generics.ListAPIView):
    queryset = FlightInstance.objects.select_related(
        'schedule__departure_city',
        'schedule__arrival_city'
    ).all()
    serializer_class = FlightInstanceSerializer
    permission_classes = [AllowAny] # Allow anyone to view flights

class AddFlightView(generics.CreateAPIView):
    queryset = FlightInstance.objects.all()
    serializer_class = FlightInstanceSerializer
    permission_classes = [permissions.IsAdminUser]  # Only admins can add flights

class FlightDetailView(generics.RetrieveAPIView):
    queryset = FlightInstance.objects.all()
    serializer_class = FlightInstanceSerializer
    permission_classes = [permissions.IsAuthenticated]

class FlightSearchView(generics.ListAPIView):
    serializer_class = FlightInstanceSerializer
    permission_classes = [AllowAny]

    def get_queryset(self):
        departure_city_id = self.request.query_params.get('departure_city_id')
        arrival_city_id = self.request.query_params.get('arrival_city_id')
        departure_date = self.request.query_params.get('departure_date')
        passenger_count = self.request.query_params.get('passenger_count')
        flight_class = self.request.query_params.get('flight_class')

        queryset = FlightInstance.objects.all()

        if departure_city_id:
            queryset = queryset.filter(schedule__departure_city_id=departure_city_id)
        if arrival_city_id:
            queryset = queryset.filter(schedule__arrival_city_id=arrival_city_id)
        if departure_date:
            queryset = queryset.filter(departure_time__date=departure_date)

        # --- Implement filtering for passenger_count and flight_class ---
        if passenger_count and flight_class:
            try:
                passenger_count = int(passenger_count)
                if flight_class.lower() == 'economy':
                    queryset = queryset.filter(economy_seats_available__gte=passenger_count)
                elif flight_class.lower() == 'business':
                    queryset = queryset.filter(business_seats_available__gte=passenger_count)
                elif flight_class.lower() == 'first':
                    queryset = queryset.filter(first_seats_available__gte=passenger_count)
            except ValueError:
                pass # Handle invalid passenger_count

        return queryset
