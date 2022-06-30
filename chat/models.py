from django.db import models
from datetime import datetime
from django.contrib.auth import get_user_model
from PIL import Image

User = get_user_model()


class Files(models.Model):
    file = models.FileField(upload_to="file/", null=True)
    created_at = models.DateTimeField(default=datetime.now)

    def __str__(self):
        return str(self.id)


class Chatroom(models.Model):
    room_slug = models.CharField(max_length=20, unique=True, null=True)
    check_slug = models.CharField(max_length=255, null=True, blank=True)
    user1 = models.ForeignKey(
        User, on_delete=models.CASCADE, null=True, related_name="user1")
    user2 = models.ForeignKey(
        User, on_delete=models.CASCADE, null=True, related_name="user2")
    created_at = models.DateTimeField(default=datetime.now)

    def __str__(self):
        return self.room_slug


class Chat(models.Model):
    room = models.CharField(max_length=20, null=True)
    chatroom = models.ForeignKey(
        Chatroom, on_delete=models.CASCADE, null=True, related_name="chatroom")
    sender = models.ForeignKey(
        User, on_delete=models.CASCADE, null=True, related_name="sender")
    receiver = models.ForeignKey(
        User, on_delete=models.CASCADE, null=True, related_name="receiver")
    message = models.TextField(null=True, blank=True)
    audio = models.FileField(upload_to="audio/", null=True, blank=True)
    files = models.ManyToManyField(Files, blank=True)
    created_at = models.DateTimeField(default=datetime.now, null=True)

    def __str__(self):
        return str(self.id)


class ChatCounter(models.Model):
    room = models.CharField(max_length=20, null=True)
    chatroom = models.OneToOneField(
        Chatroom, on_delete=models.CASCADE, null=True, related_name="chatroom_chat_counter")
    sender = models.ForeignKey(
        User, on_delete=models.CASCADE, null=True, related_name="sender_chat_counter")
    receiver = models.ForeignKey(
        User, on_delete=models.CASCADE, null=True, related_name="receiver_chat_counter")
    counter = models.PositiveBigIntegerField(default=0, null=True)
    receiver_email = models.CharField(max_length=50, null=True, blank=True)
    sender_email = models.CharField(max_length=50, null=True, blank=True)
    created_at = models.DateTimeField(default=datetime.now, null=True)

    def __str__(self):
        return str(self.id)
