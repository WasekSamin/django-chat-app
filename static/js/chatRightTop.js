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
    });

    // If receiver answered the call
    newSocket.on("receiver-accept-call", callObj => {
        console.log(callObj);
        $("#calling__modal").removeClass("show__callingModal");

        onVideoCall = true;

        if (onVideoCall) {
            let room = callObj.roomLink.split("/");
            room = room[room.length - 2];
            const senderPeerId = `${room}-${callObj.sender.id}`;
            const receiverPeerId = `${room}-${callObj.receiver.id}`;
            console.log(senderPeerId, receiverPeerId);

            const peer = new Peer(senderPeerId);
            const myVideo = document.getElementById("sender__video");
            const otherUserVideo = document.getElementById("receiver__video");

            peer.on("open", id => {
                console.log(peer);
                console.log(id);

                $("#video__callModal").addClass("show__videoCallModal");

                myVideo.muted = true;

                navigator.mediaDevices.getUserMedia({
                    video: true,
                    audio: true,
                }).then(stream => {
                    addVideoStream(otherUserVideo, stream);

                    peer.on("call", call => {
                        call.answer(stream);

                        call.on("stream", userVideoStream => {
                            addVideoStream(myVideo, userVideoStream);
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

        console.log(onVideoCall);
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