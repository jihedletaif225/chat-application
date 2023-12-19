const path = require("path");
const express = require("express");
const http = require("http");
const socketio = require("socket.io");
const { disconnect } = require("process");

const formatMessage = require("./utils/messages");

const {
  getCurrentUser,
  userJoin,
  userLeave,
  getRoomUsers,
} = require("./utils/users");

const app = express();
const server = http.createServer(app);
const io = socketio(server);

// set static folder
app.use(express.static(path.join(__dirname, "public")));

const botName = "Welcome to chatCord";

// Run when client connects
io.on("connection", (socket) => {
  socket.on("joinRoom", ({ username, room }) => {
    const user = userJoin(socket.id, username, room);

    socket.join(user.room);
    // welcome current user
    socket.emit("message", formatMessage(botName, "Welcome to chatCord"));

    // broadcast when user join chat
    socket.broadcast
      .to(user.room)
      .emit(
        "message",
        formatMessage(botName, `${user.username} has joined the chat`)
      );

    // send room and user info

    io.to(user.room).emit("roomUsers", {
      room: user.room,
      users: getRoomUsers(user.room),
    });
  });

  // listen for Chatmessage

  socket.on("chatMessage", (msg) => {
    console.log(msg);

    const user = getCurrentUser(socket.id);
    io.to(user.room).emit("message", formatMessage(user.username, msg));
  });

  // Run when client disconnect

  socket.on("disconnect", () => {
    const user = userLeave(socket.id);
    if (user) {
      io.to(user.room).emit(
        "message",
        formatMessage(botName, `${user.username} has left the chat`)
      );
    }

    // send room and user info

    io.to(user.room).emit("roomUsers", {
      room: user.room,
      users: getRoomUsers(user.room),
    });
  });
});

PORT = 3000 || process.env.Port;

server.listen(PORT, () => {
  console.log(`server  running on port ${PORT} `);
});
