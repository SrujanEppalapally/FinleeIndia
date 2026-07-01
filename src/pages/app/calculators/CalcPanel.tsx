import { useEffect, useRef, ReactNode } from 'react';
import { X, ChevronLeft, ChevronRight, Pencil } from 'lucide-react';

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

interface CalcPanelProps {
  isOpen: boolean;
  onClose: () => void;
  onCalculate: () => void;
  steps: StepDef[];
  values: Record<string, string>;
  onChange: (field: string, val: string) => void;
  errors: Record<string, string>;
  setErrors: (errs: Record<string, string>) => void;
  currentStep: number;
  setCurrentStep: (s: number) => void;
  returnToReview: boolean;
  setReturnToReview: (v: boolean) => void;
}

// ── Progress Dots ──────────────────────────────────────────────

function ProgressDots({ total, current }: { total: number; current: number }) {
  return (
    <div className="flex items-center justify-center gap-2">
      {Array.from({ length: total }).map((_, i) => {
        const done = i < current;
        const active = i === current;
        return (
          <span
            key={i}
            className={[
              'rounded-full transition-all duration-300',
              done ? 'w-2 h-2 bg-[#01696f]' : active ? 'w-2.5 h-2.5 bg-[#01696f] ring-4 ring-[#01696f]/20 animate-pulse' : 'w-2 h-2 bg-[#d4d2cc]',
            ].join(' ')}
          />
        );
      })}
    </div>
  );
}

// ── Main Panel ─────────────────────────────────────────────────

export function CalcPanel({
  isOpen, onClose, onCalculate,
  steps, values, onChange, errors, setErrors,
  currentStep, setCurrentStep,
  returnToReview, setReturnToReview,
}: CalcPanelProps) {
  const inputRef = useRef<HTMLDivElement>(null);
  const isReview = currentStep === steps.length;
  const totalDots = steps.length + 1; // steps + review

  // Focus first input when step changes
  useEffect(() => {
    if (!isOpen) return;
    const timer = setTimeout(() => {
      const el = inputRef.current?.querySelector('input');
      if (el) el.focus();
    }, 320);
    return () => clearTimeout(timer);
  }, [currentStep, isOpen]);

  // Hide BottomTabBar while open (mobile)
  useEffect(() => {
    const tabBar = document.querySelector('[data-bottom-tabbar]') as HTMLElement | null;
    if (!tabBar) return;
    tabBar.style.display = isOpen ? 'none' : '';
    return () => { tabBar.style.display = ''; };
  }, [isOpen]);

  // Enter key → Next
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key !== 'Enter') return;
      if (isReview) { onCalculate(); return; }
      handleNext();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  });

  const validateCurrent = (): Record<string, string> => {
    if (isReview) return {};
    return steps[currentStep].validate(values);
  };

  const handleNext = () => {
    const errs = validateCurrent();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setErrors({});
    if (returnToReview) {
      setReturnToReview(false);
      setCurrentStep(steps.length); // back to review
    } else {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    setErrors({});
    if (returnToReview) {
      setReturnToReview(false);
      setCurrentStep(steps.length);
    } else {
      setCurrentStep(Math.max(0, currentStep - 1));
    }
  };

  const handleEditStep = (i: number) => {
    setErrors({});
    setReturnToReview(true);
    setCurrentStep(i);
  };

  const isNextDisabled = !isReview && Object.keys(validateCurrent()).some((k) => {
    // only disable if *required* field is empty (not if there's already an error shown)
    const step = steps[currentStep];
    return step.fields.includes(k) && !values[k];
  }) || (!isReview && steps[currentStep].fields.some((f) => !values[f] && steps[currentStep].validate(values)[f]));

  const canGoNext = isReview ? true : Object.keys(steps[currentStep].validate(values)).length === 0;

  return (
    <>
      {/* Overlay */}
      <div
        className={[
          'fixed inset-0 z-40 bg-black/40 transition-opacity duration-300',
          isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none',
        ].join(' ')}
        onClick={onClose}
      />

      {/* Panel */}
      <div
        className={[
          'fixed top-0 right-0 bottom-0 z-50 flex flex-col bg-white shadow-2xl',
          'w-full sm:w-[420px]',
          'transition-transform duration-300 ease-out',
          isOpen ? 'translate-x-0' : 'translate-x-full',
        ].join(' ')}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-6 pb-4 flex-shrink-0">
          <ProgressDots total={totalDots} current={currentStep} />
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full text-[#7a7974] hover:bg-[#f0ede6] hover:text-[#28251d] transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Step counter */}
        <div className="px-6 pb-2 flex-shrink-0">
          <span className="text-xs text-[#7a7974] font-medium">
            {isReview ? 'Review' : `Step ${currentStep + 1} of ${steps.length}`}
          </span>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6">
          {isReview ? (
            <div className="space-y-4 pb-6">
              <h2 className="text-xl font-bold text-[#28251d]">Review your inputs</h2>
              <p className="text-sm text-[#7a7974]">Check everything looks right before we calculate.</p>

              <div className="space-y-0 divide-y divide-[#f0ede6] mt-4">
                {steps.map((step, i) => (
                  <div key={i} className="flex items-start justify-between py-3.5 gap-3">
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-[#7a7974] mb-0.5">
                        {step.fieldLabels.length === 1 ? step.fieldLabels[0] : step.question}
                      </p>
                      <p className="text-sm font-semibold text-[#28251d] truncate">
                        {step.formatReview(values)}
                      </p>
                    </div>
                    <button
                      onClick={() => handleEditStep(i)}
                      className="flex-shrink-0 flex items-center gap-1 text-xs font-medium text-[#01696f] hover:text-[#0c4e54] mt-0.5 transition-colors"
                    >
                      <Pencil className="w-3 h-3" />
                      Edit
                    </button>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="space-y-6 pb-6" ref={inputRef}>
              <div>
                <h2 className="text-[20px] font-bold text-[#28251d] leading-snug">
                  {steps[currentStep].question}
                </h2>
                <p className="text-sm text-[#7a7974] mt-1.5">
                  {steps[currentStep].description}
                </p>
              </div>
              {steps[currentStep].renderInput({ values, onChange, errors })}
            </div>
          )}
        </div>

        {/* Footer nav */}
        <div className="flex-shrink-0 border-t border-[#f0ede6] px-6 py-4 flex items-center justify-between gap-3 bg-white">
          <button
            onClick={handleBack}
            disabled={currentStep === 0 && !returnToReview}
            className={[
              'flex items-center gap-1.5 text-sm font-medium transition-colors',
              currentStep === 0 && !returnToReview
                ? 'text-[#d4d2cc] cursor-not-allowed'
                : 'text-[#7a7974] hover:text-[#28251d]',
            ].join(' ')}
          >
            <ChevronLeft className="w-4 h-4" />
            Back
          </button>

          {isReview ? (
            <button
              onClick={onCalculate}
              className="flex-1 max-w-[200px] h-10 bg-[#01696f] hover:bg-[#0c4e54] text-white text-sm font-semibold rounded-[6px] transition-colors"
            >
              Calculate
            </button>
          ) : (
            <button
              onClick={handleNext}
              disabled={!canGoNext}
              className={[
                'flex items-center gap-1.5 text-sm font-semibold transition-colors h-10 px-5 rounded-[6px]',
                canGoNext
                  ? 'bg-[#01696f] hover:bg-[#0c4e54] text-white'
                  : 'bg-[#d4d2cc] text-white cursor-not-allowed',
              ].join(' ')}
            >
              {returnToReview ? 'Back to Review' : 'Next'}
              <ChevronRight className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </>
  );
}

// ── Reusable numeric input with prefix/suffix ──────────────────

interface StepInputProps {
  value: string;
  onChange: (val: string) => void;
  error?: string;
  prefix?: string;
  suffix?: string;
  placeholder?: string;
  min?: number;
  max?: number;
  step?: number;
  autoFocus?: boolean;
}

export function StepInput({
  value, onChange, error, prefix, suffix, placeholder, min, max, step = 1, autoFocus,
}: StepInputProps) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center h-12 rounded-[8px] border border-[#d4d2cc] bg-white overflow-hidden focus-within:ring-2 focus-within:ring-[#01696f] focus-within:border-[#01696f] hover:border-[#7a7974] transition-colors">
        {prefix && (
          <span className="pl-4 pr-2 text-[#7a7974] text-base font-medium select-none">{prefix}</span>
        )}
        <input
          type="number"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          min={min}
          max={max}
          step={step}
          autoFocus={autoFocus}
          className="flex-1 h-full bg-transparent text-[#28251d] text-base outline-none px-3 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
        />
        {suffix && (
          <span className="pr-4 pl-2 text-[#7a7974] text-sm font-medium select-none">{suffix}</span>
        )}
      </div>
      {error && <p className="text-xs text-[#a12c7b]">{error}</p>}
    </div>
  );
}

// ── Text input for non-numeric steps ──────────────────────────

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

// ── Hook for managing panel state ─────────────────────────────

import { useState } from 'react';

export function useCalcPanel(initialValues: Record<string, string>) {
  const [values, setValues] = useState<Record<string, string>>(initialValues);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isOpen, setIsOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [returnToReview, setReturnToReview] = useState(false);
  const [hasResult, setHasResult] = useState(false);
  const [showResult, setShowResult] = useState(false);

  const openPanel = () => {
    setIsOpen(true);
    if (!hasResult) setCurrentStep(0);
  };

  const closePanel = () => {
    setIsOpen(false);
    setErrors({});
  };

  const onChange = (field: string, val: string) => {
    setValues((prev) => ({ ...prev, [field]: val }));
    setErrors((prev) => {
      const next = { ...prev };
      delete next[field];
      return next;
    });
  };

  const reset = (defaults: Record<string, string>) => {
    setValues(defaults);
    setErrors({});
    setCurrentStep(0);
    setReturnToReview(false);
    setHasResult(false);
    setShowResult(false);
    setIsOpen(true);
  };

  const onCalculate = (runCalc: () => void) => {
    setIsOpen(false);
    setHasResult(true);
    setShowResult(false);
    setTimeout(() => setShowResult(true), 30);
    runCalc();
  };

  return {
    values, onChange,
    errors, setErrors,
    isOpen, openPanel, closePanel,
    currentStep, setCurrentStep,
    returnToReview, setReturnToReview,
    hasResult, showResult,
    reset, onCalculate,
  };
}
