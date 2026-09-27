# DailyDesk 🖥️⚡

> **“Everything you need for a more organized day.”**  
> *A modern personal productivity and daily-life management application.*

[![Supabase](https://img.shields.io/badge/Backend-Supabase%20PostgreSQL-3ECF8E?logo=supabase&logoColor=white)](https://supabase.com)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Vanilla JS](https://img.shields.io/badge/Frontend-HTML5%20%2F%20CSS3%20%2F%20ES6+-F7DF1E?logo=javascript&logoColor=black)](https://developer.mozilla.org)
[![Chart.js](https://img.shields.io/badge/Charts-Chart.js%204.x-FF6384?logo=chartdotjs&logoColor=white)](https://www.chartjs.org)

---

## 🌟 Executive Overview & Purpose

**DailyDesk** is a modern, responsive personal productivity web application engineered to solve "app fragmentation". Instead of juggling separate task managers, budget spreadsheets, note apps, and goal trackers, DailyDesk integrates your daily agenda into a single unified dashboard.

Designed specifically for real-world daily utility and competition presentation, DailyDesk delivers **real functionality** with **zero placeholder buttons** or fake demo data.

---

## 🚀 Key Features & Capabilities

### 1. 🎯 Dynamic Priority Task Manager
- **Full CRUD operations**: Create, edit, delete, and toggle tasks in real-time.
- **Priority tagging**: Color-coded badges for **High**, **Medium**, and **Low** priorities.
- **Categorization**: Work, Study, Personal, Shopping, Health, and Other.
- **Smart filters & views**: "Due Today", "Upcoming", "Completed", and "All Tasks".
- **Real-time sorting & search**: Instant full-text search across titles and descriptions.

### 2. 💰 Intelligent Personal Expense Tracker
- **Financial logging**: Amount, date, merchant title, category, payment method (Card, Cash, Online/UPI, Bank Transfer), and notes.
- **Visual Analytics**: 
  - **Doughnut Chart**: Interactive expense breakdown by category with percentages and custom tooltips.
  - **Bar Chart**: Weekly spending burn trend across the last 7 days.
- **Financial metrics**: Real-time computation of Today's Spend, 7-Day Total, Current Month Total, and Overall Lifetime Log.
- **Exporting**: One-click **Export to CSV** for spreadsheets and accounting.

### 3. 📝 Color-Coded Sticky Notes System
- **Quick thoughts & records**: Capture meeting notes, brainstorming ideas, study points, and checklists.
- **Card themes**: Indigo, Emerald, Amber, Rose, Sky, and Purple accents.
- **Sticky pins**: Pin critical notes to the top of your workspace.
- **Instant copy**: One-click clipboard copy for note sharing.

### 4. 🏆 Milestone Goals & Habit Tracker
- **Progress Tracking**: Dynamic interactive slider (0% to 100%) with quick `-10%` and `+10%` step buttons.
- **Countdown intelligence**: Computes remaining days to target dates and flags deadlines.
- **Celebration Confetti**: Triggers micro-animations upon reaching 100% milestone completion.

### 5. ☀️ Dedicated "My Day" Agenda Hub
- **Focus Mode**: A streamlined single-page daily command center.
- **Daily Inspiration**: Curated productivity and focus quotes that rotate daily.
- **Today's Score**: Algorithmic productivity rating calculated from completed tasks, goals, and logged entries.
- **Daily Checklist**: Instant focus on tasks due today.

### 6. 🔍 Omnibar Global Command Palette (`Ctrl + K`)
- Fast keyboard-driven command palette (`Ctrl + K` or `Cmd + K`).
- Searches across **Tasks**, **Expenses**, **Notes**, and **Goals** simultaneously with highlighted search matches and direct jump-to actions.

### 7. 🛡️ Supabase Authentication & PostgreSQL Backend
- **Supabase Auth**: Sign up, Sign in, Profile editing, and secure session persistence.
- **Dual RLS Security**: Row Level Security (RLS) ensures users can only read and write their own data.
- **Administrator Portal**: Protected area for administrators to view registered accounts, system activity streams, global task statistics, and database schema health.

---

## 📐 Architecture & Competition Workflow

The project is structured according to the competition pipeline:

```
Antigravity (Development & Verification)
   └── VS Code (Project Workspace & Code Editing)
        └── GitHub (Version Control & Repository)
             └── Supabase (Cloud PostgreSQL, Auth & Realtime Database)
```

```
daily/
├── assets/
│   └── logo.svg                 # Vector logo & brand identity
├── css/
│   └── style.css                # Modern responsive design system (Dark/Light themes)
├── js/
│   ├── config.js                # App constants, categories, and Supabase credentials
│   ├── supabase-client.js       # Supabase client & resilient storage sync
│   ├── auth.js                  # Authentication & Profile management
│   ├── tasks.js                 # Task manager with full CRUD & filters
│   ├── expenses.js              # Expense tracker & Chart.js data visualizations
│   ├── notes.js                 # Notes system with pinning & search
│   ├── goals.js                 # Milestone goals & progress meters
│   ├── myday.js                 # Dedicated "My Day" agenda hub
│   ├── admin.js                 # Administrator portal & telemetry
│   ├── search.js                # Omnibar global command palette (Ctrl+K)
│   └── app.js                   # Application router, themes & modal engine
├── schema.sql                   # Supabase PostgreSQL schema with RLS policies
├── index.html                   # Main single-page application
└── README.md                    # Project documentation & presentation guide
```

---

## ⚡ Quick Start & Deployment Guide

### Running Locally
No build tools or heavy node package installations are required! DailyDesk uses modern ES6 modules and CDN libraries.

1. **Option A: VS Code Live Server**
   - Open the `daily` directory in **VS Code**.
   - Right-click `index.html` and select **"Open with Live Server"**.

2. **Option B: Direct Browser**
   - Simply double click `index.html` or open it in Google Chrome, Microsoft Edge, Firefox, or Safari.

3. **Option C: Local Python / HTTP Server**
   ```bash
   python -m http.server 3000
   # Open http://localhost:3000 in your browser
   ```

---

## 🗄️ Supabase Database Setup

DailyDesk connects to the provided Supabase project:
- **Project URL**: `https://tgpkkiisuugnzbrhqiwp.supabase.co`

### Running the Database Schema
1. Open your [Supabase Dashboard](https://supabase.com/dashboard/project/tgpkkiisuugnzbrhqiwp/sql).
2. Go to the **SQL Editor**.
3. Open `schema.sql` from this repository, copy its contents, and click **Run**.
4. The tables (`profiles`, `tasks`, `expenses`, `notes`, `goals`, `activity_logs`), Row Level Security policies, and trigger functions will be instantly configured.

> *Note: DailyDesk includes an integrated SQL Schema Viewer modal directly in the web app (click the "Supabase Status" badge or navigate to Admin Panel) with a 1-click copy button!*

---

## 🎭 Evaluator Presentation Walkthrough

When presenting or grading DailyDesk for competition review:

1. **Landing Page Tour**:
   - Demonstrate the Hero section, dynamic live preview frame, feature cards, and responsiveness.
2. **Instant Demo Login**:
   - Click **"Instant Demo User"** in the Hero or header to enter the workspace with realistic sample tasks, expenses, notes, and goals.
3. **Task Operations**:
   - Check off a task to observe progress bar updates and confetti celebrations.
   - Click **"+ Add Task"**, assign a High priority badge, set a due date, and filter by status.
4. **Expense Visualizations**:
   - View the Category Doughnut and 7-Day Spending Bar charts.
   - Click **"Export CSV"** to demonstrate real file generation.
5. **My Day Command Center**:
   - Switch to the **"My Day"** tab to highlight today's agenda and the dynamic productivity score algorithm.
6. **Global Omnibar**:
   - Press **`Ctrl + K`** (or click the search bar) and search for `"Pitch Deck"` or `"Lunch"` to demonstrate instant cross-module search.
7. **Admin Portal**:
   - Click **"Admin View"** in the sidebar to review system activity telemetry, registered user tables, and database health metrics.
8. **Theme Customization**:
   - Click the theme toggle icon in the top header to showcase seamless **Dark Mode** and **Light Mode** styling.

---

## 🔒 Security & Privacy

- **Row Level Security (RLS)** is strictly enforced at the PostgreSQL level.
- Each user's database records are tied directly to `auth.uid() = user_id`.
- Private data is never leaked to other users or public endpoints.

---

## 📄 License
This project is open-source and released under the MIT License.
