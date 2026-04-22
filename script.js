const form = document.getElementById('chatForm');
const input = document.getElementById('chatInput');
const chatLog = document.getElementById('chatLog');
const template = document.getElementById('messageTemplate');

function addMessage(role, content) {
  const node = template.content.firstElementChild.cloneNode(true);
  node.classList.add(role);
  node.querySelector('.message-role').textContent = role === 'user' ? 'Kamu' : 'Xinn AI';
  node.querySelector('.message-content').textContent = content;
  chatLog.classList.add('has-messages');
  chatLog.appendChild(node);
  chatLog.scrollTop = chatLog.scrollHeight;
  return node;
}

async function sendMessage(message) {
  addMessage('user', message);
  const loadingNode = addMessage('assistant', 'Sedang berpikir...');

  try {
    const response = await fetch('/api/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ message })
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Terjadi kesalahan saat menghubungi AI.');
    }

    loadingNode.querySelector('.message-content').textContent = data.reply || 'Maaf, tidak ada balasan.';
  } catch (error) {
    loadingNode.querySelector('.message-content').textContent = error.message || 'Terjadi kesalahan.';
  }
}

form.addEventListener('submit', async (event) => {
  event.preventDefault();
  const message = input.value.trim();
  if (!message) return;
  input.value = '';
  await sendMessage(message);
});
