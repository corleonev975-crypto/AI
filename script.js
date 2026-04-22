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

const fileInput = document.getElementById("fileInput");
const cameraInput = document.getElementById("cameraInput");
const uploadFileBtn = document.getElementById("uploadFileBtn");
const cameraBtn = document.getElementById("cameraBtn");
const galleryBtn = document.getElementById("galleryBtn");

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
  chatBox.innerHTML = "";
  chatContainer.classList.remove("active");
  hero.classList.remove("hidden");
  input.value = "";
});

async function sendMessage() {
  const message = input.value.trim();
  if (!message) return;

  activateChatMode();
  addMessage(message, "user");
  input.value = "";

  const loading = addMessage("Xinn AI sedang mengetik...", "ai");
  scrollToBottom();

  try {
    const res = await fetch("/api/chat", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ message })
    });

    const data = await res.json();

    if (!res.ok || data.error) {
      throw new Error(data.error || "Server error");
    }

    setOnline(true);
    typeText(loading, fixText(data.reply || "Tidak ada balasan."));
  } catch (err) {
    loading.innerText = "Server offline / API error";
    setOnline(false);
  }
}

function activateChatMode() {
  hero.classList.add("hidden");
  chatContainer.classList.add("active");
}

function addMessage(text, role) {
  const msg = document.createElement("div");
  msg.className = `msg ${role}`;
  msg.innerText = fixText(text);
  msg.style.opacity = "0";
  msg.style.transform = "translateY(10px)";
  chatBox.appendChild(msg);

  setTimeout(() => {
    msg.style.transition = "0.3s";
    msg.style.opacity = "1";
    msg.style.transform = "translateY(0)";
  }, 10);

  scrollToBottom();
  return msg;
}

function typeText(el, text) {
  el.innerText = "";
  let i = 0;

  function typing() {
    if (i < text.length) {
      el.innerText += text.charAt(i);
      i++;
      scrollToBottom();
      setTimeout(typing, 14);
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

    if (res.ok) {
      setOnline(true);
    } else {
      setOnline(false);
    }
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

function handleSelectedFile(event) {
  const file = event.target.files[0];
  if (!file) return;

  activateChatMode();
  addMessage(`Mengirim file: ${file.name}`, "user");

  if (file.type.startsWith("image/")) {
    const reader = new FileReader();
    reader.onload = () => {
      const wrap = document.createElement("div");
      wrap.className = "msg user";
      wrap.style.padding = "10px";
      wrap.innerHTML = `<img src="${reader.result}" alt="preview" style="max-width:220px;border-radius:12px;display:block;">`;
      chatBox.appendChild(wrap);
      scrollToBottom();

      addMessage(
        "Gambar diterima. Upload gambar dan kamera HP sudah aktif di UI. Kalau mau analisis gambar oleh AI, backend /api/chat perlu di-upgrade ke versi vision.",
        "ai"
      );
    };
    reader.readAsDataURL(file);
  } else {
    addMessage(
      "File diterima. Upload file sudah aktif di UI.",
      "ai"
    );
  }

  event.target.value = "";
}

checkAPI();
