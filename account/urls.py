from django.urls import path

from .views import *

app_name = "account"
urlpatterns = [
    path("login/", LoginView.as_view(), name="login"),
    path("register/", RegisterView.as_view(), name="register"),
    path("account-create/", CreateAccount.as_view(), name="account-create"),
    path("account-login/", AccountLogin.as_view(), name="account-login"),
]