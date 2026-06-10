# 🎯 Event & Media Management Platform

A full-stack web platform for clubs and societies to upload, organize, and interact with event photos. Built with AI-powered tagging, role-based access control, and real-time notifications.

**Live Demo:** [Click Here](https://event-media-platform-mu.vercel.app/)  
**Backend API:** [Click Here](https://event-media-platform-production-dd95.up.railway.app/)

---

## ✨ Features

### Core
- **Event Management** — Create events with name, date, category, description. Sort and filter by any field. Public/private visibility toggle.
- **Media Upload** — Drag-and-drop bulk upload (up to 10 photos). File preview before upload. Stored on Cloudinary with auto-optimization.
- **Role-Based Access Control** — 4 roles: Admin, Photographer, Club Member, Viewer. Each role sees different UI and has different API permissions.

### AI & Search
- **AI Auto-Tagging** — Every uploaded photo is automatically tagged using the Imagga API (e.g. "mountains", "crowd", "sports"). Tags are searchable.
- **Global Search** — Search across events, photos (by AI tag), and users simultaneously from one search page.

### Social
- **Likes** — One-click like/unlike with optimistic UI updates and real-time count.
- **Comments** — Post and delete comments on any photo.
- **Favourites** — Save photos to a personal collection, viewable in your profile.
- **Share** — Copy photo link to clipboard in one click.
- **Notifications** — Bell icon with unread badge. Notified when someone likes or comments on your photo. Polls every 30 seconds.

### Downloads
- **Watermarked Download** — Every download has the club name and event name burned onto the image using Sharp.

### Admin
- **Admin Dashboard** — Platform stats (total users, events, photos, likes). User management table with role assignment and delete controls.

### Profiles
- **User Profile** — View any user's uploads. Own profile also shows saved favourites tab.

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React.js, Vite, React Router, Axios, React Dropzone |
| Backend | Node.js, Express.js, JWT Auth, Multer, Sharp |
| Database | PostgreSQL, Prisma ORM |
| File Storage | Cloudinary |
| AI Tagging | Imagga API |
| Deployment | Vercel (frontend), Railway (backend + DB) |

---

## 🗄️ Database Schema

7 tables managed by Prisma ORM:

```
User          — id, name, email, password(hashed), role(enum), avatarUrl
Event         — id, name, description, category, date, isPublic, createdById(FK)
Media         — id, url, thumbnailUrl, type, tags(array), likesCount, eventId(FK), uploaderId(FK)
Like          — id, userId(FK), mediaId(FK) [unique constraint]
Comment       — id, body, userId(FK), mediaId(FK)
Favourite     — id, userId(FK), mediaId(FK) [unique constraint]
Notification  — id, type(enum), isRead, recipientId(FK), actorId(FK), mediaId(FK)
```

---

## 🏗️ Architecture

```
Browser (React on Vercel)
        ↓  REST API (JWT)
Express API (Railway)
    ├── PostgreSQL (Prisma ORM)
    ├── Cloudinary (image storage + CDN)
    └── Imagga API (AI tagging on upload)
```

---

## 🚀 Getting Started

### Prerequisites
- Node.js v18+
- PostgreSQL
- Cloudinary account (free)
- Imagga account (free)

### 1. Clone the repo
```bash
git clone https://github.com/YOUR_USERNAME/event-media-platform.git
cd event-media-platform
```

### 2. Backend setup
```bash
cd server
npm install
```

Create `server/.env`:
```env
DATABASE_URL="postgresql://postgres:yourpassword@localhost:5432/eventmedia"
JWT_SECRET="your-secret-key"
PORT=5000
CLIENT_URL="http://localhost:5173"
CLOUDINARY_CLOUD_NAME="your_cloud_name"
CLOUDINARY_API_KEY="your_api_key"
CLOUDINARY_API_SECRET="your_api_secret"
IMAGGA_API_KEY="your_imagga_key"
IMAGGA_API_SECRET="your_imagga_secret"
```

```bash
npx prisma migrate dev --name init
npx prisma generate
npm run dev
```

### 3. Frontend setup
```bash
cd client
npm install
```

Create `client/.env`:
```env
VITE_API_URL=http://localhost:5000/api
```

```bash
npm run dev
```

### 4. Open the app
- Frontend: http://localhost:5173
- Backend: http://localhost:5000
- Prisma Studio: `cd server && npx prisma studio`

---

## 📡 API Reference

### Auth
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Register new user |
| POST | `/api/auth/login` | Login, returns JWT |
| GET | `/api/auth/me` | Get current user (protected) |

### Events
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/events` | List all events (query: sort, category, search) |
| POST | `/api/events` | Create event (Admin/Photographer) |
| GET | `/api/events/:id` | Get event + media |
| PUT | `/api/events/:id` | Update event |
| DELETE | `/api/events/:id` | Delete event (Admin) |

### Media
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/media/upload` | Upload photos (multipart, up to 10) |
| GET | `/api/media` | List media (query: eventId, tag, search) |
| GET | `/api/media/:id` | Single photo with comments/likes |
| DELETE | `/api/media/:id` | Delete photo |
| POST | `/api/media/:id/like` | Like/unlike |
| POST | `/api/media/:id/comments` | Add comment |
| DELETE | `/api/media/comments/:id` | Delete comment |
| POST | `/api/media/:id/favourite` | Toggle favourite |

### Other
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/download/:mediaId` | Download with watermark |
| GET | `/api/search?q=` | Search events, photos, users |
| GET | `/api/notifications` | Get notifications |
| PUT | `/api/notifications/read` | Mark all read |
| GET | `/api/users/profile/:id` | User profile + uploads |
| GET | `/api/users/admin/stats` | Platform stats (Admin) |
| PUT | `/api/users/:id/role` | Change user role (Admin) |

---

## 🚢 Deployment

### Backend → Railway
1. Push to GitHub
2. Railway → New Project → Deploy from GitHub → select `server/` folder
3. Add all environment variables from `.env`
4. Set start command: `npx prisma migrate deploy && npm start`
5. Generate domain → copy URL

### Frontend → Vercel
1. Vercel → New Project → Import GitHub repo → set Root Directory to `client`
2. Add environment variable: `VITE_API_URL=https://your-api.railway.app/api`
3. Deploy → get Vercel URL
4. Update `CLIENT_URL` on Railway to the Vercel URL

---

## 📁 Project Structure

```
event-media-platform/
├── client/                    # React frontend
│   ├── src/
│   │   ├── api/               # Axios config
│   │   ├── components/        # Navbar, LikeButton, CommentSection, NotificationBell
│   │   ├── context/           # AuthContext
│   │   └── pages/             # Login, Register, Events, EventDetail,
│   │                          # CreateEvent, Upload, PhotoDetail,
│   │                          # Search, Profile, AdminDashboard
│   └── package.json
│
└── server/                    # Express backend
    ├── prisma/
    │   └── schema.prisma      # DB schema
    ├── src/
    │   ├── config/            # Cloudinary config
    │   ├── helpers/           # Imagga AI tagger
    │   ├── middleware/        # JWT auth, role check
    │   └── routes/            # auth, events, media, download,
    │                          # notifications, search, users
    └── package.json
```

---

## 👥 Roles

| Role | Can Do |
|------|--------|
| **Admin** | Everything — manage users, delete any content, create events |
| **Photographer** | Create events, upload photos, social features |
| **Member** | View private events, social features, download |
| **Viewer** | View public events only, like/comment |

---

## 📦 Deliverables Checklist

- [x] GitHub repository with full source code
- [x] Deployed frontend (Vercel)
- [x] Deployed backend + database (Railway)
- [x] README with setup instructions
- [x] Database schema (Prisma schema + slide)
- [x] Architecture diagram (slide 5)
- [x] Presentation (10 slides)
- [ ] Demo video (record with Loom)

---

## 🙏 Credits

Built for CIG Open Summer Project.  
APIs used: [Cloudinary](https://cloudinary.com) · [Imagga](https://imagga.com)
