import { useState } from 'react';
import { Link, useNavigate, useLocation, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import skeletonImage from '../images/Skeleton1.jpg';
import { useToast } from './Calendar_updated/components/hooks/use-toast';

export default function LoginClassic() {
  const [email, setEmail] = useState('@gmail.com');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { isAuthenticated, login } = useAuth();
  const { toast } = useToast();
  const location = useLocation();

  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError('Please enter a valid email address');
      setLoading(false);
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      setLoading(false);
      return;
    }

    try {
      const response = await fetch('http://localhost:8080/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Login failed');
      }

      const data = await response.json();
      const token = data.token;

      localStorage.setItem('jwtToken', token.trim());

      login(token, {
        email: data.user.email,
        name: data.user.name,
        onboardingCompleted: data.user.onboardingCompleted, // Pass onboardingCompleted
      });

      toast({ title: 'Success', description: 'Logged in successfully!' });

      // Redirect based on onboarding status
      navigate(data.user.onboardingCompleted ? '/' : '/onboarding', { replace: true });
    } catch (error: any) {
      console.error('Login error:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to log in.',
        variant: 'destructive',
      });
      setError(error.message || 'Failed to log in.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-[#FFF5E9] p-8">
      <div className="w-full max-w-7xl mx-auto bg-white rounded-3xl overflow-hidden flex shadow-xl">
        {/* Left side with illustration */}
        <div className="w-1/2 p-12 bg-[#FFF5E9] relative overflow-hidden">
          <div className="absolute -top-16 -left-16 w-64 h-64 bg-[#B32C1A] rounded-full opacity-20"></div>
          <div className="absolute top-32 -right-8 w-16 h-16 bg-[#FFC7B4] rounded-full opacity-40"></div>
          <div className="absolute bottom-24 left-24 w-32 h-32 bg-[#B32C1A] rounded-full opacity-10"></div>

          <div className="relative z-10 flex flex-col h-full">
            <div className="flex-grow flex flex-col justify-center space-y-6">
              <img
                src={skeletonImage}
                alt="Skeleton at laptop"
                className="w-80 mx-auto transform -rotate-6"
              />
              <div className="space-y-4 pl-12">
                <h1 className="text-4xl font-bold text-[#4A154B] leading-tight">
                  Making time to do<br />
                  things you love ?
                </h1>
                <p className="text-lg text-[#4A154B] opacity-80">
                  Still making changes to your schedule<br />
                  to make time for people you love ?
                </p>
                <br />
                <p className="text-2xl font-handwriting text-[#4A154B] mt-8">
                  Be Human, 3rd:9:0.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Right side with login form */}
        <div className="w-1/2 p-12 flex flex-col justify-center">
          <div className="max-w-md mx-auto w-full">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-[#4A154B] mb-3">Login to your Account</h2>
              <p className="text-[#4A154B]/80">See, how you can live and grow more, Powered with AI</p>
            </div>

            <button className="w-full flex items-center justify-center gap-2 border border-gray-300 rounded-lg px-4 py-2.5 mb-6 hover:bg-gray-50 transition-colors">
              <img src="https://www.google.com/favicon.ico" alt="Google" className="w-5 h-5" />
              <span className="text-gray-700">Continue with Google</span>
            </button>

            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-200"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">or Sign in with Email</span>
              </div>
            </div>

            <form className="space-y-5" onSubmit={handleSubmit}>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="block w-full px-3 py-2.5 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-1 focus:ring-[#4A154B] focus:border-[#4A154B]"
                  placeholder="FutureYou@gmail.com"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full px-3 py-2.5 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-1 focus:ring-[#4A154B] focus:border-[#4A154B]"
                  placeholder="••••••••"
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    className="h-4 w-4 text-[#4A154B] focus:ring-[#4A154B] border-gray-300 rounded"
                  />
                  <label className="ml-2 block text-sm text-gray-700">Remember Me</label>
                </div>
                <a href="#" className="text-sm font-medium text-[#4A154B] hover:text-[#3D1D38]">
                  Forgot Password?
                </a>
              </div>

              {error && (
                <div className="mb-4 p-3 bg-red-100 text-red-800 rounded text-sm">
                  {error === 'Invalid credentials' ? (
                    <div className="space-y-2">
                      <p>Invalid email or password</p>
                      <div className="text-xs">
                        <Link to="/forgot-password" className="text-red-800 hover:text-red-900">
                          Forgot your password?
                        </Link>
                      </div>
                    </div>
                  ) : error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className={`w-full flex justify-center py-2.5 px-4 rounded-lg text-sm font-medium text-white bg-[#4A154B] ${
                  loading ? 'opacity-50 cursor-not-allowed' : 'hover:bg-[#3D1D38]'
                }`}
              >
                {loading ? 'Logging in...' : 'Login'}
              </button>
            </form>

            <div className="mt-8 text-center text-sm">
              <span className="text-gray-600">Still Planning Life By Yourself ?</span>
              <div className="mt-1">
                <span className="text-gray-600 italic">We would love you Onboard you</span>
                {' → '}
                <Link to="/signup" className="font-medium text-[#4A154B] hover:text-[#3D1D38]">
                  Create an account
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}