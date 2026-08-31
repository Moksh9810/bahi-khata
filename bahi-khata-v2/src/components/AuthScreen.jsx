import { useState } from 'react';

export default function AuthScreen({ onSignup, onSignin }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignup, setIsSignup] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      if (isSignup) {
        await onSignup(email, password);
      } else {
        await onSignin(email, password);
      }
    } catch (err) {
      setError(err.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap" rel="stylesheet"/>
      <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&family=JetBrains+Mono:wght@500;600&display=swap" rel="stylesheet"/>

      <div className="w-full max-w-md">
        <div className="card p-8">
          <h1 className="text-headline-lg font-headline-lg text-primary mb-2">
            ₹ Bahi-Khata
          </h1>
          <p className="text-on-surface-variant mb-8 text-body-md">
            Track investments, maximize returns
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full card px-4 py-3 text-on-surface focus:outline-none focus:ring-2 focus:ring-primary"
              required
            />

            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full card px-4 py-3 text-on-surface focus:outline-none focus:ring-2 focus:ring-primary"
              required
            />

            {error && (
              <div className="text-error text-sm p-3 rounded-lg bg-error/10">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full btn-primary w-full py-3 disabled:opacity-50"
            >
              {loading ? 'Loading...' : (isSignup ? 'Sign Up' : 'Login')}
            </button>
          </form>

          <p className="text-center text-on-surface-variant text-sm mt-6">
            {isSignup ? 'Already have an account?' : "Don't have an account?"}{' '}
            <button
              onClick={() => {
                setIsSignup(!isSignup);
                setError('');
              }}
              className="text-primary hover:underline"
            >
              {isSignup ? 'Login' : 'Sign Up'}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
