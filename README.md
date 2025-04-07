# AlterEgo_TimeTracking
Application powered by AI, for Time Tracking, Planning and reporting.

# Time Tracking Application

A full-stack time tracking solution with productivity analytics and AI integration.

## Features

### Core Functionality
- ⏱️ **Dual Timer Modes**
  - Stopwatch with lap tracking
  - Countdown timer with preset intervals (5/10/15/25/30/45/60 mins)
- 📊 **Productivity Analytics**
  - Real-time efficiency metrics
  - Historical trend visualization
- 🗓️ **Calendar Integration**
  - Time blocking support
  - Drag-n-drop scheduling

### Authentication & Security
- 🔐 JWT-based authentication
- 🔄 Token refresh system
- 🛡️ Protected routes
- 📝 User registration/validation

### Time Management
- 🕒 Manual time entry mode
- 🏷️ Tag system with:
  - Custom tag creation
  - Drag-n-drop organization
  - Color coding
- 📂 Project association
- 💰 Billable hours tracking

### UI Components
- 🪄 Glassmorphism design system
- 🎨 Mode selector (Focus/Balanced/Relax)
- 🤖 AI Assistant panel
- 🔊 Sound controls
- ⌨️ Keyboard shortcuts:
  - Space: Start/Pause
  - Ctrl+R: Reset
  - Esc: Close modals

### Backend Integration
- REST API Endpoints:
  - `/api/timers` (CRUD operations)
  - `/api/timers/active` 
  - `/api/auth/login`
  - `/api/auth/refresh`
  - `/api/projects`
- Error handling for:
  - 401 Unauthorized
  - 409 Conflict
  - 404 Not Found

## ⚙️ Tech Stack

| Frontend              | Backend             |
|-----------------------|---------------------|
| React 18 + TS         | Spring Boot 3       |
| Context API           | Spring Security     |
| React Router 6        | JPA/Hibernate       |
| Lucide Icons          | MySQL/H2            |
| Framer Motion         | JWT Authentication  |
## Getting Started


### Installation
```bash
# Frontend
cd frontend
npm install
npm run dev

# Backend
cd backend
mvn spring-boot:run
```

