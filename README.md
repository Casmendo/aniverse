# 🔥 AniVerse v2 — "Enter the Anime Multiverse"

> Next-generation anime streaming platform. Next.js 14 + Flask. Better than Netflix, Crunchyroll, and AnimePahe.

---

## 🏗️ Architecture

```
aniverse-next/
├── frontend/          # Next.js 14 (App Router) — TypeScript + Tailwind
│   ├── app/
│   │   ├── page.tsx              ← Home (hero + sections)
│   │   ├── anime/[slug]/page.tsx ← Anime detail
│   │   ├── watch/[slug]/[ep]/    ← Video player
│   │   ├── auth/page.tsx         ← Login / Signup / OTP
│   │   ├── downloads/page.tsx    ← Download library
│   │   ├── watchlist/page.tsx    ← Saved anime
│   │   └── apk/page.tsx          ← App download
│   ├── components/
│   │   ├── Navbar.tsx            ← Top nav + expandable search
│   │   ├── Sidebar.tsx           ← Slide-out panel
│   │   ├── BottomNav.tsx         ← Floating mobile nav
│   │   ├── HeroSlider.tsx        ← Cinematic auto-slider
│   │   ├── AnimeCard.tsx         ← Card with glow + quick actions
│   │   ├── AnimeSection.tsx      ← Horizontal scroll row
│   │   ├── VideoPlayer.tsx       ← Full HLS.js player
│   │   └── Toast.tsx             ← Notification system
│   ├── store/
│   │   ├── authStore.ts          ← Zustand auth state
│   │   ├── progressStore.ts      ← Watch progress (resume)
│   │   ├── downloadStore.ts      ← Hybrid server+local downloads
│   │   └── sidebarStore.ts       ← Sidebar open/close
│   └── lib/
│       ├── api.ts                ← Axios client + all endpoints
│       └── utils.ts              ← formatTime, extractAnimeData, …
└── backend/           # Flask API
    └── app.py                    ← Full REST API
```

---

## 🚀 Quick Start

### Prerequisites
- **Node.js** 18+
- **Python** 3.10+
- **pnpm** or **npm**

---

### 1 — Clone / extract

```bash
cd aniverse-next
```

---

### 2 — Backend setup

```bash
cd backend
python -m venv venv
source venv/bin/activate          # Windows: venv\Scripts\activate

pip install -r requirements.txt

cp .env.example .env
# Edit .env and add:
#   SECRET_KEY=...
#   API_BASE=https://apis.ayohost.site
```

**Run backend:**
```bash
python app.py
# → Running on http://localhost:5000
```

---

### 3 — Frontend setup

```bash
cd frontend
npm install                       # or: pnpm install

cp .env.example .env.local
# .env.local already has:
#   NEXT_PUBLIC_API_URL=http://localhost:5000
```

**Run frontend:**
```bash
npm run dev
# → http://localhost:3000
```

---

## ✅ Feature Checklist

### UI / UX
| Feature | Status |
|---|---|
| Dark glassmorphism design system | ✅ |
| Animated starfield background | ✅ |
| Orbitron + Exo 2 + Space Mono fonts | ✅ |
| Custom glowing "A" logo | ✅ |
| Cinematic hero slider (auto + arrows + dots + progress bar) | ✅ |
| Airing / Trending / Recommended / Genres sections | ✅ |
| Horizontal snap-scroll rows | ✅ |
| Anime cards with hover glow, scale, quick actions | ✅ |
| Expandable search with live dropdown | ✅ |
| Slide-out sidebar with profile + stats | ✅ |
| Floating bottom nav (hides on watch page) | ✅ |
| Toast notification system | ✅ |
| Page fade-in transitions | ✅ |
| Skeleton loaders everywhere | ✅ |
| Fully responsive (mobile + desktop) | ✅ |

### Video Player
| Feature | Status |
|---|---|
| HLS.js streaming (.m3u8) | ✅ |
| Safari native HLS fallback | ✅ |
| Custom controls: play/pause, seek, volume, fullscreen | ✅ |
| Skip ±10 seconds buttons | ✅ |
| Keyboard shortcuts (Space, K, ←, →, ↑, ↓, M, F) | ✅ |
| Mobile double-tap seek | built into player |
| Auto-next episode on end | ✅ |
| Resume playback (saved position) | ✅ |
| Episode switching without page reload | ✅ |
| CC subtitle toggle (UI ready) | ✅ |
| Loading spinner + error recovery | ✅ |

### Auth System
| Feature | Status |
|---|---|
| Signup with username/email/password | ✅ |
| Password validation (8+, uppercase, number) | ✅ |
| Password strength indicator (3 bars) | ✅ |
| 6-digit OTP sent to email | ✅ |
| OTP 5-minute expiry | ✅ |
| Max 5 attempts then locked | ✅ |
| 60-second resend cooldown | ✅ |
| OTP boxes: auto-advance, backspace, paste | ✅ |
| Login with rate limiting | ✅ |
| Persistent sessions (30-day) | ✅ |
| Edit username | ✅ |
| Change password | ✅ |
| Logout | ✅ |

### Backend / Data
| Feature | Status |
|---|---|
| All API calls proxied through Flask (key hidden) | ✅ |
| 3-layer API fallback for trending/recommended | ✅ |
| Response caching (3 min airing, 10 min trending, 1h detail) | ✅ |
| Rate limiting on all sensitive endpoints | ✅ |
| CORS configured for Next.js frontend | ✅ |
| SQLAlchemy models: User, OTP, Comment, Download, Watchlist | ✅ |
| Server-side comments with pagination | ✅ |
| Server-side downloads (with localStorage fallback for guests) | ✅ |
| Server-side watchlist | ✅ |
| Watchlist status injected into anime detail response | ✅ |
| User profile stats (downloads, watchlist, comments count) | ✅ |
| Input validation + SQL injection protection | ✅ |
| Passwords hashed (Werkzeug PBKDF2) | ✅ |
| OTP hashed with SHA-256 | ✅ |

---

## 🌐 API Reference

### Anime Proxy
| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/airing?page=N` | Currently airing |
| GET | `/api/trending` | Trending anime |
| GET | `/api/recommended` | Recommended anime |
| GET | `/api/search?q=query` | Search |
| GET | `/api/anime/:slug` | Anime detail + watchlist status |
| GET | `/api/anime/:slug/episodes` | Episode list |
| POST | `/api/get-stream` | `{episode_id, slug}` → stream URL |

### Auth
| Method | Endpoint | Body |
|---|---|---|
| POST | `/api/auth/signup` | `{username, email, password}` |
| POST | `/api/auth/verify-otp` | `{otp}` |
| POST | `/api/auth/resend-otp` | — |
| POST | `/api/auth/login` | `{email, password}` |
| POST | `/api/auth/logout` | — |
| GET  | `/api/user` | Current user + stats |
| POST | `/api/auth/update-username` | `{username}` |
| POST | `/api/auth/change-password` | `{old_password, new_password}` |

### Comments
| Method | Endpoint | Notes |
|---|---|---|
| GET  | `/api/comments/:slug?page=N` | Paginated, 20/page |
| POST | `/api/comments/:slug` | Auth required. `{text}` |
| DELETE | `/api/comments/delete/:id` | Auth + owner only |

### Downloads
| Method | Endpoint | Notes |
|---|---|---|
| GET  | `/api/downloads` | Auth required. Grouped by anime |
| POST | `/api/downloads` | `{anime_slug, anime_title, anime_cover, episode_num, episode_id, episode_title}` |
| DELETE | `/api/downloads/:id` | Remove single episode |
| DELETE | `/api/downloads/anime/:slug` | Remove all eps of an anime |

### Watchlist
| Method | Endpoint | Notes |
|---|---|---|
| GET  | `/api/watchlist` | Auth required |
| POST | `/api/watchlist` | `{anime_slug, anime_title, anime_cover}` — toggles |

---

## 🎮 Keyboard Shortcuts (Watch Page)

| Key | Action |
|---|---|
| `Space` or `K` | Play / Pause |
| `→` | Forward 10s |
| `←` | Back 10s |
| `↑` | Volume +10% |
| `↓` | Volume -10% |
| `M` | Toggle mute |
| `F` | Toggle fullscreen |

---

## 📧 Email OTP — Production Setup

Install Flask-Mail:
```bash
pip install Flask-Mail
```

Add to `.env`:
```env
MAIL_SERVER=smtp.gmail.com
MAIL_PORT=587
MAIL_USERNAME=your@gmail.com
MAIL_PASSWORD=your-app-password
```

Replace `_send_otp()` in `backend/app.py`:
```python
from flask_mail import Mail, Message

mail = Mail(app)

def _send_otp(email, username, otp):
    msg = Message(
        subject="Your AniVerse OTP",
        sender="noreply@aniverse.app",
        recipients=[email]
    )
    msg.html = f"""
    <div style="font-family:Arial;background:#00071f;color:#e8f4ff;padding:32px;border-radius:16px;">
      <h2 style="color:#4fa1eb;">AniVerse OTP Verification</h2>
      <p>Hi <strong>{username}</strong>!</p>
      <p>Your one-time code:</p>
      <div style="font-size:36px;font-weight:bold;letter-spacing:12px;color:#a0d8f4;margin:20px 0;">{otp}</div>
      <p style="color:#aaa;">Expires in 5 minutes. Do not share this code.</p>
    </div>"""
    mail.send(msg)
```

---

## ☁️ Deployment

### Frontend (Vercel)
```bash
cd frontend
vercel deploy --prod
# Set env: NEXT_PUBLIC_API_URL=https://your-backend.com
```

### Backend (Railway / Render)
```bash
# Procfile
web: gunicorn app:app -w 4 -b 0.0.0.0:$PORT
```

Set environment variables in dashboard:
- `SECRET_KEY`
- `API_BASE` (https://apis.ayohost.site)
- `FRONTEND_URL` (your Vercel URL)
- `DATABASE_URL` (PostgreSQL connection string)

### VPS (nginx + gunicorn)
```bash
gunicorn app:app -w 4 -b 127.0.0.1:5000 --daemon

# nginx config
server {
    listen 80;
    server_name api.aniverse.app;
    location / {
        proxy_pass http://127.0.0.1:5000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

---

## 🎨 Design System

| Token | Value | Use |
|---|---|---|
| `--navy` | `#00103c` | Deep background |
| `--blue` | `#0a3990` | Primary blue |
| `--highlight` | `#4fa1eb` | Interactive, borders, icons |
| `--glow` | `#a0d8f4` | Light highlights, glow effects |

**Fonts:** Orbitron (display/logo) · Exo 2 (body) · Space Mono (code/time)

---

## 🛡️ Security

- API key **never** sent to the browser — all proxied via Flask
- Passwords hashed with Werkzeug PBKDF2 (bcrypt-backed)  
- OTP hashed with SHA-256 before storage
- Rate limiting on all auth + stream endpoints
- CORS restricted to your frontend domain
- Input validation + SQLAlchemy parameterised queries
- HTTP-only session cookies

---

Made with 🔥 by AniVerse · *"Enter the Anime Multiverse"*
