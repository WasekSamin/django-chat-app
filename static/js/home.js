const psid = localStorage.getItem("PSID");
const email = localStorage.getItem("email");

const makeSocketConnection = (email, psid) => {
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

    // If a new user register, add the new user
    newSocket.on("add-to-all-users", accountObj => {
      const username = accountObj.username;
      let firstLetter = null, secondLetter = null;

      // For the avatar
      if (username.split(" ").length > 1) {
        firstLetter = username.split(" ")[0][0].toUpperCase();
        secondLetter = username.split(" ")[1][0].toUpperCase();
      } else {
        firstLetter = username[0].toUpperCase();
      }

      const chatLeftBottomAllPersons = document.querySelector(".chat__leftBottom");

      const a = document.createElement("a");
      a.setAttribute("href", `/chat/${accountObj.id}/`);
      a.setAttribute("class", "flex items-center justify-between last:pb-7 chat__people");

      const userInfoMainDiv = document.createElement("div");
      userInfoMainDiv.setAttribute("class", "flex items-center gap-x-1");

      const userAvatarDiv = document.createElement("div");
      userAvatarDiv.innerHTML = `
          <div data-avatar="${accountObj.username}" class="avatarBlock round avatar-${firstLetter.toLowerCase()} avatar-A" title="${accountObj.username}">
              <span style="display:block" class="text-avatar">${secondLetter !== null ? `${firstLetter}${secondLetter}` : firstLetter}</span>
          </div>
      `;

      const userInfoDiv = document.createElement("div");
      userInfoDiv.setAttribute("class", "flex flex-col gap-y-1");
      userInfoDiv.innerHTML = `
          <p class="font-semibold chat__username">
              ${accountObj.username}
          </p>
          <div class="flex items-center gap-x-1">
              <p class="text-xs text-slate-400">Status: </p>
              <div id="account-status-${accountObj.id}" class="w-[0.5rem] h-[0.5rem] rounded-full ${accountObj.is_online ? "bg-green-500" : "bg-rose-500"}"></div>
          </div>
      `;

      userInfoMainDiv.appendChild(userAvatarDiv);
      userInfoMainDiv.appendChild(userInfoDiv);

      a.appendChild(userInfoMainDiv);

      chatLeftBottomAllPersons.appendChild(a);
    });

    // If a user logged in, change its online status
    newSocket.on("make-user-login", (accountObj) => {
      const accountStatus = document.getElementById(`account-status-${accountObj.id}`);
      accountStatus.classList.remove("bg-rose-500");
      accountStatus.classList.add("bg-green-500");
    });

    // Receiving message
    newSocket.on("receive-message", (chatObj) => {
      console.log(chatObj);
    });
  });

  return () => newSocket.close();
};

if (email && psid) {
  makeSocketConnection(email, psid);
}