# Generated by Django 4.0.4 on 2022-04-14 23:18

import datetime
from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    initial = True

    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.CreateModel(
            name='Files',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('file', models.FileField(null=True, upload_to='file/')),
                ('created_at', models.DateTimeField(default=datetime.datetime.now)),
            ],
        ),
        migrations.CreateModel(
            name='Chatroom',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('room_slug', models.CharField(max_length=20, null=True, unique=True)),
                ('check_slug', models.CharField(blank=True, max_length=255, null=True)),
                ('created_at', models.DateTimeField(default=datetime.datetime.now)),
                ('user1', models.ForeignKey(null=True, on_delete=django.db.models.deletion.CASCADE, related_name='user1', to=settings.AUTH_USER_MODEL)),
                ('user2', models.ForeignKey(null=True, on_delete=django.db.models.deletion.CASCADE, related_name='user2', to=settings.AUTH_USER_MODEL)),
            ],
        ),
        migrations.CreateModel(
            name='ChatCounter',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('room', models.CharField(max_length=20, null=True)),
                ('counter', models.PositiveBigIntegerField(default=0, null=True)),
                ('receiver_token', models.CharField(blank=True, max_length=50, null=True)),
                ('sender_token', models.CharField(blank=True, max_length=50, null=True)),
                ('created_at', models.DateTimeField(default=datetime.datetime.now, null=True)),
                ('chatroom', models.OneToOneField(null=True, on_delete=django.db.models.deletion.CASCADE, related_name='chatroom_chat_counter', to='chat.chatroom')),
                ('receiver', models.ForeignKey(null=True, on_delete=django.db.models.deletion.CASCADE, related_name='receiver_chat_counter', to=settings.AUTH_USER_MODEL)),
                ('sender', models.ForeignKey(null=True, on_delete=django.db.models.deletion.CASCADE, related_name='sender_chat_counter', to=settings.AUTH_USER_MODEL)),
            ],
        ),
        migrations.CreateModel(
            name='Chat',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('room', models.CharField(max_length=20, null=True)),
                ('message', models.TextField(blank=True, null=True)),
                ('audio', models.FileField(blank=True, null=True, upload_to='audio/')),
                ('created_at', models.DateTimeField(default=datetime.datetime.now, null=True)),
                ('chatroom', models.ForeignKey(null=True, on_delete=django.db.models.deletion.CASCADE, related_name='chatroom', to='chat.chatroom')),
                ('files', models.ManyToManyField(blank=True, to='chat.files')),
                ('receiver', models.ForeignKey(null=True, on_delete=django.db.models.deletion.CASCADE, related_name='receiver', to=settings.AUTH_USER_MODEL)),
                ('sender', models.ForeignKey(null=True, on_delete=django.db.models.deletion.CASCADE, related_name='sender', to=settings.AUTH_USER_MODEL)),
            ],
        ),
    ]
