from django.shortcuts import redirect


def is_user_logged_in():
    def decorator(func):
        def wrapper(request, *args, **kwargs):
            email = request.session.get("email", None)

            if email is not None:
                return func(request, *args, **kwargs)
            else:
                return redirect("account:login")
        return wrapper
    return decorator