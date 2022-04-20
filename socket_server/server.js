const io = require("socket.io")(9000, {
  cors: {
    origin: "*",
  },
});

io.on("connection", (socket) => {
  const userEmail = socket.handshake.query.SID;
  console.log(userEmail);

  // Join user to socket
  socket.join(userEmail);

  // On first connection
  socket.emit("on-connect", socket.id);

  // If socket connection already exists
  socket.on("socket-exist", (socketId) => {
    if (socketId) {
      console.log(socketId);
      socket.emit("on-socket-exist", socketId);
    }
  });

  // Adding user + Make user register
  socket.on("add-user", (accountObj) => {
    console.log(accountObj);
    if (accountObj) {
      socket.broadcast.emit("add-to-all-users", accountObj);
      socket.emit("register-success", accountObj);
    }
  });

  // Make user login + login success
  socket.on("user-login", (accountObj) => {
    console.log(accountObj);
    if (accountObj) {
      socket.broadcast.emit("make-user-login", accountObj);
      socket.emit("login-success", accountObj);
    }
  });

  // Create and receive a new text message
  socket.on("create-message", (chatObj) => {
    console.log(chatObj);

    if (chatObj) {
      const room = chatObj.receiver.email;
      socket.to(room).emit("receive-message", chatObj);
    }
  });

  // Create and receive a new voice message
  socket.on("create-voice-message", chatObj => {
    console.log(chatObj);
  })
});
