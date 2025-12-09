import React, { useState, useEffect } from 'react';
import { useAppContext } from '../../context/AppContext';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import OtpInput from '../ui/OtpInput';
import { Loader } from '../ui/Loader';

interface VerifyEmailPageProps {
  email: string;
  onSuccess: () => void;
}

export const VerifyEmailPage: React.FC<VerifyEmailPageProps> = ({ email, onSuccess }) => {
  const { verifyEmail } = useAppContext();
  
  const [token, setToken] = useState('');
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  
  const [isLoading, setIsLoading] = useState(false);
  const [isResending, setIsResending] = useState(false);
  
  // Timer state (starts at 60 seconds)
  const [timer, setTimer] = useState(60);

  // Timer Countdown Logic
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (timer > 0) {
      interval = setInterval(() => {
        setTimer((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [timer]);

  // Main Verification Logic
  const handleVerification = async (code: string) => {
    setError('');
    setSuccessMsg('');
    
    if (!code || code.length < 6) {
      setError('Please enter the full 6-digit code.');
      return;
    }

    setIsLoading(true);
    try {
      await verifyEmail(code);
      onSuccess();
    } catch (err: any) {
      setError(err.message || 'Verification failed');
      setIsLoading(false);
    }
  };

  // Resend Logic
  const handleResend = async () => {
    setIsResending(true);
    setError('');
    setSuccessMsg('');

    try {
      // NOTE: Replace with your specific API client if you have one (e.g. axios.post)
      const response = await fetch('/api/auth/resend-verification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (!response.ok) throw new Error(data.message || 'Failed to resend');

      setSuccessMsg('New code sent! Please check your email.');
      setTimer(60); // Reset timer to 60s
    } catch (err: any) {
      setError(err.message || 'Could not resend code');
    } finally {
      setIsResending(false);
    }
  };

  // Manual Verify Button Click
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleVerification(token);
  };

  return (
    <Card title="Verify Your Email" className="w-full max-w-md fade-in">
      <p className="text-slate-400 text-sm mb-6 text-center">
        A 6-digit verification code has been sent to <br/>
        <strong className="text-slate-200">{email}</strong>. 
      </p>

      <form onSubmit={handleSubmit} className="space-y-6">
        
        {/* OTP Input */}
        <div className="flex justify-center">
            <OtpInput 
                length={6} 
                onComplete={(code) => {
                    setToken(code);
                    handleVerification(code);
                }} 
            />
        </div>

        {/* Messages */}
        {error && (
            <div className="text-red-500 text-sm text-center bg-red-500/10 p-2 rounded">
                {error}
            </div>
        )}
        {successMsg && (
            <div className="text-green-500 text-sm text-center bg-green-500/10 p-2 rounded">
                {successMsg}
            </div>
        )}

        {/* Verify Button */}
        <div className="pt-2">
            <Button 
                type="submit" 
                disabled={isLoading || token.length < 6} 
                className="w-full flex items-center justify-center"
            >
                 {isLoading ? <Loader spinnerClassName="w-5 h-5" /> : 'Verify Account'}
            </Button>
        </div>
      </form>

      {/* Resend Link / Timer */}
      <div className="mt-6 text-center text-sm">
        <p className="text-slate-500">
          Didn't receive the code?{' '}
          {timer > 0 ? (
            <span className="text-slate-400 font-medium">
              Resend in {timer}s
            </span>
          ) : (
            <button
              onClick={handleResend}
              disabled={isResending}
              className="text-blue-400 hover:text-blue-300 font-medium hover:underline focus:outline-none transition-colors"
            >
              {isResending ? 'Sending...' : 'Resend Code'}
            </button>
          )}
        </p>
      </div>
    </Card>
  );
};