import React, { useState } from 'react';
import { useAppContext } from '../../context/AppContext';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { Input } from '../ui/Input';
import { Loader } from '../ui/Loader';

interface VerifyEmailPageProps {
  email: string;
  onSuccess: () => void;
}

export const VerifyEmailPage: React.FC<VerifyEmailPageProps> = ({ email, onSuccess }) => {
  const { verifyEmail } = useAppContext();
  const [token, setToken] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!token.trim()) {
      setError('Verification token is required.');
      return;
    }
    setIsLoading(true);
    try {
      await verifyEmail(token);
      onSuccess();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card title="Verify Your Email" className="w-full max-w-md fade-in">
      <p className="text-slate-400 text-sm mb-6">
        A verification link has been sent to <strong>{email}</strong>. Please enter the token from the link below to activate your account.
      </p>
      <form onSubmit={handleSubmit} className="space-y-6">
        <Input
          id="verify-token"
          label="Verification Token"
          type="text"
          value={token}
          onChange={(e) => setToken(e.target.value)}
          error={error}
          disabled={isLoading}
        />
        <div className="pt-2">
            <Button type="submit" disabled={isLoading} className="w-full flex items-center justify-center">
                 {isLoading ? <Loader spinnerClassName="w-5 h-5" /> : 'Verify Account'}
            </Button>
        </div>
      </form>
    </Card>
  );
};
