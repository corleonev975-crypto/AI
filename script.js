const input = document.getElementById("chatInput");
const sendBtn = document.getElementById("sendBtn");

if (sendBtn && input) {
  sendBtn.addEventListener("click", sendMessage);

  input.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      sendMessage();
    }
  });
}

async function sendMessage() {
  const message = input.value.trim();
  if (!message) return;

  addMessage(message, "user");
  input.value = "";

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

    if (data.reply) {
      typeText(loading, data.reply);
    } else {
      loading.innerText = "Balasan AI tidak ditemukan.";
    }
  } catch (error) {
    loading.innerText = "Gagal terhubung ke server.";
    console.error(error);
  }
}

function addMessage(text, role) {
  let container = document.getElementById("chatBox");

  if (!container) {
    container = document.createElement("div");
    container.id = "chatBox";
    container.style.display = "flex";
    container.style.flexDirection = "column";
    container.style.gap = "10px";
    container.style.marginTop = "20px";
    container.style.padding = "10px";
    document.querySelector(".hero").appendChild(container);
  }

  const msg = document.createElement("div");
  msg.innerText = text;
  msg.style.padding = "12px 14px";
  msg.style.borderRadius = "16px";
  msg.style.maxWidth = "80%";
  msg.style.fontSize = "14px";
  msg.style.lineHeight = "1.5";

  if (role === "user") {
    msg.style.background = "#7c3aed";
    msg.style.color = "white";
    msg.style.marginLeft = "auto";
  } else {
    msg.style.background = "#141424";
    msg.style.color = "#ddd";
    msg.style.border = "1px solid rgba(168, 85, 247, 0.2)";
  }

  container.appendChild(msg);
  container.scrollTop = container.scrollHeight;
  return msg;
}

function typeText(element, text) {
  element.innerText = "";
  let i = 0;

  function typing() {
    if (i < text.length) {
      element.innerText += text.charAt(i);
      i++;
      setTimeout(typing, 15);
    }
  }

  typing();
}
