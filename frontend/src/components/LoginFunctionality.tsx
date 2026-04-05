import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import skeletonImage from '../images/Skeleton1.jpg';
import { useToast } from './Calendar_updated/components/hooks/use-toast';

type LoginErrorResponse = {
  error?: string;
  message?: string;
};

type LoginSuccessResponse = {
  user: {
    email: string;
    name?: string;
    onboardingCompleted: boolean;
  };
};

const MAX_FAILED_ATTEMPTS = 5;
const COOLDOWN_MS = 30_000;

const getSafeNextPath = (nextPathRaw: string | null): string | null => {
  if (!nextPathRaw) {
    return null;
  }

  try {
    const parsed = new URL(nextPathRaw, window.location.origin);
    const blockedTargets = new Set(['/login', '/signup', '/verify-email', '/forgot-password']);

    if (parsed.origin !== window.location.origin) {
      return null;
    }

    if (!parsed.pathname.startsWith('/')) {
      return null;
    }

    if (blockedTargets.has(parsed.pathname)) {
      return '/';
    }

    return `${parsed.pathname}${parsed.search}${parsed.hash}`;
  } catch {
    return null;
  }
};

export default function LoginClassic() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [failedAttempts, setFailedAttempts] = useState(0);
  const [cooldownUntil, setCooldownUntil] = useState<number | null>(null);
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated, login } = useAuth();
  const { toast } = useToast();

  const isInCooldown = cooldownUntil !== null && Date.now() < cooldownUntil;

  useEffect(() => {
    if (cooldownUntil === null) {
      return;
    }

    const remainingMs = cooldownUntil - Date.now();
    if (remainingMs <= 0) {
      setCooldownUntil(null);
      setFailedAttempts(0);
      return;
    }

    const timer = window.setTimeout(() => {
      setCooldownUntil(null);
      setFailedAttempts(0);
    }, remainingMs);

    return () => window.clearTimeout(timer);
  }, [cooldownUntil]);

  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isInCooldown) {
      setError('Too many failed attempts. Please wait 30 seconds and try again.');
      return;
    }

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
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email, password }),
      });

      const payload = (await response.json().catch(() => ({}))) as LoginErrorResponse & LoginSuccessResponse;

      if (!response.ok) {
        if (response.status === 403 && payload.error === 'EMAIL_NOT_VERIFIED') {
          const normalizedEmail = email.trim().toLowerCase();
          const verificationMessage = payload.message || 'Please verify your email before signing in.';
          toast({
            title: 'Email verification required',
            description: verificationMessage,
          });
          navigate(`/verify-email?email=${encodeURIComponent(normalizedEmail)}`, { replace: true });
          return;
        }

        throw new Error(payload.message || 'Invalid email or password');
      }

      const data = payload as LoginSuccessResponse;

      login({
        email: data.user.email,
        name: data.user.name,
        onboardingCompleted: data.user.onboardingCompleted, // Pass onboardingCompleted
      });

      setFailedAttempts(0);
      setCooldownUntil(null);

      toast({ title: 'Success', description: 'Logged in successfully!' });

      const requestedPath = new URLSearchParams(location.search).get('next');
      const safeNextPath = getSafeNextPath(requestedPath);
      const defaultPath = data.user.onboardingCompleted ? '/' : '/onboarding';

      navigate(safeNextPath || defaultPath, { replace: true });
    } catch (error: unknown) {
      const message = 'Invalid email or password';
      console.error('Login error:', error);

      const nextAttemptCount = failedAttempts + 1;
      setFailedAttempts(nextAttemptCount);
      if (nextAttemptCount >= MAX_FAILED_ATTEMPTS) {
        setCooldownUntil(Date.now() + COOLDOWN_MS);
      }

      toast({
        title: 'Error',
        description: message,
        variant: 'destructive',
      });
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FFF5E9] p-4 sm:p-6 lg:p-8">
      <div className="mx-auto flex w-full max-w-7xl flex-col overflow-hidden rounded-3xl bg-white shadow-xl lg:flex-row">
        {/* Left side with illustration */}
        <div className="relative hidden overflow-hidden bg-[#FFF5E9] p-12 lg:block lg:w-1/2">
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
        <div className="flex w-full flex-col justify-center p-6 sm:p-8 lg:w-1/2 lg:p-12">
          <div className="max-w-md mx-auto w-full">
            <div className="text-center mb-10 sm:mb-12">
              <h2 className="text-2xl sm:text-3xl font-bold text-[#4A154B] mb-3">Login to your Account</h2>
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
                  autoComplete="email"
                  autoCapitalize="none"
                  spellCheck={false}
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
                  autoComplete="current-password"
                  className="block w-full px-3 py-2.5 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-1 focus:ring-[#4A154B] focus:border-[#4A154B]"
                  placeholder="••••••••"
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    autoComplete="off"
                    className="h-4 w-4 text-[#4A154B] focus:ring-[#4A154B] border-gray-300 rounded"
                  />
                  <label className="ml-2 block text-sm text-gray-700">Remember Me</label>
                </div>
                <Link to="/forgot-password" className="text-sm font-medium text-[#4A154B] hover:text-[#3D1D38]">
                  Forgot Password?
                </Link>
              </div>

              {error && (
                <div className="mb-4 p-3 bg-red-100 text-red-800 rounded text-sm">
                  <div className="space-y-2">
                    <p>{error}</p>
                    <div className="text-xs">
                      <Link to="/forgot-password" className="text-red-800 hover:text-red-900">
                        Forgot your password?
                      </Link>
                    </div>
                  </div>
                </div>
              )}

              <button
                type="submit"
                disabled={loading || isInCooldown}
                className={`w-full flex justify-center py-2.5 px-4 rounded-lg text-sm font-medium text-white bg-[#4A154B] ${
                  loading || isInCooldown ? 'opacity-50 cursor-not-allowed' : 'hover:bg-[#3D1D38]'
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