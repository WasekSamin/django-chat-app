from urllib import request
from django.shortcuts import render, redirect
from account.models import Account
from django_chat_app.quick_sort import quick_sort
from django_chat_app.binary_search import binary_search
from django.views import View
from django.utils.decorators import method_decorator
from django_chat_app.decorators import is_user_logged_in
from .models import *
from django.http import JsonResponse, HttpResponse
import random
import string
import json
from copy import deepcopy


class ChatHomeView(View):
    @method_decorator(is_user_logged_in())
    def get(self, request):
        accounts = Account.objects.all()

        args = {
            "accounts": accounts,
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
            # Formatting datetime
            copiedChatList[found_chat_obj]["created_at"] = copiedChatList[found_chat_obj]["created_at"].strftime(
                "%b %d, %Y %I:%M %p")
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
        accounts = Account.objects.all()

        chatroom = Chatroom.objects.values()
        chatroom_list = list(map(lambda i: i, chatroom))

        accounts = Account.objects.values()
        account_list = list(map(lambda i: i, accounts))

        quick_sort(account_list, "id", 0, len(account_list) - 1)

        chatroom_list, chatroom_found_object = find_object(
            chatroom_list, "room_slug", room_slug, 0, len(chatroom_list))

        chats = Chat.objects.values()
        chat_list = list(map(lambda i: i, chats))

        quick_sort(chat_list, "room", 0, len(chat_list) - 1)

        itemList = []
        # Copying chat list
        copiedChatList = deepcopy(chat_list)
        # Getting all the chats of the room
        matchedChatList = findAllMatchedChats(
            copiedChatList, account_list, itemList, room_slug)

        quick_sort(matchedChatList, "id", 0, len(matchedChatList) - 1)

        args = {
            "accounts": accounts,
            "chats": matchedChatList,
        }
        return render(request, "chat/chat.html", args)


class ChatroomCheckSlugView(View):
    @method_decorator(is_user_logged_in())
    def get(self, request, pk):
        myself_email = request.session.get("email", None)
        other_user_obj, myself_obj = None, None

        accounts = Account.objects.values()
        account_list = list(map(lambda i: i, accounts))

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

            # If chatroom found for user1 + user2
            if found_chatroom_obj is not None:
                return redirect(f"/chat/{found_chatroom_obj['room_slug']}/")
            else:
                # user2 + user1
                combined_both_user = f"{splitted_user2}{splitted_user1}"

                chatroom_list, found_chatroom_obj = find_object(
                    chatroom_list, "check_slug", combined_both_user, 0, len(chatroom_list))

                # If chatroom found for user2 + user1
                if found_chatroom_obj is not None:
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

#### Only for text message ####
class MessageView(View):
    @method_decorator(is_user_logged_in())
    def post(self, request, room_slug):
        data = json.loads(request.body)
        # print("THE DATA:", data)

        sender_email = data["sender"]
        message = data["message"].strip()

        myself_email = request.session.get("email", None)

        email_changed, email_status = check_for_sender_email(sender_email, myself_email)

        if email_changed:
            if email_status == "email_change":
                return JsonResponse({
                    "email_change": True,
                    "email": myself_email
                })
            elif email_status == "email_delete":
                return JsonResponse({
                    "email_delete": True,
                    "email": myself_email
                })

        found_chatroom_obj, found_account_obj, account_list = find_room_all_objects(room_slug, myself_email)

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
                        message=message,
                    )
                    chat_obj.save()

                    # Formatting chat datetime
                    chat_obj_datetime = chat_obj.created_at.strftime(
                        "%b %d, %Y %I:%M %p")
                    # print(chat_obj_datetime)

                    return JsonResponse({
                        "id": chat_obj.id,
                        "room": chat_obj.room,
                        "sender": json.dumps({
                            "username": sender_obj.username,
                            "email": sender_obj.email,
                        }),
                        "receiver": json.dumps({
                            "username": receiver_obj.username,
                            "email": receiver_obj.email,
                        }),
                        "message": message,
                        "created_at": chat_obj_datetime
                    })
                else:
                    return JsonResponse({
                        "invalid_request": True
                    })
            else:
                return JsonResponse({
                    "invalid_request": True
                })
        else:
            return JsonResponse({
                "invalid_request": True
            })


#### For audio or files message send ####
class FileOrAudioCreateMessageView(View):
    @method_decorator(is_user_logged_in())
    def post(self, request, room_slug):
        print(request.POST)
        print(request.FILES)

        sender_email = request.POST.get("sender", None)
        files = request.POST.getlist("files", None)
        audio = request.FILES.get("audio", None)

        myself_email = request.session.get("email", None)

        email_changed, email_status = check_for_sender_email(sender_email, myself_email)

        if email_changed:
            if email_status == "email_change":
                return JsonResponse({
                    "email_change": True,
                    "email": myself_email
                })
            elif email_status == "email_delete":
                return JsonResponse({
                    "email_delete": True,
                    "email": myself_email
                })

        found_chatroom_obj, found_account_obj, account_list = find_room_all_objects(room_slug, myself_email)

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
                        audio=audio
                    )
                    chat_obj.save()

                    # Formatting chat datetime
                    chat_obj_datetime = chat_obj.created_at.strftime(
                        "%b %d, %Y %I:%M %p")
                    
                    json_response = {
                        "id": chat_obj.id,
                        "room": chat_obj.room,
                        "sender": json.dumps({
                            "username": sender_obj.username,
                            "email": sender_obj.email,
                        }),
                        "receiver": json.dumps({
                            "username": receiver_obj.username,
                            "email": receiver_obj.email,
                        }),
                        "created_at": chat_obj_datetime
                    }

                    if len(files) > 0:
                        for file in files:
                            file_obj = Files(
                                file=file
                            )
                            file_obj.save()

                            chat_obj.files.add(file_obj.id)

                    if audio:
                        json_response["audio"] = True
                        
                    return JsonResponse(json_response, safe=False)
                else:
                    return JsonResponse({
                        "invalid_request": True
                    })
            else:
                return JsonResponse({
                    "invalid_request": True
                })
        else:
            return JsonResponse({
                "invalid_request": True
            })

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

                del request.session["email"]

                return redirect("/account/login/")
                # return JsonResponse({
                #     "email": email,
                #     "user_logout": True
                # })
        return redirect("/account/login/")
