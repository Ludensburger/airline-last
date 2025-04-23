# api/views/location_views.py
from rest_framework import viewsets, permissions, generics
from rest_framework.decorators import action
from rest_framework.response import Response
from ..models.location import City
from ..serializers.location_serializers import CitySerializer
from rest_framework.permissions import AllowAny

class CityViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = City.objects.all()
    serializer_class = CitySerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]

    @action(detail=False, methods=['get'])
    def departure_cities(self, request):
        cities = City.objects.filter(
            departures__isnull=False
        ).distinct().order_by('name')
        serializer = self.get_serializer(cities, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def arrival_cities(self, request):
        cities = City.objects.filter(
            arrivals__isnull=False
        ).distinct().order_by('name')
        serializer = self.get_serializer(cities, many=True)
        return Response(serializer.data)

# New class-based views for listing all cities and adding a new city
class AllCitiesView(generics.ListAPIView):
    queryset = City.objects.all()
    serializer_class = CitySerializer
    permission_classes = [AllowAny]

class AddCityView(generics.CreateAPIView):
    queryset = City.objects.all()
    serializer_class = CitySerializer
    permission_classes = [permissions.IsAdminUser]  # Only admins can add cities
