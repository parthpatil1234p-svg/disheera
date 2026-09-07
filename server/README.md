# CareerPath AI — Backend API Documentation

> **Hack2Ignite 2026–27 · Team 404 Brain Not Found**  
> *Node.js + Express.js REST API · MongoDB Atlas / Local · JWT Authentication · Deterministic Recommendation Engine*

The `server/` directory contains the core application business logic, data models, recommendation algorithms, and RESTful API endpoints for CareerPath AI.

---

## 🏗️ Architecture & Technology Stack

- **Runtime:** Node.js (v18+)
- **Framework:** Express.js 4.x (CommonJS syntax)
- **Database:** MongoDB Atlas Free Tier (M0) or local MongoDB Community Server
- **Object Modeling:** Mongoose 8.x
- **Authentication:** JSON Web Tokens (`jsonwebtoken`) + Password Hashing (`bcryptjs`)
- **Security:** `helmet` (HTTP headers), `express-rate-limit` (anti-abuse), `cors` (origin validation)
- **Logging:** `morgan` (HTTP request logger)

---

## 📁 Directory Structure

```text
server/
├── server.js                        ← Application entry point & route registration
├── package.json                     ← Dependencies & NPM scripts ("start", "dev", "seed")
├── render.yaml                      ← Render Web Service deployment blueprint
├── .env.example                     ← Template for required environment variables
├── .env                             ← Local configuration (NEVER commit to Git)
├── seed.js                          ← Database seeding CLI script
├── config/
│   └── db.js                        ← MongoDB connection manager with auto-reconnect
├── models/
│   ├── User.js                      ← Student account & assessment schema
│   ├── Skill.js                     ← Standardized skills with categories and indexes
│   ├── Career.js                    ← Career definitions with required skill references
│   ├── Roadmap.js                   ← Personalized learning roadmaps
│   └── RoadmapTask.js               ← Actionable weekly milestone tasks
├── controllers/                     ← Request handler logic
├── routes/                          ← API route declarations
├── services/
│   ├── recommendationService.js     ← Deterministic scoring & skill-gap engine
│   └── roadmapService.js            ← Dynamic curriculum generator
├── middleware/                      ← JWT protection, input validators, error handling
└── data/                            ← Standardized seed datasets (35+ skills, 5 careers)
```

---

## ⚙️ Setup & Local Installation

### 1. Install Dependencies
```bash
cd server
npm install
```

### 2. Configure Environment Variables
Copy the template and configure your local settings:
```bash
cp .env.example .env
```

Ensure `server/.env` includes:
```env
PORT=5000
NODE_ENV=development
MONGODB_URI=mongodb://localhost:27017/careerpath-ai
JWT_SECRET=replace_with_a_long_random_secret
JWT_EXPIRES_IN=7d
CLIENT_URL=http://localhost:5500
```

### 3. Seed Database Collections
Populate the database with 35+ standardized skills and 5 target industry careers:
```bash
npm run seed
```

### 4. Start Development Server
```bash
npm run dev
```
The server will listen at **[http://localhost:5000](http://localhost:5000)**.

---

## 📋 Environment Variables Reference

| Variable | Required | Purpose | Default / Example Placeholder |
| :--- | :--- | :--- | :--- |
| `PORT` | No | Port on which Express server listens | `5000` (Local) / `10000` (Render) |
| `NODE_ENV` | Yes | Environment mode | `development` or `production` |
| `MONGODB_URI` | Yes | MongoDB Atlas or Local connection URI | `mongodb+srv://<user>:<pass>@cluster.mongodb.net/careerpath-ai` |
| `JWT_SECRET` | Yes | Secret key used to sign and verify JWT tokens | `replace_with_a_long_random_secret` |
| `JWT_EXPIRES_IN`| No | Token validity duration | `7d` |
| `CLIENT_URL` | Yes | Allowed frontend origin for CORS policies | `http://localhost:5500` or `https://YOUR-APP.vercel.app` |

---

## 🔐 Authentication & Authorization Flow

CareerPath AI uses stateless JWT Bearer authorization:
1. **Registration / Login:** The client sends credentials to `/api/auth/register` or `/api/auth/login`.
2. **Token Generation:** Upon successful verification, the server generates a signed JWT payload (`{ id: user._id }`).
3. **Protected Requests:** The client attaches the token in the `Authorization` header:
   ```text
   Authorization: Bearer <JWT_TOKEN>
   ```
4. **Token Verification:** `authMiddleware.js` verifies the signature and attaches `req.user` to the request context.

---

## 📡 API Endpoint Overview

| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/health` | Public | System uptime & health telemetry |
| `GET` | `/api/version` | Public | API version and runtime mode |
| `POST` | `/api/auth/register` | Public | Create student account and return token |
| `POST` | `/api/auth/login` | Public | Authenticate student and return token |
| `GET` | `/api/users/me` | Protected | Fetch current student profile |
| `PUT` | `/api/assessment` | Protected | Submit/update education, interests, and skills |
| `GET` | `/api/careers` | Public | Fetch all 5 target career paths |
| `GET` | `/api/careers/:slug` | Public | Fetch career details with required skills |
| `POST` | `/api/recommendations/generate` | Protected | Compute top 3 recommendations and skill gaps |
| `POST` | `/api/roadmaps/generate` | Protected | Generate 4/8/12-week roadmap |
| `GET` | `/api/roadmaps/current` | Protected | Fetch active roadmap and tasks |
| `PATCH`| `/api/roadmaps/tasks/:taskId/toggle`| Protected | Toggle completion of a milestone task |
| `DELETE`| `/api/roadmaps/current` | Protected | Archive current active roadmap |
| `GET` | `/api/dashboard` | Protected | Unified telemetry & upcoming tasks |

---

## 🧮 Career Scoring Formula

Recommendations are calculated using a 100% deterministic, explainable algorithm:

$$\text{Career Match Score} = (\text{Skill Match} \times 0.60) + (\text{Interest Match} \times 0.25) + (\text{Education Match} \times 0.15)$$

- **Skill Match (60%):** Weighted based on required importance (High=3, Med=2, Low=1) and student proficiency (Beg=1, Int=2, Adv=3).
- **Interest Match (25%):** Jaccard index between user interests and career domain tags.
- **Education Match (15%):** Degree alignment match score.

---

## 📦 Standard Error Response Format

All error responses adhere to a consistent JSON schema:
```json
{
  "success": false,
  "message": "Human-readable error description",
  "errors": []
}
```

---

## ☁️ Render Deployment Instructions

1. Connect your GitHub repository to [Render](https://render.com/).
2. Create a new **Web Service**.
3. Configure settings:
   - **Root Directory:** `server`
   - **Environment:** `Node`
   - **Build Command:** `npm install`
   - **Start Command:** `npm start`
4. In the Render dashboard, securely add the environment variables specified in `server/render.yaml`.
5. Deploy and verify `/api/health`.

---

## 🛠️ Troubleshooting Common Backend Errors

| Error | Root Cause | Solution |
| :--- | :--- | :--- |
| `ECONNREFUSED 127.0.0.1:27017` | Local MongoDB daemon is stopped. | Run `Start-Service MongoDB` (Windows) or `mongod`. |
| `EADDRINUSE :::5000` | Another process is holding port 5000. | Terminate the occupying process or change `PORT` in `.env`. |
| `jwt must be provided` | Missing `Authorization` header. | Supply header: `Authorization: Bearer <token>`. |
| `Blocked by CORS policy` | Origin mismatch between client and server. | Update `CLIENT_URL` in `server/.env` to include frontend origin. |
| `No active career profiles available` | Database has not been seeded. | Run `npm run seed` in the `server/` directory. |
