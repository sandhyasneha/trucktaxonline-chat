const socket = io();
const messagesDiv = document.getElementById("messages");
const sendBtn = document.getElementById("sendBtn");
const msgInput = document.getElementById("messageInput");
const emojiBtn = document.getElementById("emojiBtn");
const emojiPicker = document.getElementById("emojiPicker");
const fileInput = document.getElementById("fileInput");
const downloadBtn = document.getElementById("downloadBtn");

let chatHistory = [];

sendBtn.addEventListener("click", () => {
  const msg = msgInput.value.trim();
  if (!msg) return;
  socket.emit("user_message", msg);
  msgInput.value = "";
});

socket.on("chat_message", (data) => {
  const loc = data.location ? `[${data.location}, ${data.country}]` : "[Unknown]";
  const time = formatTime(data.timestamp);
  const html = `<p><strong>${data.sender}</strong> ${loc} (${time}): ${data.message}</p>`;
  messagesDiv.innerHTML += html;
  chatHistory.push(html);
});

emojiBtn.addEventListener("click", () => {
  emojiPicker.style.display = emojiPicker.style.display === "none" ? "block" : "none";
});

emojiPicker.addEventListener("emoji-click", (event) => {
  msgInput.value += event.detail.unicode;
  emojiPicker.style.display = "none";
});

fileInput.addEventListener("change", () => {
  const file = fileInput.files[0];
  if (!file) return;
  const fileLink = `<a href="#" onclick="alert('File attachments are simulated.')">📎 ${file.name}</a>`;
  socket.emit("user_message", fileLink);
});

downloadBtn.addEventListener("click", () => {
  const blob = new Blob([chatHistory.join("\n")], { type: "text/plain" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = "chat-history.txt";
  link.click();
});

function formatTime(dateStr) {
  const date = new Date(dateStr);
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

// Floating Widget Toggle
document.addEventListener("DOMContentLoaded", () => {
  const chatBubble = document.getElementById("chatBubble");
  const chatWidget = document.getElementById("chatWidget");
  const closeBtn = document.getElementById("closeBtn");

  chatBubble.addEventListener("click", () => {
    chatWidget.classList.remove("hidden");
    chatBubble.style.display = "none";
  });

  closeBtn.addEventListener("click", () => {
    chatWidget.classList.add("hidden");
    chatBubble.style.display = "block";
  });
});
