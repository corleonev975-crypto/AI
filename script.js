const STORAGE_KEY = "xinn_ai_pro_chats_v6";

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
  enhanceMessageActions();
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
    const shouldShowCopyAll = shouldRenderCopyAll(msg.text);

    if (shouldShowCopyAll) {
      const topActions = document.createElement("div");
      topActions.className = "msg-top-actions";

      const copyAllBtn = document.createElement("button");
      copyAllBtn.className = "copy-btn";
      copyAllBtn.dataset.label = "Salin Semua";
      copyAllBtn.textContent = "Salin Semua";
      copyAllBtn.addEventListener("click", () => copyText(msg.text, copyAllBtn));

      topActions.appendChild(copyAllBtn);
      el.appendChild(topActions);
    } else {
      el.classList.add("without-copy");
    }

    const content = document.createElement("div");
    content.className = "msg-content";
    content.dataset.raw = msg.text;
    content.innerHTML = renderMarkdown(msg.text);
    el.appendChild(content);
  } else {
    el.innerText = msg.text;
  }

  messages.appendChild(el);
  return el;
}

function shouldRenderCopyAll(text) {
  const value = String(text || "").trim();

  if (!value) return false;
  if (value.includes("```")) return true;
  if (value.length > 220) return true;
  if (/file:\s|index\.html|style\.css|script\.js/i.test(value)) return true;

  return false;
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
      enhanceMessageActions(el);
      scrollBottom();
      setTimeout(tick, 8);
    } else {
      enhanceMessageActions(el);
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
      button.textContent = button.dataset.label || "Salin";
      button.classList.remove("copied");
    }, 1600);
  } catch {
    button.textContent = "Gagal";
    setTimeout(() => {
      button.textContent = button.dataset.label || "Salin";
    }, 1200);
  }
}

function enhanceMessageActions(scope = document) {
  const target = scope instanceof Element ? scope : document;

  target.querySelectorAll("pre").forEach((pre) => {
    if (pre.dataset.enhanced === "true") return;
    pre.dataset.enhanced = "true";

    const code = pre.querySelector("code");
    const lang = pre.dataset.lang || detectLanguageFromCode(code?.textContent || "");

    const top = document.createElement("div");
    top.className = "code-block-top";

    const label = document.createElement("div");
    label.className = "code-lang";
    label.textContent = lang || "code";

    const copyCodeBtn = document.createElement("button");
    copyCodeBtn.className = "copy-btn code-copy-btn";
    copyCodeBtn.dataset.label = "Salin Kode";
    copyCodeBtn.textContent = "Salin Kode";
    copyCodeBtn.addEventListener("click", () => {
      copyText(code?.textContent || "", copyCodeBtn);
    });

    top.appendChild(label);
    top.appendChild(copyCodeBtn);

    pre.prepend(top);
  });
}

function detectLanguageFromCode(code) {
  const value = String(code).trim();

  if (/^<!DOCTYPE html>|<html|<head|<body|<div|<section/i.test(value)) return "html";
  if (/:root|background:|display:\s*flex|@media|border-radius|color:/i.test(value)) return "css";
  if (/const |let |function |=>|document\.|addEventListener|fetch\(/i.test(value)) return "javascript";
  if (/export default|interface |type |: string|: number/i.test(value)) return "typescript";
  if (/SELECT |INSERT INTO |UPDATE |DELETE FROM |CREATE TABLE/i.test(value)) return "sql";
  if (/from flask|def |print\(|import os|if __name__/i.test(value)) return "python";

  return "code";
}

function renderMarkdown(text) {
  const escaped = escapeHtml(text);

  const withCodeBlocks = escaped.replace(/```(\w+)?\n?([\s\S]*?)```/g, (_, lang, code) => {
    const safeLang = lang ? lang.toLowerCase() : detectLanguageFromCode(code);
    return `<pre data-lang="${safeLang}"><code>${code.trim()}</code></pre>`;
  });

  const withInline = withCodeBlocks.replace(
    /`([^`]+)`/g,
    "<code style='display:inline;background:rgba(255,255,255,.06);padding:2px 6px;border-radius:6px;'>$1</code>"
  );

  return withInline
    .split(/\n{2,}/)
    .map((p) => {
      if (p.startsWith("<pre")) return p;
      return `<p>${p.replace(/\n/g, "<br>")}</p>`;
    })
    .join("");
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
