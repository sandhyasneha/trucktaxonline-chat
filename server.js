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
  const { usern
