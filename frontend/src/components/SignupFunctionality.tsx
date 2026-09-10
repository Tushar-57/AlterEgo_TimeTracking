import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import skeletonImg from '../images/Skeleton1.jpg';
import { signup as authSignup } from '../utils/auth';
import { useToast } from './Calendar_updated/components/hooks/use-toast';

const MAX_FAILED_ATTEMPTS = 5;
const COOLDOWN_MS = 30_000;

const passwordMeetsPolicy = (value: string): boolean => {
  return value.length >= 12
    && /[A-Z]/.test(value)
    && /[a-z]/.test(value)
    && /[0-9]/.test(value)
    && /[^A-Za-z0-9]/.test(value);
};

const nameLooksValid = (value: string): boolean => {
  return /^[\p{L}][\p{L} .'-]{1,79}$/u.test(value.trim());
};

export default function SignupClassic() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [failedAttempts, setFailedAttempts] = useState(0);
  const [cooldownUntil, setCooldownUntil] = useState<number | null>(null);
  const navigate = useNavigate();
  const { toast } = useToast();

  const inCooldown = cooldownUntil !== null && Date.now() < cooldownUntil;

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

  const isFormValid =
    nameLooksValid(name) &&
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) &&
    passwordMeetsPolicy(password) &&
    password === confirmPassword &&
    agreedToTerms;

  const validate = () => {
    const errors: string[] = [];
    if (!nameLooksValid(name)) errors.push('Full name is required and may only contain letters, spaces, apostrophes, periods, and hyphens');
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errors.push('Invalid email format');
    if (!passwordMeetsPolicy(password)) {
      errors.push('Password must be at least 12 characters and include uppercase, lowercase, number, and special character');
    }
    if (password !== confirmPassword) errors.push('Passwords do not match');
    if (!agreedToTerms) errors.push('You must agree to the terms and privacy policy');
    setError(errors.join('. ') || null);
    return errors.length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;

    if (inCooldown) {
      setError('Too many attempts. Please wait 30 seconds before retrying.');
      return;
    }

    setError(null);

    if (!validate()) {
      return;
    }

    setLoading(true);
    try {
      await authSignup({ name, email, password });
      setSuccess(true);
      setFailedAttempts(0);
      setCooldownUntil(null);
      toast({
        title: 'Success',
        description: 'Account created. Verify your email using the OTP we sent (check spam/junk too).',
      });
      const normalizedEmail = email.trim().toLowerCase();
      setTimeout(
        () => navigate(`/verify-email?email=${encodeURIComponent(normalizedEmail)}`, { replace: true }),
        900,
      );
    } catch (err: unknown) {
      console.error('Signup error:', err);
      const nextAttempts = failedAttempts + 1;
      setFailedAttempts(nextAttempts);
      if (nextAttempts >= MAX_FAILED_ATTEMPTS) {
        setCooldownUntil(Date.now() + COOLDOWN_MS);
      }

      const message = err instanceof Error && err.message.trim()
        ? err.message
        : 'Unable to complete signup. Please verify your details and try again.';
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
    window.location.href = '/oauth2/authorization/google';
  };

  return (
    <div className="min-h-screen bg-auth-surface p-4 sm:p-6 lg:p-8">
      <div className="mx-auto flex w-full max-w-7xl flex-col overflow-hidden rounded-3xl bg-auth-card shadow-xl lg:flex-row">
        {/* Left side with illustration */}
        <div className="relative hidden bg-auth-surface p-12 lg:block lg:w-1/2">
          <div className="absolute top-8 left-8 w-32 h-32 bg-auth-accent rounded-full opacity-80"></div>
          <div className="absolute top-24 right-24 w-8 h-8 bg-auth-accent-soft rounded-full opacity-60"></div>
          <div className="absolute bottom-24 right-12 w-24 h-24 bg-auth-accent-soft rounded-full opacity-40"></div>

          <div className="relative z-10 flex flex-col h-full">
            <div className="flex-grow flex flex-col justify-center">
              <img src={skeletonImg} alt="Skeleton at laptop" className="w-96 mx-auto mb-12" />
              <h1 className="text-4xl font-bold text-auth-ink mb-4 leading-tight">
                There is a version of you<br />
                who does the things.
              </h1>
              <p className="text-lg text-auth-ink mb-8">
                Track your time, money and habits. See the gap. Close it.
              </p>
              <p className="text-lg font-handwriting text-auth-ink">Become them.</p>
            </div>
          </div>
        </div>

        {/* Right side with signup form */}
        <div className="flex w-full flex-col justify-center p-6 sm:p-8 lg:w-1/2 lg:p-12">
          <div className="max-w-md mx-auto w-full">
            <div className="text-center mb-8">
              <div className="w-8 h-8 mx-auto mb-6">
                <svg viewBox="0 0 24 24" className="w-full h-full text-auth-ink">
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
              <h2 className="text-2xl sm:text-3xl font-semibold text-auth-ink-strong">Create your account</h2>
              <p className="text-auth-ink/80 mt-2 text-sm">Takes a minute.</p>
            </div>

            <button
              onClick={handleGoogleSignup}
              className="w-full flex items-center justify-center gap-2 border border-auth-ink/25 rounded-lg px-4 py-2.5 mb-6 hover:bg-auth-surface/60 transition-colors"
            >
              <img src="https://www.google.com/favicon.ico" alt="Google" className="w-5 h-5" />
              <span className="text-auth-ink">Continue with Google</span>
            </button>

            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-auth-ink/15"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-auth-card text-auth-ink/60">or Sign up with Email</span>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-auth-ink mb-1">Full Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  autoComplete="name"
                  className="block w-full px-3 py-2.5 border border-auth-ink/25 rounded-lg shadow-sm focus:outline-none focus:ring-1 focus:ring-auth-ink focus:border-auth-ink"
                  placeholder="John Doe"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-auth-ink mb-1">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="email"
                  autoCapitalize="none"
                  spellCheck={false}
                  className="block w-full px-3 py-2.5 border border-auth-ink/25 rounded-lg shadow-sm focus:outline-none focus:ring-1 focus:ring-auth-ink focus:border-auth-ink"
                  placeholder="your.email@example.com"
                />
                {email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) && (
                  <p className="text-red-500 text-xs mt-1">Invalid email format</p>
                )}
              </div>

              <div className="relative">
                <label className="block text-sm font-medium text-auth-ink mb-1">Password</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="new-password"
                  className="block w-full px-3 py-2.5 border border-auth-ink/25 rounded-lg shadow-sm focus:outline-none focus:ring-1 focus:ring-auth-ink focus:border-auth-ink"
                  placeholder="••••••••"
                />
                <div className="mt-2 flex gap-1">
                  {[
                    password.length >= 12,
                    /[A-Z]/.test(password),
                    /[a-z]/.test(password),
                    /[0-9]/.test(password),
                    /[^A-Za-z0-9]/.test(password),
                  ].map((valid, idx) => (
                    <div
                      key={idx}
                      className={`h-1 w-1/5 rounded-full ${valid ? 'bg-success' : 'bg-auth-ink/20'}`}
                    />
                  ))}
                </div>
                <div className="text-xs text-auth-ink/60 mt-1">
                  At least 12 characters, with an uppercase, a lowercase, a number and a symbol
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-auth-ink mb-1">Confirm Password</label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  autoComplete="new-password"
                  className="block w-full px-3 py-2.5 border border-auth-ink/25 rounded-lg shadow-sm focus:outline-none focus:ring-1 focus:ring-auth-ink focus:border-auth-ink"
                  placeholder="••••••••"
                />
                {confirmPassword && password !== confirmPassword && (
                  <p className="text-red-500 text-xs mt-1">Passwords do not match</p>
                )}
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  className="h-4 w-4 text-auth-ink focus:ring-auth-ink border-auth-ink/25 rounded"
                  checked={agreedToTerms}
                  onChange={(e) => setAgreedToTerms(e.target.checked)}
                />
                <label className="ml-2 block text-sm text-auth-ink">
                  I agree to the{' '}
                  <a href="#" className="text-auth-ink hover:text-auth-ink-strong">
                    Terms of Service
                  </a>{' '}
                  and{' '}
                  <a href="#" className="text-auth-ink hover:text-auth-ink-strong">
                    Privacy Policy
                  </a>
                </label>
              </div>

              <button
                type="submit"
                disabled={loading || !isFormValid || inCooldown}
                className={`w-full flex justify-center py-2.5 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-auth-ink hover:bg-auth-ink-strong focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-auth-ink disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                {loading ? 'Creating Account...' : 'Create Account'}
              </button>

              {success && (
                <div className="mt-4 p-3 bg-green-100 text-green-800 rounded">
                  Account created. Check your email to verify it.
                </div>
              )}
              {error && (
                <div className="mt-4 p-3 bg-red-100 text-red-800 rounded">{error}</div>
              )}
            </form>

            <div className="mt-8 text-center text-sm">
              <span className="text-auth-ink/80">Already have an account?</span>
              <div className="mt-1">
                <span className="text-auth-ink/80 italic">Welcome back!</span>
                {' → '}
                <Link to="/login" className="font-medium text-auth-ink hover:text-auth-ink-strong">
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