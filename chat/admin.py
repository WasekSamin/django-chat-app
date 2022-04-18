from django.contrib import admin

from .models import *


@admin.register(Files)
class FilesAdmin(admin.ModelAdmin):
    list_display = (
        "id", "file", "created_at"
    )


@admin.register(Chatroom)
class ChatroomAdmin(admin.ModelAdmin):
    list_display = (
        "id", "room_slug", "check_slug",
        "user1", "user2", "created_at"
    )


@admin.register(Chat)
class ChatAdmin(admin.ModelAdmin):
    list_display = (
        "id", "chatroom",
        "sender", "receiver",
        "message", "audio",
        "created_at"
    )


@admin.register(ChatCounter)
class ChatCounterAdmin(admin.ModelAdmin):
    list_display = (
        "id", "chatroom",
        "sender", "receiver",
        "sender_email", "receiver_email",
        "counter", "created_at"
    )
