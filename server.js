require("dotenv").config();
const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const axios = require("axios");
const cors = require("cors");
const { MongoClient } = require("mongodb");

const app = express();
const server = http.createServer(app);
const io = new Server(server);
const PORT = process.env.PORT || 3000;

// Serve frontend files
app.use(cors());
app.use(express.static("public"));

// MongoDB setup
const mongoUri = process.env.MONGO_URI || "mongodb://localhost:27017";
const client = new MongoClient(mongoUri);
let messages;

(async () => {
  try {
    await client.connect();
    const db = client.db("trucktax_chat");
    messages = db.collection("messages");
    console.log("✅ Connected to MongoDB");
  } catch (err) {
    console.error("❌ MongoDB connection failed:", err);
  }
})();

// IP Location helper
async function getGeoInfo(ip) {
  try {
    const { data } = await axios.get(`https://ipapi.co/${ip}/json/`);
    return {
      ip,
      city: data.city,
      country: data.country_name,
      source: data.org || "Unknown",
    };
  } catch (e) {
    return { ip, city: "Unknown", country: "Unknown", source: "Unknown" };
  }
}

// WebSocket events
io.on("connection", (socket) => {
  let rawIP = socket.handshake.headers["x-forwarded-for"] || socket.conn.remoteAddress;
  const ip = rawIP?.split(",")[0]?.replace("::ffff:", "") || "0.0.0.0";

  getGeoInfo(ip).then((geo) => {
    socket.geo = geo;
  });

  ...
});

  socket.on("user_message", async (msg) => {
    if (!messages) return console.error("MongoDB not initialized");
    const fullMsg = {
      sender: "user",
      message: msg,
      time: new Date(),
      geo: socket.geo,
    };
    await messages.insertOne(fullMsg);
    io.emit("chat_message", fullMsg);
  });

  socket.on("admin_message", async (msg) => {
    if (!messages) return console.error("MongoDB not initialized");
    const fullMsg = {
      sender: "admin",
      message: msg,
      time: new Date(),
      geo: null,
    };
    await messages.insertOne(fullMsg);
    io.emit("chat_message", fullMsg);
  });
});

// View full chat history (optional)
app.get("/history", async (req, res) => {
  if (!messages) return res.status(500).json({ error: "DB not ready" });
  const chat = await messages.find().sort({ time: 1 }).toArray();
  res.json(chat);
});

server.listen(PORT, () => {
  console.log(`🚀 Trucktaxonline Chat running on ${PORT}`);
});
