# 🌳 LearnTree

> AI-powered learning companion. Start learning anything — from zero to hero, with personal agents, roadmaps, project ideas, and action plans.

**Bilingual (ID/EN) · Next.js 14 · Vercel Ready · Gemini 2.0 Flash (Free)**

---

## ✨ Features

| Feature | Description |
|---|---|
| 🌳 **AI Mother (LearnTree)** | Orchestrator AI yang membuat agen belajar personal |
| 🎯 **Assess / Ukur Kemampuan** | Deteksi level kamu via pertanyaan diagnostik |
| 🗺️ **Roadmap** | Generate roadmap belajar personal + resource |
| 🛠️ **Project Ideas** | Ide project nyata yang bisa dibangun |
| ⚡ **Brainstorm → Action** | Ubah ide abstrak jadi checklist harian |
| 💬 **Free Chat** | Diskusi bebas dengan agenmu |
| 📝 **Progress Notes** | Catat perjalanan belajar |
| ♾️ **Unlimited Agents** | Buat sebanyak mau, gratis |

---

## 🚀 Deploy ke Vercel (3 Langkah)

### Langkah 1 — Siapkan API Key Gemini (GRATIS)
1. Buka [aistudio.google.com](https://aistudio.google.com)
2. Login dengan Google → klik **"Get API Key"**
3. Klik **"Create API key"** → copy key-nya
4. ⚠️ **Jangan share key ini ke siapapun / jangan commit ke git**

### Langkah 2 — Upload ke GitHub
```bash
tar -xzf learntree-project.tar.gz
cd learnai
git init
git add .
git commit -m "init: LearnTree"
git branch -M main
git remote add origin https://github.com/USERNAME/learntree.git
git push -u origin main
```

### Langkah 3 — Deploy di Vercel
1. Buka [vercel.com](https://vercel.com) → Login dengan GitHub
2. Klik **"Add New Project"** → Import repo `learntree`
3. Buka tab **"Environment Variables"** → tambahkan:
   - **Name:** `GEMINI_API_KEY`
   - **Value:** API key Gemini kamu
4. Klik **"Deploy"** → tunggu ~1 menit → live! 🎉

---

## 💻 Jalankan Lokal

```bash
tar -xzf learntree-project.tar.gz
cd learnai
npm install
echo "GEMINI_API_KEY=your_key_here" > .env.local
npm run dev
# Buka http://localhost:3000
```

---

## 🏗️ Struktur Project

```
learnai/
├── app/
│   ├── page.tsx              # Home: dashboard + AI Mother chat
│   ├── agent/[id]/page.tsx   # Agent workspace (5 mode)
│   ├── api/
│   │   ├── chat/route.ts     # AI Mother → Gemini
│   │   └── agents/route.ts   # Agent chat → Gemini
│   ├── layout.tsx
│   └── globals.css
├── lib/
│   ├── types.ts
│   ├── storage.ts
│   └── prompts.ts
└── vercel.json
```

---

## 📦 Gemini Free Tier

| Metric | Limit |
|---|---|
| Requests per minute | 15 RPM |
| Tokens per day | 1,000,000 |

Cukup untuk ribuan sesi belajar per hari.

---

Made with 🌳 — Tumbuh setiap hari.
