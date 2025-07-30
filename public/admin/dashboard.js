async function fetchHistory() {
  const res = await fetch("/history");
  const data = await res.json();
  window.chatData = data;
  renderTable(data);
}

function renderTable(data) {
  const tbody = document.querySelector("#chatTable tbody");
  tbody.innerHTML = "";
  data.forEach(msg => {
    const row = document.createElement("tr");
    row.innerHTML = `
      <td>${new Date(msg.time).toLocaleString()}</td>
      <td>${msg.sender}</td>
      <td>${msg.message}</td>
      <td>${msg.geo?.ip || "N/A"}</td>
      <td>${msg.geo?.city || "N/A"}, ${msg.geo?.country || "N/A"}</td>
    `;
    tbody.appendChild(row);
  });
}

document.getElementById("search").addEventListener("input", function () {
  const keyword = this.value.toLowerCase();
  const filtered = window.chatData.filter(msg =>
    msg.message.toLowerCase().includes(keyword) ||
    (msg.geo?.ip || "").toLowerCase().includes(keyword) ||
    (msg.geo?.country || "").toLowerCase().includes(keyword)
  );
  renderTable(filtered);
});

function exportCSV() {
  const rows = [["Time", "Sender", "Message", "IP", "Location"]];
  window.chatData.forEach(msg => {
    rows.push([
      new Date(msg.time).toLocaleString(),
      msg.sender,
      msg.message,
      msg.geo?.ip || "N/A",
      `${msg.geo?.city || "N/A"}, ${msg.geo?.country || "N/A"}`
    ]);
  });
  const csv = rows.map(r => r.map(field => `"${(field || "").replace(/"/g, '""')}"`).join(",")).join("\n");
  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "chat-history.csv";
  a.click();
}

fetchHistory();
