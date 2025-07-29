
const socket = io();
function toggleChat() {
  document.getElementById('chatBox').classList.toggle('active');
}
function send() {
  const msg = document.getElementById("msg").value;
  if (msg.trim() === "") return;
  socket.emit("user_message", msg);
  document.getElementById("msg").value = "";
}
function quickSend(text) {
  socket.emit("user_message", text);
}
socket.on("chat_message", (msg) => {
  const div = document.getElementById("chat");
  const time = new Date(msg.time).toLocaleTimeString();
  const geo = msg.geo ? `[${msg.geo.city}, ${msg.geo.country}]` : "";
  div.innerHTML += `<p><b>${msg.sender}</b> ${geo} (${time}): ${msg.message}</p>`;
  div.scrollTop = div.scrollHeight;
});
