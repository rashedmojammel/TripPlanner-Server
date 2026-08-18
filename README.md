# TripPlanner — API Server (Backend)

Express + TypeScript REST API powering TripPlanner: trip catalog with filtering/pagination, Better Auth authentication (email/password + Google), and two agentic AI features built on Groq LLMs.

**🔗 Live API:** https://tripplanner-server-tclz.onrender.com
**🌐 Frontend:** https://trip-planner-client-navy.vercel.app
**📦 Frontend Repository:** https://github.com/rashedmojammel/TripPlanner-Client

> ⏳ Runs on Render's free tier — the first request after idle takes 30–60 seconds (cold start) !
> 

---

## Tech Stack

| Layer | Technology |
|---|---|
| Runtime | Node.js + Express + TypeScript |
| Database | MongoDB Atlas (Mongoose for trips) |
| Auth | Better Auth (MongoDB adapter, Google provider, admin plugin, session cookies) |
| Validation | Zod (all bodies and query params) |
| AI | Groq — `llama-3.3-70b-versatile` (answers/generation) + `llama-3.1-8b-instant` (intent extraction) |
| Deployment | Render |

---

## API Endpoints

### Auth — `/api/auth/*` (handled by Better Auth)
`sign-up/email`, `sign-in/email`, `sign-in/social` (Google), `get-session`, `sign-out`, and the Google OAuth callback. Sessions are cookie-based (`sameSite=none; secure` in production for the cross-origin Vercel ↔ Render setup).

### Trips — `/api/trips`
| Method | Path | Access | Description |
|---|---|---|---|
| GET | `/` | Public | List with `search`, `category`, `minPrice`, `maxPrice`, `sort`, `page`, `limit` |
| GET | `/mine` | Private | Current user's trips |
| GET | `/:id` | Public | Single trip + related trips (same category) |
| POST | `/` | Private | Create trip (`createdBy` taken from the session, never the body) |
| DELETE | `/:id` | Private | Delete own trip only (ownership enforced → 403 otherwise) |

List response shape: `{ data, total, page, totalPages }`.

### AI — `/api/ai`
| Method | Path | Access | Description |
|---|---|---|---|
| POST | `/generate` | Private | Generates `{ title, shortDescription, fullDescription }` from destination/duration/category with tone + length options (JSON-mode, retry on parse failure) |
| POST | `/chat` | Public | Agentic travel concierge — streams the reply as plain-text chunks |

**How the chat agent works (the agentic part):**
1. **Intent extraction** — a fast 8B model converts the user's message into structured filters (`category`, `maxPrice`, `minDays`, `maxDays`, `destination`).
2. **Tool use** — the server queries MongoDB with those filters (top 6 matches, fallback to top-rated).
3. **Grounded answer** — the 70B model answers using only those real trips, linking each as `[Title](/trips/<id>)`, streamed token-by-token. The model is instructed never to invent trips, prices, or details.

---

## Environment Variables

```env
PORT=5000
NODE_ENV=development                # "production" on Render (enables cross-site cookies)

MONGODB_URI=mongodb://<user>:<password>@<hosts>/tripplanner?ssl=true&replicaSet=...&authSource=admin
AUTH_DB_NAME=tripplanner

GROQ_API_KEY=gsk_...
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
BETTER_AUTH_SECRET=<32+ random characters>

BETTER_AUTH_URL=http://localhost:5000        # deployed backend URL in production
CLIENT_URL=http://localhost:3000             # deployed frontend URL in production
```

All variables are validated at startup (`config/env.ts`) — the server fails fast with a clear message if any are missing.

---

## Run Locally

```bash
# 1. Clone
git clone <this-repo-url>
cd tripplanner-server

# 2. Install
npm install

# 3. Configure
#    create .env as shown above (MongoDB Atlas URI, Groq key, Google OAuth credentials)

# 4. Seed the database (demo user + 18 realistic trips)
npm run seed

# 5. Start
npm run dev
# → http://localhost:5000/api/health
```

Demo user created by the seed: `demo@tripplanner.com` / `Demo1234!`

### Scripts
| Script | Purpose |
|---|---|
| `npm run dev` | Development server (tsx watch) |
| `npm run build` | Compile TypeScript → `dist/` |
| `npm start` | Run compiled server (production) |
| `npm run seed` | Reset + seed trips and demo user |

---

## Security Notes

- Passwords hashed by Better Auth; sessions are httpOnly cookies
- Google ID tokens verified server-side
- Zod validation on every input; ownership checks on mutations
- CORS locked to the configured `CLIENT_URL`; Better Auth `trustedOrigins` enforced
- Secrets only in environment variables (never committed — see `.gitignore`)

---

## Project Structure

```
src/
├── server.ts / app.ts       # entry + Express app (Better Auth mounted before express.json)
├── config/                  # env validation, DB connection
├── lib/auth.ts              # Better Auth configuration
├── models/Trip.ts           # Mongoose schema + indexes
├── validators/              # zod schemas (trips, ai)
├── services/                # trip filtering/pagination, AI service (Groq)
├── controllers/             # request handlers
├── middleware/              # requireAuth, validate, errorHandler
├── routes/                  # /api/trips, /api/ai
└── seed/                    # seed script (demo user + 18 trips)
```
