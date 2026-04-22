const input = document.getElementById("chatInput");
const sendBtn = document.getElementById("sendBtn");

sendBtn.onclick = sendMessage;

input.addEventListener("keydown", (e) => {
  if (e.key === "Enter") sendMessage();
});

async function sendMessage() {
  const message = input.value.trim();
  if (!message) return;

  addMessage(message, "user");
  input.value = "";

  const loading = addMessage("...", "ai");

  try {
    const res = await fetch("/api/chat", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ message })
    });

    const data = await res.json();

    loading.innerText = data.reply;

  } catch (err) {
    loading.innerText = "Error...";
  }
}

function addMessage(text, role) {
  let container = document.getElementById("chatBox");

  if (!container) {
    container = document.createElement("div");
    container.id = "chatBox";
    container.style.padding = "10px";
    container.style.marginTop = "20px";
    document.querySelector(".hero").appendChild(container);
  }

  const msg = document.createElement("div");
  msg.innerText = text;

  msg.style.margin = "10px 0";
  msg.style.padding = "10px 14px";
  msg.style.borderRadius = "16px";
  msg.style.maxWidth = "80%";
  msg.style.fontSize = "14px";

  if (role === "user") {
    msg.style.background = "#7c3aed";
    msg.style.color = "white";
    msg.style.marginLeft = "auto";
  } else {
    msg.style.background = "#1a1a2e";
    msg.style.color = "#ddd";
  }

  container.appendChild(msg);
  return msg;
}
