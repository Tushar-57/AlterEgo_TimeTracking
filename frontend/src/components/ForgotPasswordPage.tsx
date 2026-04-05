import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

type ResetRequestResponse = {
  message?: string;
  devCode?: string;
};

const passwordMeetsPolicy = (value: string): boolean => {
  return value.length >= 12
    && /[A-Z]/.test(value)
    && /[a-z]/.test(value)
    && /[0-9]/.test(value)
    && /[^A-Za-z0-9]/.test(value);
};

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<'request' | 'confirm'>('request');
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [devCode, setDevCode] = useState<string | null>(null);
  const navigate = useNavigate();

  const requestReset = async (event: React.FormEvent) => {
    event.preventDefault();
    setErrorMessage(null);
    setStatusMessage(null);

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setErrorMessage('Please enter a valid email address.');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/auth/password-reset/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email }),
      });

      const payload = await response.json().catch(() => ({})) as ResetRequestResponse;
      if (!response.ok) {
        throw new Error('Unable to process password reset request.');
      }

      setStatusMessage(payload.message || 'If the account exists, a reset code has been issued.');
      setDevCode(payload.devCode || null);
      setStep('confirm');
    } catch (error) {
      console.error('Password reset request failed:', error);
      setErrorMessage('Unable to process password reset request. Please try again shortly.');
    } finally {
      setLoading(false);
    }
  };

  const confirmReset = async (event: React.FormEvent) => {
    event.preventDefault();
    setErrorMessage(null);
    setStatusMessage(null);

    if (!/^[0-9]{6}$/.test(code)) {
      setErrorMessage('Reset code must be exactly 6 digits.');
      return;
    }

    if (!passwordMeetsPolicy(newPassword)) {
      setErrorMessage('Password must be at least 12 characters and include uppercase, lowercase, number, and special character.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setErrorMessage('Passwords do not match.');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/auth/password-reset/confirm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email, code, newPassword }),
      });

      const payload = await response.json().catch(() => ({} as { message?: string }));
      if (!response.ok) {
        throw new Error(payload.message || 'Reset code is invalid or expired.');
      }

      setStatusMessage(payload.message || 'Password updated successfully.');
      setTimeout(() => navigate('/login', { replace: true }), 1200);
    } catch (error) {
      console.error('Password reset confirmation failed:', error);
      setErrorMessage(error instanceof Error ? error.message : 'Unable to reset password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FFF5E9] p-4 sm:p-6 lg:p-8">
      <div className="mx-auto w-full max-w-xl overflow-hidden rounded-3xl bg-white p-6 shadow-xl sm:p-8 lg:p-10">
        <h1 className="text-2xl font-semibold text-[#4A154B] sm:text-3xl">Reset your password</h1>
        <p className="mt-2 text-sm text-gray-600">
          Use a one-time verification code. No password reset token is exposed in the URL.
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

        {step === 'request' ? (
          <form className="mt-6 space-y-4" onSubmit={requestReset}>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Account Email</label>
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

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg bg-[#4A154B] px-4 py-2.5 text-sm font-medium text-white transition hover:bg-[#3D1D38] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading ? 'Requesting Code...' : 'Request Reset Code'}
            </button>
          </form>
        ) : (
          <form className="mt-6 space-y-4" onSubmit={confirmReset}>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                autoComplete="email"
                autoCapitalize="none"
                spellCheck={false}
                className="block w-full rounded-lg border border-gray-300 px-3 py-2.5 shadow-sm focus:border-[#4A154B] focus:outline-none focus:ring-1 focus:ring-[#4A154B]"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">6-digit code</label>
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
                <p className="mt-1 text-xs text-amber-700">
                  Development code: {devCode}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">New Password</label>
              <input
                type="password"
                value={newPassword}
                onChange={(event) => setNewPassword(event.target.value)}
                autoComplete="new-password"
                placeholder="••••••••••••"
                className="block w-full rounded-lg border border-gray-300 px-3 py-2.5 shadow-sm focus:border-[#4A154B] focus:outline-none focus:ring-1 focus:ring-[#4A154B]"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Confirm New Password</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                autoComplete="new-password"
                placeholder="••••••••••••"
                className="block w-full rounded-lg border border-gray-300 px-3 py-2.5 shadow-sm focus:border-[#4A154B] focus:outline-none focus:ring-1 focus:ring-[#4A154B]"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg bg-[#4A154B] px-4 py-2.5 text-sm font-medium text-white transition hover:bg-[#3D1D38] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading ? 'Updating Password...' : 'Update Password'}
            </button>
          </form>
        )}

        <div className="mt-6 text-center text-sm text-gray-600">
          Remembered your password?{' '}
          <Link to="/login" className="font-medium text-[#4A154B] hover:text-[#3D1D38]">
            Go back to login
          </Link>
        </div>
      </div>
    </div>
  );
}
