# Plan 47: Browser Voice AI Support Agent, WhatsApp Ticket Relay & Admin Telemetry Suite

> **Disheera · Enterprise Architecture Plan**  
> **Status:** ⏳ Ready for Execution (Planning Complete · Awaiting User Execution Approval)  
> **Target Release:** v4.8 Voice Support Platform  
> **Primary Physical Codebase:** `P:\Startup✔️\disheera\disheera` (Junction: `C:\Users\PARTH\OneDrive\Documents\hackethon\Hack 2 ignite\CareerPath AI\disheera`)

---

## 1. Executive Summary & Context

Disheera requires a real-time, browser-based **Voice AI Support Agent** embedded directly into the platform to handle technical, academic, roadmap, and grievance queries from students with zero friction.

### Key Objectives & User Alignment
1. **Real-Time Browser Call Agent**: Operates in the browser via modern Web Audio / `MediaRecorder` APIs. Powered by **Dual-Engine Architecture**: **Groq LPU** (Whisper STT + Llama-3.3-70b-versatile) for sub-second (<300ms) voice interaction, with automatic graceful fallback to **Google Gemini 2.0 Flash**.
2. **Total Replacement of Legacy Phone Telephony**: Deprecate and remove the unconfigured Sarvam outbound phone call service (`sarvamVoiceService.js`, Sarvam routes, and obsolete test scripts), replacing it with the new Browser Voice AI Support Agent.
3. **Strict Domain Guardrails**: The agent answers questions **ONLY** regarding the Disheera platform (roadmaps, assignments, AI grading, proctoring, certificates, skill radar, recruiter applications, and authentication). All out-of-domain queries (general chit-chat, outside politics, unrelated school homework) are politely rejected with a return-to-platform guidance.
4. **Automated Ticket Creation & WhatsApp Relay**: If a student's problem cannot be resolved by the agent or if the user requests human grievance intervention:
   - The agent automatically generates an official ticket (`CP-TKT-XXXXXX`).
   - Dispatches an instant WhatsApp confirmation message to the student's mobile number.
   - Dispatches a high-priority grievance alert to the Disheera Support Lead (+91 74990 85045).
   - Verbally informs the student of their Ticket ID during the call.
5. **Strict Authentication Gate**: The call agent functions **ONLY when the user is logged in**. It verifies the session using `careerpath_token` and extracts student details from `careerpath_user` in `localStorage` (as confirmed in the client storage audit). If the user’s registered phone number is missing, the agent voice-prompts them to provide their 10-digit WhatsApp number to enable ticket creation.
6. **Admin Dashboard Telemetry**: Call sessions, durations, statuses, full time-stamped text transcripts, and audio recordings are securely logged and surfaced in a dedicated **Voice Support Cockpit** on `admin.disheera.site` with an in-browser audio player.

---

## 2. Technical Architecture & Data Flow

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                             STUDENT BROWSER                                 │
│  - localStorage Auth Check: careerpath_token & careerpath_user             │
│  - Floating Voice Widget & Light-Theme Call Modal (#FFFFFF / #2563EB)      │
│  - Audio Stream: Web Audio API & MediaRecorder (16kHz Mono PCM/Opus)        │
└─────────────────────────────────────┬───────────────────────────────────────┘
                                      │ Audio Chunks / REST / WebSockets
                                      ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                    DISHEERA BACKEND (Node.js / Express)                     │
│  Endpoint: /api/voice/session & /api/voice/interact                         │
│                                                                             │
│  [1. Auth Middleware]   ──► Verifies JWT & extracts student ID/phone        │
│  [2. Audio Processing]  ──► 16kHz mono resampling & saves call recording    │
│  [3. Dual-Engine LLM]   ──► Groq Whisper (<150ms) + Llama 3.3 70B (<200ms)  │
│                             Fallback: Google Gemini 2.0 Flash               │
│  [4. Domain Guardrails] ──► Disheera System Boundary Validation             │
│  [5. Ticket Escalator]  ──► Generates CP-TKT-XXXXXX on unresolvable query  │
└───────────────────────┬───────────────────────────────┬─────────────────────┘
                        │                               │
                        ▼                               ▼
┌───────────────────────────────────┐   ┌─────────────────────────────────────┐
│         WHATSAPP SERVICE          │   │           DATABASE & ADMIN          │
│ - Instant WhatsApp to Student     │   │ - PostgreSQL Prisma: CallLog Model  │
│ - Instant WhatsApp to Support     │   │ - Server Storage: /uploads/calls/   │
│   Grievance Lead (+91 74990 85045)│   │ - Admin Cockpit (admin.disheera.site│
└───────────────────────────────────┘   └─────────────────────────────────────┘
```

---

## 3. Detailed Phase Breakdown (4 Phases)

### Phase 1: Database Schema, Storage & Legacy Telephony Purge
- **Deprecate & Remove Legacy Sarvam Phone Code**:
  - Delete `server/services/sarvamVoiceService.js`.
  - Clean `server/routes/voiceRoutes.js` of obsolete Sarvam outbound telephone endpoints.
  - Remove `server/scripts/testSarvamCall.js` and `server/tests/sarvam_voice_agent_test.js`.
- **Prisma Schema Extension (`server/prisma/schema.prisma`)**:
  - Add `CallLog` model:
    ```prisma
    model CallLog {
      id              String    @id @default(cuid())
      userId          String
      user            User      @relation(fields: [userId], references: [id], onDelete: Cascade)
      userName        String
      userEmail       String
      userPhone       String
      durationSeconds Int       @default(0)
      status          String    @default("RESOLVED") // "RESOLVED", "ESCALATED_TICKET", "ABANDONED"
      ticketId        String?
      transcript      Json      // Array of { speaker, text, timestamp }
      recordingUrl    String?   // Local or hosted audio recording path
      createdAt       DateTime  @default(now())
      updatedAt       DateTime  @updatedAt

      @@index([userId])
      @@index([status])
      @@index([createdAt])
    }
    ```
  - Run `npx prisma db push` and `npx prisma generate`.
- **Audio Storage Setup**:
  - Create secure local directory `server/uploads/calls/` for temporary or persistent call audio blobs with access control.

### Phase 2: Dual-Engine Core Service, Ticket Escalation & WhatsApp Relay
- **New Service: `server/services/browserVoiceSupportService.js`**:
  - **Speech-to-Text**: Groq Whisper (`whisper-large-v3-turbo` / `whisper-large-v3`) with 16kHz mono audio normalization.
  - **Support Intelligence**: Groq `llama-3.3-70b-versatile` with prompt system boundary:
    - Grounding: Disheera features (Roadmaps, Code Chamber, Assignments, Proximity Radar, Skill Passports, Proctoring, Resume Builder).
    - Hard Domain Wall: Strictly reject external queries (e.g. *"I am your Disheera Support Guide. I can only assist with Disheera courses, roadmaps, assignments, and platform features."*).
  - **Failover**: Automatic fallback to `callGemini()` (`gemini-2.0-flash`) if Groq hits rate limits or network timeout.
  - **Ticket Escalation Trigger**: If student requests human support or query cannot be answered:
    - Triggers `supportController.createTicket()`.
    - Dispatches student WhatsApp confirmation via `whatsappService.js`.
    - Dispatches Grievance Lead alert (+91 74990 85045) via `whatsappService.js`.
    - Generates ticket confirmation payload with speech synthesis text.
- **REST / Audio Streaming Endpoints (`server/routes/voiceRoutes.js`)**:
  - `POST /api/voice/session/start`: Requires `authMiddleware`, initializes call record, returns session ID.
  - `POST /api/voice/interact`: Accepts audio blob or text transcript, runs Groq/Gemini, returns agent response audio/text + escalation flags.
  - `POST /api/voice/session/end`: Closes session, calculates duration, commits final recording and transcript to Prisma `CallLog`.

### Phase 3: Client Voice Support Interface (Widget & Modal)
- **Client Script: `client/js/voice-support-agent.js`**:
  - Session verification: Checks `careerpath_token` and `careerpath_user` from `localStorage`.
  - Non-logged-in handling: If student is not logged in, pops an auth alert and guides to login.
  - Web Audio recording: Captures user mic with `MediaRecorder` in clean chunks.
  - Speech Synthesis / Audio Player: Seamless playback of agent voice responses.
  - Live Audio Waveform & Speech Visualizer animation.
- **UI Markup & Theme Compliance**:
  - Floating Call Trigger button (bottom-right above footer across `support.html`, `dashboard.html`, `roadmap.html`).
  - Strict adherence to **Light Theme Only** (`#F8FAFC` background, `#FFFFFF` cards, `#2563EB` Royal Blue accents, `#0F172A` text; never pitch-dark or neon).
  - Responsive Call Sheet with Mute, Speaker, End Call, and Live Transcript buttons.

### Phase 4: Admin Dashboard Telemetry & Pre-Flight Verification
- **Admin Dashboard Integration (`disheera/admin-client`)**:
  - Add **Voice Support Cockpit** navigation item to sidebar in `admin-client/index.html`.
  - Create `admin-client/js/modules/callsView.js`:
    - KPI cards: Total Calls, Avg Duration, Resolved Rate, Escalated Tickets.
    - Data table listing all call sessions with search/filter (by student name, phone, ticket ID, status).
    - Built-in HTML5 Audio Player to listen to call recordings directly in the browser.
    - Modal to read full turn-by-turn conversation transcript.
  - Admin backend endpoints: `GET /api/admin/calls` & `GET /api/admin/calls/:id`.
- **End-to-End Automated Testing**:
  - Create `server/tests/browser_voice_support_agent_test.js`:
    - Test 1: Unauthorized access rejection (calls without `careerpath_token` blocked).
    - Test 2: Audio STT & Groq response latency benchmark (< 500ms).
    - Test 3: Out-of-domain rejection test (e.g. asking about world politics).
    - Test 4: Support ticket creation & WhatsApp dispatch simulation.
    - Test 5: CallLog persistence in Supabase PostgreSQL & retrieval in Admin API.
  - Zero-breaking changes to local dev server (`npm start` on `localhost:5000`).

---

## 4. Verification & Acceptance Criteria
- [ ] Non-logged-in users cannot access the Voice Support Agent (redirects to login).
- [ ] Dual-engine STT + LLM response latency under 500ms using Groq, with seamless Gemini fallback.
- [ ] Strictly rejects questions outside Disheera platform.
- [ ] Generates ticket `#CP-TKT-XXXXXX` and sends WhatsApp confirmation when escalation is needed.
- [ ] Call logs and audio recordings appear in `admin.disheera.site` with playable audio and transcript viewer.
- [ ] Zero pitch-dark backgrounds; 100% compliant with Disheera Light Theme standards.
