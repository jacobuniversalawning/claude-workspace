'use client';

import { signOut } from 'next-auth/react';

export default function PendingPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0A0A0A] px-4">
      <div className="max-w-md w-full text-center">
        <div className="mb-8">
          <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-yellow-500/20 flex items-center justify-center">
            <svg className="w-10 h-10 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-[#EDEDED] mb-2">Account Pending Approval</h1>
          <p className="text-[#A1A1A1] mb-6">
            Your account has been created but is not yet active. An administrator needs to approve your account before you can access the application.
          </p>
          <div className="p-4 bg-yellow-900/20 border border-yellow-500/30 rounded-lg mb-6">
            <p className="text-sm text-yellow-300">
              Please contact your administrator to activate your account.
            </p>
          </div>
        </div>

        <button
          onClick={() => signOut({ callbackUrl: '/login' })}
          className="px-6 py-2.5 text-sm font-medium text-[#EDEDED] bg-[#1F1F1F] border border-[#333333] rounded-lg hover:bg-[#2A2A2A] transition-colors"
        >
          Sign Out
        </button>
      </div>
    </div>
  );
}
