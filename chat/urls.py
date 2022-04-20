from django.urls import path

from .views import *

app_name = "chat"
urlpatterns = [
    path("", ChatHomeView.as_view(), name="home"),
    path("chat/<int:pk>/", ChatroomCheckSlugView.as_view(), name="chatroom-check-slug"),
    path("chat/<str:room_slug>/", ChatroomView.as_view(), name="chatroom"),
    # Text message
    path("create-message/<str:room_slug>/", MessageView.as_view(), name="message"),
    path("file-request/<int:pk>/", FetchFileRequest.as_view(), name="file-request"),
    path("logout/", LogoutView.as_view(), name="logout"),
]