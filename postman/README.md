# Postman API Collection — Disheera

> **Disheera Technologies Inc. · Enterprise API Testing & Verification Suite**  
> *Official REST API Collection & Integration Guide*

This directory contains the official Postman API collection for testing, validating, and demonstrating the Disheera RESTful API across local development and production environments.

---

## 📁 Collection File

- **File:** [`Disheera.postman_collection.json`](Disheera.postman_collection.json)
- **Format:** Postman Collection v2.1 (Standard JSON)

---

## ⚙️ Collection Variables

Importing the collection provides three pre-configured collection variables:

| Variable | Default Value | Purpose |
| :--- | :--- | :--- |
| `baseUrl` | `http://localhost:5000` | The base URL for the backend API (change to `https://api.disheera.site` for cloud testing) |
| `token` | `""` (Empty string) | Automatically populated with the signed JWT token upon registering or logging in |
| `taskId` | `""` (Empty string) | Populated with a specific roadmap task ObjectId for task toggling tests |

---

## 🧪 Verification & Execution
To execute via Postman or Newman CLI:
```bash
newman run postman/Disheera.postman_collection.json --env-var baseUrl=http://localhost:5000
```
