import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import skeletonImg from '../images/Skeleton1.jpg';
import { signup as authSignup } from '../utils/auth';
import { useToast } from './Calendar_updated/components/hooks/use-toast';

export default function SignupClassic() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const isFormValid =
    name.trim() !== '' &&
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) &&
    password.length >= 6 &&
    password === confirmPassword &&
    agreedToTerms;

  const validate = () => {
    const errors: string[] = [];
    if (!name.trim()) errors.push('Full name is required');
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errors.push('Invalid email format');
    if (password.length < 6) errors.push('Password must be at least 6 characters');
    if (!/[0-9]/.test(password)) errors.push('Password must contain at least one number');
    if (password !== confirmPassword) errors.push('Passwords do not match');
    if (!agreedToTerms) errors.push('You must agree to the terms and privacy policy');
    setError(errors.join('. ') || null);
    return errors.length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;
    setError(null);

    if (!validate()) {
      return;
    }

    setLoading(true);
    try {
      const response = await authSignup({ name, email, password });
      setSuccess(true);
      toast({
        title: 'Success',
        description: 'Account created successfully! Please log in.',
      });
      setTimeout(() => navigate('/login', { replace: true }), 1000); // Redirect after 1s to show toast
    } catch (err: any) {
      console.error('Signup error:', err);
      const message =
        err.message === 'This email is already registered'
          ? 'This email is already registered'
          : 'Registration failed - please try again later';
      setError(message);
      toast({
        title: 'Error',
        description: message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignup = () => {
    window.location.href = 'http://localhost:8080/oauth2/authorization/google';
  };

  return (
    <div className="min-h-screen flex bg-[#FFF5E9] p-8">
      <div className="w-full max-w-7xl mx-auto bg-white rounded-3xl overflow-hidden flex shadow-xl">
        {/* Left side with illustration */}
        <div className="w-1/2 p-12 bg-[#FFF5E9] relative">
          <div className="absolute top-8 left-8 w-32 h-32 bg-[#B32C1A] rounded-full opacity-80"></div>
          <div className="absolute top-24 right-24 w-8 h-8 bg-[#FFC7B4] rounded-full opacity-60"></div>
          <div className="absolute bottom-24 right-12 w-24 h-24 bg-[#FFC7B4] rounded-full opacity-40"></div>

          <div className="relative z-10 flex flex-col h-full">
            <div className="flex-grow flex flex-col justify-center">
              <img src={skeletonImg} alt="Skeleton at laptop" className="w-96 mx-auto mb-12" />
              <h1 className="text-4xl font-bold text-[#4A154B] mb-4">Ready to transform your life?</h1>
              <p className="text-lg text-[#4A154B] mb-8">
                Join thousands who are already managing their time better with AI
              </p>
              <p className="text-lg font-handwriting text-[#4A154B]">Be Human, Ask AI.</p>
            </div>
          </div>
        </div>

        {/* Right side with signup form */}
        <div className="w-1/2 p-12 flex flex-col justify-center">
          <div className="max-w-md mx-auto w-full">
            <div className="text-center mb-8">
              <div className="w-8 h-8 mx-auto mb-6">
                <svg viewBox="0 0 24 24" className="w-full h-full text-[#4A154B]">
                  <path
                    d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"
                    stroke="currentColor"
                    fill="none"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>
              <h2 className="text-2xl font-semibold text-gray-900">Create your Account</h2>
              <p className="text-gray-600 mt-2 text-sm">Start your journey to better time management</p>
            </div>

            <button
              onClick={handleGoogleSignup}
              className="w-full flex items-center justify-center gap-2 border border-gray-300 rounded-lg px-4 py-2.5 mb-6 hover:bg-gray-50 transition-colors"
            >
              <img src="https://www.google.com/favicon.ico" alt="Google" className="w-5 h-5" />
              <span className="text-gray-700">Continue with Google</span>
            </button>

            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-200"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">or Sign up with Email</span>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="block w-full px-3 py-2.5 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-1 focus:ring-[#4A154B] focus:border-[#4A154B]"
                  placeholder="John Doe"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="block w-full px-3 py-2.5 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-1 focus:ring-[#4A154B] focus:border-[#4A154B]"
                  placeholder="your.email@example.com"
                />
                {email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) && (
                  <p className="text-red-500 text-xs mt-1">Invalid email format</p>
                )}
              </div>

              <div className="relative">
                <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full px-3 py-2.5 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-1 focus:ring-[#4A154B] focus:border-[#4A154B]"
                  placeholder="••••••••"
                />
                <div className="mt-2 flex gap-1">
                  {[
                    password.length >= 8,
                    /[A-Z]/.test(password),
                    /[0-9]/.test(password),
                  ].map((valid, idx) => (
                    <div
                      key={idx}
                      className={`h-1 w-1/3 rounded-full ${valid ? 'bg-green-500' : 'bg-gray-200'}`}
                    />
                  ))}
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  Requirements: 8+ characters, 1 uppercase, 1 number
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Confirm Password</label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="block w-full px-3 py-2.5 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-1 focus:ring-[#4A154B] focus:border-[#4A154B]"
                  placeholder="••••••••"
                />
                {confirmPassword && password !== confirmPassword && (
                  <p className="text-red-500 text-xs mt-1">Passwords do not match</p>
                )}
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  className="h-4 w-4 text-[#4A154B] focus:ring-[#4A154B] border-gray-300 rounded"
                  checked={agreedToTerms}
                  onChange={(e) => setAgreedToTerms(e.target.checked)}
                />
                <label className="ml-2 block text-sm text-gray-700">
                  I agree to the{' '}
                  <a href="#" className="text-[#4A154B] hover:text-[#3D1D38]">
                    Terms of Service
                  </a>{' '}
                  and{' '}
                  <a href="#" className="text-[#4A154B] hover:text-[#3D1D38]">
                    Privacy Policy
                  </a>
                </label>
              </div>

              <button
                type="submit"
                disabled={loading || !isFormValid}
                className={`w-full flex justify-center py-2.5 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-[#4A154B] hover:bg-[#3D1D38] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#4A154B] disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                {loading ? 'Creating Account...' : 'Create Account'}
              </button>

              {success && (
                <div className="mt-4 p-3 bg-green-100 text-green-800 rounded">
                  Signup successful! Redirecting to login...
                </div>
              )}
              {error && (
                <div className="mt-4 p-3 bg-red-100 text-red-800 rounded">{error}</div>
              )}
            </form>

            <div className="mt-8 text-center text-sm">
              <span className="text-gray-600">Already have an account?</span>
              <div className="mt-1">
                <span className="text-gray-600 italic">Welcome back!</span>
                {' → '}
                <Link to="/login" className="font-medium text-[#4A154B] hover:text-[#3D1D38]">
                  Sign in to your account
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}