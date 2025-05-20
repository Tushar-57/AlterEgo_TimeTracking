# AlterEgo Time Tracking

Track time, boost productivity, and stay motivated with AlterEgo, an AI-powered app featuring a personalized mentor to guide you through tasks and goals.

## Click to View Application Demo

<a href="https://drive.google.com/file/d/1uSWtXf84HJaQ7-PIMalHH_3yC6s1vLiD/view?usp=sharing">
  <img src="https://drive.google.com/file/d/1_GsdkOQ8WqvHbWyzdHYzu6Ht5aliIuwW/view?usp=sharing" 
       alt="Demo - Alter Ego" 
       style="width: 400px; height: auto; border-radius: 8px;">
</a>


## Features

### Core Functionality
- ⏱️ **Time Tracking**
  - Stopwatch with lap tracking and countdown timer (5/10/15/25/30/45/60 minutes).
  - Manual time entry for flexible logging.
  - Billable hours tracking for projects.
- 📊 **Productivity Analytics**
  - Real-time efficiency metrics and historical trend visualizations.
  - Insights into task completion and time allocation.
- 🗓️ **Calendar Integration**
  - Drag-and-drop scheduling and time blocking.
  - Visual task management with project and tag associations.
- 🤖 **AI Chat Assistant**
  - Personalized mentor persona (name, tone, archetype, avatar) defined during onboarding.
  - Handles general queries and time management commands (e.g., “start timer”) via LangChain.
  - Context-aware responses with dynamic goal and milestone integration.
- 🧠 **Agent Society**: Powered by 8 specialized agents (e.g., Intent, Scheduler) for context-aware task management.

### Authentication & Security
- 🔐 **JWT-Based Authentication**
  - Secure login and registration with token refresh.
  - Protected routes for authenticated users.
- 🛡️ **Robust Security**
  - Spring Security with JWT filters.
  - CORS configuration for frontend-backend communication.

### Time Management
- 🏷️ **Tag System**
  - Custom tag creation with color coding and drag-and-drop organization.
  - Associate tags with projects and tasks.
- 📂 **Project Management**
  - Create and manage projects with time entries.
  - Track project-specific hours and progress.
- 🕒 **Pomodoro Support**
  - Configurable focus sessions with audio notifications.

### UI/UX
- 🪄 **Glassmorphism Design**
  - Frosted glass effects (`backdrop-blur-md`) for modals and panels.
  - Vibrant gradients (e.g., pink-to-purple) for a modern aesthetic.
- 🎨 **Responsive Interface**
  - Optimized for desktop and mobile with Tailwind CSS.
  - Smooth animations using Framer Motion.
- 🔊 **Audio Feedback**
  - Optional sound effects for timer events (requires `public/sounds/` files).
- ⌨️ **Keyboard Shortcuts**
  - `Space`: Start/Pause timer.
  - `Ctrl+R`: Reset timer.
  - `Esc`: Close modals.

### Backend Integration
- **REST API Endpoints**
  - `/api/auth/login`, `/api/auth/refresh`: Authentication.
  - `/api/onboarding/onboardNewUser`, `/api/onboarding/getOnboardingData`: Onboarding data.
  - `/api/onboarding/updateTone`, `/api/onboarding/updateMentor`: Mentor customization.
  - `/api/ai/chat`: AI-driven chat with time management.
  - `/api/timers`, `/api/projects`, `/api/tags`: Time tracking and project management.
- **Error Handling**
  - 401 Unauthorized, 404 Not Found, 409 Conflict.
  - User-friendly toast notifications for frontend errors.

### Experimental Features
- 🗣️ **Real-Time Text-to-Speech**
  - POC implementation in `POCs/Realtime_Text-To-Speech_Impl.py`.
  - Future integration for voice-based interactions.

## Tech Stack

- **Frontend**: React 18, TypeScript, Tailwind CSS, Framer Motion
- **Backend**: Spring Boot 3, Spring Security, MySQL/H2, LangChain
- **Extra**: Python (Text-to-Speech POC)

## Get Started

1. **Clone the Repo**:

### Prerequisites
- **Node.js**: v16 or higher
- **Java**: JDK 17
- **Maven**: 3.8.x
- **MySQL**: 8.x (or H2 for development)
- **Python**: 3.8+ (for text-to-speech POC)

### Installation

1. **Clone the Repository**:
```bash
   git clone <repository-url>
   cd AlterEgo_TimeTracking
```
2. **Backend Setup**:
```bash
  cd backend
  # Update application.properties (MySQL/H2)
  spring.datasource.url=jdbc:mysql://localhost:3306/alterego_db
  spring.datasource.username=root
  spring.datasource.password=your_password
  mvn clean install
  mvn spring-boot:run
```
3. **Frontend Setup**
```bash
  cd frontend
  npm install
  npm run dev
```
4. **Try the POC**:
```bash
  cd POCs
  pip install -r requirements.txt
  python Realtime_Text-To-Speech_Impl.py
```

## Usage

1. **Onboarding**: Visit `/onboarding` to set your role, goals, and mentor persona (name, tone, archetype, avatar).
2. **Track Time**: Log tasks using timers in `TimeTracker` or AI chat commands like “start timer”.
3. **Chat with AI**: Use the chat to get personalized advice and manage tasks with your mentor.
4. **Analyze & Plan**: View productivity analytics and schedule tasks via the calendar.
5. **Customize**: Adjust your mentor’s tone or archetype in the chat settings modal.

## Troubleshooting

- **Backend Issues**: Ensure MySQL or H2 is running and the JWT token is valid in `localStorage`.
- **Frontend Errors**: Verify `VITE_API_URL=http://localhost:8080` in `.env`.
- **Audio**: Place `digital-quick-tone.mp3`, `clock-ticking-2.mp3`, and `analog-watch-alarm.mp3` in `public/sounds/`.
