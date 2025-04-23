# api/views/admin_flight_schedule_views.py
from rest_framework import viewsets, permissions, generics
from ..models.flight import FlightSchedule
from ..serializers.flight_serializers import FlightScheduleSerializer

class AdminFlightScheduleViewSet(viewsets.ModelViewSet):
    queryset = FlightSchedule.objects.all()
    serializer_class = FlightScheduleSerializer
    permission_classes = [permissions.IsAdminUser]

# New class-based views for listing all flight schedules and adding a new flight schedule
class AdminFlightScheduleListView(generics.ListAPIView):
    queryset = FlightSchedule.objects.all()
    serializer_class = FlightScheduleSerializer
    permission_classes = [permissions.IsAdminUser]

class AdminFlightScheduleCreateView(generics.CreateAPIView):
    queryset = FlightSchedule.objects.all()
    serializer_class = FlightScheduleSerializer
    permission_classes = [permissions.IsAdminUser]
