import { Link } from 'react-router-dom';

export default function Welcome() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold">Welcome to TimeTracker</h1>
        <p className="text-gray-600">Start managing your time effectively</p>
        <Link to="/" className="text-[#4A154B] hover:underline">
          Go to Dashboard
        </Link>
      </div>
    </div>
  );
}