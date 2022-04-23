const p = localStorage.getItem("PSID");
const e = localStorage.getItem("email");
let onVideoCall = false;
let peer = null;
let senderVideoStream = null, 
    receiverVideoStream = null;

let sender_obj = null,
  receiver_obj = null,
  roomLocation = null;

const setSocketConnection = (psid, email) => {
  const newSocket = io("http://localhost:9000", {
    query: {
      SID: email,
    },
  });

  newSocket.on("connect", () => {
    newSocket.emit("socket-exist", psid);
    newSocket.on("on-socket-exist", (socketId) => {
      newSocket.id = socketId;
    });

    // Receiving call request
    newSocket.on("receive-call", (callObj) => {
      sender_obj = callObj.sender;
      receiver_obj = callObj.receiver;
      roomLocation = callObj.roomLink;

        if (!onVideoCall) {
            $("#receive__callingModal").addClass("show__receiveCallingModal");
        
        } else {
            newSocket.emit("already-on-call", callObj);
        }

    //   $("#caller__tune")[0].muted = false;
    //   $("#caller__tune")[0].play();
    });
  });

  return () => newSocket.close();
};

if (p && e) {
  setSocketConnection(p, e);
}

// Answer call button
const answerCall = () => {
    const newSocket = io("http://localhost:9000", {
        query: {
            SID: e
        }
    });

    // $("#caller__tune")[0].muted = true;
    // $("#caller__tune")[0].pause();
    // $("#caller__tune")[0].currentTime = 0;

    newSocket.on("connect", () => {
        newSocket.emit("socket-exist", p);
        newSocket.on("on-socket-exist", socketId => {
            newSocket.id = socketId;
        });

        newSocket.emit("call-received", {
            sender: sender_obj,
            receiver: receiver_obj,
            roomLink: roomLocation
        });

        // If receiver is not the chat room, then navigate to the chatroom
        newSocket.on("receive-call-obj", callObj => {
            onVideoCall = true;

            if (callObj.receiver.id === receiver_obj.id) {
                if (roomLocation !== window.location.href) {    // If the receiver is not in the chatroom
                    localStorage.setItem("onCall", true);
                    localStorage.setItem("caller_sender_id", callObj.sender.id);
                    localStorage.setItem("caller_receiver_id", callObj.receiver.id);
                    window.location.href = roomLocation;    // Navigate to the caller chatroom
                } else {    // If the receiver is in the chatroom
                    // Hide the receiver side call modal after call is being answered
                    $("#receive__callingModal").removeClass("show__receiveCallingModal");
                    
                    // Connecting call on receiver side
                    if (onVideoCall) {
                        let room = callObj.roomLink.split("/");
                        room = room[room.length - 2];

                        const senderPeerId = `${room}-${callObj.sender.id}`;
                        const receiverPeerId = `${room}-${callObj.receiver.id}`;

                        // If there is any peer connection from the past, disconnect that
                        if (peer) {
                            peer.disconnect();
                        }

                        peer = new Peer(receiverPeerId);
                        const myVideo = document.getElementById("sender__video");
                        const otherUserVideo = document.getElementById("receiver__video");
                        
                        peer.on("open", id => {
                            $("#video__callModal").addClass("show__videoCallModal");

                            myVideo.muted = true;

                            navigator.mediaDevices.getUserMedia({
                                video: {
                                    facingMode: "user"
                                },
                                audio: true
                            }).then(stream => {
                                senderVideoStream = stream;
                                addVideoStream(myVideo, stream);

                                peer.on("call", call => {
                                    call.answer(stream);

                                    call.on("stream", userVideoStream => {
                                        receiverVideoStream = userVideoStream;
                                        addVideoStream(otherUserVideo, userVideoStream);
                                    });
                                });

                                connectToNewUser(senderPeerId, stream);
                            }).catch(err => console.error(err));
                        });

                        function addVideoStream(video, stream) {
                            video.srcObject = stream;

                            video.addEventListener('loadedmetadata', () => {
                                video.play();
                            });
                        }

                        function connectToNewUser(userId, stream) {
                            const call = peer.call(userId, stream);

                            call.on('stream', userVideoStream => {
                                if (!receiverVideoStream) {
                                    receiverVideoStream = userVideoStream;
                                }
                                addVideoStream(otherUserVideo, userVideoStream);
                            });
                            
                            call.on('close', () => {
                                video.remove();
                            });
                        
                            // peers[userId] = call
                        }
                    }
                }
            }
        });
    });

  return () => newSocket.close();
};

// Reject call button
const rejectCall = () => {
    const newSocket = io("http://localhost:9000", {
        query: {
            SID: e
        }
    });

    // $("#caller__tune")[0].muted = true;
    // $("#caller__tune")[0].pause();
    // $("#caller__tune")[0].currentTime = 0;

    newSocket.on("connect", () => {
        newSocket.emit("socket-exist", p);
        newSocket.on("on-socket-exist", socketId => {
            newSocket.id = socketId;
        });

        newSocket.emit("call-rejected", {
            sender: sender_obj,
            receiver: receiver_obj
        });

        onVideoCall = false;

        // Hide the receiver side call modal after call is being rejected
        $("#receive__callingModal").removeClass("show__receiveCallingModal");
    });

    return () => newSocket.close();
};
