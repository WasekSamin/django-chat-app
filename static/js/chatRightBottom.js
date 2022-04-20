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
      div2.setAttribute("class", "flex gap-x-1 w-[75%] sm:w-1/2 chat__rightMiddleDivWidth");

      const avatarDiv = document.createElement("div");
      avatarDiv.innerHTML = `
        <div data-avatar="${senderUsername}" class="avatarBlock round avatar-${firstLetter} avatar-A">
          <span style="display:block" class="text-avatar">${secondLetter !== null ? `${firstLetter}${secondLetter}` : firstLetter}</span>
        </div>
      `;

      const messageDiv = document.createElement("div");
      messageDiv.setAttribute("class", "flex flex-col gap-y-1.5");

      if (data.type === "text") { // For sending text messages
        messageDiv.innerHTML = `
          <p class="font-semibold right__middleUsername">${senderUsername}</p>
          <p class="text-400">${data.message}</p>
          <p class="text-500 text-xs">${data.created_at}</p>
        `
      } else if (data.type === "audio") { // For sending audio messages
        messageDiv.innerHTML = `
        <p class="font-semibold right__middleUsername">${senderUsername}</p>
        <div class="h-[40px] chat__audioDiv">
          <audio class="h-[40px] shadow" preload="auto" controls>
              <source src="${URL.createObjectURL(data.audio)}" type="audio/mpeg" />
              Your browser does not support the audio format!
          </audio>
        </div>
        <p class="text-500 text-xs">${data.created_at}</p>
        `
      } else if (data.type === "files") { // For sending file messages
        // Username section
        const userNamePara = document.createElement("p");
        userNamePara.setAttribute("class", "font-semibold right__middleUsername");
        userNamePara.innerText = senderUsername;

        // Files section
        const fileMainDiv = document.createElement("div");
        fileMainDiv.setAttribute("class", "mb-1 last:mb-0");

        data.files.map((file, i) => {
          // For image files
          if (data.file_extensions[i] === "png" || 
            data.file_extensions[i] === "jpg" || 
            data.file_extensions[i] === "jpeg" || 
            data.file_extensions[i] === "gif") {
              const imageDiv = document.createElement("img");
              imageDiv.setAttribute("onclick", "showChatImageModal(this)")
              imageDiv.setAttribute("class", `w-full h-48 object-cover cursor-pointer ${i !== data.files.length - 1 ? "mb-2" : "mb-0"}`);
              imageDiv.setAttribute("src", URL.createObjectURL(file));
              
              fileMainDiv.appendChild(imageDiv);
          } else {  // For other files except images
            const downloadedFile = document.createElement("a");
            downloadedFile.setAttribute("class", `flex items-center gap-x-1 text-sky-500 i ${i !== data.files.length - 1 ? "mb-2" : "mb-0"}`);
            downloadedFile.setAttribute("href", URL.createObjectURL(file));
            downloadedFile.setAttribute("download", data.file_names[i]);

            const downloadIcon = document.createElement("span");
            downloadIcon.setAttribute("class", "iconify download__icon");
            downloadIcon.setAttribute("data-icon", "eva:download-fill");

            const fileInfo = document.createElement("p");
            fileInfo.setAttribute("class", "chat__file");
            fileInfo.innerText = data.file_names[i];

            downloadedFile.appendChild(downloadIcon);
            downloadedFile.appendChild(fileInfo);

            fileMainDiv.appendChild(downloadedFile);
          }
        })

        // Datetime section
        const messageCreatedAtPara = document.createElement("p");
        messageCreatedAtPara.setAttribute("class", "text-500 text-xs");
        messageCreatedAtPara.innerText = data.created_at;

        messageDiv.appendChild(userNamePara);
        messageDiv.appendChild(fileMainDiv);
        messageDiv.appendChild(messageCreatedAtPara);
      }

      div2.appendChild(avatarDiv);
      div2.appendChild(messageDiv);

      div.appendChild(div2);

      chatRightMiddle.appendChild(div);

      $(".chat__rightMiddleChat").animate({
        scrollTop: $(".chat__rightMiddleChat")[0].scrollHeight,
      });
  }

  // Create a new message
  const createMessage = (email, psid, data, message) => {
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

      const chatObj = {
        id: data.id,
        sender: JSON.parse(data.sender),
        receiver: JSON.parse(data.receiver),
        room: data.room,
        created_at: data.created_at
      }

      if (data.message) { // For text message
        chatObj["message"] = message;
        chatObj["type"] = "text";
        newSocket.emit("create-message", chatObj);
      } else if (data.audio) {  // For audio message
        chatObj["audio"] = message;
        chatObj["type"] = "audio";
        newSocket.emit("create-message", chatObj);
      } else if (data.files) {
        chatObj["files"] = message;
        chatObj["type"] = "files";

        // Getting all the uploaded file name and extensions
        let fileExtensionArr = [];
        let fileNameArr = [];
        message.map(file => {
          fileNameArr.push(file.name);

          let fileExtension = file.name.split(".");
          fileExtension = fileExtension[fileExtension.length - 1];
          fileExtensionArr.push(fileExtension);
        })
        chatObj["file_names"] = fileNameArr;
        chatObj["file_extensions"] = fileExtensionArr;
        newSocket.emit("create-message", chatObj);
      }

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
    });

    return () => newSocket.close();
  }

  const resetLocalStorageEmailVal = (email) => {
    localStorage.removeItem("email");
    localStorage.setItem("email", email);
  }

  // Sending text message
  const sendMessage = async (info) => {
    // console.log(info);
    const CSRFTOKEN = getCookie("csrftoken");
    // Current URL
    let currentPath = window.location.href.split("/");
    currentPath = currentPath[currentPath.length - 2];

    let formData = new FormData();
    formData.append("sender", email);
    if (info.type === "text") {
      formData.append("message", info.message);
    } else if (info.type === "audio") {
      formData.append("audio", info.audio);
    } else if (info.type === "files") {
      info.files.map(file => {
        formData.append("files", file);
      });
    }

    await fetch(`/create-message/${currentPath}/`, {
      method: "POST",
      headers: {
        // "Content-Type": "application/json",
        "X-CSRFToken": CSRFTOKEN, // Pass csrf token value
      },
      body: formData
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
          if (data.message) { // If type is text message
            createMessage(email, psid, data, info.message);
          } else if (data.audio) {  // If type is audio message
            createMessage(email, psid, data, info.audio)
          } else if (data.files) {
            createMessage(email, psid, data, info.files);
          }
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
      sendMessage({message: messageTextArea.val(), type: "text"});
    }
  });

  // Voice modal
  const recorder = new MicRecorder({
    bitRate: 128
  });
  let permissionAccepted = false;

  let closeRecording = false;

  // On record start
  $("#voice__modal").click(() => {
    $("#chat__rightVoiceModal").addClass("show__voiceModal");

    // Start recording. Browser will request permission to use your microphone.
    recorder.start().then(() => {
      // something else
      permissionAccepted = true;
      closeRecording = false;
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
        sendMessage({audio: file, type: "audio"});
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

  // For sending files
  const fileInput = document.getElementById("chat__inputFile");
  fileInput.onchange = (e) => {
    if (e.target.files.length > 0) {
      const files = [...e.target.files];
      sendMessage({files: files, type: "files"});
    }
  }
});