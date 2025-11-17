// sarim-aliii/version2/version2-1493846b30acdc91c679cab38a402d8b18ff91c6/components/auth/LoginPage.tsx
import React, { useState } from 'react';
import { useAppContext } from '../../context/AppContext';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { Input } from '../ui/Input';
import { Loader } from '../ui/Loader';
import { SocialButton } from '../ui/SocialButton';

interface LoginPageProps {
  onSwitchToSignUp: () => void;
  onSwitchToForgotPassword: () => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onSwitchToSignUp, onSwitchToForgotPassword }) => {
  const { login, loginWithGoogle, loginWithGithub } = useAppContext();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!email || !password) {
      setError('Please enter both email and password.');
      return;
    }
    setIsLoading(true);
    try {
      await login({ email, password });
      // On success, the AppContext will handle redirecting to the main app
    } catch (err: any) {
      setError(err.message || 'Login failed. Please check your credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card title="Welcome Back" className="w-full max-w-md fade-in">
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          id="login-email"
          label="Email Address"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          disabled={isLoading}
          autoComplete="email"
        />
        <div>
          <Input
            id="login-password"
            label="Password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={isLoading}
            autoComplete="current-password"
          />
          <div className="text-right mt-1">
             <button type="button" onClick={onSwitchToForgotPassword} className="text-xs font-semibold text-red-400 hover:underline focus:outline-none">
                Forgot password?
            </button>
          </div>
        </div>
        {error && <p className="text-sm text-red-400 -mb-2">{error}</p>}
        <div className="pt-2">
            <Button type="submit" disabled={isLoading} className="w-full flex items-center justify-center">
                 {isLoading ? <Loader spinnerClassName="w-5 h-5" /> : 'Log In'}
            </Button>
        </div>
      </form>
       <div className="relative my-6">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-slate-700" />
        </div>
        <div className="relative flex justify-center text-sm">
          <span className="px-2 bg-slate-800 text-slate-400">Or log in with</span>
        </div>
      </div>
      <div className="space-y-3">
        <SocialButton provider="google" onClick={loginWithGoogle} isLoading={false} />
        <SocialButton provider="github" onClick={loginWithGithub} isLoading={false} />
      </div>
       <p className="text-sm text-center text-slate-400 mt-6">
          Don't have an account?{' '}
          <button type="button" onClick={onSwitchToSignUp} className="font-semibold text-red-400 hover:underline focus:outline-none">
            Sign up
          </button>
        </p>
    </Card>
  );
};