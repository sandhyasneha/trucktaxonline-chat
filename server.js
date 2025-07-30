require("dotenv").config();
const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");
const nodemailer = require("nodemailer");
const axios = require("axios");
const session = require("express-session");
const bodyParser = require("body-parser");
const { MongoClient } = require("mongodb");

const app = express();
const server = http.createServer(app);
const io = new Server(server);
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.static("public"));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(session({
  secret: "trucktaxonline-secret",
  resave: false,
  saveUninitialized: true
}));

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

async function getGeoInfo(ip) {
  try {
    console.log("Fetching geo info for IP:", ip);
    const { data } = await axios.get(`https://ipapi.co/${ip}/json/`);
    return {
      ip,
      city: data.city || "N/A",
      country: data.country_name || "N/A",
      source: data.org || "N/A",
    };
  } catch (e) {
    console.error("Geo lookup failed for IP:", ip);
    return { ip, city: "N/A", country: "N/A", source: "N/A" };
  }
}

let isAdminOnline = false;

app.post("/login", (req, res) => {
  const { username, password } = req.body;
  if (username === "admin" && password === "admin123") {
    req.session.authenticated = true;
    isAdminOnline = true;
    return res.redirect("/admin/admin.html");
  }
  res.send("Invalid credentials. <a href='/admin/login.html'>Try again</a>");
});

app.get("/logout", (req, res) => {
  req.session.destroy();
  isAdminOnline = false;
  res.redirect("/admin/login.html");
});

io.on("connection", (socket) => {
  let rawIP = socket.handshake.headers["x-forwarded-for"] || socket.conn.remoteAddress;
  const ip = rawIP?.split(",")[0]?.replace("::ffff:", "") || "0.0.0.0";

  getGeoInfo(ip).then((geo) => {
    socket.geo = geo;
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

    if (!isAdminOnline) {
      sendEmailFallback(fullMsg);
    }
  });

  socket.on("admin_message", async (msg) => {
    const fullMsg = {
      sender: "admin",
      message: msg,
      time: new Date(),
      geo: null,
    };

    await messages.insertOne(fullMsg);
    io.emit("chat_message", fullMsg);
  });

  socket.on("disconnect", () => {
    isAdminOnline = false;
  });
});

async function sendEmailFallback(msg) {
  let transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL_FROM,
      pass: process.env.EMAIL_PASS
    }
  });

  const body = `
    <h3>New Chat Message (Admin Offline)</h3>
    <p><strong>Message:</strong> ${msg.message}</p>
    <p><strong>Location:</strong> ${msg.geo?.city}, ${msg.geo?.country}</p>
    <p><strong>IP:</strong> ${msg.geo?.ip}</p>
    <p><strong>Time:</strong> ${msg.time}</p>
  `;

  await transporter.sendMail({
    from: process.env.EMAIL_FROM,
    to: process.env.EMAIL_TO || "support@trucktaxonline.com",
    subject: "Trucktaxonline - New Chat Message",
    html: body
  });
}

app.get("/history", async (req, res) => {
  if (!messages) return res.status(500).json({ error: "DB not ready" });
  const chat = await messages.find().sort({ time: 1 }).toArray();
  res.json(chat);
});

server.listen(PORT, () => {
  console.log(`🚀 Trucktaxonline Chat running on ${PORT}`);
});
