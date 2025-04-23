import random
from datetime import datetime, timedelta, time # Import time
from django.db import transaction
from django.http import JsonResponse
from ..models.flight import FlightSchedule, FlightInstance
from ..models.location import City
from django.db.models import Count
from decimal import Decimal

def populate_flights(request):
    """
    Populates the database with random FlightSchedules and FlightInstances.
    """
    with transaction.atomic():
        # Optional: Clear existing data first for a clean slate
        # FlightInstance.objects.all().delete()
        # FlightSchedule.objects.all().delete()

        cities = list(City.objects.all())
        if len(cities) < 2:
            return JsonResponse({"error": "Not enough cities to create schedules. Need at least 2."}, status=400)

        schedules_created = 0
        instances_created = 0

        for i in range(10): # Create 10 schedules
            departure_city, arrival_city = random.sample(cities, 2)
            flight_number = f"AA{random.randint(100, 999)}"

            # Define seat distribution for the schedule
            total_seats = random.choice([100, 150, 180])
            business_seats = int(total_seats * random.uniform(0.1, 0.15)) # 10-15% Business
            first_seats = int(total_seats * random.uniform(0.05, 0.08)) # 5-8% First
            economy_seats = total_seats - business_seats - first_seats

            # Generate a random time object for departure
            departure_hour = random.randint(6, 18)
            departure_minute = random.choice([0, 15, 30, 45])
            departure_time_obj = time(hour=departure_hour, minute=departure_minute)

            # Generate a duration for arrival time (assuming typical_arrival_time is DurationField)
            arrival_duration = timedelta(hours=random.randint(1, 5), minutes=random.choice([0, 15, 30, 45]))

            schedule, created = FlightSchedule.objects.get_or_create(
                flight_number=flight_number,
                defaults={
                    'departure_city': departure_city,
                    'arrival_city': arrival_city,
                    'typical_departure_time': departure_time_obj, # Use the time object
                    'typical_arrival_time': arrival_duration, # Use timedelta (ensure model field is DurationField)
                    'operating_days': "Mon,Tue,Wed,Thu,Fri,Sat,Sun", # Example
                    'total_seats': total_seats,
                    'economy_seats': economy_seats,
                    'business_seats': business_seats,
                    'first_seats': first_seats
                }
            )
            if created:
                schedules_created += 1

            # Create 2 instances for this schedule in the near future
            for j in range(2):
                # Generate a random departure datetime based on today + offset
                departure_datetime = datetime.now() + timedelta(days=random.randint(1, 30))
                # Combine with the schedule's typical departure time
                departure_datetime = departure_datetime.replace(
                    hour=schedule.typical_departure_time.hour,
                    minute=schedule.typical_departure_time.minute,
                    second=0,
                    microsecond=0
                )

                # Calculate arrival based on departure datetime + schedule's typical duration
                # Ensure schedule.typical_arrival_time is a timedelta (DurationField)
                arrival_datetime = departure_datetime + schedule.typical_arrival_time

                # Define prices for this instance (can vary slightly)
                base_eco_price = Decimal(random.uniform(100, 300))
                business_multiplier = Decimal(random.uniform(2.0, 3.5))
                first_multiplier = Decimal(random.uniform(4.0, 6.0))

                FlightInstance.objects.create(
                    schedule=schedule,
                    departure_time=departure_datetime,
                    arrival_time=arrival_datetime,
                    # Prices
                    economy_price=base_eco_price.quantize(Decimal("0.01")),
                    business_price=(base_eco_price * business_multiplier).quantize(Decimal("0.01")),
                    first_price=(base_eco_price * first_multiplier).quantize(Decimal("0.01")),
                    # Available seats are set automatically by the model's save method now
                )
                instances_created += 1

    # Optional: Call delete duplicate here if you still need it
    # delete_duplicate_flights(request) # Pass request if needed by the function

    return JsonResponse({
        "message": f"Successfully created/updated {schedules_created} schedules and created {instances_created} flight instances.",
    })


def delete_duplicate_flights(request):
    """
    Finds and deletes duplicate FlightInstances based on schedule and departure_time,
    keeping only the one with the lowest ID.
    """
    with transaction.atomic():
        # Identify groups of (schedule, departure_time) that appear more than once
        duplicate_groups = FlightInstance.objects.values(
            'schedule', 'departure_time'
        ).annotate(count=Count('id')).filter(count__gt=1)

        flight_ids_to_delete = []
        for group in duplicate_groups:
            # For each duplicate group, find all matching instances
            duplicates = FlightInstance.objects.filter(
                schedule=group['schedule'],
                departure_time=group['departure_time']
            ).order_by('id') # Order by ID to easily identify the one to keep

            # Add IDs of all but the first one (the one to keep) to the deletion list
            flight_ids_to_delete.extend(duplicates[1:].values_list('id', flat=True))

        deleted_count = 0
        if flight_ids_to_delete:
            # Perform the deletion in a single query
            result = FlightInstance.objects.filter(id__in=flight_ids_to_delete).delete()
            deleted_count = result[0] # delete() returns a tuple (total_deleted, dict_of_deletions_per_model)

    return JsonResponse({
        "message": f"Successfully found and deleted {deleted_count} duplicate flight instances."
    })