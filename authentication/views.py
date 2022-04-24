from django.shortcuts import render, redirect
from django.views import View
from .models import *
from django_chat_app.quick_sort import quick_sort
from django_chat_app.binary_search import binary_search
from django.http import JsonResponse
from django.contrib.auth.hashers import make_password, check_password
import json


# If email session exist, redirect to homepage
def check_session_exist(request):
    email = request.session.get("email", None)
    print(email)

    if email is not None:
        return True
    return False


class LoginView(View):
    def get(self, request):
        session_exist = check_session_exist(request)

        if session_exist:
            return redirect("/")

        return render(request, "authentication/login.html")


def strip_login_info(email, password):
    email = email.strip()
    password = password.strip()

    return email, password


class AccountLogin(View):
    def post(self, request):
        email = request.POST.get("email")
        password = request.POST.get("password")

        if email is not None and password is not None:
            email, password = strip_login_info(email, password)

            if len(email) > 0 and len(password) > 0:
                accounts = Account.objects.values()
                account_list = list(map(lambda i: i, accounts))

                quick_sort(account_list, "email", 0, len(account_list) - 1)

                found_account_obj_index = binary_search(account_list, "email", email, 0, len(account_list) - 1)

                if found_account_obj_index > -1:
                    found_user_obj = account_list[found_account_obj_index]

                    valid_password = check_password(password, found_user_obj["password"])

                    if valid_password:
                        # Set user online status to online 
                        found_user_obj["is_online"] = True

                        account_obj = Account(**found_user_obj)
                        account_obj.save()

                        request.session["email"] = account_obj.email

                        return JsonResponse({
                            "user_login_success": True,
                            "account_obj": json.dumps({
                                "id": account_obj.id,
                                "email": account_obj.email,
                                "username": account_obj.username,
                                "is_online": account_obj.is_online,
                            })
                        }, safe=False)
                    else:
                        return JsonResponse({
                            "invalid_credential": True,
                        }, safe=False)
                else:
                    return JsonResponse({
                        "invalid_credential": True
                    }, safe=False)
            else:
                return JsonResponse({
                    "blank_fields": True
                })
        else:
            return JsonResponse({
                "blank_fields": True
            }, safe=False)


class RegisterView(View):
    def get(self, request):
        session_exist = check_session_exist(request)

        if session_exist:
            return redirect("/")

        return render(request, "authentication/register.html")


def striping_user_given_info(username, email, password, confirm_password):
    username = username.strip()
    email = email.strip()
    password = password.strip()
    confirm_password = confirm_password.strip()

    return username, email, password, confirm_password


class CreateAccount(View):
    def post(self, request):
        username = request.POST.get("username", None)
        email = request.POST.get("email", None)
        password = request.POST.get("password", None)
        confirm_password = request.POST.get("confirm_password", None)

        if username is not None and email is not None and password is not None and confirm_password is not None:
            username, email, password, confirm_password = striping_user_given_info(
                username, email, password, confirm_password)
            # print(username, email, password, confirm_password)

            if password != confirm_password:
                return JsonResponse({
                    "password_did_not_match": True
                }, safe=False)
            elif len(password) < 6:
                return JsonResponse({
                    "password_too_short": True
                }, safe=False)

            if len(username) > 0 and len(email) > 0 and len(password) > 0 and len(confirm_password) > 0:
                accounts = Account.objects.values()
                account_list = list(map(lambda i: i, accounts))

                # Applying quick sort
                quick_sort(account_list, "email", 0, len(account_list) - 1)

                # Applying binary search
                found_account_obj_index = binary_search(
                    account_list, "email", email, 0, len(account_list) - 1)

                if found_account_obj_index > -1:
                    return JsonResponse({
                        "user_exist": True
                    }, safe=False)
                else:
                    # Creating account object
                    account_obj = Account(
                        username=username,
                        email=email,
                        password=make_password(password)
                    )
                    account_obj.save()

                    # Creating session
                    request.session["email"] = email

                    return JsonResponse({
                        "register_success": True,
                        "account_obj": json.dumps({
                            "id": account_obj.id,
                            "email": account_obj.email,
                            "username": account_obj.username,
                            "is_online": account_obj.is_online
                        })
                    }, safe=False)
            else:
                return JsonResponse({
                    "blank_fields": True
                }, safe=False)
        else:
            return JsonResponse({
                "blank_fields": True
            }, safe=False)
