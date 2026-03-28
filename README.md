<p align="center">
  <img src="https://img.shields.io/badge/IITM_BS-Electronic_Systems-0d1117?style=for-the-badge&logo=data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0iIzZiZTNmZiI+PHBhdGggZD0iTTEyIDJMMyA3djEwbDkgNSA5LTVWN2wtOS01em0wIDIuMThsNi45MSAzLjgzTDEyIDE5Ljg2bC02LjkxLTMuODNMMTIgNC4xOHoiLz48L3N2Zz4=&logoColor=6be3ff" alt="IITM BS ES"/>
</p>

<h1 align="center">⚡ StudyPulse</h1>

<p align="center">
  <strong>A premium progress tracker & dashboard for IIT Madras BS in Electronic Systems</strong>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/React-18.3-61DAFB?style=flat-square&logo=react&logoColor=white" alt="React"/>
  <img src="https://img.shields.io/badge/Vite-6.4-646CFF?style=flat-square&logo=vite&logoColor=white" alt="Vite"/>
  <img src="https://img.shields.io/badge/License-MIT-22c55e?style=flat-square" alt="License"/>
  <img src="https://img.shields.io/github/deployments/scalerflux/iitm-es/github-pages?style=flat-square&label=deploy&color=6be3ff" alt="Deploy"/>
</p>

<p align="center">
  <a href="https://scalerflux.github.io/iitm-es/">🚀 Live Demo</a>
</p>

---

## ✨ What is StudyPulse?

StudyPulse is a **NOC War Room**–styled dashboard built for students of the IIT Madras BS program in Electronic Systems. It tracks your academic progress across all courses — assignments, quizzes, labs, exams — in real time.

### 🎯 Key Features

| Feature | Description |
|---|---|
| 🧙 **Interactive Setup Wizard** | 5-step guided onboarding — pick your term, level (Foundation/Diploma/Degree), courses, and week focus |
| 📊 **Dashboard** | At-a-glance view of all course progress, upcoming deadlines, and term calendar |
| 📅 **Weekly View** | Week-by-week execution board with checklist items per course |
| 🎓 **Grade Simulator** | Enter scores and see projected grades with eligibility checks |
| 📈 **Analytics** | Visual breakdowns of progress, completion rates, and pacing |
| 🔄 **Term Pack System** | Swap between terms or import custom JSON packs |

### 🏗️ Program Levels Supported

```
Foundation  →  English, Math, Circuits, C, Digital Systems, Linux + Labs
Diploma     →  Signals, Python, Analog, DSP, Sensors + Labs & Projects
BS Degree   →  Control, EMF, Product Design, FPGAs + Electives
```

---

## 🚀 Quick Start

```bash
# Clone the repo
git clone https://github.com/scalerflux/iitm-es.git
cd iitm-es

# Install dependencies
npm install

# Start dev server
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) and the setup wizard will guide you through.

---

## 🌐 Deploy to GitHub Pages

```bash
# One-command deploy
npm run deploy
```

Your site goes live at **[scalerflux.github.io/iitm-es](https://scalerflux.github.io/iitm-es/)**

---

## 📁 Project Structure

```
src/
├── App.jsx              # Main app — routing, dashboard, wizard, all pages
├── App.css              # Full stylesheet — NOC War Room dark theme
├── data.js              # Term pack registry, course library, navigation
├── utils.js             # Grade calculators, score logic, helpers
├── configs/
│   ├── jan2026FoundationTerm2.js   # Jan 2026 T1 term pack (7 Foundation courses)
│   └── jul2026SamplePack.json      # Sample pack template for T2/T3
├── index.css            # Base reset & typography
└── main.jsx             # React entry point
```

---

## 🎨 Design

- **Dark theme** with glassmorphism and cyan accent (`#6be3ff`)
- **Staggered animations** on cards and wizard transitions
- **Responsive layout** — sidebar + main content
- **Custom grade engine** with per-course eligibility rules matching official IITM grading docs

---

## 📄 Data Sources

- [IITM ES Academics](https://study.iitm.ac.in/es/academics.html)
- [Jan 2026 Grading Document](https://docs.google.com/document/d/e/2PACX-1vTFhsEQkgismKJq5Ey_172lv7MJ8STdeSPbn3Jw4PEwwEo0b4q6J841DQCQWKazcEw47XrYFO9fBTEp/pub)
- [Program Structure](https://docs.google.com/document/d/1DC9QAwtN2KMacntPDjkA0PSrFyC0PUlf/pub)

---

## 📝 License

MIT — use it, fork it, make it yours.

<p align="center">
  <sub>Built with ☕ for the IITM BS community</sub>
</p>
