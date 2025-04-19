// App.tsx
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import Sidebar from './components/Sidebar';
import TimeTracker from './components/TimeTracker';
import Analytics from './components/Analytics';
import LoginClassic from './components/LoginFunctionality';
import SignupClassic from './components/SignupFunctionality';
import ProjectPage from './components/Project/ProjectPage';
import Calendar from './components/Calendar';
import TaskManager from './components/TaskManager';
import { AuthProvider, useAuth, LoadingSpinner } from './context/AuthContext'; 
import { PlannerForm } from './components/Planner/Planner';
import {Dashboard} from './components/Dashboard'
// import AIComponent from './components/AIComponent/client/src/App'


// Placeholder components for other routes
// const TaskManager = () => <div className="min-h-screen bg-gray-50 pl-64 p-8">Tasks Page</div>;
const Reports = () => <div className="min-h-screen bg-gray-50 pl-64 p-8">Reports Page</div>;
const Projects = () => <div className="min-h-screen bg-gray-50 pl-64 p-8">Projects Page</div>;
const Clients = () => <div className="min-h-screen bg-gray-50 pl-64 p-8">Clients Page</div>;
const Invoices = () => <div className="min-h-screen bg-gray-50 pl-64 p-8">Invoices Page</div>;
const Tags = () => <div className="min-h-screen bg-gray-50 pl-64 p-8">Tags Page</div>;
const Settings = () => <div className="min-h-screen bg-gray-50 pl-64 p-8">Settings Page</div>;

const App = () => (
    <Router>
      <AuthProvider>
      <Routes>
        <Route path="/login" element={<LoginClassic />} />
        <Route path="/signup" element={<SignupClassic />} />
        <Route path="/*" element={<ProtectedRoutes />} />
      </Routes>
      </AuthProvider>
    </Router>
);


const ProtectedRoutes = () => {
  const { isAuthenticated, loading } = useAuth();
  const navigate = useNavigate();
  const [checked, setChecked] = useState(false);
  useEffect(() => {
    if (!loading && !isAuthenticated) {
      navigate('/login');
    }
  }, [isAuthenticated, loading]);

  if (loading) return <LoadingSpinner />;

  return isAuthenticated ? (
    <div className="flex">
      <Sidebar />
      <main className="flex-1">
        <Routes>
          <Route index element={<TimeTracker />} />
          <Route path="/" element={<TimeTracker />} />
          <Route path="/tasks" element={<TaskManager />} />
          <Route path="/analytics" element={<Analytics />} />
          <Route path="/calendar" element={<Calendar />} />
          <Route path="/reports" element={<Reports />} />
          <Route path="/projects" element={<ProjectPage />} />
          <Route path="/clients" element={<Clients />} />
          <Route path="/invoices" element={<Invoices />} />
          <Route path="/tags" element={<Tags />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/planner" element={<PlannerForm />} />
          <Route path="/dashboard" element={<Dashboard />} />
          {/* <Route path="/aibutton" element={<AIComponent />} /> */}
          {/* <Route path="*" element={<Navigate to="/" replace />} */}
        </Routes>
      </main>
    </div>
  ): <Navigate to="/login" replace />;
};

export default App;