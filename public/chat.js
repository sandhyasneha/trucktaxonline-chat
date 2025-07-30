const socket = io();
const messagesDiv = document.getElementById("messages");
const sendBtn = document.getElementById("sendBtn");
const msgInput = document.getElementById("messageInput");
const emojiBtn = document.getElementById("emojiBtn");
const emojiPicker = document.getElementById("emojiPicker");
const fileInput = document.getElementById("fileInput");
const downloadBtn = document.getElementById("downloadBtn");
const chatBubble = document.getElementById("chatBubble");
const chatWidget = document.getElementById("chatWidget");
const closeBtn = document.getElementById("closeBtn");

let chatHistory = [];

// 💬 Send message
sendBtn.addEventListener("click", () => {
  const msg = msgInput.value.trim();
  if (!msg) return;
  socket.emit("user_message", msg);
  msgInput.value = "";
});

// 📥 Receive message
socket.on("chat_message", (data) => {
  const loc = data.location ? `[${data.location}, ${data.country}]` : "[Unknown]";
  const time = formatTime(data.timestamp);
  const html = `<p><strong>${data.sender}</strong> ${loc} (${time}): ${data.message}</p>`;
  messagesDiv.innerHTML += html;
  chatHistory.push(html);
});

// 😊 Emoji Picker
emojiBtn.addEventListener("click", () => {
  emojiPicker.style.display = emojiPicker.style.display === "none" ? "block" : "none";
});
emojiPicker.addEventListener("emoji-click", (event) => {
  msgInput.value += event.detail.unicode;
  emojiPicker.style.display = "none";
});

// 📎 File Upload
fileInput.addEventListener("change", () => {
  const file = fileInput.files[0];
  if (!file) return;
  const fileLink = `<a href="#" onclick="alert('File attachments are simulated.')">📎 ${file.name}</a>`;
  socket.emit("user_message", fileLink);
});

// 💾 Download Chat
downloadBtn.addEventListener("click", () => {
  const blob = new Blob([chatHistory.join("\n")], { type: "text/plain" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = "chat-history.txt";
  link.click();
});

// 🕓 Format time
function formatTime(dateStr) {
  const date = new Date(dateStr);
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

// 💬 Bubble Toggle Logic
chatBubble.addEventListener("click", () => {
  chatWidget.classList.remove("hidden");
  chatBubble.style.display = "none";
});

closeBtn.addEventListener("click", () => {
  chatWidget.classList.add("hidden");
  chatBubble.style.display = "block";
});
