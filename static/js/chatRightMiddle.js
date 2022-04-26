$(document).ready(() => {
  // Chat scroll to bottom
  $(".chat__rightMiddleChat").animate({
    scrollTop: $(".chat__rightMiddleChat")[0].scrollHeight,
  });
});

let scrollTrigger = false;
let userScrollTrigger = true;

// Scroll trigger for chat -> If user scroll to top, then show a down scroll button
$(".chat__rightMiddleChat").scroll((e) => {
  let chatHeight = $(".chat__rightMiddleChat")[0].scrollHeight;
  let chatScrollTop = $(".chat__rightMiddleChat")[0].scrollTop;
  let chatInnerHeight = $(".chat__rightMiddleChat").innerHeight();

  if (chatHeight >= chatScrollTop + chatInnerHeight + 100 && scrollTrigger) {
    $("#chat__scrollToBottomDiv").css({"opacity": 1, "bottom": "5rem"});
    userScrollTrigger = false;
  } else if (chatHeight === chatScrollTop + chatInnerHeight) {
    scrollTrigger = true;
    userScrollTrigger = true;
  } else {
    userScrollTrigger = true;
    $("#chat__scrollToBottomDiv").css({"opacity": 0, "bottom": "-100%"});
  }
});

$("#chat__scrollToBottomDiv").click(() => {
  $(".chat__rightMiddleChat").animate({
    scrollTop: $(".chat__rightMiddleChat")[0].scrollHeight,
  });
});

let videoModeOn = true, audioModeOn = true;

const preloadImage = (img) => {
  const src = img.getAttribute("data-src");

  if (!src) return;
  img.src = src;
}

const imageObserver = new IntersectionObserver((entries, imageObserver) => {
  entries.forEach(entry => {
    if (!entry.isIntersecting) return;
    
    preloadImage(entry.target);
    imageObserver.unobserve(entry.target);
  })
}, {
  threshold: 0.1
});

// Lazy load image
const lazyLoadImages = () => {
  const images = document.querySelectorAll(".chat__imageFile");

  images.forEach(img => {
    imageObserver.observe(img);
  });
}

lazyLoadImages();

// Appending new message
const appendMessage = (senderUsername, firstLetter, secondLetter, chatObj) => {
  // console.log(chatObj);
  const chatRightMiddle = document.querySelector(".chat__rightMiddleChat");
      
  const div = document.createElement("div");
  div.setAttribute("class", "flex justify-start");

  const div2 = document.createElement("div");
  div2.setAttribute("class", "flex gap-x-1 w-[75%] sm:w-1/2 chat__rightMiddleDivWidth");

  const avatarDiv = document.createElement("div");
  avatarDiv.innerHTML = `
    <div data-avatar="${senderUsername}" class="avatarBlock round avatar-${firstLetter} avatar-A">
      <span style="display:block" class="text-avatar">${secondLetter !== null ? `${firstLetter}${secondLetter}` : firstLetter}</span>
    </div>
  `;

  const messageDiv = document.createElement("div");
  messageDiv.setAttribute("class", "flex flex-col gap-y-1.5");

  if (chatObj.type === "text") {  // For receiving text message
    messageDiv.innerHTML = `
      <p class="font-semibold right__middleUsername">${senderUsername}</p>
      <p class="text-400 flex flex-wrap items-center gap-1 chat__messagePara">${chatObj.message}</p>
      <p class="text-500 text-xs">${chatObj.created_at}</p>
    `
  } else if (chatObj.type === "audio") {  // For receiving audio message
    // Converting audio array buffer to blob object
    const audio = new Blob([chatObj.audio], { "type": "audio/mpeg" });

    messageDiv.innerHTML = `
      <p class="font-semibold right__middleUsername">${senderUsername}</p>
      <div class="h-[40px] chat__audioDiv">
        <audio class="h-[40px] shadow" preload="auto" controls>
            <source class="chat__audioFile" src="${URL.createObjectURL(audio)}" type="audio/mpeg" />
            Your browser does not support the audio format!
        </audio>
      </div>
      <p class="text-500 text-xs">${chatObj.created_at}</p>
    `
  } else if (chatObj.type === "files") {
    // console.log(chatObj);

    fetch(`/file-request/${chatObj.id}/`)
    .then(res => {
      if (res.ok) {
        return res.json();
      } else {
        alert("Invalid request! Please try again...");
      }
    }).then(data => {
      if (data) {
        const {sender, receiver, created_at} = data;
        const files = JSON.parse(data.files);

        // Username section
        const userNamePara = document.createElement("p");
        userNamePara.setAttribute("class", "font-semibold right__middleUsername");
        userNamePara.innerText = senderUsername;

        // Files section
        const fileMainDiv = document.createElement("div");
        fileMainDiv.setAttribute("class", "mb-1 last:mb-0");

        files.map((file, i) => {
          let file_extension = file.file.split(".");
          file_extension = file_extension[file_extension.length - 1];

          // If the file is image
          if (file_extension === "jpg" || 
            file_extension === "jpeg" ||
            file_extension === "png" || 
            file_extension === "gif"
          ) {
            const imageDiv = document.createElement("img");
            imageDiv.setAttribute("onclick", "showChatImageModal(this)");
            imageDiv.setAttribute("class", `w-full h-48 object-cover cursor-pointer ${i !== files.length - 1 ? "mb-2" : "mb-0"} chat__imageFile`);
            imageDiv.setAttribute("src", `/media/${file.file}`);

            fileMainDiv.appendChild(imageDiv);
          } else {  // If the file is not image
            const fileName = file.file.split("file/")[1];

            const downloadedFile = document.createElement("a");
            downloadedFile.setAttribute("class", `flex items-center gap-x-1 text-sky-500 i ${i !== files.length - 1 ? "mb-2" : "mb-0"}`);
            downloadedFile.setAttribute("href", `/media/${file.file}`);
            downloadedFile.setAttribute("download", fileName);

            const downloadIcon = document.createElement("span");
            downloadIcon.setAttribute("class", "iconify download__icon");
            downloadIcon.setAttribute("data-icon", "eva:download-fill");

            const fileInfo = document.createElement("p");
            fileInfo.setAttribute("class", "break-all chat__file");
            fileInfo.innerText = fileName;

            downloadedFile.appendChild(downloadIcon);
            downloadedFile.appendChild(fileInfo);

            fileMainDiv.appendChild(downloadedFile);
          }
        });

        // Datetime section
        const messageCreatedAtPara = document.createElement("p");
        messageCreatedAtPara.setAttribute("class", "text-500 text-xs");
        messageCreatedAtPara.innerText = chatObj.created_at;

        messageDiv.appendChild(userNamePara);
        messageDiv.appendChild(fileMainDiv);
        messageDiv.appendChild(messageCreatedAtPara);
      }
    });
  }

  div2.appendChild(avatarDiv);
  div2.appendChild(messageDiv);

  div.appendChild(div2);

  chatRightMiddle.appendChild(div);

  if (userScrollTrigger) {
    $(".chat__rightMiddleChat").animate({
      scrollTop: $(".chat__rightMiddleChat")[0].scrollHeight,
    });
  }
}

const toggleVideoCam = (stream, videoMode) => {
  let videoTrack = stream.getTracks().find(track => track.kind === "video");
  videoTrack.enabled = JSON.parse(videoMode);
}

const toggAudioCam = (stream, audioMode) => {
  let audioTrack = stream.getTracks().find(track => track.kind === "audio");
  audioTrack.enabled = JSON.parse(audioMode);
}

// Receiver message via socket
const receiveMessage = (email, psid) => {
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

    // Receiving message
    newSocket.on("receive-message", (chatObj) => {
      let room = window.location.href.split("/");
      room = room[room.length - 2];

      if (room === chatObj.room) {
        const sender = chatObj.sender;

        const senderUsername = sender.username;
        let firstLetter = null, secondLetter = null;

        // For the avatar
        if (senderUsername.split(" ").length > 1) {
          firstLetter = senderUsername.split(" ")[0][0].toUpperCase();
          secondLetter = senderUsername.split(" ")[1][0].toUpperCase();
        } else {
          firstLetter = senderUsername[0].toUpperCase();
        }

        appendMessage(senderUsername, firstLetter, secondLetter, chatObj);
      }
    });

    // Leave call on the receiver side
    newSocket.on("leave-call-on-receiver-side", callObj => {
      peer.disconnect();
      window.location.reload();
    });

    // Video on/off at receiver side
    newSocket.on("video-mode-on-receiver-side", callObj => {
      toggleVideoCam(receiverVideoStream, callObj.videoMode);
    });

    // Audio on/off at receiver side
    newSocket.on("audio-mode-on-receiver-side", callObj => {
      toggAudioCam(receiverVideoStream, callObj.audioMode);
    });
  });

  return () => newSocket.close();
};

if (email && psid) {
  receiveMessage(email, psid);
}

const showChatImageModal = (img) => {
  $("#chat__imageModal").addClass("show__chatImageModal");
  if (img.src) {
    $(".chat__selectedImg").attr("src", img.src);
    $("#chat__scrollToBottomDiv").css({"opacity": 0, "bottom": "-100%"});
  }
}

$("#close__chatImageModal").click(() => {
  $("#chat__imageModal").removeClass("show__chatImageModal");
  $(".chat__selectedImg").attr("src", "");
});

// After receiver received the call and navigated to the chatroom
// Connecting call on the receiver side
const onCall = localStorage.getItem("onCall");
const sender_id = localStorage.getItem("caller_sender_id");
const receiver_id = localStorage.getItem("caller_receiver_id");

if (onCall && sender_id && receiver_id) {
  onVideoCall = true;

  // Hide the receiver side call modal after call is being answered
  $("#receive__callingModal").removeClass("show__receiveCallingModal");

  // Connecting call on receiver side
  if (onVideoCall) {
      let room = window.location.href.split("/");
      room = room[room.length - 2];

      const senderPeerId = `${room}-${sender_id}`;
      const receiverPeerId = `${room}-${receiver_id}`;

      // If there is any peer connection from the past, disconnect that
      if (peer) {
        peer.disconnect();
      }

      peer = new Peer(receiverPeerId);
      const myVideo = document.getElementById("sender__video");
      const otherUserVideo = document.getElementById("receiver__video");

      peer.on("open", id => {
          // Clearing localstorage value so that the video does not open on every page reload
          localStorage.removeItem("onCall");
          localStorage.removeItem("caller_sender_id");
          localStorage.removeItem("caller_receiver_id");

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
                      if (!receiverVideoStream) {
                        receiverVideoStream = userVideoStream;
                      }
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

// Fetching user1 and user2 object of chatroom to leave the call
const fetchCallOptionUsersInfo = async(room, socket, info) => {
  const CSRFTOKEN = getCookie("csrftoken");

  let formData = new FormData();
  if (info.type === "leaveCall") {
    formData.append("leaveCall", info.leaveCall);
  } else if (info.type === "audioMode") {
    formData.append("audioModeOn", info.audioModeOn);
  } else if (info.type === "videoMode") {
    formData.append("videoModeOn", info.videoModeOn);
  }

  await fetch(`/call-options/${room}/`, {
    method: "POST",
    headers: {
      "X-CSRFToken": CSRFTOKEN
    },
    body: formData
  })
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
      } else if (data.call_option_type === "leave") { // Leave call on both side
        socket.emit("leave-call", {
          sender: data.sender,
          receiver: data.receiver
        });

        socket.on("leave-call-on-sender-side", callObj => {
          // Leave call on the sender side
          if (callObj.sender.id === data.sender.id) {
            peer.disconnect();
            window.location.reload();
          }
        });
      } else if (data.call_option_type === "audio") { // Audio on/off option on both side
        socket.emit("audio-mode-option", {
          sender: data.sender,
          receiver: data.receiver,
          audioMode: data.audio_mode
        });

        // Audio on/off at sender side
        socket.on("audio-mode-on-sender-side", callObj => {
          if (callObj.sender.id === data.sender.id) {
            toggAudioCam(senderVideoStream, data.audio_mode);
            if (JSON.parse(data.audio_mode)) {
              $("#audio__optionBtn").css("background-color", "rgb(51 65 85)");
              $("#audio__optionIcon").attr("data-icon", "ant-design:audio-outlined");
            } else {
              $("#audio__optionBtn").css("background-color", "rgb(244 63 94)");
              $("#audio__optionIcon").attr("data-icon", "ant-design:audio-muted-outlined");
            }
          }
        });
      } else if (data.call_option_type === "video") { // Video on/off option on both side
        socket.emit("video-mode-option", {
          sender: data.sender,
          receiver: data.receiver,
          videoMode: data.video_mode
        });

        // Video on/off at sender side
        socket.on("video-mode-on-sender-side", callObj => {
          if (callObj.sender.id === data.sender.id) {
            toggleVideoCam(senderVideoStream, data.video_mode);
            if (JSON.parse(data.video_mode)) {
              $("#video__optionBtn").css("background-color", "rgb(51 65 85)");
              $("#video__optionIcon").attr("data-icon", "bi:camera-video");
            } else {
              $("#video__optionBtn").css("background-color", "rgb(244 63 94)");
              $("#video__optionIcon").attr("data-icon", "bi:camera-video-off");
            }
          }
        });
      }
    } else {
      alert("Invalid request! Please try again...");
    }
  }).catch(err => console.error(err));
}

$("#leave__callBtn").click(() => {
  if (psid && email) {
    const newSocket = io("http://localhost:9000", {
      query: {
        SID: email
      }
    });

    newSocket.on("connect", () => {
      newSocket.emit("socket-exist", psid);
      newSocket.on("on-socket-exist", socketId => {
        newSocket.id = socketId;
      });

      let room = window.location.href.split("/");
      room = room[room.length - 2];

      fetchCallOptionUsersInfo(room, newSocket, {leaveCall: true, "type": "leaveCall"});
    });

    return () => newSocket.close();
  }
});

// Video mode option click
$("#video__optionBtn").click(() => {
  if (psid && email) {
    const newSocket = io("http://localhost:9000", {
      query: {
        SID: email
      }
    });

    videoModeOn = !videoModeOn;

    newSocket.on("connect", () => {
      newSocket.emit("socket-exist", psid);
      newSocket.on("on-socket-exist", socketId => {
        newSocket.id = socketId;
      });

      let room = window.location.href.split("/");
      room = room[room.length - 2];

      fetchCallOptionUsersInfo(room, newSocket, {videoModeOn: videoModeOn, type: "videoMode"});
    });

    return () => newSocket.close();
  }
});

// Audio mode option click
$("#audio__optionBtn").click(() => {
  if (psid && email) {
    const newSocket = io("http://localhost:9000", {
      query: {
        SID: email
      }
    });

    audioModeOn = !audioModeOn;

    newSocket.on("connect", () => {
      newSocket.emit("socket-exist", psid);
      newSocket.on("on-socket-exist", socketId => {
        newSocket.id = socketId;
      });

      let room = window.location.href.split("/");
      room = room[room.length - 2];

      fetchCallOptionUsersInfo(room, newSocket, {audioModeOn: audioModeOn, type: "audioMode"});
    });

    return () => newSocket.close();
  }
});