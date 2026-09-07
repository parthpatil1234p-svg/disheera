# Backend Schema & Data Dictionary — CareerPath AI

> **Status:** Draft / To be validated during qualifier  
> **Hack2Ignite 2026–27 · Round 1 MVP**  
> **Domain:** EduTech / AI for Good  
> **Team:** 404 Brain Not Found  
> **Primary Author:** Parth Patil (Backend Architect)

This document defines the complete MongoDB document schemas, relationships, indexing strategies, and API response structures for CareerPath AI.

---

## 1. Database Overview

- **Engine:** MongoDB (Atlas M0 Free Tier / Local Community Edition).
- **Driver / ODM:** Mongoose 8.x.
- **Connection Strategy:** Singleton client pattern with TLS encryption and automatic retry logic in `server/config/db.js`.

---

## 2. Mongoose Schemas & Data Models

### 2.1 User Model (`User.js`)
Represents registered student accounts and their dynamic assessment profile.

| Field | Type | Required | Default | Description |
| :--- | :--- | :--- | :--- | :--- |
| `name` | String | Yes | — | Student's full name |
| `email` | String | Yes | — | Unique, lowercase email (Indexed) |
| `password` | String | Yes | — | Salted bcrypt password hash (min 6 chars) |
| `education` | Object | No | `{}` | Subdocument: `{ degree, fieldOfStudy, graduationYear }` |
| `interests` | [String] | No | `[]` | Array of chosen domain interest tags |
| `skills` | [Object] | No | `[]` | Array of `{ name, proficiency: 'beginner'\|'intermediate'\|'advanced' }` |
| `careerGoals` | String | No | `""` | Free-text student career aspirations |
| `profileCompleted` | Boolean | No | `false` | Flag indicating assessment submission |
| `timestamps` | Date | Auto | `now` | `createdAt` and `updatedAt` |

---

### 2.2 Skill Model (`Skill.js`)
Catalog of standardized technical and professional skills.

| Field | Type | Required | Description |
| :--- | :--- | :--- | :--- |
| `name` | String | Yes | Display name of the skill (e.g., "JavaScript") |
| `slug` | String | Yes | URL-friendly unique identifier (e.g., "javascript") (Indexed) |
| `category` | String | Yes | Category: Frontend, Backend, Database, Cloud, Security, Data, Design, Soft Skills |
| `description` | String | No | Brief explanation of the skill |

---

### 2.3 Career Model (`Career.js`)
Standardized industry tech roles and their prerequisite skill vectors.

| Field | Type | Required | Description |
| :--- | :--- | :--- | :--- |
| `title` | String | Yes | Career title (e.g., "Front-End Developer") |
| `slug` | String | Yes | Unique identifier (e.g., "front-end-developer") (Indexed) |
| `description` | String | Yes | Industry role summary |
| `requiredSkills` | [Object] | Yes | Array of `{ skill: ObjectId(ref Skill), importance: 'high'\|'medium'\|'low', minimumProficiency: 'beginner'\|'intermediate'\|'advanced' }` |
| `preferredEducation` | [String] | No | Target degrees (e.g., BCA, B.Tech, BSc CS) |
| `industryInterestTags`| [String] | Yes | Related domain tags (e.g., ["Web Development", "UI/UX"]) |

---

### 2.4 Roadmap Model (`Roadmap.js`)
Time-boxed learning curriculum customized to student skill gaps.

| Field | Type | Required | Description |
| :--- | :--- | :--- | :--- |
| `user` | ObjectId | Yes | Reference to User document (Indexed) |
| `career` | ObjectId | Yes | Reference to Career document |
| `durationWeeks` | Number | Yes | Chosen timeline: 4, 8, or 12 weeks |
| `status` | String | Yes | Status: `active`, `completed`, or `archived` |
| `progressPercentage`| Number | No (0) | Dynamically calculated completion percentage |
| `totalTasks` | Number | No (0) | Total actionable tasks in roadmap |
| `completedTasks` | Number | No (0) | Total tasks marked complete |

---

### 2.5 RoadmapTask Model (`RoadmapTask.js`)
Granular, actionable weekly learning tasks.

| Field | Type | Required | Description |
| :--- | :--- | :--- | :--- |
| `roadmap` | ObjectId | Yes | Reference to Roadmap document (Indexed) |
| `user` | ObjectId | Yes | Reference to User document (Indexed) |
| `weekNumber` | Number | Yes | Week milestone number (1 to 12) |
| `title` | String | Yes | Task title (e.g., "Master CSS Grid & Flexbox") |
| `description` | String | No | Detailed learning objectives and practice exercises |
| `skillTag` | String | Yes | Associated skill name |
| `priority` | String | Yes | `high`, `medium`, or `low` |
| `resources` | [Object] | No | Array of `{ title, url, type: 'documentation'\|'tutorial'\|'project' }` |
| `completed` | Boolean | Yes (false) | Task completion state |
| `completedAt` | Date | No | Timestamp of completion |

---

## 3. Database Indexing Strategy

- `User.email`: Unique index for $O(1)$ credential lookups.
- `Skill.slug`: Unique index for fast relationship resolution.
- `Career.slug`: Unique index for catalog routing.
- `Roadmap.user + status`: Compound index for querying a student's active roadmap.
- `RoadmapTask.roadmap + weekNumber`: Compound index for milestone ordering.

---

## 4. API Conventions & Standard Payloads

### Standard Success Response (`200 OK` / `201 Created`)
```json
{
  "success": true,
  "message": "Career recommendations generated successfully",
  "data": { ... }
}
```

### Standard Error Response (`400 Bad Request` / `401 Unauthorized` / `404 Not Found`)
```json
{
  "success": false,
  "message": "Please select a career from your top recommendations",
  "errors": []
}
```
