const callButton = document.getElementById("call__button");

// Make call request
const makeCall = (psid, sender, receiver) => {
    const newSocket = io("http://localhost:9000", {
        query: {
            SID: sender.email
        }
    });

    newSocket.on("connect", () => {
        newSocket.emit("socket-exist", psid);
        newSocket.on("on-socket-exist", socketId => {
            newSocket.id = socketId;
        });

        // Sending call request to receiver
        newSocket.emit("create-call", {
            sender: sender,
            receiver: receiver,
            roomLink: window.location.href,
        });

        // If receiver is already on another call
        newSocket.on("receiver-already-on-call", callObj => {
            $("#calling__modal").removeClass("show__callingModal");
            $("#calling__modal").addClass("show__callingModal");
            $("#sender__callingText").addClass("hidden");
            $("#sender__callingFailedText").removeClass("hidden");
            setTimeout(() => {
                $("#calling__modal").removeClass("show__callingModal");
                $("#sender__callingText").removeClass("hidden");
                $("#sender__callingFailedText").addClass("hidden");
            }, 2000);
        })
    });

    // If receiver answered the call
    newSocket.on("receiver-accept-call", callObj => {
        $("#calling__modal").removeClass("show__callingModal");

        onVideoCall = true;
        
        // Connecting call on sender side
        if (onVideoCall) {
            let room = callObj.roomLink.split("/");
            room = room[room.length - 2];
            const senderPeerId = `${room}-${callObj.sender.id}`;
            const receiverPeerId = `${room}-${callObj.receiver.id}`;

            // If there is any peer connection from the past, disconnect that
            if (peer) {
                peer.disconnect();
            }

            peer = new Peer(senderPeerId);
            const myVideo = document.getElementById("sender__video");
            const otherUserVideo = document.getElementById("receiver__video");
            
            peer.on("open", id => {
                $("#video__callModal").addClass("show__videoCallModal");

                myVideo.muted = true;

                navigator.mediaDevices.getUserMedia({
                    video: {
                        facingMode: "user"
                    },
                    audio: true,
                }).then(stream => {
                    senderVideoStream = stream;
                    addVideoStream(myVideo, stream);

                    peer.on("call", call => {
                        call.answer(stream);

                        call.on("stream", userVideoStream => {
                            if (!receiverVideoStream) {
                                receiverVideoStream = userVideoStream;
                            }
                            addVideoStream(otherUserVideo, userVideoStream);
                        });
                    });

                    connectToNewUser(receiverPeerId, stream);
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
    });

    // If receiver rejected the call
    newSocket.on("receiver-rejected-call", callObj => {
        $("#calling__modal").removeClass("show__callingModal");

        onVideoCall = false;
    })

    return () => newSocket.close();
}

// Getting caller sender and receiver object
callButton.addEventListener("click", async() => {
    $("#calling__modal").addClass("show__callingModal");
    let receiverVal = $("#calling__value").val();
    receiverVal = Number(receiverVal);
    
    if (!Number.isNaN(receiverVal)) {
        await fetch(`/check-receiver/${receiverVal}/`)
        .then(res => {
            if (res.ok) {
                return res.json();
            } else {
                alert("Invalid request! Please try again...");
            }
        }).then(data => {
            if (data) {
                if (data.invalid_request) {
                    alert("Invalid request! Please try again...");
                } else if (psid && data.sender && data.receiver) {
                    makeCall(psid, data.sender, data.receiver);
                } else {
                    alert("Invalid request! Please try again...");
                    window.location.reload();
                }
            }
        })
    } else {
        alert("Invalid request!!!");
        window.location.reload();
    }
})