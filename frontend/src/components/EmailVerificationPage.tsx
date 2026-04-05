import { useMemo, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';

type VerificationResponse = {
  message?: string;
  devCode?: string;
  error?: string;
};

const isEmailValid = (value: string): boolean => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);

export default function EmailVerificationPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const initialEmail = useMemo(() => (searchParams.get('email') || '').trim(), [searchParams]);

  const [email, setEmail] = useState(initialEmail);
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [devCode, setDevCode] = useState<string | null>(null);

  const requestNewCode = async () => {
    setErrorMessage(null);
    setStatusMessage(null);

    if (!isEmailValid(email)) {
      setErrorMessage('Please enter a valid email address.');
      return;
    }

    setResending(true);
    try {
      const response = await fetch('/api/auth/email-verification/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email }),
      });

      const payload = (await response.json().catch(() => ({}))) as VerificationResponse;
      if (!response.ok) {
        throw new Error(payload.message || 'Unable to send verification code.');
      }

      setStatusMessage(payload.message || 'Verification code sent. Please check your inbox and spam folder.');
      setDevCode(payload.devCode || null);
    } catch (error) {
      console.error('Email verification request failed:', error);
      setErrorMessage(error instanceof Error ? error.message : 'Unable to send verification code.');
    } finally {
      setResending(false);
    }
  };

  const verifyCode = async (event: React.FormEvent) => {
    event.preventDefault();
    setErrorMessage(null);
    setStatusMessage(null);

    if (!isEmailValid(email)) {
      setErrorMessage('Please enter a valid email address.');
      return;
    }

    if (!/^[0-9]{6}$/.test(code)) {
      setErrorMessage('Verification code must be exactly 6 digits.');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/auth/email-verification/confirm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email, code }),
      });

      const payload = (await response.json().catch(() => ({}))) as VerificationResponse;
      if (!response.ok) {
        throw new Error(payload.message || 'Verification code is invalid or expired.');
      }

      setStatusMessage(payload.message || 'Email verified successfully. Redirecting to login...');
      setTimeout(() => navigate('/login', { replace: true }), 1200);
    } catch (error) {
      console.error('Email verification confirmation failed:', error);
      setErrorMessage(error instanceof Error ? error.message : 'Unable to verify email.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FFF5E9] p-4 sm:p-6 lg:p-8">
      <div className="mx-auto w-full max-w-xl overflow-hidden rounded-3xl bg-white p-6 shadow-xl sm:p-8 lg:p-10">
        <h1 className="text-2xl font-semibold text-[#4A154B] sm:text-3xl">Verify your email</h1>
        <p className="mt-2 text-sm text-gray-600">
          Enter the 6-digit OTP sent to your inbox. If you do not see it, please check your spam or junk folder.
        </p>

        {statusMessage && (
          <div className="mt-5 rounded-lg bg-green-100 px-4 py-3 text-sm text-green-800">
            {statusMessage}
          </div>
        )}

        {errorMessage && (
          <div className="mt-5 rounded-lg bg-red-100 px-4 py-3 text-sm text-red-800">
            {errorMessage}
          </div>
        )}

        <form className="mt-6 space-y-4" onSubmit={verifyCode}>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Email</label>
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              autoComplete="email"
              autoCapitalize="none"
              spellCheck={false}
              placeholder="you@example.com"
              className="block w-full rounded-lg border border-gray-300 px-3 py-2.5 shadow-sm focus:border-[#4A154B] focus:outline-none focus:ring-1 focus:ring-[#4A154B]"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">6-digit OTP</label>
            <input
              type="text"
              value={code}
              onChange={(event) => setCode(event.target.value.replace(/\D/g, '').slice(0, 6))}
              inputMode="numeric"
              autoComplete="one-time-code"
              placeholder="123456"
              className="block w-full rounded-lg border border-gray-300 px-3 py-2.5 shadow-sm focus:border-[#4A154B] focus:outline-none focus:ring-1 focus:ring-[#4A154B]"
            />
            {devCode && (
              <p className="mt-1 text-xs text-amber-700">Development code: {devCode}</p>
            )}
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg bg-[#4A154B] px-4 py-2.5 text-sm font-medium text-white transition hover:bg-[#3D1D38] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading ? 'Verifying...' : 'Verify Email'}
            </button>
            <button
              type="button"
              onClick={requestNewCode}
              disabled={resending}
              className="w-full rounded-lg border border-[#4A154B] px-4 py-2.5 text-sm font-medium text-[#4A154B] transition hover:bg-[#F9F2FA] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {resending ? 'Sending...' : 'Resend OTP'}
            </button>
          </div>
        </form>

        <div className="mt-6 text-center text-sm text-gray-600">
          Already verified?{' '}
          <Link to="/login" className="font-medium text-[#4A154B] hover:text-[#3D1D38]">
            Go back to login
          </Link>
        </div>
      </div>
    </div>
  );
}
