
const socket = io();
const chat = document.getElementById("chat");
const audio = document.getElementById("notifySound");

function send() {
  const msg = document.getElementById("msg").value;
  if (msg.trim() === "") return;
  socket.emit("admin_message", msg);
  document.getElementById("msg").value = "";
}

socket.on("chat_message", (msg) => {
  const time = new Date(msg.time).toLocaleTimeString();
  const geo = msg.geo ? `[${msg.geo.city}, ${msg.geo.country}]` : "";
  chat.innerHTML += `<p><b>${msg.sender}</b> ${geo} (${time}): ${msg.message}</p>`;
  chat.scrollTop = chat.scrollHeight;

  if (msg.sender === "user") {
    audio.play();
  }
});
