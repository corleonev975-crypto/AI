# Xinn AI

UI AI futuristik + API chat Groq untuk deploy ke GitHub dan Vercel.

## Isi project
- `index.html`
- `style.css`
- `script.js`
- `api/chat.js`
- `vercel.json`
- `.env.example`

## Cara pakai
1. Upload semua file ke GitHub.
2. Import repo ke Vercel.
3. Tambahkan Environment Variable:
   - `GROQ_API_KEY`
   - `GROQ_MODEL` (opsional)
4. Deploy.

## Ambil API key Groq
Buka dashboard Groq lalu buat API key.

## Catatan
- Jangan upload file `.env` asli ke GitHub.
- Frontend memanggil `/api/chat` dan backend meneruskan ke Groq.
