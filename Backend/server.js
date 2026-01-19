const express = require("express");
const mongoose = require("mongoose");
const http = require("http");
const cors = require("cors");
const { Server } = require("socket.io");
const Player = require("./models/player");

const app = express();
const server = http.createServer(app);

app.use(cors());
app.use(express.json());

// ✅ MongoDB Connection (FIXED)
mongoose
  .connect("mongodb://localhost:27017/score")
  .then(() => console.log("✅ MongoDB connected"))
  .catch((err) => {
    console.error("❌ MongoDB connection error:", err.message);
  });

// Socket.IO
const io = new Server(server, {
  cors: { origin: "*" },
});

io.on("connection", async (socket) => {
  console.log("⚡ New client connected");

  // Send players
  const players = await Player.find().sort({ score: -1 });
  socket.emit("players", players);

  socket.on("addPlayer", async (name) => {
    if (!name) return;
    await Player.create({ name });
    io.emit("players", await Player.find().sort({ score: -1 }));
  });

  socket.on("updateScore", async ({ id, delta }) => {
    await Player.findByIdAndUpdate(id, { $inc: { score: delta } });
    io.emit("players", await Player.find().sort({ score: -1 }));
  });

  socket.on("deletePlayer", async (id) => {
    await Player.findByIdAndDelete(id);
    io.emit("players", await Player.find().sort({ score: -1 }));
  });

  socket.on("resetAll", async () => {
    await Player.updateMany({}, { score: 0 });
    io.emit("players", await Player.find().sort({ score: -1 }));
  });

  socket.on("disconnect", () => {
    console.log("❌ Client disconnected");
  });
});

server.listen(5000, () => {
  console.log("🔥 ScoreSphere Backend running on port 5000");
});
