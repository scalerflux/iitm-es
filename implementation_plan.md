# StudyPulse — IITM BS Progress Tracker (Final Plan)

Local webapp: **"Am I on track or falling behind?"** + **"What are my grades looking like?"**

**Level**: Foundation Term 2 | **Week**: 6 of 12 | **Term**: Jan 2026

## Tech Stack
- **Vite + React** + **Vanilla CSS** (dark theme)
- **localStorage** — no backend
- **Path**: `/Users/mohammedomer/Docs/ES/study-pulse/`

---

## Pre-loaded Exam Calendar

| Date | Event | Courses |
|------|-------|---------|
| **Mar 15** | Quiz 1 | EEC, BDS, Embedded C |
| **Mar 20** | BPT-3 | Linux |
| **Apr 10** | BPT-4 | Linux |
| **Apr 12** | Quiz 2 | EEC, BDS, Embedded C |
| **Apr 20** | NPPE | Linux |
| **Apr 25** | OPPE | Linux |
| **May 7** | Tutorial batch W9-12 | EEC |
| **May 10** | End Term Exam | All theory |
| **Late May** | In-Campus Labs | Electronics Lab, Linux Lab |

---

## Grading Formulas (Pre-loaded)

### EEC (EE1103)
`T = max(0.6F + 0.3*max(Q1,Q2), 0.45F + 0.25Q1 + 0.3Q2)`
- **Bonus**: Tutorials (≥60%): 4→1pt, 8→2pt, 12→3pt
- **Eligibility**: Best 5/7 GA ≥ 40 AND attend ≥1 quiz

### BDS (EE1102)
`T = max(0.6F + 0.3*max(Q1,Q2), 0.45F + 0.25Q1 + 0.3Q2)`
- **Special**: Handwritten GA scan upload mandatory
- **Eligibility**: Best 5/7 GA ≥ 40 AND attend ≥1 quiz

### Linux (CS1102)
`T = 0.25Q1 + 0.25*OPPE + 0.35F + 0.05*BPTA + 0.05*VMT + 0.05*NPPE`
- **OPPE eligibility**: Avg first 3 BPTs ≥ 40 AND OPPE SCT
- **Course grade**: End Term AND OPPE ≥ 40

### Embedded C (CS2101)
`T = 0.1*GRPA + max(0.5F + 0.3*max(Q1,Q2), 0.4F + 0.25Q1 + 0.25Q2)`
- **GRPA**: Best 10 weekly programming assignments
- **Eligibility**: Best 5/6 GA ≥ 40 AND attend ≥1 quiz
- 10% exam questions from GAs

### Labs (EE1902, CS1902)
`T = 0.5 * avg(OL scores) + 0.5 * IL score`
- **Electronics**: Submit ≥5/8 labs AND avg ≥ 40 for in-campus
- **Linux Lab**: Avg OL ≥ 40 for in-campus

---

## Pages (5 total)

### 1. Dashboard (`/`)
- Term progress bar (Week 6/12)
- Course cards: progress rings + status badges (Ahead/On Track/Behind/Critical)
- **Upcoming deadlines** with exact dates (auto-show/hide based on proximity — shows next 7 days)
- Today's live sessions
- **Eligibility status** per course (GA avg vs 40% threshold)

### 2. Weekly View (`/weekly`)
- Week selector
- Per-course checklist: lectures, GA, practice, AQ, TYU, PPA, BPT, etc.
- Toggle completion, week % at top

### 3. Grades (`/grades`) ← NEW
- **Score input** for each assessment component per course
- **Live grade calculator** using actual grading formulas
- Shows "What if" scenarios (e.g., "If I score X on Quiz 2 and Y on Final, my grade will be Z")
- **Eligibility tracker**: green/red indicator per course
- GA average tracker (best 5/7 calculation)

### 4. Course Setup (`/courses`)
- Pre-loaded with all 7 courses, edit as needed
- Exam dates, weekly items, custom trackers

### 5. Analytics (`/analytics`)
- Week-by-week completion chart
- Ideal vs actual progress trend
- Per-course comparison

---

## Component Architecture

```
App.jsx — Sidebar + Router
├── Dashboard.jsx
│   ├── TermProgressBar
│   ├── CourseCard (×7) → ProgressRing + StatusBadge
│   ├── UpcomingDeadlines (date-aware, auto show/hide)
│   ├── TodayLiveSessions
│   └── EligibilityAlert
├── WeeklyView.jsx
│   ├── WeekSelector
│   └── CourseChecklist (×7) → ChecklistItem
├── Grades.jsx ← NEW
│   ├── ScoreInput (per assessment per course)
│   ├── GradeCalculator (uses actual formulas)
│   ├── WhatIfSimulator
│   └── EligibilityTracker
├── CourseSetup.jsx
│   ├── CourseForm + ExamDateEditor
│   └── CustomTrackerForm
└── Analytics.jsx
    ├── CompletionChart
    └── ProgressTrend
```

---

## Design
- Dark navy/charcoal + glassmorphism cards
- Course accent colors
- Google Fonts: Inter + JetBrains Mono
- Smooth animations, micro-interactions
- Date-aware: deadlines glow/pulse as they approach

---

## Verification
1. `npm run dev` → test all 5 pages
2. Pre-loaded courses match actual data
3. Grade calculator formulas verified per course
4. Deadline display: shows items within 7 days, hides past items
5. Eligibility logic: turns red when GA avg < 40
6. Data persists across refresh
