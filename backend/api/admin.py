from django.contrib import admin
from django.contrib.auth.admin import UserAdmin

# Auth models
from .models.auth import BaseUser, AdminUser, CustomerUser

# Location models
from .models.location import Country, City

# Flight models
from .models.flight import FlightSchedule, FlightInstance

# Booking models
from .models.booking import Booking

# Register auth models
# admin.site.register(BaseUser, UserAdmin)
# admin.site.register(AdminUser)
# admin.site.register(CustomerUser)

# Register auth models
@admin.register(BaseUser)
class BaseUserAdmin(UserAdmin):
    pass

@admin.register(AdminUser)
class AdminUserAdmin(UserAdmin):
    def get_queryset(self, request):
        # Extra protection to ensure only admin users appear
        return super().get_queryset(request).filter(is_staff=True)

@admin.register(CustomerUser)
class CustomerUserAdmin(UserAdmin):
    def get_queryset(self, request):
        # Extra protection to ensure only customer users appear
        return super().get_queryset(request).filter(is_staff=False)

# Register location models
@admin.register(Country)
class CountryAdmin(admin.ModelAdmin):
    list_display = ('name', 'code')
    search_fields = ('name', 'code')

@admin.register(City)
class CityAdmin(admin.ModelAdmin):
    list_display = ('id','name', 'code', 'country')
    list_filter = ('country',)
    search_fields = ('name', 'code')

# Register flight models
@admin.register(FlightSchedule)
class FlightScheduleAdmin(admin.ModelAdmin):
    list_display = ('id', 'flight_number', 'departure_city', 'arrival_city',
                    'typical_departure_time', 'typical_arrival_time',
                    'operating_days', 'total_seats', 'economy_seats', 'business_seats', 'first_seats') # Added seats
    list_filter = ('departure_city', 'arrival_city', 'operating_days')
    search_fields = ('flight_number',)

@admin.register(FlightInstance)
class FlightInstanceAdmin(admin.ModelAdmin):
    list_display = ('id', 'schedule', 'departure_time', 'arrival_time',
                    'economy_seats_available', 'business_seats_available', 'first_seats_available', # Show class seats
                    'economy_price', 'business_price', 'first_price', # Show class prices
                    'total_available_seats', 'is_full')
    list_filter = ('departure_time', 'arrival_time', 'schedule__departure_city', 'schedule__arrival_city')
    search_fields = ('schedule__flight_number',)
    readonly_fields = ('total_available_seats', 'is_full') # Make properties read-only

@admin.register(Booking)
class BookingAdmin(admin.ModelAdmin):
    list_display = ('id', 'user', 'get_flight_number', 'seats_booked', 'seat_class', # Added seat_class
                    'total_price', 'status', 'booking_date')
    list_filter = ('status', 'booking_date', 'seat_class') # Added seat_class filter
    search_fields = ('user__username', 'flight__schedule__flight_number')
    readonly_fields = ('total_price', 'booking_date') # Price is calculated
    
    def get_flight_number(self, obj):
        return obj.flight.schedule.flight_number if obj.flight and obj.flight.schedule else "N/A"
    get_flight_number.short_description = 'Flight Number'
    

