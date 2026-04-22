const STORAGE_KEY = "xinn_ai_pro_chats_v3";

const sidebar = document.getElementById("sidebar");
const openSidebar = document.getElementById("openSidebar");
const closeSidebar = document.getElementById("closeSidebar");
const overlay = document.getElementById("overlay");

const plusBtn = document.getElementById("plusBtn");
const plusMenu = document.getElementById("plusMenu");

const statusBtn = document.getElementById("statusBtn");
const statusCard = document.getElementById("statusCard");
const statusDot = document.getElementById("statusDot");
const statusText = document.getElementById("statusText");

const hero = document.getElementById("hero");
const chatArea = document.getElementById("chatArea");
const messages = document.getElementById("messages");
const chatInput = document.getElementById("chatInput");
const sendBtn = document.getElementById("sendBtn");
const newChatBtn = document.getElementById("newChatBtn");
const historyList = document.getElementById("historyList");
const historySearch = document.getElementById("historySearch");

const fileInput = document.getElementById("fileInput");
const cameraInput = document.getElementById("cameraInput");
const fileBtn = document.getElementById("fileBtn");
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

plusBtn.addEventListener("click", (e) => {
  e.stopPropagation();
  plusMenu.classList.toggle("show");
  statusCard.classList.remove("show");
});

statusBtn.addEventListener("click", (e) => {
  e.stopPropagation();
  statusCard.classList.toggle("show");
  plusMenu.classList.remove("show");
});

document.addEventListener("click", () => {
  plusMenu.classList.remove("show");
  statusCard.classList.remove("show");
});

fileBtn.addEventListener("click", () => {
  plusMenu.classList.remove("show");
  fileInput.click();
});

galleryBtn.addEventListener("click", () => {
  plusMenu.classList.remove("show");
  fileInput.click();
});

cameraBtn.addEventListener("click", () => {
  plusMenu.classList.remove("show");
  cameraInput.click();
});

fileInput.addEventListener("change", handleSelectedFile);
cameraInput.addEventListener("change", handleSelectedFile);

sendBtn.addEventListener("click", sendMessage);
chatInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter") {
    e.preventDefault();
    sendMessage();
  }
});

chatInput.addEventListener("focus", () => {
  setTimeout(() => {
    scrollBottom();
  }, 300);
});

newChatBtn.addEventListener("click", () => {
  createNewChat();
  closeSide();
});

historySearch.addEventListener("input", renderHistory);

function loadChats() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
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
  messages.innerHTML = "";

  if (!chat || !chat.messages.length) {
    hero.classList.remove("hidden");
    chatArea.classList.remove("active");
    return;
  }

  hero.classList.add("hidden");
  chatArea.classList.add("active");

  chat.messages.forEach(renderMessageElement);
  scrollBottom();
}

function renderMessageElement(msg) {
  const el = document.createElement("div");
  el.className = `msg ${msg.role}`;

  if (msg.type === "image") {
    el.style.padding = "10px";
    el.classList.add("without-copy");
    el.innerHTML = `<img class="file-preview" src="${msg.image}" alt="preview">`;
  } else if (msg.role === "ai") {
    const copyBtn = document.createElement("button");
    copyBtn.className = "copy-btn";
    copyBtn.textContent = "Salin";
    copyBtn.addEventListener("click", () => copyText(msg.text, copyBtn));
    el.appendChild(copyBtn);

    const content = document.createElement("div");
    content.className = "msg-content";
    content.innerHTML = renderMarkdown(msg.text);
    el.appendChild(content);
  } else {
    el.innerText = msg.text;
  }

  messages.appendChild(el);
  return el;
}

async function sendMessage() {
  const text = chatInput.value.trim();
  if (!text) return;

  if (!currentChatId) createNewChat();
  const chat = getCurrentChat();
  if (!chat) return;

  if (!chat.messages.length) {
    chat.title = makeTitle(text);
  }

  activateChatMode();

  const userMsg = {
    role: "user",
    text,
    type: "text"
  };

  chat.messages.push(userMsg);
  saveChats();
  renderHistory();
  renderCurrentChat();

  chatInput.value = "";

  const typingEl = addTyping();

  try {
    const history = chat.messages
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
        message: text,
        history
      })
    });

    const data = await res.json();
    typingEl.remove();

    const reply = data.reply || "No response";

    const aiMsg = {
      role: "ai",
      text: reply,
      type: "text"
    };

    chat.messages.push(aiMsg);
    saveChats();
    renderHistory();

    const el = renderMessageElement(aiMsg);
    typeMarkdown(el, reply);

    setOnline(true);
  } catch {
    typingEl.remove();

    const aiMsg = {
      role: "ai",
      text: "Server offline / API error",
      type: "text"
    };

    chat.messages.push(aiMsg);
    saveChats();
    renderHistory();
    renderCurrentChat();
    setOnline(false);
  }
}

function activateChatMode() {
  hero.classList.add("hidden");
  chatArea.classList.add("active");
}

function addTyping() {
  const wrap = document.createElement("div");
  wrap.className = "msg ai without-copy";
  wrap.innerHTML = `<div class="typing"><span></span><span></span><span></span></div>`;
  messages.appendChild(wrap);
  scrollBottom();
  return wrap;
}

function typeMarkdown(el, fullText) {
  const content = el.querySelector(".msg-content");
  if (!content) return;

  content.innerHTML = "";
  let i = 0;

  function tick() {
    if (i < fullText.length) {
      i += 2;
      const partial = fullText.slice(0, i);
      content.innerHTML = renderMarkdown(partial);
      scrollBottom();
      setTimeout(tick, 8);
    }
  }

  tick();
}

function scrollBottom() {
  requestAnimationFrame(() => {
    chatArea.scrollTo({
      top: chatArea.scrollHeight,
      behavior: "smooth"
    });
  });
}

function setOnline(state) {
  statusDot.textContent = state ? "🟢" : "🔴";
  statusText.textContent = state ? "Online" : "Offline";
}

async function checkAPI() {
  try {
    const res = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: "ping" })
    });
    setOnline(res.ok);
  } catch {
    setOnline(false);
  }
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
      if (!chat.messages.length) chat.title = "Gambar baru";

      chat.messages.push({
        role: "user",
        type: "image",
        image: reader.result
      });

      chat.messages.push({
        role: "ai",
        type: "text",
        text: "Gambar diterima 📷✨ Upload aktif di UI. Kalau mau analisis gambar oleh AI, backend `/api/chat` perlu versi vision."
      });

      saveChats();
      renderHistory();
      renderCurrentChat();
    };
    reader.readAsDataURL(file);
  } else {
    if (!chat.messages.length) chat.title = file.name;

    chat.messages.push({
      role: "user",
      type: "text",
      text: `Mengirim file: ${file.name}`
    });

    chat.messages.push({
      role: "ai",
      type: "text",
      text: "File diterima 📎 Upload file sudah aktif di UI."
    });

    saveChats();
    renderHistory();
    renderCurrentChat();
  }

  event.target.value = "";
}

async function copyText(text, button) {
  try {
    await navigator.clipboard.writeText(text);
    button.textContent = "Tersalin";
    button.classList.add("copied");
    setTimeout(() => {
      button.textContent = "Salin";
      button.classList.remove("copied");
    }, 1600);
  } catch {
    button.textContent = "Gagal";
    setTimeout(() => {
      button.textContent = "Salin";
    }, 1200);
  }
}

function renderMarkdown(text) {
  const escaped = escapeHtml(text);

  const withCodeBlocks = escaped.replace(/```([\s\S]*?)```/g, (_, code) => {
    return `<pre><code>${code.trim()}</code></pre>`;
  });

  const withInline = withCodeBlocks.replace(/`([^`]+)`/g, "<code>$1</code>");

  const paragraphs = withInline
    .split(/\n{2,}/)
    .map((p) => {
      if (p.startsWith("<pre>")) return p;
      return `<p>${p.replace(/\n/g, "<br>")}</p>`;
    })
    .join("");

  return paragraphs;
}

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function makeTitle(text) {
  const clean = text.trim();
  return clean.length > 26 ? clean.slice(0, 26) + "..." : clean;
}

if (!chats.length) {
  createNewChat();
  const first = getCurrentChat();
  if (first) {
    first.messages = [];
    saveChats();
  }
}

renderHistory();
renderCurrentChat();
checkAPI();
