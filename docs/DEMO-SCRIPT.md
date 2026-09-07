# CareerPath AI — Live Presentation & Demo Script (3–4 Minutes)

> **Hack2Ignite 2026–27 · Round 1 MVP**  
> Team: **404 Brain Not Found** · Domain: **EduTech / AI for Good**  
> Tagline: *Discover Your Career. Build Your Skills.*

---

## 👥 Speaker Division & Roles

| Speaker | Role in Demo | Time | Key Focus Areas |
| :--- | :--- | :--- | :--- |
| **Parth Patil** (Team Leader) | Lead Presenter & System Architect | 0:00 – 1:00 | Problem statement, introduction, backend architecture & deterministic scoring formula |
| **Suyog Pawar** | Frontend & Assessment Lead | 1:00 – 1:55 | User onboarding, student assessment, and recommendation generation |
| **Asmita Lokhande** | UI/UX & 3D Visuals Designer | 1:55 – 2:50 | 3D design philosophy, Skill Orbit, Milestone Path, and Progress Orb |
| **Aditi Vispute** | Roadmap, Data & Impact Lead | 2:50 – 3:45 | Curriculum personalization, live task completion, dashboard telemetry, social impact & conclusion |

---

## ⏱️ Step-by-Step Live Demo Flow (3–4 Minutes)

### Act 1: The Problem & Introduction (0:00 – 1:00)
**Speaker: Parth Patil**

- **[Screen: Landing Page Hero with 3D Career Universe]**
- *"Good morning/afternoon, esteemed judges! We are Team **404 Brain Not Found**, and today we are excited to present **CareerPath AI**.*
- *Over 70% of undergraduate students face analysis paralysis when choosing career paths in tech. Traditional career portals either give vague questionnaire results or dump generic 40-hour course links without understanding the student’s actual skill proficiency.*
- *CareerPath AI solves this by acting as an intelligent career compass: analyzing the student's unique academic background, domain interests, and technical proficiency to recommend the top 3 best-fit careers, map out their exact skill gaps, and generate a personalized, time-boxed learning roadmap.*
- *Under the hood, we built a robust, secure Node.js and Express backend on Render connected to MongoDB Atlas, backed by an accessible, responsive HTML5/Bootstrap and Three.js frontend."*

---

### Act 2: Assessment & Recommendation Engine (1:00 – 1:55)
**Speaker: Suyog Pawar**

- **[Screen: Click 'Start Assessment' → Login / Assessment Page]**
- *"Let's see it in action. A student logs in and opens our interactive assessment.*
- *Rather than simple yes/no questions, the student specifies their degree, selects areas of interest like Web Development and Cloud Computing, and chooses their current technical skills with explicit proficiency levels—such as HTML and CSS at Intermediate, and JavaScript at Beginner.*
- *When they click **'Find My Career Path'**, our backend evaluates their profile across 35+ industry skill vectors."*
- **[Screen: Recommendations Page Displays Top 3 Matches]**
- *"In less than 100 milliseconds, our deterministic algorithm ranks the top 3 best-fitting careers:*
  $$\text{Match Score} = (\text{Skill Match} \times 60\%) + (\text{Interest Match} \times 25\%) + (\text{Education Match} \times 15\%)$$
- *Notice our #1 match: **Front-End Developer at 81%**.*
- *Right below, our Skill-Gap Breakdown instantly classifies skills into: **Matched** (Green), **Needs Upgrade** (Amber), and **Missing** (Red). The student immediately knows what they already have and exactly what they lack."*

---

### Act 3: 3D Innovation & Visual Philosophy (1:55 – 2:50)
**Speaker: Asmita Lokhande**

- **[Screen: Interact with 3D Skill Orbit on Recommendations Page]**
- *"To make career exploration engaging rather than overwhelming, we designed four purposeful Three.js WebGL experiences:*
  1. *On the home page, the **Career Universe** lets students explore celestial career nodes.*
  2. *Here on recommendations, the **Skill Orbit** transforms abstract skill gaps into a planetary system—with the career at the center, surrounded by orbiting matched green planets, amber upgrade satellites, and red missing skill meteors.*
- *Crucially, this is built on **Progressive Enhancement**: if a student is on a low-end mobile phone or WebGL is disabled, the page seamlessly degrades to crisp 2D cards without breaking."*

---

### Act 4: Personalized Roadmap, Dashboard & Impact (2:50 – 3:45)
**Speaker: Aditi Vispute**

- **[Screen: Click 'Choose This Career' → Select 8 Weeks → Roadmap Page]**
- *"Now comes the breakthrough feature: execution. The student clicks **'Choose This Career'** and selects their pace—such as an **8-Week Balanced Roadmap**.*
- *Our engine generates a structured curriculum that schedules their **missing skills first**, followed by weak skills, complete with curated public resources from MDN, freeCodeCamp, and W3Schools.*
- **[Screen: 3D Roadmap Milestone Path → Click Checkbox on Task 1]**
- *Watch closely: as the student finishes Week 1's project and checks off the task, our backend atomically recalculates their progress. The 3D milestone path updates in real-time.*
- **[Screen: Dashboard Page]**
- *On the **Student Dashboard**, the student sees their unified profile, prioritized upcoming tasks, and our **3D Progress Orb**, which pulses and changes color as their job-readiness grows.*
- *CareerPath AI bridges the gap between college education and industry hiring. In future phases, we will expand from 5 to 50 career tracks, integrate real-time job market APIs, and add peer project reviews.*
- *Thank you, judges! We are Team 404 Brain Not Found, and we are ready for your questions."*

---

## 🎯 Anticipated Judge Q&A & Rebuttals

### Q1: "Why do you call this AI if you don't use OpenAI or an external LLM?"
**Answer (Parth Patil):**  
*"AI in computer science encompasses deterministic expert systems, multi-criteria decision analysis, and heuristic search—not merely generative chatbots. For high-stakes career counseling, generative LLMs frequently hallucinate prerequisites and provide non-reproducible advice. Our weighted vector matching $(60\% \text{ Skills} + 25\% \text{ Interests} + 15\% \text{ Education})$ provides transparent, mathematically defensible, and reliable guidance with zero latency and zero API cost."*

### Q2: "Isn't 3D just a gimmick for a career platform?"
**Answer (Asmita Lokhande):**  
*"Every 3D component in CareerPath AI corresponds to a cognitive milestone:*
- *The **Career Universe** provides bird’s-eye orientation across technology sectors.*
- *The **Skill Orbit** visualizes gravitational proximity: how far the student is from career mastery.*
- *The **Roadmap Path** gamifies multi-week perseverance.*
- *The **Progress Orb** offers immediate positive psychological feedback.  
Moreover, every component degrades gracefully to lightweight 2D if WebGL is unavailable."*

### Q3: "How does the scoring formula prevent bias towards popular degrees?"
**Answer (Parth Patil):**  
*"We deliberately assigned the highest weight (60%) to **proven technical skill proficiencies** rather than degrees (15%). Even if a student has a non-traditional background, high mastery in required skills allows them to achieve top career match scores, supporting equitable, merit-based career transition."*

### Q4: "How do you handle user data security and privacy?"
**Answer (Parth Patil):**  
*"We implement industry best practices: password hashing using salted bcrypt (10 rounds), stateless JWT authentication with expiration, rate limiting to protect against brute-force attacks, Helmet HTTP security headers, CORS origin restrictions, and MongoDB schema-level validation."*

### Q5: "What makes this different from generic career portals like LinkedIn or Coursera?"
**Answer (Aditi Vispute):**  
*"Generic portals either sell uncurated individual courses or match existing job openings. They don't diagnose your exact skill delta. CareerPath AI identifies what you are missing and generates a structured, week-by-week curriculum using official, high-quality free resources so students become job-ready without expensive paywalls."*

### Q6: "How will this architecture scale to hundreds of thousands of students?"
**Answer (Parth Patil):**  
*"Because our recommendation engine and roadmap generators are deterministic and compute in memory using indexed MongoDB lookups, each calculation executes in under 15ms. The backend is stateless, enabling horizontal scaling across multiple container instances behind a load balancer."*

### Q7: "What are your post-hackathon plans?"
**Answer (Aditi Vispute):**  
*"Post-hackathon, our roadmap includes: expanding to 50+ career tracks across healthcare, finance, and engineering; integrating live LinkedIn/Indeed job market demand APIs; and adding verified project repository evaluations."*
