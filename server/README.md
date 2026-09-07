# CareerPath AI — Backend Server

> Node.js + Express.js REST API · MongoDB Atlas · JWT Authentication

---

## 📁 Folder Structure

```
server/
├── server.js               ← Express entry point
├── package.json
├── .env.example            ← Copy this to .env and fill in values
├── .gitignore
├── config/
│   └── db.js               ← MongoDB Atlas connection
├── models/
│   └── User.js             ← Mongoose user schema
├── controllers/
│   ├── authController.js   ← Register & login logic
│   └── userController.js   ← Get & update profile logic
├── routes/
│   ├── authRoutes.js       ← POST /api/auth/register, /login
│   └── userRoutes.js       ← GET/PUT /api/users/me
├── middleware/
│   ├── authMiddleware.js   ← JWT protect + role authorize
│   ├── validateRequest.js  ← Input validation
│   └── errorMiddleware.js  ← Global error handler
└── utils/
    └── generateToken.js    ← JWT token creator
```

---

## ⚙️ Setup

### Step 1 — Install dependencies

```powershell
cd server
npm install
```

### Step 2 — Create your `.env` file

```powershell
# Windows
Copy-Item .env.example .env
```

Open `.env` and fill in these values:

```env
PORT=5000
NODE_ENV=development
MONGODB_URI=mongodb+srv://<user>:<pass>@<cluster>.mongodb.net/careerpath-ai?retryWrites=true&w=majority
JWT_SECRET=your_long_random_secret_here
JWT_EXPIRES_IN=7d
CLIENT_URL=http://localhost:5500
```

### Step 3 — Create a MongoDB Atlas cluster

1. Go to [cloud.mongodb.com](https://cloud.mongodb.com) and sign in.
2. Click **Build a Database** → choose **M0 Free Tier**.
3. Go to **Database Access** → Add a database user (username + password).
4. Go to **Network Access** → Add IP Address → `0.0.0.0/0` (allow all, fine for hackathon).
5. Click **Connect** on your cluster → **Drivers** → copy the URI.
6. Paste the URI into your `.env` as `MONGODB_URI`, replacing `<username>` and `<password>`.

### Step 4 — Generate a secure JWT_SECRET

```powershell
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Copy the output into `JWT_SECRET` in your `.env`.

---

## ▶️ Running the Server

```powershell
# Development (auto-restart on file changes)
npm run dev

# Production
npm start
```

The server starts on: **http://localhost:5000**

---

## 🌐 API Endpoints

### Health Check

| Method | Endpoint       | Auth | Description              |
|--------|----------------|------|--------------------------|
| GET    | `/api/health`  | No   | Verify server is running |

---

### Authentication

| Method | Endpoint               | Auth | Description      |
|--------|------------------------|------|------------------|
| POST   | `/api/auth/register`   | No   | Create account   |
| POST   | `/api/auth/login`      | No   | Login & get JWT  |

---

### User Profile

| Method | Endpoint         | Auth | Description          |
|--------|------------------|------|----------------------|
| GET    | `/api/users/me`  | Yes  | Get my profile       |
| PUT    | `/api/users/me`  | Yes  | Update my profile    |

**Auth header format:**
```
Authorization: Bearer <your_jwt_token>
```

---

## 🔬 Example curl Commands

### 1. Health Check
```bash
curl http://localhost:5000/api/health
```

### 2. Register
```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d "{\"name\": \"Parth Patil\", \"email\": \"parth@example.com\", \"password\": \"password123\"}"
```

### 3. Login
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d "{\"email\": \"parth@example.com\", \"password\": \"password123\"}"
```

### 4. Get Profile (replace TOKEN)
```bash
curl http://localhost:5000/api/users/me \
  -H "Authorization: Bearer TOKEN"
```

### 5. Update Profile (replace TOKEN)
```bash
curl -X PUT http://localhost:5000/api/users/me \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer TOKEN" \
  -d "{\"education\": {\"course\": \"B.Tech\", \"branch\": \"CSE\", \"year\": \"3rd\", \"college\": \"PVPIT\"}, \"interests\": [\"Web Development\", \"AI/ML\"], \"skills\": [{\"name\": \"JavaScript\", \"proficiency\": \"intermediate\"}, {\"name\": \"Python\", \"proficiency\": \"beginner\"}], \"careerGoals\": [\"Get a job at a product startup\"]}"
```

---

## 🧪 Postman Test Sequence

1. **Health Check** → `GET http://localhost:5000/api/health`
   - Expected: `200 OK`, `"success": true`

2. **Register** → `POST http://localhost:5000/api/auth/register`
   - Body (JSON): `{ "name": "Parth Patil", "email": "parth@example.com", "password": "password123" }`
   - Expected: `201 Created`, token in response

3. **Login** → `POST http://localhost:5000/api/auth/login`
   - Body (JSON): `{ "email": "parth@example.com", "password": "password123" }`
   - Expected: `200 OK`, token in response

4. **Copy the token** from the login response `data.token`

5. **Get Profile** → `GET http://localhost:5000/api/users/me`
   - Header: `Authorization: Bearer <token>`
   - Expected: `200 OK`, user object, `profileCompleted: false`

6. **Update Profile** → `PUT http://localhost:5000/api/users/me`
   - Header: `Authorization: Bearer <token>`
   - Body (JSON):
     ```json
     {
       "education": { "course": "B.Tech", "branch": "CSE", "year": "3rd", "college": "PVPIT" },
       "interests": ["Web Development"],
       "skills": [{ "name": "JavaScript", "proficiency": "intermediate" }]
     }
     ```
   - Expected: `200 OK`, `profileCompleted: true`

7. **Get Profile Again** → `GET http://localhost:5000/api/users/me`
   - Expected: `200 OK`, `profileCompleted: true`, updated fields visible

---

## 🔒 Security Notes

| Concern | How we handle it |
|---|---|
| Password storage | bcrypt with 12 salt rounds — never stored as plain text |
| Password exposure | `select: false` on schema — never returned in any response |
| JWT storage | Stored in `localStorage` on the client |
| Brute-force | express-rate-limit: 100 req / 15 min per IP |
| HTTP headers | helmet() sets security-related headers |
| CORS | Restricted to `CLIENT_URL` in production |
| Mass assignment | Only whitelisted fields accepted in profile update |
| User enumeration | Login returns identical 401 for unknown email and wrong password |

> ⚠️ **Hackathon MVP Note:** JWT is stored in `localStorage` for simplicity.
> In a production application, use **httpOnly cookies** with **CSRF protection** instead.
> `localStorage` tokens are vulnerable to XSS attacks.

---

## 🐛 Troubleshooting

### MongoDB connection fails
- Check that `MONGODB_URI` is set correctly in `.env`
- Check that your cluster's **Network Access** allows `0.0.0.0/0`
- Check that your database user credentials in the URI are correct
- Look at the full error message in the console

### CORS error in the browser
- Check that `CLIENT_URL` in `.env` matches exactly where your frontend is running
- VS Code Live Server default is `http://localhost:5500`
- Python server default is `http://localhost:3000`
- The URL must NOT have a trailing slash

### `Cannot find module` error
- Run `npm install` inside the `server/` folder
- Make sure you're running `node server.js` from inside `server/`, not from the root

### JWT invalid / expired
- Tokens expire after `JWT_EXPIRES_IN` (default 7 days)
- Log in again to get a fresh token
- Make sure the `Authorization` header format is exactly: `Bearer <token>`
