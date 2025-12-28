'use client';

import { signIn } from 'next-auth/react';
import { useSearchParams } from 'next/navigation';
import { Suspense, useState } from 'react';

function LoginContent() {
  const searchParams = useSearchParams();
  const error = searchParams.get('error');
  const [isLoading, setIsLoading] = useState(false);

  const handleSignIn = async () => {
    setIsLoading(true);
    await signIn('google', { callbackUrl: '/' });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-black p-4">
      {/* Background gradient effect */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-gradient-radial from-[#0070F3]/10 via-transparent to-transparent opacity-50" />
      </div>

      <div className="relative w-full max-w-md animate-fade-in-up">
        {/* Logo and Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-white rounded-2xl mb-6 shadow-lg shadow-white/10">
            <svg className="w-8 h-8 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-[#EDEDED] tracking-tight mb-2">Universal Awning</h1>
          <p className="text-[#666666]">Cost Sheet Calculator</p>
        </div>

        {/* Login Card */}
        <div className="bg-[#0A0A0A] rounded-2xl border border-[#1F1F1F] p-8 shadow-2xl shadow-black/50">
          <h2 className="text-lg font-semibold text-[#EDEDED] text-center tracking-tight mb-1">Welcome Back</h2>
          <p className="text-[#666666] text-sm text-center mb-8">Sign in with your Google account to continue</p>

          {error && (
            <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl">
              <p className="text-sm text-red-400 text-center">
                {error === 'AccessDenied'
                  ? 'Access denied. Only @universalawning.com emails are allowed.'
                  : error === 'OAuthCallbackError'
                  ? 'Google sign-in failed. Please try again or contact support if the issue persists.'
                  : error === 'SessionError'
                  ? 'Session expired or invalid. Please sign in again.'
                  : error === 'Configuration'
                  ? 'Server configuration error. Please contact support.'
                  : 'Sign in failed. Please try again.'}
              </p>
            </div>
          )}

          <button
            onClick={handleSignIn}
            disabled={isLoading}
            className="w-full flex items-center justify-center gap-3 px-6 py-3.5 bg-white text-black rounded-full text-sm font-medium hover:bg-[#E5E5E5] transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <div className="w-5 h-5 border-2 border-black/20 border-t-black rounded-full animate-spin" />
            ) : (
              <>
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                </svg>
                Sign in with Google
              </>
            )}
          </button>

          <div className="mt-8 pt-6 border-t border-[#1F1F1F]">
            <p className="text-xs text-[#666666] text-center">
              Only @universalawning.com emails can access this app.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-8 text-center">
          <p className="text-xs text-[#666666]">&copy; {new Date().getFullYear()} Universal Awning & Canopy</p>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-black">
        <div className="flex items-center gap-3">
          <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
          <div className="w-2 h-2 bg-white rounded-full animate-pulse [animation-delay:150ms]" />
          <div className="w-2 h-2 bg-white rounded-full animate-pulse [animation-delay:300ms]" />
        </div>
      </div>
    }>
      <LoginContent />
    </Suspense>
  );
}
