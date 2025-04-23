from django.db import transaction
from ..models.location import City, Country
from django.http import JsonResponse


def populate_countries_and_cities(request):
    with transaction.atomic():
        usa = Country.objects.create(name='United States', code='US')
        nyc = City.objects.create(name='New York', code='NYC', country=usa)
        lax = City.objects.create(name='Los Angeles', code='LAX', country=usa)
        chicago = City.objects.create(name='Chicago', code='CHI', country=usa)
        houston = City.objects.create(name='Houston', code='HOU', country=usa)

        canada = Country.objects.create(name='Canada', code='CA')
        toronto = City.objects.create(name='Toronto', code='TOR', country=canada)
        vancouver = City.objects.create(name='Vancouver', code='VAN', country=canada)
        montreal = City.objects.create(name='Montreal', code='MTL', country=canada)
        calgary = City.objects.create(name='Calgary', code='CAL', country=canada)

        uk = Country.objects.create(name='United Kingdom', code='UK')
        london = City.objects.create(name='London', code='LON', country=uk)
        manchester = City.objects.create(name='Manchester', code='MAN', country=uk)
        birmingham = City.objects.create(name='Birmingham', code='BIR', country=uk)
        glasgow = City.objects.create(name='Glasgow', code='GLA', country=uk)

        australia = Country.objects.create(name='Australia', code='AU')
        sydney = City.objects.create(name='Sydney', code='SYD', country=australia)
        melbourne = City.objects.create(name='Melbourne', code='MEL', country=australia)
        brisbane = City.objects.create(name='Brisbane', code='BNE', country=australia)
        perth = City.objects.create(name='Perth', code='PER', country=australia)
    
    # This is now properly reachable
    return JsonResponse({"message": "Cities populated successfully"})