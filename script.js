const STORAGE_KEY = "xinn_ai_chats_v1";

const sidebar = document.getElementById("sidebar");
const openSidebar = document.getElementById("openSidebar");
const closeSidebar = document.getElementById("closeSidebar");
const overlay = document.getElementById("overlay");

const plusBtn = document.getElementById("plusBtn");
const plusPopup = document.getElementById("plusPopup");

const serverStatusBtn = document.getElementById("serverStatusBtn");
const statusDropdown = document.getElementById("statusDropdown");
const statusDot = document.getElementById("statusDot");
const statusText = document.getElementById("statusText");

const hero = document.getElementById("hero");
const chatContainer = document.getElementById("chatContainer");
const chatBox = document.getElementById("chatBox");
const input = document.getElementById("chatInput");
const sendBtn = document.getElementById("sendBtn");
const newChatBtn = document.getElementById("newChatBtn");
const historyList = document.getElementById("historyList");
const historySearch = document.getElementById("historySearch");

const fileInput = document.getElementById("fileInput");
const cameraInput = document.getElementById("cameraInput");
const uploadFileBtn = document.getElementById("uploadFileBtn");
const cameraBtn = document.getElementById("cameraBtn");
const galleryBtn = document.getElementById("galleryBtn");

let chats = loadChats();
let currentChatId = chats[0]?.id || null;

openSidebar.addEventListener("click", () => {
  sidebar.classList.add("open");
  overlay.classList.add("show");
});

closeSidebar.addEventListener("click", closeSide);
overlay.addEventListener("click", closeSide);

function closeSide() {
  sidebar.classList.remove("open");
  overlay.classList.remove("show");
}

plusBtn.onclick = (e) => {
  e.stopPropagation();
  plusPopup.classList.toggle("show");
  statusDropdown.classList.remove("show");
};

serverStatusBtn.addEventListener("click", (e) => {
  e.stopPropagation();
  statusDropdown.classList.toggle("show");
  plusPopup.classList.remove("show");
});

document.addEventListener("click", () => {
  plusPopup.classList.remove("show");
  statusDropdown.classList.remove("show");
});

uploadFileBtn.addEventListener("click", () => {
  plusPopup.classList.remove("show");
  fileInput.click();
});

galleryBtn.addEventListener("click", () => {
  plusPopup.classList.remove("show");
  fileInput.click();
});

cameraBtn.addEventListener("click", () => {
  plusPopup.classList.remove("show");
  cameraInput.click();
});

fileInput.addEventListener("change", handleSelectedFile);
cameraInput.addEventListener("change", handleSelectedFile);

sendBtn.addEventListener("click", sendMessage);
input.addEventListener("keydown", (e) => {
  if (e.key === "Enter") {
    e.preventDefault();
    sendMessage();
  }
});

newChatBtn.addEventListener("click", () => {
  createNewChat();
  closeSide();
});

historySearch.addEventListener("input", renderHistory);

function loadChats() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

function saveChats() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(chats));
}

function createNewChat() {
  const chat = {
    id: crypto.randomUUID(),
    title: "Chat baru",
    messages: []
  };
  chats.unshift(chat);
  currentChatId = chat.id;
  saveChats();
  renderHistory();
  renderCurrentChat();
}

function getCurrentChat() {
  return chats.find((c) => c.id === currentChatId) || null;
}

function renderHistory() {
  const keyword = historySearch.value.trim().toLowerCase();
  historyList.innerHTML = "";

  const filtered = chats.filter((chat) =>
    chat.title.toLowerCase().includes(keyword)
  );

  if (!filtered.length) {
    historyList.innerHTML = `<div class="history-empty">Belum ada riwayat chat.</div>`;
    return;
  }

  filtered.forEach((chat) => {
    const btn = document.createElement("button");
    btn.className = "history-card" + (chat.id === currentChatId ? " active" : "");
    btn.textContent = chat.title;
    btn.onclick = () => {
      currentChatId = chat.id;
      renderHistory();
      renderCurrentChat();
      closeSide();
    };
    historyList.appendChild(btn);
  });
}

function renderCurrentChat() {
  const chat = getCurrentChat();
  chatBox.innerHTML = "";

  if (!chat || !chat.messages.length) {
    hero.classList.remove("hidden");
    chatContainer.classList.remove("active");
    return;
  }

  hero.classList.add("hidden");
  chatContainer.classList.add("active");

  chat.messages.forEach((msg) => {
    const el = document.createElement("div");
    el.className = `msg ${msg.role}`;
    if (msg.type === "image" && msg.image) {
      el.style.padding = "10px";
      el.innerHTML = `<img src="${msg.image}" alt="preview" style="max-width:220px;border-radius:12px;display:block;">`;
    } else {
      el.innerText = msg.text;
    }
    chatBox.appendChild(el);
  });

  scrollToBottom();
}

async function sendMessage() {
  const message = input.value.trim();
  if (!message) return;

  if (!currentChatId) createNewChat();

  const chat = getCurrentChat();
  if (!chat) return;

  if (!chat.messages.length) {
    chat.title = makeTitle(message);
  }

  activateChatMode();

  chat.messages.push({
    role: "user",
    text: message,
    type: "text"
  });

  saveChats();
  renderHistory();
  renderCurrentChat();

  input.value = "";

  const typingEl = addTypingBubble();

  try {
    const historyForApi = chat.messages
      .filter((m) => m.type === "text")
      .slice(-10)
      .map((m) => ({
        role: m.role === "user" ? "user" : "assistant",
        content: m.text
      }));

    const res = await fetch("/api/chat", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        message,
        history: historyForApi
      })
    });

    const data = await res.json();
    typingEl.remove();

    const reply = fixText(data.reply || "Tidak ada balasan.");

    chat.messages.push({
      role: "ai",
      text: reply,
      type: "text"
    });

    saveChats();
    renderCurrentChat();
    renderHistory();
    typeLastAiMessage(reply);

    setOnline(true);
  } catch (err) {
    typingEl.remove();

    chat.messages.push({
      role: "ai",
      text: "Server offline / API error",
      type: "text"
    });

    saveChats();
    renderCurrentChat();
    renderHistory();
    setOnline(false);
  }
}

function activateChatMode() {
  hero.classList.add("hidden");
  chatContainer.classList.add("active");
}

function addTypingBubble() {
  const wrap = document.createElement("div");
  wrap.className = "msg ai";
  wrap.innerHTML = `
    <div class="typing-bubble">
      <span></span><span></span><span></span>
    </div>
  `;
  chatBox.appendChild(wrap);
  scrollToBottom();
  return wrap;
}

function typeLastAiMessage(text) {
  const aiMessages = [...chatBox.querySelectorAll(".msg.ai")];
  const el = aiMessages[aiMessages.length - 1];
  if (!el) return;

  el.innerText = "";
  let i = 0;

  function typing() {
    if (i < text.length) {
      el.innerText += text.charAt(i);
      i++;
      scrollToBottom();
      setTimeout(typing, 10);
    }
  }

  typing();
}

function scrollToBottom() {
  chatContainer.scrollTop = chatContainer.scrollHeight;
}

function setOnline(state) {
  if (state) {
    statusDot.innerText = "🟢";
    statusText.innerText = "Online";
  } else {
    statusDot.innerText = "🔴";
    statusText.innerText = "Offline";
  }
}

async function checkAPI() {
  try {
    const res = await fetch("/api/chat", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ message: "ping" })
    });

    if (res.ok) setOnline(true);
    else setOnline(false);
  } catch {
    setOnline(false);
  }
}

function fixText(text) {
  return String(text)
    .replace(/([.!?])([A-Za-zÀ-ÿ])/g, "$1 $2")
    .replace(/([a-zà-ÿ])([A-ZÀ-Ÿ])/g, "$1 $2")
    .replace(/\s+/g, " ")
    .trim();
}

function makeTitle(text) {
  const clean = text.trim();
  return clean.length > 24 ? clean.slice(0, 24) + "..." : clean;
}

function handleSelectedFile(event) {
  const file = event.target.files[0];
  if (!file) return;

  if (!currentChatId) createNewChat();
  const chat = getCurrentChat();
  if (!chat) return;

  activateChatMode();

  if (file.type.startsWith("image/")) {
    const reader = new FileReader();
    reader.onload = () => {
      if (!chat.messages.length) {
        chat.title = "Gambar baru";
      }

      chat.messages.push({
        role: "user",
        image: reader.result,
        type: "image"
      });

      chat.messages.push({
        role: "ai",
        text: "Gambar diterima. Upload gambar dan kamera HP sudah aktif di UI. Kalau mau analisis gambar oleh AI, backend /api/chat perlu di-upgrade ke versi vision.",
        type: "text"
      });

      saveChats();
      renderCurrentChat();
      renderHistory();
    };
    reader.readAsDataURL(file);
  } else {
    if (!chat.messages.length) {
      chat.title = file.name;
    }

    chat.messages.push({
      role: "user",
      text: `Mengirim file: ${file.name}`,
      type: "text"
    });

    chat.messages.push({
      role: "ai",
      text: "File diterima. Upload file sudah aktif di UI.",
      type: "text"
    });

    saveChats();
    renderCurrentChat();
    renderHistory();
  }

  event.target.value = "";
}

if (!chats.length) {
  createNewChat();
  const empty = getCurrentChat();
  if (empty) {
    empty.messages = [];
    saveChats();
  }
}

renderHistory();
renderCurrentChat();
checkAPI();
