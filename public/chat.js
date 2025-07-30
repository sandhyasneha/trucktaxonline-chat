const socket = io();
const messagesDiv = document.getElementById("messages");
const messageInput = document.getElementById("messageInput");
const sendBtn = document.getElementById("sendBtn");
const fileInput = document.getElementById("fileInput");
const emojiBtn = document.getElementById("emojiBtn");
const emojiPicker = document.getElementById("emojiPicker");
const downloadBtn = document.getElementById("downloadBtn");

let chatHistory = [];

emojiBtn.addEventListener("click", () => {
  emojiPicker.style.display = emojiPicker.style.display === "none" ? "block" : "none";
});

emojiPicker.addEventListener("emoji-click", (e) => {
  messageInput.value += e.detail.unicode;
  emojiPicker.style.display = "none";
});

sendBtn.addEventListener("click", () => {
  const msg = messageInput.value.trim();
  const file = fileInput.files[0];

  if (!msg && !file) return;

  if (msg) {
    socket.emit("user_message", msg);
    addMessage("You", msg);
  }

  if (file) {
    const reader = new FileReader();
    reader.onload = function () {
      const link = `<a href="${reader.result}" download="${file.name}">📎 ${file.name}</a>`;
      socket.emit("user_message", `[File] ${file.name}`);
      addMessage("You", link);
    };
    reader.readAsDataURL(file);
    fileInput.value = "";
  }

  messageInput.value = "";
});

socket.on("chat_message", (msg) => {
  const who = msg.sender === "admin" ? "Admin" : "User";
  const text = msg.message;
  addMessage(who, text);
});

function addMessage(sender, message) {
  const div = document.createElement("div");
  div.className = "message";
  div.innerHTML = `<strong>${sender}:</strong> ${message}`;
  messagesDiv.appendChild(div);
  chatHistory.push(`${sender}: ${message}`);
  messagesDiv.scrollTop = messagesDiv.scrollHeight;
}

downloadBtn.addEventListener("click", () => {
  const blob = new Blob([chatHistory.join("\n")], { type: "text/plain" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "chat-transcript.txt";
  a.click();
});
