import { useState } from 'react';
import { Camera, Lock, MessageCircle, AlertTriangle, X } from 'lucide-react';
import { Button, Input } from '../../components/ui';

// ── Confirm Modal ──────────────────────────────────────────────

function ConfirmModal({
  title,
  description,
  confirmLabel,
  onConfirm,
  onCancel,
}: {
  title: string;
  description: string;
  confirmLabel: string;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onCancel} />
      <div className="relative bg-white rounded-[8px] shadow-card-md w-full max-w-[400px] p-6 space-y-4">
        <div className="flex items-start justify-between gap-3">
          <div className="w-10 h-10 rounded-full bg-[#a12c7b]/10 flex items-center justify-center flex-shrink-0">
            <AlertTriangle className="w-5 h-5 text-[#a12c7b]" />
          </div>
          <button onClick={onCancel} className="text-[#7a7974] hover:text-[#28251d] transition-colors ml-auto">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div>
          <h3 className="text-base font-bold text-[#28251d]">{title}</h3>
          <p className="text-sm text-[#7a7974] mt-1 leading-relaxed">{description}</p>
        </div>
        <div className="flex gap-3 pt-1">
          <Button variant="secondary" size="md" className="flex-1" onClick={onCancel}>
            Cancel
          </Button>
          <Button variant="danger" size="md" className="flex-1" onClick={onConfirm}>
            {confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}

// ── Main Page ──────────────────────────────────────────────────

const MOCK = {
  name: 'Srujan Reddy',
  email: 'srujan@example.com',
  phone: '9876543210',
  whatsapp: '9876543210',
};

export function ProfilePage() {
  const [name, setName] = useState(MOCK.name);
  const [phone, setPhone] = useState(MOCK.phone);
  const [whatsapp, setWhatsapp] = useState(MOCK.whatsapp);
  const [errors, setErrors] = useState<{ name?: string; phone?: string; whatsapp?: string }>({});
  const [saved, setSaved] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const initials = name
    .split(' ')
    .map((w) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const errs: typeof errors = {};
    if (!name.trim()) errs.name = 'Name is required';
    if (phone && !/^\d{10}$/.test(phone.replace(/\s/g, ''))) errs.phone = 'Enter a valid 10-digit number';
    if (whatsapp && !/^\d{10}$/.test(whatsapp.replace(/\s/g, ''))) errs.whatsapp = 'Enter a valid 10-digit number';
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  return (
    <>
      <div className="mx-auto w-full max-w-2xl space-y-5">
        {/* Avatar section */}
        <div className="bg-white rounded-[8px] shadow-card p-6 flex flex-col items-center gap-3">
          <div className="w-20 h-20 rounded-full bg-[#01696f] flex items-center justify-center">
            <span className="text-2xl font-bold text-white tracking-wide">{initials}</span>
          </div>
          <button
            type="button"
            className="flex items-center gap-1.5 text-sm font-medium text-[#01696f] hover:text-[#0c4e54] transition-colors"
          >
            <Camera className="w-4 h-4" />
            Change Photo
          </button>
        </div>

        {/* Form */}
        <div className="bg-white rounded-[8px] shadow-card p-6">
          <p className="text-sm font-semibold text-[#28251d] mb-5">Personal Information</p>
          <form onSubmit={handleSave} className="space-y-4" noValidate>
            <Input
              label="Full Name"
              placeholder="Srujan Reddy"
              value={name}
              onChange={(e) => { setName(e.target.value); setErrors((p) => ({ ...p, name: '' })); }}
              error={errors.name}
            />

            {/* Email — read only */}
            <div className="w-full flex flex-col gap-1">
              <label className="text-sm font-medium text-[#28251d]">Email</label>
              <div className="relative">
                <input
                  type="email"
                  value={MOCK.email}
                  readOnly
                  className="w-full h-10 rounded-[6px] border border-[#d4d2cc] bg-[#f7f6f2] text-[#7a7974] text-sm px-3 pr-9 cursor-not-allowed"
                />
                <Lock className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#7a7974]" />
              </div>
              <p className="text-[11px] text-[#7a7974]">Email cannot be changed</p>
            </div>

            {/* Phone */}
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
                  onChange={(e) => { setPhone(e.target.value.replace(/\D/g, '').slice(0, 10)); setErrors((p) => ({ ...p, phone: '' })); }}
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
            </div>

            {/* WhatsApp */}
            <div className="w-full flex flex-col gap-1">
              <label className="text-sm font-medium text-[#28251d] flex items-center gap-1.5">
                <MessageCircle className="w-4 h-4 text-[#25d366]" />
                WhatsApp Number
              </label>
              <div className="flex">
                <span className="inline-flex items-center px-3 h-10 rounded-l-[6px] border border-r-0 border-[#d4d2cc] bg-[#f7f6f2] text-sm text-[#7a7974] select-none">
                  +91
                </span>
                <input
                  type="tel"
                  placeholder="98765 43210"
                  value={whatsapp}
                  onChange={(e) => { setWhatsapp(e.target.value.replace(/\D/g, '').slice(0, 10)); setErrors((p) => ({ ...p, whatsapp: '' })); }}
                  maxLength={10}
                  className={[
                    'flex-1 h-10 rounded-r-[6px] border bg-white text-[#28251d] text-sm placeholder:text-[#7a7974]',
                    'px-3 transition-colors duration-150',
                    'focus:outline-none focus:ring-2 focus:ring-[#01696f] focus:border-[#01696f]',
                    errors.whatsapp
                      ? 'border-[#a12c7b] focus:ring-[#a12c7b] focus:border-[#a12c7b]'
                      : 'border-[#d4d2cc] hover:border-[#7a7974]',
                  ].join(' ')}
                />
              </div>
              {errors.whatsapp && <p className="text-xs text-[#a12c7b]">{errors.whatsapp}</p>}
              <p className="text-[11px] text-[#7a7974]">Used for budget alerts and notifications</p>
            </div>

            <div className="flex items-center gap-3 pt-1">
              <Button type="submit" variant="primary" size="md">
                Save Changes
              </Button>
              {saved && (
                <span className="text-sm font-medium text-[#437a22] animate-pulse">
                  Saved!
                </span>
              )}
            </div>
          </form>
        </div>

        {/* Danger Zone */}
        <div className="bg-white rounded-[8px] shadow-card p-6 border border-[#a12c7b]/15">
          <p className="text-sm font-semibold text-[#a12c7b] mb-1">Danger Zone</p>
          <p className="text-xs text-[#7a7974] mb-4 leading-relaxed">
            Permanently delete your account and all associated data. This action cannot be undone.
          </p>
          <Button
            variant="danger"
            size="md"
            onClick={() => setShowDeleteModal(true)}
          >
            Delete Account
          </Button>
        </div>
      </div>

      {showDeleteModal && (
        <ConfirmModal
          title="Delete your account?"
          description="This will permanently delete your account, all transactions, budgets, and settings. There is no way to recover this data."
          confirmLabel="Yes, Delete Account"
          onConfirm={() => setShowDeleteModal(false)}
          onCancel={() => setShowDeleteModal(false)}
        />
      )}
    </>
  );
}
