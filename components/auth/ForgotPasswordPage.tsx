import React, { useState } from 'react';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { Input } from '../ui/Input';
import { Loader } from '../ui/Loader';
import { useAppContext } from '../../context/AppContext';

interface ForgotPasswordPageProps {
  onSuccess: (email: string) => void;
  onSwitchToLogin: () => void;
}

export const ForgotPasswordPage: React.FC<ForgotPasswordPageProps> = ({ onSuccess, onSwitchToLogin }) => {
  // const { requestPasswordReset } = useAppContext(); // Would be in a real context
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!email.trim() || !/\S+@\S+\.\S+/.test(email)) {
      setError('Please enter a valid email address.');
      return;
    }
    setIsLoading(true);
    try {
      // In a real app: await requestPasswordReset(email);
      await new Promise(res => setTimeout(res, 1000)); // Simulate API call
      setIsSubmitted(true);
      onSuccess(email);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  if (isSubmitted) {
      return (
        <Card title="Check Your Email" className="w-full max-w-md fade-in">
             <p className="text-slate-400 text-center">
                If an account exists for <strong>{email}</strong>, you will receive an email with instructions on how to reset your password.
             </p>
             <div className="mt-6 text-center">
                <Button onClick={onSwitchToLogin}>Back to Login</Button>
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
          onChange={(e) => setEmail(e.target.value)}
          error={error}
          disabled={isLoading}
          autoComplete="email"
        />
        <div className="pt-2">
            <Button type="submit" disabled={isLoading} className="w-full flex items-center justify-center">
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
