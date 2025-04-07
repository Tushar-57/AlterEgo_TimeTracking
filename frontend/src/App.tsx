// App.tsx
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import Sidebar from './components/Sidebar';
import TimeTracker from './components/TimeTracker';
import Analytics from './components/Analytics';
import LoginClassic from './components/LoginFunctionality';
import SignupClassic from './components/SignupFunctionality';
import Welcome from './components/Welcome';
import Calendar from './components/Calendar';
import TaskManager from './components/TaskManager';
import { AuthProvider, LoadingSpinner, useAuth } from './context/AuthContext'; 
import { Loader2Icon } from 'lucide-react';

// Placeholder components for other routes
// const TaskManager = () => <div className="min-h-screen bg-gray-50 pl-64 p-8">Tasks Page</div>;
const Reports = () => <div className="min-h-screen bg-gray-50 pl-64 p-8">Reports Page</div>;
const Projects = () => <div className="min-h-screen bg-gray-50 pl-64 p-8">Projects Page</div>;
const Clients = () => <div className="min-h-screen bg-gray-50 pl-64 p-8">Clients Page</div>;
const Invoices = () => <div className="min-h-screen bg-gray-50 pl-64 p-8">Invoices Page</div>;
const Tags = () => <div className="min-h-screen bg-gray-50 pl-64 p-8">Tags Page</div>;
const Settings = () => <div className="min-h-screen bg-gray-50 pl-64 p-8">Settings Page</div>;


const App = () => (
  <AuthProvider>
    <Router>
      <Routes>
        <Route path="/login" element={<LoginClassic />} />
        <Route path="/signup" element={<SignupClassic />} />
        <Route path="/*" element={<ProtectedRoutes />} />
      </Routes>
    </Router>
  </AuthProvider>
);


const ProtectedRoutes = () => {
  const { isAuthenticated, loading } = useAuth();
  // const [checked, setChecked] = useState(false);
  if(loading){return <LoadingSpinner/>}
  
  // useEffect(() => {
  //   // Give time for auth check to complete
  //   const timer = setTimeout(() => setChecked(true), 100);
  //   return () => clearTimeout(timer);
  // }, []);

  // if (!checked) return <LoadingSpinner />;

  // if (!isAuthenticated) {
  //   return <Navigate to="/login" replace />;
  // }

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
          <Route path="/projects" element={<Projects />} />
          <Route path="/clients" element={<Clients />} />
          <Route path="/invoices" element={<Invoices />} />
          <Route path="/tags" element={<Tags />} />
          <Route path="/settings" element={<Settings />} />
          {/* <Route path="*" element={<Navigate to="/" replace />} */}
        </Routes>
      </main>
    </div>
  ): <Navigate to="/login" replace />;
};

// const ProtectedRoutes = () => {
//   const { isAuthenticated } = useAuth();  // Use the authentication context
//   console.log('Is authenticated:', isAuthenticated); 
//   if (!isAuthenticated) {
//     return <Navigate to="/login" replace />;  // Redirect to login if not authenticated
//   }

//   return (
//     <div className="flex">
//       <Sidebar />
//       <main className="flex-1">
//         <Routes>
//           <Route path="/" element={<TimeTracker />} />
//           <Route path="/tasks" element={<TaskManager />} />
//           <Route path="/analytics" element={<Analytics />} />
//           <Route path="/calendar" element={<Calendar />} />
//           <Route path="/reports" element={<Reports />} />
//           <Route path="/projects" element={<Projects />} />
//           <Route path="/clients" element={<Clients />} />
//           <Route path="/invoices" element={<Invoices />} />
//           <Route path="/tags" element={<Tags />} />
//           <Route path="/settings" element={<Settings />} />
//           <Route path="*" element={<Navigate to="/" replace />} />
//         </Routes>
//       </main>
//     </div>
//   );
// };

export default App;
