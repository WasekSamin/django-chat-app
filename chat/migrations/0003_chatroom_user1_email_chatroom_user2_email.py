# Generated by Django 4.0.4 on 2022-04-17 09:27

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('chat', '0002_rename_receiver_token_chatcounter_receiver_email_and_more'),
    ]

    operations = [
        migrations.AddField(
            model_name='chatroom',
            name='user1_email',
            field=models.EmailField(blank=True, max_length=254, null=True),
        ),
        migrations.AddField(
            model_name='chatroom',
            name='user2_email',
            field=models.EmailField(blank=True, max_length=254, null=True),
        ),
    ]