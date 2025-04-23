# api/views/business_logic_views.py
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from ..models.flight import FlightInstance

class CheckAvailabilityView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        flight_id = request.query_params.get('flight_id')
        if not flight_id:
            return Response({'error': 'Flight ID is required'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            flight = FlightInstance.objects.get(id=flight_id)
            available_seats = flight.available_seats
            return Response({'available_seats': available_seats}, status=status.HTTP_200_OK)
        except FlightInstance.DoesNotExist:
            return Response({'error': 'Flight not found'}, status=status.HTTP_404_NOT_FOUND)
