# ⬡ ChatForge

A Discord-style public chat server platform. Create servers, join conversations, and chat with anyone in real time. Deploy in minutes on Vercel + Supabase.

![ChatForge Screenshot](https://placeholder-for-screenshot.png)

---

## ✨ Features

- 🌐 **Public server discovery** — browse and search all servers
- 💬 **Real-time chat** — messages auto-refresh every 3 seconds
- 🏗️ **Create servers** — name, icon emoji, and description
- 👤 **Guest usernames** — no account required
- 🛡️ **Moderation** — delete messages or entire servers
- 📱 **Responsive** — works on desktop and mobile

---

## 🚀 Deploy in 5 minutes

### Step 1 — Set up Supabase

1. Go to [supabase.com](https://supabase.com) and create a free account
2. Create a **New Project**
3. Go to your project → **SQL Editor**
4. Paste and run the contents of [`supabase-schema.sql`](./supabase-schema.sql)
5. Go to **Settings → API** and copy:
   - **Project URL** → `SUPABASE_URL`
   - **service_role** key (secret) → `SUPABASE_SERVICE_KEY`

### Step 2 — Deploy to Vercel

#### Option A: Deploy from GitHub (recommended)

1. Fork or push this repo to your GitHub account
2. Go to [vercel.com](https://vercel.com) → **New Project**
3. Import your GitHub repository
4. Add **Environment Variables**:
   ```
   SUPABASE_URL=https://your-project-id.supabase.co
   SUPABASE_SERVICE_KEY=your-service-role-key
   ```
5. Click **Deploy** — you're live!

#### Option B: Deploy with Vercel CLI

```bash
# Install Vercel CLI
npm i -g vercel

# Clone and install
git clone https://github.com/YOUR_USERNAME/chatforge
cd chatforge
npm install

# Set up environment
cp .env.example .env.local
# Edit .env.local with your Supabase credentials

# Deploy
vercel --prod
```

### Step 3 — Done! 🎉

Your ChatForge instance is live. Share the URL and start chatting.

---

## 🗂 Project Structure

```
chatforge/
├── public/
│   ├── index.html        # App shell + modals
│   ├── style.css         # Dark Discord-style UI
│   └── app.js            # Frontend logic + API calls
│
├── api/
│   ├── servers.js        # GET /api/servers, DELETE /api/servers?id=
│   ├── messages.js       # GET/POST/DELETE /api/messages
│   └── createServer.js   # POST /api/createServer
│
├── supabase-schema.sql   # Database setup (run once)
├── vercel.json           # Vercel routing config
├── package.json          # Node dependencies
└── .env.example          # Environment variable template
```

---

## 📡 API Reference

### `GET /api/servers`
Returns all public servers.
```json
{ "servers": [{ "id": "...", "name": "General", "icon": "🌍", ... }] }
```

### `POST /api/createServer`
Creates a new server.
```json
// Request body:
{ "name": "My Server", "icon": "🚀", "description": "About my server" }

// Response:
{ "server": { "id": "...", "name": "My Server", ... } }
```

### `GET /api/messages?server_id=UUID&limit=60`
Fetches messages for a server (sorted ascending by time).

### `POST /api/messages`
Sends a message.
```json
// Request body:
{ "server_id": "...", "username": "cool_user", "content": "Hello!" }
```

### `DELETE /api/messages?id=UUID`
Deletes a message.

### `DELETE /api/servers?id=UUID`
Deletes a server and all its messages.

---

## 🛠 Local Development

```bash
npm install
cp .env.example .env.local
# Fill in your Supabase credentials

npm run dev
# Runs at http://localhost:3000
```

---

## 🛡 Moderation

Click the **🛡** shield icon in the top-right of any chat to enter moderation mode:
- Delete buttons appear on all messages
- A **Delete Server** button appears at the bottom

> **Note:** Moderation is currently unprotected (anyone can delete). For production, add authentication via Supabase Auth or a simple admin password stored in environment variables.

---

## 🔒 Security Notes

- The `SUPABASE_SERVICE_KEY` is only used server-side in Vercel API routes — it's never exposed to the browser
- Input is sanitized and length-limited in both frontend and API
- RLS (Row Level Security) is enabled on all tables
- For production, consider adding rate limiting via Vercel middleware

---

## 📦 Tech Stack

| Layer     | Technology |
|-----------|------------|
| Frontend  | Vanilla HTML, CSS, JavaScript |
| Backend   | Vercel Serverless Functions (Node.js) |
| Database  | Supabase (PostgreSQL) |
| Hosting   | Vercel |
| Fonts     | Syne + Space Mono (Google Fonts) |

---

## 📄 License

MIT — use it, fork it, ship it.
