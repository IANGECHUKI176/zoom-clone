"use strict";
const express = require("express");
const app = express();
const { v4: uuidv4 } = require("uuid");
const server = require("http").Server(app);
const io = require("socket.io")(server);
const { ExpressPeerServer } = require("peer");
const peerServer = ExpressPeerServer(server, {
  debug: true,
});

app.use("/peerjs", peerServer);
app.use(express.static("public"));
app.set("view engine", "ejs");
app.get("/", (req, res) => {
  res.redirect(`/${uuidv4()}`);
});
app.get("/:room", (req, res) => {
  res.render("room", { roomId: req.params.room });
});

io.on("connection", (socket) => {
  socket.on("join-room", (roomId, userId) => {
    socket.join(roomId);
    socket.broadcast.to(roomId).emit("user-connected", userId);
    socket.on("disconnect", () => {
      socket.broadcast.emit("user-disconnected", userId);
    });
  });
  socket.on("message", (message, roomId) => {
    io.to(roomId).emit("createMessage", message);
  });
   
});
const PORT = 3000;
server.listen(PORT, () => console.log(`server listening on port:${PORT}`));
