import React, { useState } from 'react';
import { useAppContext } from '../../context/AppContext';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { Input } from '../ui/Input';
import { Loader } from '../ui/Loader';
import { SocialButton } from '../ui/SocialButton';

interface SignUpPageProps {
  onSwitchToLogin: () => void;
  onSignUpSuccess: (email: string) => void;
}

export const SignUpPage: React.FC<SignUpPageProps> = ({ onSwitchToLogin, onSignUpSuccess }) => {
  const { signup } = useAppContext();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [isLoading, setIsLoading] = useState(false);

  const validate = () => {
    const newErrors: { [key: string]: string } = {};
    if (!email) {
      newErrors.email = 'Email is required.';
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = 'Email address is invalid.';
    }
    if (!password) {
      newErrors.password = 'Password is required.';
    } else if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/.test(password)) {
        newErrors.password = 'Password must be 8+ characters and include an uppercase, lowercase, number, and special character.';
    }
    if (password !== confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match.';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setIsLoading(true);
    try {
      await signup({ email, password });
      onSignUpSuccess(email);
    } catch (error: any) {
      setErrors({ form: error.message || "An unexpected error occurred." });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card title="Create an Account" className="w-full max-w-md fade-in">
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          id="signup-email"
          label="Email Address"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          error={errors.email}
          disabled={isLoading}
          autoComplete="email"
        />
        <Input
          id="signup-password"
          label="Password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          error={errors.password}
          disabled={isLoading}
          autoComplete="new-password"
        />
        <Input
          id="confirm-password"
          label="Confirm Password"
          type="password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          error={errors.confirmPassword}
          disabled={isLoading}
          autoComplete="new-password"
        />
        {errors.form && <p className="text-sm text-red-400 -mb-2">{errors.form}</p>}
        <div className="pt-2">
          <Button type="submit" disabled={isLoading} className="w-full flex items-center justify-center">
            {isLoading ? <Loader spinnerClassName="w-5 h-5" /> : 'Create Account'}
          </Button>
        </div>
      </form>
      <div className="relative my-6">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-slate-700" />
        </div>
        <div className="relative flex justify-center text-sm">
          <span className="px-2 bg-slate-800 text-slate-400">Or continue with</span>
        </div>
      </div>
      <div className="space-y-3">
        <SocialButton provider="google" onClick={() => {}} isLoading={false} />
        <SocialButton provider="github" onClick={() => {}} isLoading={false} />
      </div>
      <p className="text-sm text-center text-slate-400 mt-6">
        Already have an account?{' '}
        <button type="button" onClick={onSwitchToLogin} className="font-semibold text-red-400 hover:underline focus:outline-none">
          Log in
        </button>
      </p>
    </Card>
  );
};
