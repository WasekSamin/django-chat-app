const io = require("socket.io")(9000, {
  cors: {
    origin: "*",
  },
});

io.on("connection", (socket) => {
  const userEmail = socket.handshake.query.SID;
  // console.log(userEmail);

  // Join user to socket
  socket.join(userEmail);

  // On first connection
  socket.emit("on-connect", socket.id);

  // If socket connection already exists
  socket.on("socket-exist", (socketId) => {
    if (socketId) {
      // console.log(socketId);
      socket.emit("on-socket-exist", socketId);
    }
  });

  // Adding user + Make user register
  socket.on("add-user", (accountObj) => {
    // console.log(accountObj);
    if (accountObj) {
      socket.broadcast.emit("add-to-all-users", accountObj);
      socket.emit("register-success", accountObj);
    }
  });

  // Make user login + login success
  socket.on("user-login", (accountObj) => {
    // console.log(accountObj);
    if (accountObj) {
      socket.broadcast.emit("make-user-login", accountObj);
      socket.emit("login-success", accountObj);
    }
  });

  // Create and receive a new text message
  socket.on("create-message", (chatObj) => {
    // console.log(chatObj);

    if (chatObj) {
      const room = chatObj.receiver.email;
      socket.to(room).emit("receive-message", chatObj);
    }
  });

  // Create and receiver call
  socket.on("create-call", (callObj) => {
    // console.log("CREATING CALL:", callObj);
    if (callObj) {
      const room = callObj.receiver.email;
      socket.to(room).emit("receive-call", callObj);
    }
  });

  // After the call is received by receiver
  socket.on("call-received", (callObj) => {
    // console.log(callObj);

    if (callObj) {
      const room = callObj.sender.email;
      socket.to(room).emit("receiver-accept-call", callObj);
      socket.emit("receive-call-obj", callObj);
    }
  });

  // Call rejecting
  socket.on("call-rejected", (callObj) => {
    if (callObj) {
      const room = callObj.sender.email;
      socket.to(room).emit("receiver-rejected-call", callObj);
    }
  });

  // If receiver already on a call
  socket.on("already-on-call", callObj => {
    // console.log("ALREADY ON CALL:", callObj);
    if (callObj) {
      const room = callObj.sender.email;
      socket.to(room).emit("receiver-already-on-call", callObj);
    }
  })

  // Leave call on both sender and receiver side
  socket.on("leave-call", (callObj) => {
    // console.log(callObj);
    if (callObj) {
      const room = callObj.receiver.email;
      // Receiver side
      socket.to(room).emit("leave-call-on-receiver-side", callObj);
      // Sender side
      socket.emit("leave-call-on-sender-side", callObj);
    }
  });

  // Video on/off on both sender and receiver side
  socket.on("video-mode-option", callObj => {
    // console.log(callObj);
    if(callObj) {
      const room = callObj.receiver.email;
      // Receiver side
      socket.to(room).emit("video-mode-on-receiver-side", callObj);
      socket.emit("video-mode-on-sender-side", callObj);
    }
  });

  // Audio on/off on both sender and receiver side
  socket.on("audio-mode-option", callObj => {
    // console.log(callObj);
    if(callObj) {
      const room = callObj.receiver.email;
      // Receiver side
      socket.to(room).emit("audio-mode-on-receiver-side", callObj);
      socket.emit("audio-mode-on-sender-side", callObj);
    }
  });

  socket.on("user-logout", accountInfo => {
    // console.log(accountInfo);
    if (accountInfo) {
      socket.broadcast.emit("receive-user-logout", accountInfo);
    }
  })
});
