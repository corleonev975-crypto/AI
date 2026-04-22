const input = document.getElementById("chatInput");
const sendBtn = document.getElementById("sendBtn");

sendBtn.onclick = sendMessage;

input.addEventListener("keydown", (e) => {
  if (e.key === "Enter") sendMessage();
});

async function sendMessage() {
  const message = input.value.trim();
  if (!message) return;

  // tampilkan pesan user
  addMessage(message, "user");

  input.value = "";

  // loading AI
  const loading = addMessage("Xinn AI sedang mengetik...", "ai");

  try {
    const res = await fetch("/api/chat", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ message })
    });

    const data = await res.json();

    typeText(loading, data.reply);

  } catch (err) {
    loading.innerText = "Error koneksi...";
  }
}

function addMessage(text, role) {
  let chat = document.getElementById("chatBox");

  if (!chat) {
    chat = document.createElement("div");
    chat.id = "chatBox";
    chat.style.marginTop = "20px";
    chat.style.display = "flex";
    chat.style.flexDirection = "column";
    chat.style.gap = "10px";
    document.querySelector(".hero").appendChild(chat);
  }

  const msg = document.createElement("div");
  msg.innerText = text;

  msg.style.padding = "10px 14px";
  msg.style.borderRadius = "16px";
  msg.style.maxWidth = "80%";

  if (role === "user") {
    msg.style.background = "#7c3aed";
    msg.style.marginLeft = "auto";
    msg.style.color = "white";
  } else {
    msg.style.background = "#111";
    msg.style.color = "#ddd";
  }

  chat.appendChild(msg);
  chat.scrollTop = chat.scrollHeight;

  return msg;
}

function typeText(el, text) {
  el.innerText = "";
  let i = 0;

  function typing() {
    if (i < text.length) {
      el.innerText += text[i];
      i++;
      setTimeout(typing, 15);
    }
  }

  typing();
    }
