$(document).ready(() => {
  let showEmoji = false;

  // If emoji picker button is clicked, show the emojis
  $("#emoji__picker").click(() => {
    const emojis = $("#emojis");
    showEmoji = !showEmoji;

    if (showEmoji) {
      emojis.css("opacity", 1);
      emojis.css("z-index", 10);
      emojis.disMojiPicker();
      twemoji.parse(document.body);

      // Adding emoji in the message textarea field
      emojis.picker((emoji) => {
        const messageTextArea = $("#chat__messageField");
        let textVal = messageTextArea.val();
        textVal += emoji;
        messageTextArea.val(textVal);
      });
    } else {
      emojis.css("opacity", 0);
      emojis.css("z-index", 0);
      emojis.find(".emoji-picker").remove();
    }
  });

  // If click outside of emoji
  document.addEventListener("click", (event) => {
    if (
      !event.target.closest("#emojis") &&
      !event.target.closest("#emoji__picker")
    ) {
      const emojis = $("#emojis");
      showEmoji = false;

      emojis.css("opacity", 0);
      emojis.css("z-index", 0);
      emojis.find(".emoji-picker").remove();
    }
  });

  // Get csrf token cookie value
  const getCookie = (name) => {
    var cookieValue = null;
    if (document.cookie && document.cookie != "") {
      var cookies = document.cookie.split(";");
      for (var i = 0; i < cookies.length; i++) {
        var cookie = cookies[i].trim();
        // Does this cookie string begin with the name we want?
        if (cookie.substring(0, name.length + 1) == name + "=") {
          cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
          break;
        }
      }
    }
    return cookieValue;
  };

  // Appending new message
  const appendMessage = (senderUsername, firstLetter, secondLetter, data) => {
    const chatRightMiddle = document.querySelector(".chat__rightMiddleChat");
      
      const div = document.createElement("div");
      div.setAttribute("class", "flex justify-end");

      const div2 = document.createElement("div");
      div2.setAttribute("class", "flex gap-x-1 w-1/2");

      const avatarDiv = document.createElement("div");
      avatarDiv.innerHTML = `
        <div data-avatar="${senderUsername}" class="avatarBlock round avatar-${firstLetter} avatar-A">
          <span style="display:block" class="text-avatar">${secondLetter !== null ? `${firstLetter}${secondLetter}` : firstLetter}</span>
        </div>
      `;

      const messageDiv = document.createElement("div");
      messageDiv.setAttribute("class", "flex flex-col gap-y-1.5");
      messageDiv.innerHTML = `
        <p class="font-semibold right__middleUsername">${senderUsername}</p>
        <p class="text-400">${data.message}</p>
        <p class="text-500 text-xs">${data.created_at}</p>
      `

      div2.appendChild(avatarDiv);
      div2.appendChild(messageDiv);

      div.appendChild(div2);

      chatRightMiddle.appendChild(div);

      $(".chat__rightMiddleChat").animate({
        scrollTop: $(".chat__rightMiddleChat")[0].scrollHeight,
      });
  }

  // Create a new message
  const createMessage = (email, psid, data) => {
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

      newSocket.emit("create-message", data);

      const sender = JSON.parse(data.sender);

      const senderUsername = sender.username;
      let firstLetter = null, secondLetter = null;

      // For the avatar
      if (senderUsername.split(" ").length > 1) {
        firstLetter = senderUsername.split(" ")[0][0].toUpperCase();
        secondLetter = senderUsername.split(" ")[1][0].toUpperCase();
      } else {
        firstLetter = senderUsername[0].toUpperCase();
      }

      appendMessage(senderUsername, firstLetter, secondLetter, data);
    });

    return () => newSocket.close();
  }

  const resetLocalStorageEmailVal = (email) => {
    localStorage.removeItem("email");
    localStorage.setItem("email", email);
  }

  // Sending text message
  const sendMessage = async (message) => {
    const CSRFTOKEN = getCookie("csrftoken");
    // Current URL
    let currentPath = window.location.href.split("/");
    currentPath = currentPath[currentPath.length - 2];

    await fetch(`/create-message/${currentPath}/`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-CSRFToken": CSRFTOKEN, // Pass csrf token value
      },
      body: JSON.stringify({
        sender: email,
        message: message,
      }),
    })
      .then((res) => {
        if (res.ok) {
          return res.json();
        } else {
          alert("Invalid request! Please try again...");
        }
      }).then(data => {
        // If user try to mess with localstorage value
        if (data.email_change) {
          alert("You should not change your local storage value!");
          resetLocalStorageEmailVal(data.email);
        } else if (data.email_delete) {
          alert("You should not delete your local storage value!");
          resetLocalStorageEmailVal(data.email);
        } else if (data.invalid_request) {
          alert("Invalid request! Please try again...");
        } else if (data && psid && email) {
          createMessage(email, psid, data);
        }
      })
      .catch((err) => console.error(err));

    document.getElementById("chat__messageField").rows = 1;
    $("#chat__messageField").val("");
  };

  // For message textarea
  // If shift + enter button is pressed, increase textarea rows number
  // If only enter button is presseed, submit the form
  const messageTextArea = $("#chat__messageField");

  messageTextArea.keyup((event) => {
    // Getting message textarea row value
    const messageRows = document.getElementById("chat__messageField").rows;

    if (messageTextArea.val() === "") {
      document.getElementById("chat__messageField").rows = 1;
    }

    // If shift + enter key is pressed, than increase row number of textarea
    // until the textrea has less than 4 lines
    if (event.keyCode === 13 && event.shiftKey) {
      if (messageRows > 4) return;
      document.getElementById("chat__messageField").rows = messageRows + 1;
    } else if (event.keyCode === 13) {
      if (messageTextArea.val().trim() === "") {
        messageTextArea.val("");
        return;
      }
      // Sending message
      sendMessage(messageTextArea.val());
    }
  });

  // Voice modal
  const recorder = new MicRecorder({
    bitRate: 128
  });
  let permissionAccepted = false;

  let closeRecording = false;

  const createVoiceMessage = (data, psid, email, audioFile) => {
    const newSocket = io("http://localhost:9000", {
      query: {
        SID: email,
      },
    });

    newSocket.on("connect", () => {
      newSocket.emit("socket-exist", psid);
      newSocket.on("on-socket-exist", socketId => {
        newSocket.id = socketId;
      });

      console.log(audioFile)

      const voiceMessage = {
        id: data.id,
        room: data.room,
        sender: JSON.parse(data.sender),
        receiver: JSON.parse(data.receiver),
        created_at: data.created_at,
        audio: audioFile,
        mimeType: audioFile.type,
        fileName: audioFile.name,
      }
      newSocket.emit("create-voice-message", voiceMessage);
    })
  }

  // Sending voice message
  const sendVoiceMessage = async(audioFile) => {
    let formData = new FormData();
    formData.append("sender", email);
    formData.append("audio", audioFile);
    // formData.append("csrfmiddlewaretoken", CSRFTOKEN);

    const CSRFTOKEN = getCookie("csrftoken");
    // Current URL
    let currentPath = window.location.href.split("/");
    currentPath = currentPath[currentPath.length - 2];

    await fetch(`/create-file-message/${currentPath}/`, {
      method: "POST",
      headers: {
        // Don't put content type while submitting file
        "X-CSRFToken": CSRFTOKEN
      },
      body: formData
    })
    .then(res => {
      if (res.ok) {
        return res.json()
      } else {
        alert("Invalid request! Please try again...");
      }
    })
    .then(data => {
      // If user try to mess with localstorage value
      if (data.email_change) {
        alert("You should not change your local storage value!");
        resetLocalStorageEmailVal(data.email);
      } else if (data.email_delete) {
        alert("You should not delete your local storage value!");
        resetLocalStorageEmailVal(data.email);
      } else if (data.invalid_request) {
        alert("Invalid request! Please try again...");
      } else if (data && psid && email) {
        if (data.audio) {
          createVoiceMessage(data, psid, email, audioFile);
        }
      }
    })
    .catch(err => console.error(err));
  }

  // On record start
  $("#voice__modal").click(() => {
    $("#chat__rightVoiceModal").addClass("show__voiceModal");

    // Start recording. Browser will request permission to use your microphone.
    recorder.start().then(() => {
      // something else
      permissionAccepted = true;
    }).catch((e) => {
      permissionAccepted = false;
      console.error(e);
    });
    
    // Auto stop recording after 20 seconds
    setTimeout(() => {
      if (closeRecording === false) {
        $("#chat__rightVoiceModal").removeClass("show__voiceModal");
        closeVoiceRecording(recorder);
      }
    }, 20000);
  });

  const closeVoiceRecording = (recorder) => {
    // Once you are done singing your best song, stop and get the mp3.
    closeRecording = true;

    recorder
    .stop()
    .getMp3().then(([buffer, blob]) => {
      // do what ever you want with buffer and blob
      // Example: Create a mp3 file and play
      const file = new File(buffer, 'my-audio.mp3', {
        type: blob.type,
        lastModified: Date.now()
      });

      // const player = new Audio(URL.createObjectURL(file));
      // player.play();
      if (permissionAccepted) {
        sendVoiceMessage(file);
      }

      // Reset closeRecording value
      setTimeout(() => {
        closeRecording = false;
      }, 20000);
    }).catch((e) => {
      alert('We could not retrieve your message');
      console.log(e);
    });
  }

  // On record end
  $("#close__voiceModal").click(() => {
    $("#chat__rightVoiceModal").removeClass("show__voiceModal");

    closeVoiceRecording(recorder);
  });
});