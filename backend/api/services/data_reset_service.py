from django.db import transaction
from ..models.location import City, Country
from ..models.flight import FlightSchedule, FlightInstance
from django.http import JsonResponse

def reset_all_data(request):  # Add 'request' parameter here
    with transaction.atomic():
        FlightInstance.objects.all().delete()
        FlightSchedule.objects.all().delete()
        City.objects.all().delete()
        Country.objects.all().delete()
        
    return JsonResponse({"message": "All data has been reset successfully"})


def reset_cities(request):  # Add 'request' parameter here
    with transaction.atomic():
        City.objects.all().delete()
        Country.objects.all().delete()
        
    return JsonResponse({"message": "Cities and countries have been reset successfully"})

def reset_flights(request):  # Add 'request' parameter here
    with transaction.atomic():
        FlightInstance.objects.all().delete()
        FlightSchedule.objects.all().delete()
        
    return JsonResponse({"message": "Flights have been reset successfully"})