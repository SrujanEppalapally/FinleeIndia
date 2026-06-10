import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Eye, EyeOff } from 'lucide-react';
import { Button, Input } from '../../components/ui';
import { useAuth } from '../../contexts/AuthContext';

export function LoginPage() {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const errs: typeof errors = {};
    if (!email.trim()) errs.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(email)) errs.email = 'Enter a valid email';
    if (!password) errs.password = 'Password is required';
    if (Object.keys(errs).length) { setErrors(errs); return; }

    setLoading(true);
    setTimeout(() => { login(); }, 600);
  };

  return (
    <>
      <h2 className="text-xl font-bold text-[#28251d] mb-1">Welcome back</h2>
      <p className="text-sm text-[#7a7974] mb-6">Sign in to your Finley account</p>

      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        <Input
          label="Email"
          type="email"
          placeholder="you@example.com"
          value={email}
          onChange={(e) => { setEmail(e.target.value); setErrors((p) => ({ ...p, email: '' })); }}
          error={errors.email}
          autoComplete="email"
        />

        {/* Password with show/hide */}
        <div className="w-full flex flex-col gap-1">
          <label className="text-sm font-medium text-[#28251d]">Password</label>
          <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'}
              placeholder="Enter your password"
              value={password}
              onChange={(e) => { setPassword(e.target.value); setErrors((p) => ({ ...p, password: '' })); }}
              autoComplete="current-password"
              className={[
                'w-full h-10 rounded-[6px] border bg-white text-[#28251d] text-sm placeholder:text-[#7a7974]',
                'px-3 pr-10 transition-colors duration-150',
                'focus:outline-none focus:ring-2 focus:ring-[#01696f] focus:border-[#01696f]',
                errors.password
                  ? 'border-[#a12c7b] focus:ring-[#a12c7b] focus:border-[#a12c7b]'
                  : 'border-[#d4d2cc] hover:border-[#7a7974]',
              ].join(' ')}
            />
            <button
              type="button"
              tabIndex={-1}
              onClick={() => setShowPassword((p) => !p)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[#7a7974] hover:text-[#28251d] transition-colors"
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          {errors.password && <p className="text-xs text-[#a12c7b]">{errors.password}</p>}
        </div>

        {/* Remember me + Forgot password */}
        <div className="flex items-center justify-between">
          <label className="flex items-center gap-2 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              className="w-4 h-4 rounded border-[#d4d2cc] accent-[#01696f] cursor-pointer"
            />
            <span className="text-sm text-[#7a7974]">Remember me</span>
          </label>
          <Link
            to="/forgot-password"
            className="text-sm text-[#01696f] hover:text-[#0c4e54] font-medium transition-colors"
          >
            Forgot password?
          </Link>
        </div>

        <Button type="submit" loading={loading} className="w-full" size="lg">
          Sign In
        </Button>
      </form>

      {/* Divider */}
      <div className="flex items-center gap-3 my-5">
        <div className="flex-1 h-px bg-[#e9e7e1]" />
        <span className="text-xs text-[#7a7974] font-medium">or</span>
        <div className="flex-1 h-px bg-[#e9e7e1]" />
      </div>

      <p className="text-sm text-[#7a7974] text-center">
        Don't have an account?{' '}
        <Link to="/register" className="text-[#01696f] hover:text-[#0c4e54] font-semibold transition-colors">
          Create an account
        </Link>
      </p>
    </>
  );
}
