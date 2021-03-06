from django.urls import path, re_path
from django.views.static import serve
from django.conf import settings

from .views import *

app_name = "chat"
urlpatterns = [
    path("", ChatHomeView.as_view(), name="home"),
    path("chat/<int:pk>/", ChatroomCheckSlugView.as_view(), name="chatroom-check-slug"),
    path("chat/<str:room_slug>/", ChatroomView.as_view(), name="chatroom"),
    # Text message
    path("create-message/<str:room_slug>/", MessageView.as_view(), name="message"),
    # To fetch file on receiver side
    path("file-request/<int:pk>/", FetchFileRequest.as_view(), name="file-request"),
    # To check if the user is valid
    path("check-receiver/<int:pk>/", FetchReceiverCaller.as_view(), name="check-receiver"),
    # While leave call, fetch sender and user info
    path("call-options/<str:room_slug>/", FetchCallOptionUserInfo.as_view(), name="leave-call"),
    # Chat counter
    path("chat-counter/", ChatCounterView.as_view(), name="chat-counter"),
    path("logout/", LogoutView.as_view(), name="logout"),

    # For file download
    re_path(r'^download/(?P<path>.*)$', serve, {'document root': settings.MEDIA_ROOT}),
]