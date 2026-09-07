# Postman API Collection — CareerPath AI

> **Hack2Ignite 2026–27 · Team 404 Brain Not Found**  
> *API Testing & Verification Guide*

This directory contains the official Postman API collection for testing, validating, and demonstrating the CareerPath AI RESTful API.

---

## 📁 Collection File

- **File:** [`CareerPath-AI.postman_collection.json`](CareerPath-AI.postman_collection.json)
- **Format:** Postman Collection v2.1 (Standard JSON)

---

## ⚙️ Collection Variables

Importing the collection provides three pre-configured collection variables:

| Variable | Default Value | Purpose |
| :--- | :--- | :--- |
| `baseUrl` | `http://localhost:5000` | The base URL for the backend API (change to your Render URL for cloud testing) |
| `token` | `""` (Empty string) | Automatically populated with the signed JWT token upon registering or logging in |
| `taskId` | `""` (Empty string) | Populated with a specific roadmap task ObjectId for task toggling tests |

---

## 🔄 Intended Endpoint Execution Order

To execute an end-to-end API test cycle, run requests in this sequence:

1. **System Health & Meta:**
   - `GET {{baseUrl}}/api/health` → Expect `200 OK`
   - `GET {{baseUrl}}/api/version` → Expect `200 OK`
2. **Catalog Verification:**
   - `GET {{baseUrl}}/api/careers` → Returns 5 seeded industry career paths
   - `GET {{baseUrl}}/api/careers/front-end-developer` → Returns specific career details
3. **Authentication:**
   - `POST {{baseUrl}}/api/auth/register` (or `POST {{baseUrl}}/api/auth/login`) → **Automatically captures and sets `{{token}}`**
4. **User Profile & Assessment:**
   - `GET {{baseUrl}}/api/users/me` → Returns user profile
   - `PUT {{baseUrl}}/api/assessment` → Submits education, interests, and skills
5. **Recommendations Engine:**
   - `POST {{baseUrl}}/api/recommendations/generate` → Generates top 3 career matches and skill gaps
6. **Roadmap Synthesis & Progress:**
   - `POST {{baseUrl}}/api/roadmaps/generate` → Generates personalized 4/8/12-week roadmap
   - `GET {{baseUrl}}/api/roadmaps/current` → Retrieves active roadmap tasks
   - `PATCH {{baseUrl}}/api/roadmaps/tasks/{{taskId}}/toggle` → Toggles task completion and recalculates %
7. **Dashboard Telemetry:**
   - `GET {{baseUrl}}/api/dashboard` → Returns user telemetry, upcoming tasks, and next action
8. **Roadmap Cleanup:**
   - `DELETE {{baseUrl}}/api/roadmaps/current` → Archives active roadmap

---

## 🚀 How to Import & Run

1. Open Postman.
2. Click **Import** (top left).
3. Select or drag-and-drop `postman/CareerPath-AI.postman_collection.json`.
4. In the collection settings, ensure the `baseUrl` variable points to your target backend (`http://localhost:5000` or your deployed Render URL).
5. Run the requests sequentially.
