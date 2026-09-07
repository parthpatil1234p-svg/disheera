# Comprehensive Backend Schema & API Reference

**Database:** MongoDB Atlas (Mongoose ODM)  
**Architecture:** Node.js / Express.js REST API

## 1. Mongoose Schemas (Detailed)

### `User` Model
```javascript
const UserSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true },
  password: { type: String, required: true, select: false }, // Hidden by default
  role: { type: String, enum: ['student', 'admin'], default: 'student' },
  
  // Profile specific
  academicInfo: {
    course: { type: String, default: '' },
    branch: { type: String, default: '' },
    year: { type: Number, default: 1 }
  },
  interests: [{ type: String }],
  
  // Array of Subdocuments
  skills: [{
    skillId: { type: mongoose.Schema.Types.ObjectId, ref: 'Skill' },
    proficiency: { type: Number, enum: [1, 2, 3], required: true } // 1:Beg, 2:Int, 3:Adv
  }]
}, { timestamps: true });
```

### `Skill` Model
```javascript
const SkillSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true }, // e.g., "React", "Python"
  category: { type: String, required: true }, // e.g., "Frontend", "Backend", "Soft Skills"
  iconUrl: { type: String, default: '' } // Optional for UI mapping
});
```

### `Career` Model
```javascript
const CareerSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  tags: [{ type: String }], // Used for interest matching
  
  requiredSkills: [{
    skillId: { type: mongoose.Schema.Types.ObjectId, ref: 'Skill' },
    importance: { type: Number, enum: [1, 2, 3], required: true }, // 1:Low, 2:Med, 3:High
    minProficiency: { type: Number, enum: [1, 2, 3], required: true }
  }]
});
```

### `Roadmap` & `RoadmapTask` Model
```javascript
const RoadmapSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  careerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Career', required: true },
  targetWeeks: { type: Number, required: true },
  progressPercentage: { type: Number, default: 0 }
}, { timestamps: true });

const RoadmapTaskSchema = new mongoose.Schema({
  roadmapId: { type: mongoose.Schema.Types.ObjectId, ref: 'Roadmap', required: true },
  weekNumber: { type: Number, required: true },
  skillId: { type: mongoose.Schema.Types.ObjectId, ref: 'Skill' },
  title: { type: String, required: true }, // e.g., "Learn React Hooks"
  resources: [{
    type: { type: String, enum: ['video', 'article', 'course'] },
    title: { type: String },
    url: { type: String }
  }],
  isCompleted: { type: Boolean, default: false }
});
```

---

## 2. API Endpoints Dictionary

*All protected routes require standard HTTP header: `Authorization: Bearer <token>`*

### Auth Routes
| Method | Endpoint | Description | Payload Body (JSON) | Returns (JSON) |
| :--- | :--- | :--- | :--- | :--- |
| **POST** | `/api/auth/register` | Create a new student account | `{ name, email, password }` | `{ msg: "Success", token: "jwt..." }` |
| **POST** | `/api/auth/login` | Log in and get token | `{ email, password }` | `{ msg: "Success", token: "jwt..." }` |

### Profile & Setup Routes
| Method | Endpoint | Description | Payload Body (JSON) | Returns (JSON) |
| :--- | :--- | :--- | :--- | :--- |
| **GET**  | `/api/profile/me` | Fetch logged-in user profile | `None` (Use Token) | `{ user: { ...profileData } }` |
| **PUT**  | `/api/profile/setup` | Save onboarding data (academics, skills, interests) | `{ academicInfo: {}, interests: [], skills: [{skillId, proficiency}] }` | `{ msg: "Profile updated" }` |

### Career & Engine Routes
| Method | Endpoint | Description | Payload Body (JSON) | Returns (JSON) |
| :--- | :--- | :--- | :--- | :--- |
| **GET**  | `/api/careers/recommendations` | Execute Algorithm. Return Top 3 careers. | `None` (Runs against Token data) | `[{ career: {}, matchScore: 89, gaps: [] }, ... ]` |
| **GET**  | `/api/careers/:id` | Get specific career detail | `None` | `{ career: {}, required: [], optional: [] }` |

### Roadmap Routes
| Method | Endpoint | Description | Payload Body (JSON) | Returns (JSON) |
| :--- | :--- | :--- | :--- | :--- |
| **POST** | `/api/roadmaps/generate` | Build tasks based on gaps | `{ careerId, targetWeeks: 8 }` | `{ roadmapId: "xyz123" }` |
| **GET**  | `/api/roadmaps/:id` | Fetch roadmap and populated tasks | `None` | `{ roadmap: {}, tasks: [ {Week1}, {Week2} ] }` |
| **PUT**  | `/api/roadmaps/tasks/:taskId` | Toggle completion status | `{ isCompleted: true }` | `{ newProgressPercentage: 25 }` |

## 3. Database Indexes for Performance
To ensure NFR-1 (Sub 800ms matching):
*   Create Index on `User.email` (Unique).
*   Create Compound Index on `RoadmapTask({ roadmapId: 1, weekNumber: 1 })` since tasks will always be queried and sorted by week per roadmap.
