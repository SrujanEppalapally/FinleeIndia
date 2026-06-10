import { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Eye, EyeOff, CheckCircle } from 'lucide-react';
import { Button, Input } from '../../components/ui';

type Step = 1 | 2 | 3;

const STEP_LABELS = ['Send OTP', 'Verify OTP', 'New Password'];

// ── Progress indicator ─────────────────────────────────────────

function StepProgress({ current }: { current: Step }) {
  return (
    <div className="flex items-center gap-0 mb-6">
      {STEP_LABELS.map((label, i) => {
        const stepNum = (i + 1) as Step;
        const done = current > stepNum;
        const active = current === stepNum;
        return (
          <div key={label} className="flex items-center flex-1 min-w-0">
            <div className="flex flex-col items-center gap-1 flex-shrink-0">
              <div
                className={[
                  'w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-colors',
                  done ? 'bg-[#437a22] text-white' : active ? 'bg-[#01696f] text-white' : 'bg-[#f0ede6] text-[#7a7974]',
                ].join(' ')}
              >
                {done ? <CheckCircle className="w-4 h-4" /> : stepNum}
              </div>
              <span
                className={[
                  'text-[10px] font-medium whitespace-nowrap',
                  active ? 'text-[#01696f]' : done ? 'text-[#437a22]' : 'text-[#7a7974]',
                ].join(' ')}
              >
                {label}
              </span>
            </div>
            {i < STEP_LABELS.length - 1 && (
              <div
                className={[
                  'flex-1 h-0.5 mx-1 mb-4 transition-colors',
                  done ? 'bg-[#437a22]' : 'bg-[#e9e7e1]',
                ].join(' ')}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

// ── OTP input (6 boxes) ────────────────────────────────────────

function OtpInput({ value, onChange, error }: { value: string; onChange: (v: string) => void; error?: string }) {
  const refs = useRef<(HTMLInputElement | null)[]>([]);

  const handleKey = (i: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !value[i] && i > 0) refs.current[i - 1]?.focus();
  };

  const handleChange = (i: number, ch: string) => {
    const digit = ch.replace(/\D/, '');
    if (!digit) return;
    const arr = value.padEnd(6, ' ').split('');
    arr[i] = digit;
    const next = arr.join('').replace(/ /g, '');
    onChange(next.slice(0, 6));
    if (i < 5) refs.current[i + 1]?.focus();
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (pasted) { onChange(pasted); refs.current[Math.min(pasted.length, 5)]?.focus(); }
    e.preventDefault();
  };

  return (
    <div className="space-y-1">
      <label className="text-sm font-medium text-[#28251d]">6-digit OTP</label>
      <div className="flex gap-2 justify-between" onPaste={handlePaste}>
        {Array.from({ length: 6 }).map((_, i) => (
          <input
            key={i}
            ref={(el) => { refs.current[i] = el; }}
            type="text"
            inputMode="numeric"
            maxLength={1}
            value={value[i] ?? ''}
            onChange={(e) => handleChange(i, e.target.value)}
            onKeyDown={(e) => handleKey(i, e)}
            className={[
              'w-10 h-12 rounded-[6px] border text-center text-lg font-bold text-[#28251d]',
              'focus:outline-none focus:ring-2 transition-colors',
              error
                ? 'border-[#a12c7b] focus:ring-[#a12c7b]'
                : 'border-[#d4d2cc] hover:border-[#7a7974] focus:ring-[#01696f] focus:border-[#01696f]',
            ].join(' ')}
          />
        ))}
      </div>
      {error && <p className="text-xs text-[#a12c7b]">{error}</p>}
    </div>
  );
}

// ── Password field ─────────────────────────────────────────────

function PasswordField({
  label,
  placeholder,
  value,
  onChange,
  error,
}: {
  label: string;
  placeholder: string;
  value: string;
  onChange: (v: string) => void;
  error?: string;
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
        >
          {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
        </button>
      </div>
      {error && <p className="text-xs text-[#a12c7b]">{error}</p>}
    </div>
  );
}

// ── Main Page ──────────────────────────────────────────────────

export function ForgotPasswordPage() {
  const [step, setStep] = useState<Step>(1);
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);

  // Resend cooldown countdown
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const t = setTimeout(() => setResendCooldown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [resendCooldown]);

  const handleSendOtp = (e: React.FormEvent) => {
    e.preventDefault();
    const errs: Record<string, string> = {};
    if (!email.trim()) errs.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(email)) errs.email = 'Enter a valid email';
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setStep(2);
      setResendCooldown(30);
    }, 700);
  };

  const handleVerifyOtp = (e: React.FormEvent) => {
    e.preventDefault();
    const errs: Record<string, string> = {};
    if (otp.length < 6) errs.otp = 'Enter the 6-digit OTP';
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setStep(3);
    }, 700);
  };

  const handleReset = (e: React.FormEvent) => {
    e.preventDefault();
    const errs: Record<string, string> = {};
    if (!newPassword) errs.newPassword = 'Password is required';
    else if (newPassword.length < 8) errs.newPassword = 'At least 8 characters required';
    if (!confirmPassword) errs.confirmPassword = 'Please confirm your password';
    else if (newPassword !== confirmPassword) errs.confirmPassword = 'Passwords do not match';
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setDone(true);
    }, 700);
  };

  if (done) {
    return (
      <div className="text-center py-4">
        <div className="w-14 h-14 bg-[#437a22]/10 rounded-full flex items-center justify-center mx-auto mb-4">
          <CheckCircle className="w-7 h-7 text-[#437a22]" />
        </div>
        <h2 className="text-xl font-bold text-[#28251d] mb-2">Password reset!</h2>
        <p className="text-sm text-[#7a7974] mb-6">
          Your password has been updated. You can now sign in with your new password.
        </p>
        <Link
          to="/login"
          className="inline-flex items-center justify-center w-full h-12 rounded-[6px] bg-[#01696f] text-white text-sm font-medium hover:bg-[#0c4e54] transition-colors"
        >
          Back to Sign In
        </Link>
      </div>
    );
  }

  return (
    <>
      <h2 className="text-xl font-bold text-[#28251d] mb-1">Reset your password</h2>
      <p className="text-sm text-[#7a7974] mb-5">
        {step === 1 && "Enter your email and we'll send you an OTP."}
        {step === 2 && `OTP sent to ${email}`}
        {step === 3 && 'Create a new password for your account.'}
      </p>

      <StepProgress current={step} />

      {/* Step 1 — Email + Send OTP */}
      {step === 1 && (
        <form onSubmit={handleSendOtp} className="space-y-4" noValidate>
          <Input
            label="Email"
            type="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => { setEmail(e.target.value); setErrors((p) => ({ ...p, email: '' })); }}
            error={errors.email}
            autoComplete="email"
          />
          <Button type="submit" loading={loading} className="w-full" size="lg">
            Send OTP
          </Button>
        </form>
      )}

      {/* Step 2 — OTP Verify */}
      {step === 2 && (
        <form onSubmit={handleVerifyOtp} className="space-y-4" noValidate>
          <OtpInput
            value={otp}
            onChange={(v) => { setOtp(v); setErrors((p) => ({ ...p, otp: '' })); }}
            error={errors.otp}
          />
          <div className="flex items-center justify-between text-xs">
            <span className="text-[#7a7974]">Didn't receive it?</span>
            {resendCooldown > 0 ? (
              <span className="text-[#7a7974]">Resend in {resendCooldown}s</span>
            ) : (
              <button
                type="button"
                onClick={() => { setResendCooldown(30); setOtp(''); }}
                className="text-[#01696f] hover:text-[#0c4e54] font-medium transition-colors"
              >
                Resend OTP
              </button>
            )}
          </div>
          <Button type="submit" loading={loading} className="w-full" size="lg">
            Verify OTP
          </Button>
        </form>
      )}

      {/* Step 3 — New Password */}
      {step === 3 && (
        <form onSubmit={handleReset} className="space-y-4" noValidate>
          <PasswordField
            label="New Password"
            placeholder="At least 8 characters"
            value={newPassword}
            onChange={(v) => { setNewPassword(v); setErrors((p) => ({ ...p, newPassword: '' })); }}
            error={errors.newPassword}
          />
          <PasswordField
            label="Confirm New Password"
            placeholder="Re-enter new password"
            value={confirmPassword}
            onChange={(v) => { setConfirmPassword(v); setErrors((p) => ({ ...p, confirmPassword: '' })); }}
            error={errors.confirmPassword}
          />
          <Button type="submit" loading={loading} className="w-full" size="lg">
            Reset Password
          </Button>
        </form>
      )}

      <p className="text-sm text-center mt-5">
        <Link to="/login" className="text-[#01696f] hover:text-[#0c4e54] font-medium transition-colors">
          Back to Sign In
        </Link>
      </p>
    </>
  );
}
