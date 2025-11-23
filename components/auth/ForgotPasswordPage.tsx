import React, { useState } from 'react';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { Input } from '../ui/Input';
import { Loader } from '../ui/Loader';
import { forgotPassword } from '../../services/api';


interface ForgotPasswordPageProps {
  onSuccess: (email: string) => void;
  onSwitchToLogin: () => void;
  onSwitchToSignUp: () => void;
}

export const ForgotPasswordPage: React.FC<ForgotPasswordPageProps> = ({ onSuccess, onSwitchToLogin, onSwitchToSignUp }) => {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [userNotFound, setUserNotFound] = useState(false);
  const [socialLoginError, setSocialLoginError] = useState(false); // New State
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setUserNotFound(false);
    setSocialLoginError(false);

    if (!email.trim() || !/\S+@\S+\.\S+/.test(email)) {
      setError('Please enter a valid email address.');
      return;
    }

    setIsLoading(true);
    try {
      await forgotPassword(email);
      setIsSubmitted(true);
      onSuccess(email);
    } 
    catch (err: any) {
      if (err.message && (err.message.includes('404') || err.message.toLowerCase().includes('user not found'))) {
        setUserNotFound(true);
        setError("We couldn't find an account with that email.");
      } 
      else if (err.message && err.message.includes('You registered with')) {
         setSocialLoginError(true);
         setError(err.message);
      }
      else {
        setError(err.message || "Failed to send reset email.");
      }
    } 
    finally {
      setIsLoading(false);
    }
  };

  if (isSubmitted) {
      return (
        <Card title="Check Your Email" className="w-full max-w-md fade-in">
             <div className="text-center space-y-4">
                <div className="mx-auto w-12 h-12 bg-green-900/30 rounded-full flex items-center justify-center">
                    <svg className="w-6 h-6 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
                </div>
                 <p className="text-slate-300">
                    We have sent a password reset link to <strong>{email}</strong>.
                 </p>
                 <p className="text-sm text-slate-500">Please check your inbox and spam folder.</p>
                 <div className="pt-4">
                    <Button onClick={onSwitchToLogin} variant="secondary" className="w-full">Back to Login</Button>
                </div>
            </div>
        </Card>
      )
  }

  return (
    <Card title="Reset Your Password" className="w-full max-w-md fade-in">
      <p className="text-slate-400 text-sm mb-6">
        Enter your email address and we will send you a link to reset your password.
      </p>
      <form onSubmit={handleSubmit} className="space-y-6">
        <Input
          id="reset-email"
          label="Email Address"
          type="email"
          value={email}
          onChange={(e) => {
              setEmail(e.target.value);
              setError(''); 
              setUserNotFound(false);
              setSocialLoginError(false);
          }}
          error={!socialLoginError && !userNotFound ? error : undefined}
          disabled={isLoading}
          autoComplete="email"
        />

        {userNotFound && (
            <div className="bg-red-900/20 border border-red-500/50 rounded-md p-3 text-center">
                <p className="text-sm text-red-200 mb-2">Account does not exist.</p>
                <Button type="button" onClick={onSwitchToSignUp} variant="secondary" className="w-full text-xs py-1.5">
                    Create New Account
                </Button>
            </div>
        )}

        {socialLoginError && (
            <div className="bg-blue-900/20 border border-blue-500/50 rounded-md p-3 text-center">
                <p className="text-sm text-blue-200 mb-2">{error}</p>
                <Button type="button" onClick={onSwitchToLogin} className="w-full text-xs py-1.5">
                    Go to Login
                </Button>
            </div>
        )}

        <div className="pt-2">
            <Button type="submit" disabled={isLoading || userNotFound || socialLoginError} className="w-full flex items-center justify-center">
                 {isLoading ? <Loader spinnerClassName="w-5 h-5" /> : 'Send Reset Link'}
            </Button>
        </div>
      </form>
       <p className="text-sm text-center text-slate-400 mt-6">
          Remember your password?{' '}
          <button type="button" onClick={onSwitchToLogin} className="font-semibold text-red-400 hover:underline focus:outline-none">
            Back to Login
          </button>
        </p>
    </Card>
  );
};