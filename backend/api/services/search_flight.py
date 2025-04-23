from django.db.models import Q
from ..models.flight import FlightInstance
from datetime import datetime

class FlightSearchService:
    @staticmethod
    def search_flights(departure_city=None, arrival_city=None, date=None, max_price=None):
        queryset = FlightInstance.objects.all()
        
        if departure_city:
            queryset = queryset.filter(schedule__departure_city=departure_city)
        
        if arrival_city:
            queryset = queryset.filter(schedule__arrival_city=arrival_city)
        
        if date:
            queryset = queryset.filter(
                Q(departure_time__date=date) | 
                Q(schedule__operating_days__contains=date.strftime('%A')[0])
            )
        
        if max_price:
            queryset = queryset.filter(base_price__lte=max_price)
        
        return queryset.order_by('departure_time')