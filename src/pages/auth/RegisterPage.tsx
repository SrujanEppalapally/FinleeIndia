import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Eye, EyeOff } from 'lucide-react';
import { Button, Input } from '../../components/ui';
import { useAuth } from '../../contexts/AuthContext';

interface FormErrors {
  name?: string;
  email?: string;
  phone?: string;
  password?: string;
  confirm?: string;
  terms?: string;
}

function PasswordField({
  label,
  placeholder,
  value,
  onChange,
  error,
  autoComplete,
}: {
  label: string;
  placeholder: string;
  value: string;
  onChange: (v: string) => void;
  error?: string;
  autoComplete?: string;
}) {
  const [show, setShow] = useState(false);
  return (
    <div className="w-full flex flex-col gap-1">
      <label className="text-sm font-medium text-[#28251d]">{label}</label>
      <div className="relative">
        <input
          type={show ? 'text' : 'password'}
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          autoComplete={autoComplete}
          className={[
            'w-full h-10 rounded-[6px] border bg-white text-[#28251d] text-sm placeholder:text-[#7a7974]',
            'px-3 pr-10 transition-colors duration-150',
            'focus:outline-none focus:ring-2 focus:ring-[#01696f] focus:border-[#01696f]',
            error
              ? 'border-[#a12c7b] focus:ring-[#a12c7b] focus:border-[#a12c7b]'
              : 'border-[#d4d2cc] hover:border-[#7a7974]',
          ].join(' ')}
        />
        <button
          type="button"
          tabIndex={-1}
          onClick={() => setShow((s) => !s)}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-[#7a7974] hover:text-[#28251d] transition-colors"
          aria-label={show ? 'Hide' : 'Show'}
        >
          {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
        </button>
      </div>
      {error && <p className="text-xs text-[#a12c7b]">{error}</p>}
    </div>
  );
}

export function RegisterPage() {
  const { login } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [terms, setTerms] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});
  const [loading, setLoading] = useState(false);

  const clearErr = (field: keyof FormErrors) =>
    setErrors((p) => ({ ...p, [field]: '' }));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const errs: FormErrors = {};
    if (!name.trim()) errs.name = 'Full name is required';
    if (!email.trim()) errs.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(email)) errs.email = 'Enter a valid email';
    if (!phone.trim()) errs.phone = 'Phone number is required';
    else if (!/^\d{10}$/.test(phone.replace(/\s/g, ''))) errs.phone = 'Enter a valid 10-digit phone number';
    if (!password) errs.password = 'Password is required';
    else if (password.length < 8) errs.password = 'At least 8 characters required';
    if (!confirm) errs.confirm = 'Please confirm your password';
    else if (password !== confirm) errs.confirm = 'Passwords do not match';
    if (!terms) errs.terms = 'You must accept the terms to continue';
    if (Object.keys(errs).length) { setErrors(errs); return; }

    setLoading(true);
    setTimeout(() => { login(); }, 600);
  };

  return (
    <>
      <h2 className="text-xl font-bold text-[#28251d] mb-1">Create your Finley account</h2>
      <p className="text-sm text-[#7a7974] mb-6">Start tracking your finances today</p>

      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        <Input
          label="Full Name"
          placeholder="Priya Sharma"
          value={name}
          onChange={(e) => { setName(e.target.value); clearErr('name'); }}
          error={errors.name}
          autoComplete="name"
        />
        <Input
          label="Email"
          type="email"
          placeholder="you@example.com"
          value={email}
          onChange={(e) => { setEmail(e.target.value); clearErr('email'); }}
          error={errors.email}
          autoComplete="email"
        />
        <div className="w-full flex flex-col gap-1">
          <label className="text-sm font-medium text-[#28251d]">Phone Number</label>
          <div className="flex">
            <span className="inline-flex items-center px-3 h-10 rounded-l-[6px] border border-r-0 border-[#d4d2cc] bg-[#f7f6f2] text-sm text-[#7a7974] select-none">
              +91
            </span>
            <input
              type="tel"
              placeholder="98765 43210"
              value={phone}
              onChange={(e) => { setPhone(e.target.value.replace(/\D/g, '').slice(0, 10)); clearErr('phone'); }}
              autoComplete="tel"
              maxLength={10}
              className={[
                'flex-1 h-10 rounded-r-[6px] border bg-white text-[#28251d] text-sm placeholder:text-[#7a7974]',
                'px-3 transition-colors duration-150',
                'focus:outline-none focus:ring-2 focus:ring-[#01696f] focus:border-[#01696f]',
                errors.phone
                  ? 'border-[#a12c7b] focus:ring-[#a12c7b] focus:border-[#a12c7b]'
                  : 'border-[#d4d2cc] hover:border-[#7a7974]',
              ].join(' ')}
            />
          </div>
          {errors.phone && <p className="text-xs text-[#a12c7b]">{errors.phone}</p>}
          <p className="text-[11px] text-[#7a7974]">Used for WhatsApp alerts later</p>
        </div>
        <PasswordField
          label="Password"
          placeholder="At least 8 characters"
          value={password}
          onChange={(v) => { setPassword(v); clearErr('password'); }}
          error={errors.password}
          autoComplete="new-password"
        />
        <PasswordField
          label="Confirm Password"
          placeholder="Re-enter your password"
          value={confirm}
          onChange={(v) => { setConfirm(v); clearErr('confirm'); }}
          error={errors.confirm}
          autoComplete="new-password"
        />

        {/* Terms checkbox */}
        <div className="space-y-1">
          <label className="flex items-start gap-2.5 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={terms}
              onChange={(e) => { setTerms(e.target.checked); clearErr('terms'); }}
              className="mt-0.5 w-4 h-4 rounded border-[#d4d2cc] accent-[#01696f] cursor-pointer flex-shrink-0"
            />
            <span className="text-sm text-[#7a7974] leading-relaxed">
              I agree to the{' '}
              <span className="text-[#01696f] font-medium cursor-pointer hover:text-[#0c4e54]">
                Terms of Service
              </span>{' '}
              &amp;{' '}
              <span className="text-[#01696f] font-medium cursor-pointer hover:text-[#0c4e54]">
                Privacy Policy
              </span>
            </span>
          </label>
          {errors.terms && <p className="text-xs text-[#a12c7b] ml-6">{errors.terms}</p>}
        </div>

        <Button type="submit" loading={loading} className="w-full" size="lg">
          Create Account
        </Button>
      </form>

      <p className="text-sm text-[#7a7974] mt-5 text-center">
        Already have an account?{' '}
        <Link to="/login" className="text-[#01696f] hover:text-[#0c4e54] font-semibold transition-colors">
          Sign in
        </Link>
      </p>
    </>
  );
}
