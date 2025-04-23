from django.contrib.auth.models import AbstractUser, UserManager
from django.db import models

class BaseUser(AbstractUser):
    # Remove the abstract Meta class
    # Any additional fields common to both user types would go here
    pass

class AdminUserManager(UserManager):
    def get_queryset(self):
        return super().get_queryset().filter(is_staff=True)

class AdminUser(BaseUser):
    class Meta:
        proxy = True
        permissions = [
            ("can_manage_flights", "Can manage flights"),
            ("can_manage_bookings", "Can manage bookings"),
            ("can_manage_cities", "Can manage cities"),
        ]

    def save(self, *args, **kwargs):
        self.is_staff = True
        self.is_superuser = True
        super().save(*args, **kwargs)
        
class CustomerUserManager(UserManager):
    def get_queryset(self):
        return super().get_queryset().filter(is_staff=False)

class CustomerUser(BaseUser):
    class Meta:
        proxy = True
        permissions = [
            ("can_book_flight", "Can book a flight"),
            ("can_search_flight", "Can search for flights"),
        ]

    def save(self, *args, **kwargs):
        self.is_staff = False
        self.is_superuser = False
        super().save(*args, **kwargs)