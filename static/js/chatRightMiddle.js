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
    <p class="text-400">${chatObj.message}</p>
    <p class="text-500 text-xs">${chatObj.created_at}</p>
  `

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
