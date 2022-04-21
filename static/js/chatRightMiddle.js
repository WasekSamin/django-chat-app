$(document).ready(() => {
  // Chat scroll to bottom
  $(".chat__rightMiddleChat").animate({
    scrollTop: $(".chat__rightMiddleChat")[0].scrollHeight,
  });
});


// Appending new message
const appendMessage = (senderUsername, firstLetter, secondLetter, chatObj) => {
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
      <p class="text-400">${chatObj.message}</p>
      <p class="text-500 text-xs">${chatObj.created_at}</p>
    `
  } else if (chatObj.type === "audio") {  // For receiving audio message
    // Converting audio array buffer to blob object
    const audio = new Blob([chatObj.audio], { "type": "audio/mpeg" });

    messageDiv.innerHTML = `
      <p class="font-semibold right__middleUsername">${senderUsername}</p>
      <div class="h-[40px] chat__audioDiv">
        <audio class="h-[40px] shadow" preload="auto" controls>
            <source src="${URL.createObjectURL(audio)}" type="audio/mpeg" />
            Your browser does not support the audio format!
        </audio>
      </div>
      <p class="text-500 text-xs">${chatObj.created_at}</p>
    `
  } else if (chatObj.type === "files") {
    // console.log(chatObj);

    fetch(`/file-request/${chatObj.id}/`)
    .then(res => {
      console.log(res);
      if (res.ok) {
        return res.json();
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
            imageDiv.setAttribute("class", `w-full h-48 object-cover cursor-pointer ${i !== files.length - 1 ? "mb-2" : "mb-0"}`);
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

  $(".chat__rightMiddleChat").animate({
    scrollTop: $(".chat__rightMiddleChat")[0].scrollHeight,
  });
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
  }
}

$("#close__chatImageModal").click(() => {
  $("#chat__imageModal").removeClass("show__chatImageModal");
  $(".chat__selectedImg").attr("src", "");
})