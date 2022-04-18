from email.policy import default
from enum import unique
from multiprocessing.sharedctypes import Value
from django.db import models
from django.contrib.auth.models import AbstractBaseUser, BaseUserManager
from datetime import datetime


class AccountManager(BaseUserManager):
    def create_user(self, email, username, password=None):
        if not email:
            raise ValueError("User must have an email address!")
        elif not username:
            raise ValueError("User must have a username!")
        
        email = self.normalize_email(email)
        user = self.model(email=email, username=username)

        user.set_password(password)
        user.save()

        return user

    def create_superuser(self, email, username, password=None):
        if not email:
            raise ValueError("User must have an email address!")
        elif not username:
            raise ValueError("User must have a username!")

        email = self.normalize_email(email)
        user = self.model(email=email, username=username)

        user.set_password(password)
        user.is_superuser = True
        user.is_staff = True

        user.save()
        

class Account(AbstractBaseUser):
    email = models.EmailField(null=True, unique=True)
    username = models.CharField(max_length=255, null=True)
    is_active = models.BooleanField(default=True)
    is_staff = models.BooleanField(default=False)
    is_superuser = models.BooleanField(default=False)
    is_online = models.BooleanField(default=True)
    created_at = models.DateTimeField(default=datetime.now)

    objects = AccountManager()

    USERNAME_FIELD = "email"
    REQUIRED_FIELDS = ["username"]

    def has_perm(self, perm, obj=None):
        return self.is_superuser

    def has_module_perms(self, app_label):
        return self.is_superuser

    def __str__(self):
        return self.email
