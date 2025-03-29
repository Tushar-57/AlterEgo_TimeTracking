import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';


export default function SignupClassic() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (!agreedToTerms) {
      setError('You must agree to the terms and conditions');
      return;
    }

    try {
      setLoading(true);
      const response = await fetch('http://localhost:8080/api/auth/signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          password,
          name // Add this if your backend supports name
        }),
      });

      const data = await response.json();
      
      if (response.ok) {
        localStorage.setItem('authToken', data.token);
        navigate('/welcome');
      } else {
        setError(data.message || 'Registration failed');
        {error && (
            <div className="text-red-500 text-sm text-center mb-4">
              {error}
            </div>
          )}
      }
    } catch (err) {
      setError('Network error - please try again later');
    } finally {
      setLoading(false);
    }
  };

  // Add Google OAuth handler
  const handleGoogleSignup = () => {
    window.location.href = 'http://localhost:8080/oauth2/authorization/google';
  };  
  

  return (
    <div className="min-h-screen flex bg-[#FFF5E9] p-8">
      <div className="w-full max-w-7xl mx-auto bg-white rounded-3xl overflow-hidden flex shadow-xl">
        {/* Left side with illustration */}
        <div className="w-1/2 p-12 bg-[#FFF5E9] relative">
          {/* Background circles */}
          <div className="absolute top-8 left-8 w-32 h-32 bg-[#B32C1A] rounded-full opacity-80"></div>
          <div className="absolute top-24 right-24 w-8 h-8 bg-[#B32C1A] rounded-full opacity-60"></div>
          <div className="absolute bottom-24 right-12 w-24 h-24 bg-[#FFC7B4] rounded-full opacity-40"></div>
          
          {/* Content */}
          <div className="relative z-10 flex flex-col h-full">
            <div className="flex-grow flex flex-col justify-center">
              <img 
                src="public/Skeleton.jpg" 
                alt="Skeleton at laptop" 
                className="w-96 mx-auto mb-12"
              />
              <h1 className="text-4xl font-bold text-[#4A154B] mb-4">Ready to transform your life?</h1>
              <p className="text-lg text-[#4A154B] mb-8">Join thousands who are already managing their time better with AI</p>
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
                  <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" 
                        stroke="currentColor" 
                        fill="none" 
                        strokeWidth="2" 
                        strokeLinecap="round" 
                        strokeLinejoin="round"/>
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

            <form className="space-y-5">
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

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Confirm Password</label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="block w-full px-3 py-2.5 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-1 focus:ring-[#4A154B] focus:border-[#4A154B]"
                  placeholder="••••••••"
                />
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
                  <a href="#" className="text-[#4A154B] hover:text-[#3D1D38]">Terms of Service</a>
                  {' '}and{' '}
                  <a href="#" className="text-[#4A154B] hover:text-[#3D1D38]">Privacy Policy</a>
                </label>
              </div>

              <button
                type="submit"
                disabled={loading}
                className={`w-full flex justify-center py-2.5 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-[#4A154B] ${
                    loading ? 'opacity-50 cursor-not-allowed' : 'hover:bg-[#3D1D38]'
                }`}
                >
                {loading ? 'Creating Account...' : 'Create Account'}
                </button>
            </form>

            <div className="mt-8 text-center text-sm">
              <span className="text-gray-600">Already have an account?</span>
              <div className="mt-1">
                <span className="text-gray-600 italic">Welcome back!</span>
                {' → '}
                <Link to="/" className="font-medium text-[#4A154B] hover:text-[#3D1D38]">
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