const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const { MongoClient } = require("mongodb");
const ipinfo = require("ipinfo");
const path = require("path");
const nodemailer = require("nodemailer");
const session = require("express-session");
require("dotenv").config();

const app = express();
const server = http.createServer(app);
const io = new Server(server);

// MongoDB connection
const client = new MongoClient(process.env.MONGO_URI);
let messages;

// Sessions
app.use(session({
  secret: "trucktaxsecret",
  resave: false,
  saveUninitialized: true
}));

// Static files
app.use(express.static("public"));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.post("/login", (req, res) => {
  const { email, password } = req.body;
  if (email === "support@trucktaxonline.com" && password === "admin123") {
    req.session.isAdmin = true;
    req.session.username = "admin";
    res.sendStatus(200);
  } else {
    res.status(401).send("Unauthorized");
  }
});

app.get("/logout", (req, res) => {
  req.session.destroy();
  res.redirect("/");
});

io.on("connection", (socket) => {
  const ip = socket.handshake.headers["x-forwarded-for"]?.split(",")[0] || socket.handshake.address;

  socket.on("user_message", async (msg) => {
    ipinfo(ip, async (err, cLoc) => {
      const location = cLoc?.region || "Unknown";
      const country = cLoc?.country || "Unknown";
      const sender = socket.request.session?.isAdmin ? "admin" : "user";

      const fullMsg = {
        sender,
        message: msg,
        location,
        country,
        timestamp: new Date()
      };

      await messages.insertOne(fullMsg);
      io.emit("chat_message", fullMsg);

      // 📩 Email fallback if admin offline
      const clients = Array.from(io.sockets.sockets.values());
      const adminOnline = clients.some((s) => s.request?.session?.isAdmin);
      if (!adminOnline && sender === "user") {
        sendOfflineEmail(fullMsg);
      }
    });
  });
});

// 📩 Nodemailer offline fallback
function sendOfflineEmail(msg) {
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    }
  });

  const content = `
    New message from user:
    Message: ${msg.message}
    Location: ${msg.location}, ${msg.country}
    Time: ${msg.timestamp}
  `;

  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: "support@trucktaxonline.com",
    subject: "New chat message (offline fallback)",
    text: content
  };

  transporter.sendMail(mailOptions, (error, info) => {
    if (error) console.error("Email error:", error);
    else console.log("Fallback email sent:", info.response);
  });
}

// Start app
async function start() {
  await client.connect();
  messages = client.db("trucktax_chat").collection("messages");

  server.listen(process.env.PORT || 3000, () => {
    console.log("🚀 Trucktaxonline Chat running on port 3000");
  });
}

start();
