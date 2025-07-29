const socket = io();
function send() {
  const msg = document.getElementById("msg").value;
  socket.emit("user_message", msg);
  document.getElementById("msg").value = "";
}
socket.on("chat_message", (msg) => {
  const div = document.getElementById("chat");
  const time = new Date(msg.time).toLocaleTimeString();
  const geo = msg.geo ? `[${msg.geo.city}, ${msg.geo.country}]` : "";
  div.innerHTML += `<p><b>${msg.sender}</b> ${geo} (${time}): ${msg.message}</p>`;
});
