# api/serializers/auth_serializers.py
from rest_framework import serializers
from django.contrib.auth.hashers import make_password
from ..models.auth import CustomerUser

# class UserRegistrationSerializer(serializers.ModelSerializer):
#     password = serializers.CharField(write_only=True)

#     class Meta:
#         model = CustomerUser
#         fields = ['id', 'username', 'email', 'password']

#     def create(self, validated_data):
#         validated_data['password'] = make_password(validated_data['password'])
#         return super().create(validated_data)

class UserRegistrationSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True)

    class Meta:
        model = CustomerUser  # Make sure this is CustomerUser, not BaseUser
        fields = ('username', 'email', 'password')

    def create(self, validated_data):
        # Return CustomerUser instance, not BaseUser
        user = CustomerUser.objects.create_user(
            username=validated_data['username'],
            email=validated_data.get('email', ''),
            password=validated_data['password']
        )
        return user

class UserLoginSerializer(serializers.Serializer):
    username = serializers.CharField()
    password = serializers.CharField(write_only=True)
