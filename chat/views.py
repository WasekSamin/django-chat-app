from urllib import request
from django.shortcuts import render, redirect
from authentication.models import Account
from django_chat_app.quick_sort import quick_sort
from django_chat_app.binary_search import binary_search
from django.views import View
from django.utils.decorators import method_decorator
from django_chat_app.decorators import is_user_logged_in
from .models import *
from django.http import JsonResponse, HttpResponse, Http404
import random
import string
import json
import time
import os
from django.conf import settings
from copy import deepcopy


# Find all the chat counters of the requested user as a receiver
def find_all_matched_chat_counters(chat_counter_list, key, target, start, chat_counter_list_length, receiver_chat_counters):
    quick_sort(chat_counter_list, key, start, len(chat_counter_list) - 1)
    found_chat_counter_obj_index = binary_search(chat_counter_list, key, target, start, len(chat_counter_list) - 1)

    if found_chat_counter_obj_index > -1:
        receiver_chat_counters.append(chat_counter_list[found_chat_counter_obj_index])
        chat_counter_list.pop(found_chat_counter_obj_index)
        return find_all_matched_chat_counters(chat_counter_list, key, target, start, chat_counter_list_length, receiver_chat_counters)
    return receiver_chat_counters


def get_receiver_all_chat_counter_objects(chat_counter_list, account_list, myself_email):
    receiver_chat_counters = []
    copied_chat_counter_list = deepcopy(chat_counter_list)
    all_matched_chat_counters = find_all_matched_chat_counters(copied_chat_counter_list, "receiver_email", myself_email, 0, len(copied_chat_counter_list), receiver_chat_counters)

    if all_matched_chat_counters:
        quick_sort(all_matched_chat_counters, "id", 0, len(all_matched_chat_counters) - 1)

    for account in account_list:
        _, found_chat_counter_obj = find_object(all_matched_chat_counters, "sender_email", account["email"], 0, len(all_matched_chat_counters))
        # Adding counter if found the chat counter object
        if found_chat_counter_obj is not None:
            account["counter"] = found_chat_counter_obj["counter"]

    return account_list


class ChatHomeView(View):
    @method_decorator(is_user_logged_in())
    def get(self, request):
        accounts = Account.objects.values()
        myself_email = request.session.get("email", None)

        account_list = list(map(lambda i: i, accounts))
        _, sender_obj = find_object(account_list, "email", myself_email, 0, len(account_list))

        chat_counters = ChatCounter.objects.values()
        chat_counter_list = list(map(lambda i: i, chat_counters))

        # Find all the chat counters of the requested user as a receiver
        account_list = get_receiver_all_chat_counter_objects(chat_counter_list, account_list, myself_email)
        # print(account_list)

        args = {
            "accounts": accounts,
            "sender_obj": sender_obj,
        }
        return render(request, "chat/home.html", args)


# Create random room slug of chatroom
def chatroomGenerator(size=20, chars=string.ascii_letters + string.digits):
    random_room = ''.join(random.choice(chars) for _ in range(size))

    chatrooms = Chatroom.objects.values()
    chatroom_list = list(map(lambda i: i, chatrooms))

    chatroom_list, found_chatroom_obj = find_object(
        chatroom_list, "room_slug", random_room, 0, len(chatroom_list))

    # If room slug already exists, make the function run again
    if found_chatroom_obj is not None:
        return chatroomGenerator(
            size=20, chars=string.ascii_letters + string.digits)
    return random_room


# Finding the object
# Return an index number or None
def find_object(lst, key, target, start, lst_length):
    quick_sort(lst, key, start, lst_length - 1)
    found_obj_index = binary_search(lst, key, target, start, lst_length - 1)

    if found_obj_index > -1:
        obj = lst[found_obj_index]

        return lst, obj
    return lst, None


# Finding all the chats of the room
def findAllMatchedChats(copiedChatList, account_list, itemList, room_slug):
    found_chat_obj = binary_search(
        copiedChatList, "room", room_slug, 0, len(copiedChatList) - 1)

    if found_chat_obj > -1:
        # Finding sender and receiver object index
        found_sender_obj = binary_search(
            account_list, "id", copiedChatList[found_chat_obj]["sender_id"], 0, len(account_list) - 1)
        found_receiver_obj = binary_search(
            account_list, "id", copiedChatList[found_chat_obj]["receiver_id"], 0, len(account_list) - 1)

        if found_sender_obj > -1 and found_receiver_obj > -1:
            # Setting sender and receiver object
            copiedChatList[found_chat_obj]["sender"] = account_list[found_sender_obj]
            copiedChatList[found_chat_obj]["receiver"] = account_list[found_receiver_obj]

            itemList.append(copiedChatList[found_chat_obj])
            copiedChatList.pop(found_chat_obj)
            return findAllMatchedChats(copiedChatList, account_list, itemList, room_slug)
    return itemList


class ChatroomView(View):
    @method_decorator(is_user_logged_in())
    def get(self, request, room_slug):
        accounts = Account.objects.values()
        account_list = list(map(lambda i: i, accounts))

        myself_email = request.session.get("email", None)

        quick_sort(account_list, "id", 0, len(account_list) - 1)

        chat_counters = ChatCounter.objects.values()
        chat_counter_list = list(map(lambda i: i, chat_counters))

        account_list = get_receiver_all_chat_counter_objects(chat_counter_list, account_list, myself_email)

        # For many to many fields, I have to do like this
        chats = Chat.objects.all()
        # chat_list = list(map(lambda i: i, chats))
        chat_list = list(
            map(
                lambda i: {"id": i.id,
                           "sender_id": i.sender.id,
                           "receiver_id": i.receiver.id,
                           "room": i.room,
                           "chatroom_id": i.chatroom.id,
                           "message": i.message,
                           "audio": i.audio,
                           "files": i.files,
                           "created_at": i.created_at.strftime("%b %d, %Y %I:%M %p")}, chats
            )
        )

        # print(chat_list)

        quick_sort(chat_list, "room", 0, len(chat_list) - 1)

        itemList = []
        # Copying chat list
        copiedChatList = deepcopy(chat_list)
        # Getting all the chats of the room
        matchedChatList = findAllMatchedChats(
            copiedChatList, account_list, itemList, room_slug)

        if matchedChatList:
            quick_sort(matchedChatList, "id", 0, len(matchedChatList) - 1)

        sender_obj, receiver_obj = None, None
        
        if matchedChatList:
            sender_obj = matchedChatList[0]["sender"]
            receiver_obj = matchedChatList[0]["receiver"]
        else:
            chatrooms = Chatroom.objects.values()
            chatroom_list = list(map(lambda i: i, chatrooms))

            _, chatroom_obj = find_object(chatroom_list, "room_slug", room_slug, 0, len(chatroom_list))
            
            if chatroom_obj is not None:
                _, user1_obj = find_object(account_list, "id", chatroom_obj["user1_id"], 0, len(account_list))
                _, user2_obj = find_object(account_list, "id", chatroom_obj["user2_id"], 0, len(account_list))

                if user1_obj is not None and user2_obj is not None:
                    if user1_obj["email"] == myself_email:
                        sender_obj = user1_obj
                        receiver_obj = user2_obj
                    else:
                        sender_obj = user2_obj
                        receiver_obj = user1_obj
                else:
                    return HttpResponse("Invlaid request! Please try again...")
            else:
                return HttpResponse("Invlaid request! Please try again...")

        # print(sender_obj)
        # print(receiver_obj)

        args = {
            "accounts": accounts,
            "chats": matchedChatList,
            "sender_obj": sender_obj,
            "receiver_obj": receiver_obj
        }
        return render(request, "chat/chat.html", args)


# Resetting chat counter object
def reset_chat_counter_obj(chat_counter_list, chatroom_obj, myself_email):
    _, found_chat_counter_obj = find_object(chat_counter_list, "room", chatroom_obj["room_slug"], 0, len(chat_counter_list))

    if found_chat_counter_obj is not None:
        if found_chat_counter_obj["receiver_email"] == myself_email:
            chat_counter_obj = ChatCounter(**found_chat_counter_obj)
            if chat_counter_obj.counter > 0:
                chat_counter_obj.counter = 0
                chat_counter_obj.save()


# If chatroom exists, then navigate to the chatroom
# Else create a new chatroom
class ChatroomCheckSlugView(View):
    @method_decorator(is_user_logged_in())
    def get(self, request, pk):
        myself_email = request.session.get("email", None)
        other_user_obj, myself_obj = None, None

        accounts = Account.objects.values()
        account_list = list(map(lambda i: i, accounts))

        chat_counters = ChatCounter.objects.values()
        chat_counter_list = list(map(lambda i: i, chat_counters))

        account_list, other_user_obj = find_object(
            account_list, "id", pk, 0, len(account_list))
        account_list, myself_obj = find_object(
            account_list, "email", myself_email, 0, len(account_list))

        if other_user_obj is not None and myself_obj is not None:
            splitted_user1 = myself_obj["email"].split("@")[0]
            splitted_user2 = other_user_obj["email"].split("@")[0]

            # user1 + user2
            combined_both_user = f"{splitted_user1}{splitted_user2}"

            chatrooms = Chatroom.objects.values()
            chatroom_list = list(map(lambda i: i, chatrooms))

            # quick_sort(chatroom_list, "check_slug", 0, len(chatroom_list) - 1)

            chatroom_list, found_chatroom_obj = find_object(
                chatroom_list, "check_slug", combined_both_user, 0, len(chatroom_list))

            print(found_chatroom_obj)
            # If chatroom found for user1 + user2
            if found_chatroom_obj is not None:
                # Resetting chat counter object
                reset_chat_counter_obj(chat_counter_list, found_chatroom_obj, myself_email)
                return redirect(f"/chat/{found_chatroom_obj['room_slug']}/")
            else:
                # user2 + user1
                combined_both_user = f"{splitted_user2}{splitted_user1}"

                chatroom_list, found_chatroom_obj = find_object(
                    chatroom_list, "check_slug", combined_both_user, 0, len(chatroom_list))

                # If chatroom found for user2 + user1
                if found_chatroom_obj is not None:
                    # Resetting chat counter object
                    reset_chat_counter_obj(chat_counter_list, found_chatroom_obj, myself_email)
                    return redirect(f"/chat/{found_chatroom_obj['room_slug']}/")
                else:
                    # Create new chatroom
                    room_generator = chatroomGenerator()

                    user1_obj = Account(**myself_obj)
                    user2_obj = Account(**other_user_obj)

                    splitted_user1 = user1_obj.email.split("@")[0]
                    splitted_user2 = user2_obj.email.split("@")[0]
                    combined_both_user = f"{splitted_user1}{splitted_user2}"

                    chatroom_obj = Chatroom(
                        room_slug=room_generator,
                        check_slug=combined_both_user,
                        user1=user1_obj,
                        user2=user2_obj
                    )
                    chatroom_obj.save()

                    return redirect(f"/chat/{chatroom_obj.room_slug}/")
        else:
            return HttpResponse("Invalid user request!")


# Selecting message sender and receiver
# Returns sender and receiver object
def get_message_sender_and_receiver(chatroom_obj, account_obj, account_list):
    receiver = None
    sender = account_obj

    if chatroom_obj["user1_id"] == account_obj["id"]:
        account_list, found_receiver_obj = find_object(
            account_list, "id", chatroom_obj["user2_id"], 0, len(account_list))
    else:
        account_list, found_receiver_obj = find_object(
            account_list, "id", chatroom_obj["user1_id"], 0, len(account_list))

    if found_receiver_obj is not None:
        receiver = found_receiver_obj

    return sender, receiver

# Check if user change or delete localstorage email value


def check_for_sender_email(sender_email, my_email):
    if sender_email is None:
        return True, "email_delete"
    elif sender_email.strip() != my_email:
        return True, "email_change"
    return False, None


# Find the chatroom object, account object
def find_room_all_objects(room_slug, myself_email):
    chatrooms = Chatroom.objects.values()
    chatroom_list = list(map(lambda i: i, chatrooms))

    chatroom_list, found_chatroom_obj = find_object(
        chatroom_list, "room_slug", room_slug, 0, len(chatroom_list))

    if found_chatroom_obj is not None:
        accounts = Account.objects.values()
        account_list = list(map(lambda i: i, accounts))

        account_list, found_account_obj = find_object(
            account_list, "email", myself_email, 0, len(account_list))

        return found_chatroom_obj, found_account_obj, account_list
    return None, None, None


class MessageView(View):
    @method_decorator(is_user_logged_in())
    def post(self, request, room_slug):
        sender_email = request.POST.get("sender", None)
        message = request.POST.get("message", None)
        audio = request.FILES.get("audio", None)
        files = request.FILES.getlist("files", None)

        # print(sender_email)
        # print(message)
        # print(audio)
        # print(files)

        if message is not None:
            message = message.strip()

        myself_email = request.session.get("email", None)

        email_changed, email_status = check_for_sender_email(
            sender_email, myself_email)

        if email_changed:
            if email_status == "email_change":
                return JsonResponse({
                    "email_change": True,
                    "email": myself_email
                }, safe=False)
            elif email_status == "email_delete":
                return JsonResponse({
                    "email_delete": True,
                    "email": myself_email
                }, safe=False)

        found_chatroom_obj, found_account_obj, account_list = find_room_all_objects(
            room_slug, myself_email)

        if found_chatroom_obj is not None and found_account_obj is not None and account_list is not None:
            if found_account_obj is not None:
                sender, receiver = get_message_sender_and_receiver(
                    found_chatroom_obj, found_account_obj, account_list)

                if receiver is not None:
                    chatroom_obj = Chatroom(**found_chatroom_obj)
                    sender_obj = Account(**sender)
                    receiver_obj = Account(**receiver)

                    chat_obj = Chat(
                        room=chatroom_obj.room_slug,
                        chatroom=chatroom_obj,
                        sender=sender_obj,
                        receiver=receiver_obj,
                    )

                    json_response = {
                        "room": chat_obj.room,
                        "sender": json.dumps({
                            "username": sender_obj.username,
                            "email": sender_obj.email,
                        }),
                        "receiver": json.dumps({
                            "username": receiver_obj.username,
                            "email": receiver_obj.email,
                        }),
                    }

                    if message is not None:
                        chat_obj.message = message
                        json_response["message"] = True

                    elif audio is not None:
                        chat_obj.audio = audio
                        json_response["audio"] = True

                    chat_obj.save()

                    json_response["id"] = chat_obj.id

                    if files is not None and len(files) > 0:
                        for file in files:
                            file_obj = Files(
                                file=file
                            )
                            file_obj.save()

                            chat_obj.files.add(file_obj.id)
                        json_response["files"] = True

                    # Formatting chat datetime
                    chat_obj_datetime = chat_obj.created_at.strftime(
                        "%b %d, %Y %I:%M %p")
                    json_response["created_at"] = chat_obj_datetime
                    # print(chat_obj_datetime)

                    return JsonResponse(json_response, safe=False)
                return JsonResponse({
                    "invalid_request": True
                }, safe=False)
            return JsonResponse({
                "invalid_request": True
            }, safe=False)
        return JsonResponse({
            "invalid_request": True
        }, safe=False)


# Getting chat object, sender and receiver object
def find_chat_obj(chat_list, key, target, start, chat_list_length, account_list):
    found_chat_obj_index = binary_search(
        chat_list, key, target, start, chat_list_length - 1)

    if found_chat_obj_index > -1:
        found_chat_obj = chat_list[found_chat_obj_index]
        found_sender_obj_index = binary_search(
            account_list, "id", found_chat_obj["sender_id"], 0, len(account_list) - 1)
        found_receiver_obj_index = binary_search(
            account_list, "id", found_chat_obj["receiver_id"], 0, len(account_list) - 1)
        if found_sender_obj_index > -1 and found_receiver_obj_index > -1:
            sender_obj = account_list[found_sender_obj_index]
            receiver_obj = account_list[found_receiver_obj_index]
            return found_chat_obj, sender_obj, receiver_obj
    return None, None, None


# Get request for file receiving
class FetchFileRequest(View):
    @method_decorator(is_user_logged_in())
    def get(self, request, pk):
        accounts = Account.objects.values()
        account_list = list(map(lambda i: i, accounts))

        chats = Chat.objects.all()
        chat_list = list(
            map(
                lambda i: {"id": i.id,
                           "sender_id": i.sender.id,
                           "receiver_id": i.receiver.id,
                           "room": i.room,
                           "chatroom_id": i.chatroom.id,
                           "message": i.message,
                           "audio": i.audio,
                           "files": i.files,
                           "created_at": i.created_at.strftime("%b %d, %Y %I:%M %p")}, chats
            )
        )

        quick_sort(chat_list, "id", 0, len(chat_list) - 1)
        quick_sort(account_list, "id", 0, len(account_list) - 1)

        found_chat_obj, found_sender_obj, found_receiver_obj = find_chat_obj(
            chat_list, "id", pk, 0, len(chat_list), account_list)
        # print(found_chat_obj)

        files = list(
            map(
                lambda file: {
                    "id": file.id,
                    "file": str(file.file)
                },
                found_chat_obj["files"].all()
            )
        )

        return JsonResponse({
            "sender": json.dumps({
                "username": found_sender_obj["username"],
                "email": found_sender_obj["email"],
            }),
            "receiver": json.dumps({
                "username": found_receiver_obj["username"],
                "email": found_receiver_obj["email"],
            }),
            "files": json.dumps(files),
            "created_at": found_chat_obj["created_at"]
        }, safe=False)


# While calling the receiver, get all the info of the receiver object
class FetchReceiverCaller(View):
    @method_decorator(is_user_logged_in())
    def get(self, request, pk):
        accounts = Account.objects.values()
        account_list = list(map(lambda i: i, accounts))

        myself_email = request.session.get("email")
        sender_obj = None

        # Finding sender object
        if myself_email is not None:
            account_list, sender_obj = find_object(account_list, "email", myself_email, 0, len(account_list))

        # Finding receiver obj
        account_list, receiver_obj = find_object(account_list, "id", pk, 0, len(account_list))

        if sender_obj is not None and receiver_obj is not None:
            json_response = {
                "sender": {
                    "id": sender_obj["id"],
                    "email": sender_obj["email"],
                    "username": sender_obj["username"],
                    "is_active": sender_obj["is_active"]
                },
                "receiver": {
                    "id": receiver_obj["id"],
                    "email": receiver_obj["email"],
                    "username": receiver_obj["username"],
                    "is_active": receiver_obj["is_active"]
                }
            }
            return JsonResponse(json_response, safe=False)
        return JsonResponse({
            "invalid_request": True
        }, safe=False)


# Finding the chatroom, user1 and user2 object
def find_chatroom_all_obj(chatroom_list, key, target, start, chatroom_lst_length, account_list):
    found_chatroom_obj_index = binary_search(chatroom_list, key, target, start, chatroom_lst_length - 1)

    if found_chatroom_obj_index > -1:
        chatroom_obj = chatroom_list[found_chatroom_obj_index]
        user1_obj_index = binary_search(account_list, "id", chatroom_obj["user1_id"], 0, len(account_list) - 1)
        user2_obj_index = binary_search(account_list, "id", chatroom_obj["user2_id"], 0, len(account_list) - 1)

        if user1_obj_index > -1 and user2_obj_index > -1:
            user1_obj = account_list[user1_obj_index]
            user2_obj = account_list[user2_obj_index]

            return chatroom_obj, user1_obj, user2_obj
        return None, None, None
    return None, None, None
    

# While selecting a video call option, fetch sender and receiver info
class FetchCallOptionUserInfo(View):
    @method_decorator(is_user_logged_in())
    def post(self, request, room_slug):
        leave_call = request.POST.get("leaveCall", None)
        audio_mode = request.POST.get("audioModeOn", None)
        video_mode = request.POST.get("videoModeOn", None)

        chatrooms = Chatroom.objects.values()
        chatroom_list = list(map(lambda i: i, chatrooms))

        accounts = Account.objects.values()
        account_list = list(map(lambda i: i, accounts))

        myself_email = request.session.get("email", None)
        
        quick_sort(chatroom_list, "room_slug", 0, len(chatroom_list) - 1)
        quick_sort(account_list, "id", 0, len(account_list) - 1)

        # Getting chatroom, user1 and user2 object
        chatroom_obj, user1_obj, user2_obj = find_chatroom_all_obj(chatroom_list, "room_slug", room_slug, 0, len(chatroom_list), account_list)
        
        if chatroom_obj is not None and user1_obj is not None and user2_obj is not None:
            # Getting sender and receiver object
            sender_obj, receiver_obj = None, None
            if user1_obj["email"] == myself_email:
                sender_obj = user1_obj
                receiver_obj = user2_obj
            else:
                sender_obj = user2_obj
                receiver_obj = user1_obj

            json_response = {
                "room": chatroom_obj["room_slug"],
                "sender": {
                    "username": sender_obj["username"],
                    "email": sender_obj["email"]
                },
                "receiver": {
                    "username": receiver_obj["username"],
                    "email": receiver_obj["email"]
                },
            }

            if leave_call:
                json_response["call_option_type"] = "leave"
            elif audio_mode is not None:
                json_response["audio_mode"] = audio_mode
                json_response["call_option_type"] = "audio"
            elif video_mode is not None:
                json_response["video_mode"] = video_mode
                json_response["call_option_type"] = "video"

            return JsonResponse(json_response, safe=False)
        JsonResponse({
            "invalid_request": True
        }, safe=False)


class ChatCounterView(View):
    @method_decorator(is_user_logged_in())
    def post(self, request):
        room_slug = request.POST.get("room", None)
        sender_email = request.POST.get("sender", None)
        receiver_email = request.POST.get("receiver", None)
        update_counter = request.POST.get("updateCounter", None)
        reset_counter = request.POST.get("resetCounter", None)

        chatrooms = Chatroom.objects.values()
        chatroom_list = list(map(lambda i: i, chatrooms))
        accounts = Account.objects.values()
        account_list = list(map(lambda i: i, accounts))
        chat_counters = ChatCounter.objects.values()
        chat_counter_list = list(map(lambda i: i, chat_counters))

        _, found_chatroom_obj = find_object(chatroom_list, "room_slug", room_slug, 0, len(chatroom_list))
        _, found_sender_obj = find_object(account_list, "email", sender_email, 0, len(account_list))
        _, found_receiver_obj = find_object(account_list, "email", receiver_email, 0, len(account_list))
        _, found_chat_counter_obj = find_object(chat_counter_list, "room", room_slug, 0, len(chat_counter_list))

        # print(found_chatroom_obj)
        # print(found_sender_obj)
        # print(found_receiver_obj)

        if found_chatroom_obj is not None and found_sender_obj is not None and found_receiver_obj is not None:
            chatroom_obj = Chatroom(**found_chatroom_obj)
            sender_obj = Account(**found_sender_obj)
            receiver_obj = Account(**found_receiver_obj)

            if found_chat_counter_obj is None:
                chat_counter_obj = ChatCounter(
                    room=chatroom_obj.room_slug,
                    chatroom=chatroom_obj,
                    sender=sender_obj,
                    receiver=receiver_obj,
                    sender_email=sender_obj.email,
                    receiver_email=receiver_obj.email,
                )
            else:
                chat_counter_obj = ChatCounter(**found_chat_counter_obj)

            if update_counter:
                chat_counter_obj.sender = sender_obj
                chat_counter_obj.receiver = receiver_obj
                chat_counter_obj.sender_email = sender_obj.email
                chat_counter_obj.receiver_email = receiver_obj.email
                chat_counter_obj.counter += 1
            elif reset_counter:
                chat_counter_obj.counter = 0

            chat_counter_obj.save()

            return JsonResponse({
                "sender_id": chat_counter_obj.sender.id,
                "counter": chat_counter_obj.counter
            }, safe=False)
        else:
            return JsonResponse({
                "invalid_response": True
            }, safe=False)


# User logout
class LogoutView(View):
    def get(self, request):
        email = request.session.get("email", None)

        if email is not None:
            accounts = Account.objects.values()
            account_list = list(map(lambda i: i, accounts))

            quick_sort(account_list, "email", 0, len(account_list) - 1)

            found_account_obj_index = binary_search(
                account_list, "email", email, 0, len(account_list) - 1)

            if found_account_obj_index > -1:
                found_account_obj = account_list[found_account_obj_index]

                # Set user online status to offline
                found_account_obj["is_online"] = False

                account_obj = Account(**found_account_obj)
                account_obj.save()

                # Clearing every session
                request.session.clear()

                return JsonResponse({
                    "account_id": account_obj.id,
                    "account_email": account_obj.email,
                    "user_logout": True
                }, safe=False)
        return redirect("/authentication/login/")


# For file download
def download(request, path):
    file_path = os.path.join(settings.MEDIA_ROOT, path)
    if os.path.exists(file_path):
        with open(file_path, 'rb') as fh:
            response = HttpResponse(fh.read(), content_type="application/vnd.ms-excel")
            response['Content-Disposition'] = 'inline; filename=' + os.path.basename(file_path)
            return response
    raise Http404