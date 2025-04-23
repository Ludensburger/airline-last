from django.urls import path
from django.contrib import admin  
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from api.views.admin_flight_schedule_views import AdminFlightScheduleListView
from api.views.auth_views import AuthViewSet, RegisterView, LoginView, UserProfileView
from api.views.location_views import CityViewSet, AllCitiesView, AddCityView
from api.views.flight_views import FlightViewSet, AllFlightsView, AddFlightView, FlightDetailView, FlightSearchView
from api.views.booking_views import BookingViewSet, AddBookingView, BookingDetailView, AddBookingByFlightNumberView
from api.views.admin_flight_schedule_views import AdminFlightScheduleViewSet, AdminFlightScheduleListView, AdminFlightScheduleCreateView
from api.views.business_logic_views import CheckAvailabilityView
from api.services import data_reset_service, city_population_service, flight_population_service

urlpatterns = [
    
    # To Test the API endpoints in the browser
    # http://127.0.0.1:8000
    # or
    # http://127.0.0.1:8000/admin/

    
    path('admin/', admin.site.urls),

    # ========================
    # Authentication
    # ========================
    path('auth/register/', RegisterView.as_view(), name='register'),
    path('auth/login/', LoginView.as_view(), name='login'),
    path('auth/user/', UserProfileView.as_view(), name='user-profile'),
    path('auth/token/', TokenObtainPairView.as_view(), name='token-obtain'),
    path('auth/token/refresh/', TokenRefreshView.as_view(), name='token-refresh'),
    
    # ========================
    # Cities
    # ========================
    path('cities/', AllCitiesView.as_view(), name='all-cities'),
    path('cities/add/', AddCityView.as_view(), name='add-city'),
    
    # ========================
    # Flights
    # ========================
    path('flights/', AllFlightsView.as_view(), name='all-flights'),
    path('flights/add/', AddFlightView.as_view(), name='add-flight'),
    path('flights/<int:pk>/', FlightDetailView.as_view(), name='flight-detail'),
    path('flights/search/', FlightSearchView.as_view(), name='flight-search'),
    
    
    # ========================
    # Bookings
    # ========================
    path('bookings/', BookingViewSet.as_view({'get': 'list'}), name='booking-list'), 
    # POST requests to /bookings/ go to AddBookingView's create action (which uses perform_create)
    path('bookings/', AddBookingView.as_view(), name='booking-create'), 
    path('bookings/add-by-flight-number/', AddBookingByFlightNumberView.as_view(), name='add-booking-by-flight-number'),
    path('bookings/<int:pk>/', BookingDetailView.as_view(), name='booking-detail'), 

    
    # ========================
    # Admin Endpoints
    # ========================
    path('admin/schedules/', AdminFlightScheduleListView.as_view(), name='admin-schedule-list'),
    path('admin/schedules/add/', AdminFlightScheduleCreateView.as_view(), name='admin-schedule-add'),
    
    # ========================
    # Business Logic
    # ========================
    path('availability/', CheckAvailabilityView.as_view(), name='check-availability'),
    
    # ========================
    # Utility/Dev Endpoints
    # ========================
    path('reset-all/', data_reset_service.reset_all_data, name='reset-all'),
    
    # City Utilities
    path('populate-cities/', city_population_service.populate_countries_and_cities, name='populate-cities'),
    path('reset_cities/', data_reset_service.reset_cities, name='reset-cities'),
    
    # Flight Utilities
    path('populate-flights/', flight_population_service.populate_flights, name='populate-flights'),
    path('reset_flights/', data_reset_service.reset_flights, name='reset-flights'),
    path('delete-duplicate-flights/', flight_population_service.delete_duplicate_flights, name='delete-duplicate-flights'),
    
    
    # ========================
    # JWT Authentication
    # ========================
    path('auth/token/', TokenObtainPairView.as_view(), name='token-obtain'),
    path('auth/token/refresh/', TokenRefreshView.as_view(), name='token-refresh'),
]