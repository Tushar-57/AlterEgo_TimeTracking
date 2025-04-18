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
          {/* <Route path="*" element={<Navigate to="/" replace />} */}
        </Routes>
      </main>
    </div>
  ): <Navigate to="/login" replace />;
};

export default App;  
// App.tsx
// import { useEffect, useState } from 'react';
// import Sidebar from './components/Sidebar';
// import TimeTracker from './components/TimeTracker';
// import Analytics from './components/Analytics';
// import LoginClassic from './components/LoginFunctionality';
// import SignupClassic from './components/SignupFunctionality';
// import Calendar from './components/Calendar';
// import TaskManager from './components/TaskManager';
// import { AuthProvider, useAuth} from './context/AuthContext';
// import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
// import { Loader2Icon } from 'lucide-react';
// import { AlertDialog, AlertDialogContent, AlertDialogDescription, AlertDialogTitle } from "@radix-ui/react-alert-dialog"



// // const TaskManager = () => <div className="min-h-screen bg-gray-50 pl-64 p-8">Tasks Page</div>;
// const Reports = () => <div className="min-h-screen bg-gray-50 pl-64 p-8">Reports Page</div>;
// const Projects = () => <div className="min-h-screen bg-gray-50 pl-64 p-8">Projects Page</div>;
// const Clients = () => <div className="min-h-screen bg-gray-50 pl-64 p-8">Clients Page</div>;
// const Invoices = () => <div className="min-h-screen bg-gray-50 pl-64 p-8">Invoices Page</div>;
// const Tags = () => <div className="min-h-screen bg-gray-50 pl-64 p-8">Tags Page</div>;
// const Settings = () => <div className="min-h-screen bg-gray-50 pl-64 p-8">Settings Page</div>;


// const App = () => {
//   return (
//     <AuthProvider>
//       <Router>
//         <AppRoutes />
//       </Router>
//     </AuthProvider>
//   );
// };

// const AppRoutes = () => {
//   const { isAuthenticated, loading, error, clearError } = useAuth();
  
//   if (loading) {
//     return <div className="flex items-center justify-center min-h-screen bg-gray-100">
//       <Loader2Icon className="w-8 h-8 animate-spin" />
//       <span className="ml-2">Loading...</span>
//     </div>;
//   }

//   return (
//     <>
//       {error && (
//         <AlertDialog open={!!error} onOpenChange={clearError}>
//           <AlertDialogContent>
//             <AlertDialogTitle>Error</AlertDialogTitle>
//             <AlertDialogDescription>{error.message}</AlertDialogDescription>
//           </AlertDialogContent>
//         </AlertDialog>
//       )}

//       <Routes>
//         <Route path="/login" element={!isAuthenticated ? <LoginClassic /> : <Navigate to="/" />} />
//         <Route path="/signup" element={!isAuthenticated ? <SignupClassic /> : <Navigate to="/" />} />
//         <Route path="/*" element={isAuthenticated ? <ProtectedRoutes /> : <Navigate to="/login" />} />
//       </Routes>
//     </>
//   );
// };


// const ProtectedRoutes = () => (
//   <div className="flex">
//     <Sidebar />
//     <main className="flex-1 min-h-screen bg-gray-50 pl-64 p-8">
//       <Routes>
//         <Route index element={<TimeTracker />} />
//         <Route path="/tasks" element={<TaskManager />} />
//         <Route path="/analytics" element={<Analytics />} />
//         <Route path="/calendar" element={<Calendar />} />
//           <Route path="/reports" element={<Reports />} />
//           <Route path="/projects" element={<Projects />} />
//           <Route path="/clients" element={<Clients />} />
//           <Route path="/invoices" element={<Invoices />} />
//           <Route path="/tags" element={<Tags />} />
//           <Route path="/settings" element={<Settings />} />
//         </Routes>
//       </main>
//     </div>  
//   );
// export default App;
