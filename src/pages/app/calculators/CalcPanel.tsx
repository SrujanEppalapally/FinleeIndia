import { ReactNode, useEffect, useRef, useState } from 'react';
import { X, ChevronLeft, ChevronRight, Check, Pencil } from 'lucide-react';

// ── Types ──────────────────────────────────────────────────────

export interface StepDef {
  question: string;
  description: string;
  fields: string[];
  fieldLabels: string[];
  renderInput: (props: {
    values: Record<string, string>;
    onChange: (field: string, val: string) => void;
    errors: Record<string, string>;
  }) => ReactNode;
  validate: (values: Record<string, string>) => Record<string, string>;
  formatReview: (values: Record<string, string>) => string;
}

// ── Progress dots ──────────────────────────────────────────────

function ProgressDots({ total, current }: { total: number; current: number }) {
  return (
    <div className="flex items-center gap-1.5 justify-center">
      {Array.from({ length: total }, (_, i) => (
        <span
          key={i}
          className={[
            'rounded-full transition-all duration-300',
            i === current
              ? 'w-5 h-2 bg-[#01696f] animate-pulse'
              : i < current
              ? 'w-2 h-2 bg-[#01696f]'
              : 'w-2 h-2 bg-[#d4d2cc]',
          ].join(' ')}
        />
      ))}
    </div>
  );
}

// ── Review screen ──────────────────────────────────────────────

function ReviewScreen({
  steps,
  values,
  onEdit,
  onCalculate,
  isCalculating,
}: {
  steps: StepDef[];
  values: Record<string, string>;
  onEdit: (stepIndex: number) => void;
  onCalculate: () => void;
  isCalculating: boolean;
}) {
  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto px-6 py-6 space-y-3">
        <h2 className="text-lg font-bold text-[#28251d] mb-4">Review your inputs</h2>
        {steps.map((step, i) => (
          <div key={i} className="flex items-center justify-between py-3 border-b border-[#f0ede6] last:border-0">
            <div>
              <p className="text-xs text-[#7a7974] font-medium">{step.fieldLabels[0]}</p>
              <p className="text-sm font-semibold text-[#28251d] mt-0.5">{step.formatReview(values)}</p>
            </div>
            <button
              onClick={() => onEdit(i)}
              className="flex items-center gap-1 text-xs text-[#01696f] font-medium hover:text-[#0c4e54] transition-colors"
            >
              <Pencil className="w-3 h-3" />
              Edit
            </button>
          </div>
        ))}
      </div>
      <div className="px-6 pb-6 pt-3 border-t border-[#f0ede6]">
        <button
          onClick={onCalculate}
          disabled={isCalculating}
          className="w-full h-12 rounded-[8px] bg-[#01696f] hover:bg-[#0c4e54] disabled:opacity-60 text-white text-sm font-semibold transition-colors flex items-center justify-center gap-2"
        >
          <Check className="w-4 h-4" />
          Calculate
        </button>
      </div>
    </div>
  );
}

// ── Main CalcPanel component ───────────────────────────────────

interface CalcPanelProps {
  isOpen: boolean;
  onClose: () => void;
  onCalculate: () => void;
  steps: StepDef[];
  values: Record<string, string>;
  onChange: (field: string, val: string) => void;
  errors: Record<string, string>;
  setErrors: React.Dispatch<React.SetStateAction<Record<string, string>>>;
  currentStep: number;
  setCurrentStep: React.Dispatch<React.SetStateAction<number>>;
  returnToReview: boolean;
  setReturnToReview: React.Dispatch<React.SetStateAction<boolean>>;
}

export function CalcPanel({
  isOpen, onClose, onCalculate, steps, values, onChange, errors, setErrors,
  currentStep, setCurrentStep, returnToReview, setReturnToReview,
}: CalcPanelProps) {
  const [isCalculating, setIsCalculating] = useState(false);
  const isReview = currentStep >= steps.length;
  const contentRef = useRef<HTMLDivElement>(null);

  // Hide BottomTabBar on mobile while open
  useEffect(() => {
    const nav = document.querySelector('[data-bottom-tabbar]') as HTMLElement | null;
    if (!nav) return;
    if (isOpen) {
      nav.style.display = 'none';
    } else {
      nav.style.display = '';
    }
    return () => { nav.style.display = ''; };
  }, [isOpen]);

  // Scroll step content to top when step changes
  useEffect(() => {
    if (contentRef.current) contentRef.current.scrollTop = 0;
  }, [currentStep]);

  const handleNext = () => {
    const step = steps[currentStep];
    if (!step) return;
    const errs = step.validate(values);
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setErrors({});
    if (returnToReview) {
      setCurrentStep(steps.length);
      setReturnToReview(false);
    } else {
      setCurrentStep((s) => s + 1);
    }
  };

  const handleBack = () => {
    setErrors({});
    if (isReview) { setCurrentStep(steps.length - 1); return; }
    setCurrentStep((s) => Math.max(0, s - 1));
  };

  const handleEdit = (stepIndex: number) => {
    setReturnToReview(true);
    setCurrentStep(stepIndex);
  };

  const handleCalculate = () => {
    setIsCalculating(true);
    setTimeout(() => {
      onCalculate();
      setIsCalculating(false);
    }, 50);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !isReview) {
      e.preventDefault();
      handleNext();
    }
  };

  return (
    <>
      {/* Overlay */}
      <div
        className={[
          'fixed inset-0 bg-black/40 z-40 transition-opacity duration-300',
          isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none',
        ].join(' ')}
        onClick={onClose}
      />

      {/* Panel */}
      <div
        className={[
          'fixed top-0 right-0 h-full w-full sm:w-[420px] bg-white z-50 flex flex-col shadow-2xl transition-transform duration-300 ease-in-out',
          isOpen ? 'translate-x-0' : 'translate-x-full',
        ].join(' ')}
        onKeyDown={handleKeyDown}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#f0ede6] flex-shrink-0">
          <ProgressDots total={steps.length} current={Math.min(currentStep, steps.length - 1)} />
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full text-[#7a7974] hover:text-[#28251d] hover:bg-[#f0ede6] transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div ref={contentRef} className="flex-1 overflow-y-auto">
          {isReview ? (
            <ReviewScreen
              steps={steps}
              values={values}
              onEdit={handleEdit}
              onCalculate={handleCalculate}
              isCalculating={isCalculating}
            />
          ) : (
            <div className="px-6 py-6 space-y-6">
              <div>
                <p className="text-[11px] font-semibold text-[#01696f] uppercase tracking-wider mb-2">
                  Step {currentStep + 1} of {steps.length}
                </p>
                <h2 className="text-xl font-bold text-[#28251d] leading-snug">{steps[currentStep]?.question}</h2>
                {steps[currentStep]?.description && (
                  <p className="text-sm text-[#7a7974] mt-1.5 leading-relaxed">{steps[currentStep].description}</p>
                )}
              </div>
              <div>
                {steps[currentStep]?.renderInput({ values, onChange, errors })}
              </div>
            </div>
          )}
        </div>

        {/* Footer nav (only shown on step screens, not review) */}
        {!isReview && (
          <div className="flex items-center gap-3 px-6 py-4 border-t border-[#f0ede6] flex-shrink-0">
            {currentStep > 0 && (
              <button
                onClick={handleBack}
                className="flex items-center gap-1.5 h-11 px-4 rounded-[8px] border border-[#d4d2cc] text-[#7a7974] text-sm font-medium hover:bg-[#f0ede6] transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
                Back
              </button>
            )}
            <button
              onClick={handleNext}
              className="flex-1 flex items-center justify-center gap-1.5 h-11 rounded-[8px] bg-[#01696f] hover:bg-[#0c4e54] text-white text-sm font-semibold transition-colors"
            >
              {returnToReview ? 'Back to Review' : currentStep === steps.length - 1 ? 'Review' : 'Next'}
              {!returnToReview && <ChevronRight className="w-4 h-4" />}
            </button>
          </div>
        )}
      </div>
    </>
  );
}

// ── Numeric step input ─────────────────────────────────────────

interface StepInputProps {
  value: string;
  onChange: (val: string) => void;
  prefix?: string;
  suffix?: string;
  placeholder?: string;
  min?: number;
  max?: number;
  error?: string;
  autoFocus?: boolean;
}

export function StepInput({ value, onChange, prefix, suffix, placeholder, min, max, error, autoFocus }: StepInputProps) {
  return (
    <div className="space-y-1.5">
      <div className={[
        'flex items-center h-14 rounded-[8px] border-2 bg-white transition-colors overflow-hidden',
        error ? 'border-[#a12c7b]' : 'border-[#d4d2cc] focus-within:border-[#01696f]',
      ].join(' ')}>
        {prefix && <span className="pl-4 pr-2 text-base text-[#7a7974] font-medium flex-shrink-0">{prefix}</span>}
        <input
          type="number"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          min={min}
          max={max}
          autoFocus={autoFocus}
          className="flex-1 h-full bg-transparent text-base text-[#28251d] font-medium outline-none px-3 [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
        />
        {suffix && <span className="pr-4 pl-2 text-sm text-[#7a7974] flex-shrink-0 whitespace-nowrap">{suffix}</span>}
      </div>
      {error && <p className="text-xs text-[#a12c7b]">{error}</p>}
    </div>
  );
}

// ── Text step input ────────────────────────────────────────────

interface StepTextInputProps {
  value: string;
  onChange: (val: string) => void;
  error?: string;
  placeholder?: string;
}

export function StepTextInput({ value, onChange, error, placeholder }: StepTextInputProps) {
  return (
    <div className="space-y-1.5">
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        autoFocus
        className="w-full h-12 rounded-[8px] border border-[#d4d2cc] bg-white text-[#28251d] text-base px-4 outline-none focus:ring-2 focus:ring-[#01696f] focus:border-[#01696f] hover:border-[#7a7974] transition-colors"
      />
      {error && <p className="text-xs text-[#a12c7b]">{error}</p>}
    </div>
  );
}

// ── Option cards (for toggle-style choices) ───────────────────

interface OptionCardProps<T extends string> {
  options: { value: T; label: string; description?: string }[];
  value: T;
  onChange: (val: T) => void;
}

export function OptionCards<T extends string>({ options, value, onChange }: OptionCardProps<T>) {
  return (
    <div className="flex flex-col gap-2">
      {options.map((opt) => (
        <button
          key={opt.value}
          type="button"
          onClick={() => onChange(opt.value)}
          className={[
            'flex items-start gap-3 w-full text-left px-4 py-3.5 rounded-[8px] border-2 transition-all',
            value === opt.value
              ? 'border-[#01696f] bg-[#01696f]/5'
              : 'border-[#e9e7e1] hover:border-[#01696f]/40 bg-white',
          ].join(' ')}
        >
          <span className={[
            'w-4 h-4 rounded-full border-2 flex-shrink-0 mt-0.5 transition-colors',
            value === opt.value ? 'border-[#01696f] bg-[#01696f]' : 'border-[#d4d2cc]',
          ].join(' ')} />
          <div>
            <p className={`text-sm font-semibold ${value === opt.value ? 'text-[#01696f]' : 'text-[#28251d]'}`}>
              {opt.label}
            </p>
            {opt.description && (
              <p className="text-xs text-[#7a7974] mt-0.5">{opt.description}</p>
            )}
          </div>
        </button>
      ))}
    </div>
  );
}

// ── useCalcPanel hook ─────────────────────────────────────────

export function useCalcPanel(initialValues: Record<string, string>) {
  const [values, setValues] = useState<Record<string, string>>(initialValues);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isOpen, setIsOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [returnToReview, setReturnToReview] = useState(false);
  const [hasResult, setHasResult] = useState(false);
  const [showResult, setShowResult] = useState(false);

  const onChange = (field: string, val: string) => {
    setValues((prev) => ({ ...prev, [field]: val }));
    setErrors((prev) => ({ ...prev, [field]: '' }));
  };

  const openPanel = () => {
    setCurrentStep(0);
    setReturnToReview(false);
    setIsOpen(true);
  };

  const closePanel = () => setIsOpen(false);

  const reset = (defaults: Record<string, string>) => {
    setValues(defaults);
    setErrors({});
    setHasResult(false);
    setShowResult(false);
    setCurrentStep(0);
    setReturnToReview(false);
  };

  const onCalculate = (calcFn: () => unknown) => {
    const result = calcFn();
    if (result !== null) {
      setHasResult(true);
      setIsOpen(false);
      setShowResult(false);
      setTimeout(() => setShowResult(true), 50);
    }
  };

  return {
    values, onChange, errors, setErrors,
    isOpen, openPanel, closePanel,
    currentStep, setCurrentStep,
    returnToReview, setReturnToReview,
    hasResult, showResult,
    reset, onCalculate,
  };
}
