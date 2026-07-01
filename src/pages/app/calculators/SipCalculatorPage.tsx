import { useEffect } from 'react';
import { ArrowLeft, TrendingUp, Star, RefreshCw, RotateCcw } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useTopBarActions } from '../../../contexts/TopBarActionsContext';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts';
import { CalcPanel, StepInput, OptionCards, useCalcPanel } from './CalcPanel';
import type { StepDef } from './CalcPanel';

function formatINR(n: number): string {
  const a = Math.abs(n);
  if (a >= 1_00_00_000) return `₹${(a / 1_00_00_000).toFixed(2)} Cr`;
  if (a >= 1_00_000) return `₹${(a / 1_00_000).toFixed(2)} L`;
  if (a >= 1_000) return `₹${(a / 1_000).toFixed(1)} K`;
  return `₹${a.toLocaleString('en-IN')}`;
}
function fmtY(v: number): string {
  const a = Math.abs(v);
  if (a >= 1_00_00_000) return `${(a / 1_00_00_000).toFixed(1)}Cr`;
  if (a >= 1_00_000) return `${(a / 1_00_000).toFixed(1)}L`;
  if (a >= 1_000) return `${(a / 1_000).toFixed(0)}K`;
  return String(a);
}

const DEFAULTS = {
  monthlyAmount: '5000', annualReturn: '12', years: '10',
  stepUpType: 'percent', stepUpPct: '10', stepUpFixed: '500',
};

interface YearDataPoint { year: number; invested: number; total: number; returns: number; sipAmount: number; }
interface SipResult { investedAmount: number; estimatedReturns: number; totalValue: number; wealthRatio: number; yearData: YearDataPoint[]; }

function calculateSip(v: Record<string, string>): SipResult | null {
  const P = parseFloat(v.monthlyAmount);
  const annualRate = parseFloat(v.annualReturn);
  const years = parseInt(v.years, 10);
  if (!P || !annualRate || !years || P <= 0 || annualRate <= 0 || years <= 0) return null;
  const r = annualRate / 12 / 100;
  const yearData: YearDataPoint[] = [];
  let totalInvested = 0, corpus = 0;
  for (let y = 1; y <= years; y++) {
    let monthlyP: number;
    if (v.stepUpType === 'percent') {
      monthlyP = P * Math.pow(1 + parseFloat(v.stepUpPct || '0') / 100, y - 1);
    } else {
      monthlyP = P + parseFloat(v.stepUpFixed || '0') * (y - 1);
    }
    monthlyP = Math.max(monthlyP, 0);
    corpus = corpus * Math.pow(1 + r, 12) + monthlyP * (((Math.pow(1 + r, 12) - 1) / r) * (1 + r));
    totalInvested += monthlyP * 12;
    yearData.push({ year: y, invested: Math.round(totalInvested), total: Math.round(corpus), returns: Math.round(corpus - totalInvested), sipAmount: Math.round(monthlyP) });
  }
  const totalValue = Math.round(corpus);
  const investedAmount = Math.round(totalInvested);
  return { investedAmount, estimatedReturns: totalValue - investedAmount, totalValue, wealthRatio: investedAmount > 0 ? totalValue / investedAmount : 0, yearData };
}

function ChartTip({ active, payload, label }: { active?: boolean; payload?: Array<{ name: string; value: number; color: string }>; label?: string | number }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-[#e9e7e1] rounded-[6px] shadow-card p-3 text-xs">
      <p className="font-semibold text-[#28251d] mb-1.5">Year {label}</p>
      {payload.map((p) => (
        <div key={p.name} className="flex items-center gap-2 mb-0.5">
          <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: p.color }} />
          <span className="text-[#7a7974]">{p.name}:</span>
          <span className="font-medium text-[#28251d]">{formatINR(p.value)}</span>
        </div>
      ))}
    </div>
  );
}

function buildSteps(values: Record<string, string>): StepDef[] {
  return [
    {
      question: 'Monthly SIP Amount',
      description: 'How much will you invest every month into your SIP?',
      fields: ['monthlyAmount'],
      fieldLabels: ['Monthly SIP Amount'],
      renderInput: ({ values: v, onChange, errors }) => (
        <StepInput value={v.monthlyAmount} onChange={(val) => onChange('monthlyAmount', val)} prefix="₹" placeholder="5000" min={100} error={errors.monthlyAmount} autoFocus />
      ),
      validate: (v) => {
        const errs: Record<string, string> = {};
        if (!v.monthlyAmount || Number(v.monthlyAmount) <= 0) errs.monthlyAmount = 'Enter a valid amount';
        return errs;
      },
      formatReview: (v) => formatINR(parseFloat(v.monthlyAmount || '0')),
    },
    {
      question: 'Expected Annual Return',
      description: 'Estimated yearly return from your mutual fund investments.',
      fields: ['annualReturn'],
      fieldLabels: ['Annual Return'],
      renderInput: ({ values: v, onChange, errors }) => (
        <StepInput value={v.annualReturn} onChange={(val) => onChange('annualReturn', val)} suffix="% per year" placeholder="12" min={1} max={40} error={errors.annualReturn} autoFocus />
      ),
      validate: (v) => {
        const errs: Record<string, string> = {};
        if (!v.annualReturn || Number(v.annualReturn) <= 0) errs.annualReturn = 'Enter a valid rate';
        return errs;
      },
      formatReview: (v) => `${v.annualReturn}%`,
    },
    {
      question: 'Investment Duration',
      description: 'How many years do you plan to keep investing?',
      fields: ['years'],
      fieldLabels: ['Duration'],
      renderInput: ({ values: v, onChange, errors }) => (
        <StepInput value={v.years} onChange={(val) => onChange('years', val)} suffix="years" placeholder="10" min={1} max={50} error={errors.years} autoFocus />
      ),
      validate: (v) => {
        const errs: Record<string, string> = {};
        if (!v.years || Number(v.years) <= 0 || Number(v.years) > 50) errs.years = 'Enter 1–50 years';
        return errs;
      },
      formatReview: (v) => `${v.years} years`,
    },
    {
      question: 'Step-Up Type',
      description: 'Will your SIP grow by a percentage or a fixed amount each year?',
      fields: ['stepUpType'],
      fieldLabels: ['Step-Up Type'],
      renderInput: ({ values: v, onChange }) => (
        <OptionCards
          options={[
            { value: 'percent', label: '% Per Year', description: 'SIP increases by a percentage annually' },
            { value: 'fixed', label: 'Fixed ₹/Year', description: 'SIP increases by a fixed rupee amount annually' },
          ]}
          value={v.stepUpType as 'percent' | 'fixed'}
          onChange={(val) => onChange('stepUpType', val)}
        />
      ),
      validate: () => ({}),
      formatReview: (v) => v.stepUpType === 'percent' ? '% per year' : 'Fixed ₹/year',
    },
    {
      question: values.stepUpType === 'percent' ? 'Annual Step-Up Percentage' : 'Annual Increase Amount',
      description: values.stepUpType === 'percent'
        ? 'Your SIP will increase by this percentage each year.'
        : 'Your SIP will increase by this fixed amount each year.',
      fields: [values.stepUpType === 'percent' ? 'stepUpPct' : 'stepUpFixed'],
      fieldLabels: [values.stepUpType === 'percent' ? 'Step-Up %' : 'Step-Up Amount'],
      renderInput: ({ values: v, onChange, errors }) => (
        v.stepUpType === 'percent'
          ? <StepInput value={v.stepUpPct} onChange={(val) => onChange('stepUpPct', val)} suffix="% per year" placeholder="10" min={0} error={errors.stepUpPct} autoFocus />
          : <StepInput value={v.stepUpFixed} onChange={(val) => onChange('stepUpFixed', val)} prefix="₹" placeholder="500" min={0} error={errors.stepUpFixed} autoFocus />
      ),
      validate: () => ({}),
      formatReview: (v) => v.stepUpType === 'percent' ? `${v.stepUpPct}% per year` : formatINR(parseFloat(v.stepUpFixed || '0')) + '/year',
    },
  ];
}

export function SipCalculatorPage() {
  const navigate = useNavigate();
  const { setActions } = useTopBarActions();
  const panel = useCalcPanel(DEFAULTS);
  const result = panel.hasResult ? calculateSip(panel.values) : null;
  const steps = buildSteps(panel.values);

  useEffect(() => {
    setActions(
      <button onClick={() => navigate('/calculators')} className="flex items-center gap-1.5 text-sm text-[#7a7974] hover:text-[#28251d] transition-colors">
        <ArrowLeft className="w-4 h-4" /><span className="hidden sm:inline">All Calculators</span>
      </button>
    );
    return () => setActions(null);
  }, [setActions, navigate]);

  useEffect(() => { if (!panel.hasResult) panel.openPanel(); }, []);

  return (
    <>
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-[#01696f]/10 flex items-center justify-center">
            <TrendingUp className="w-5 h-5 text-[#01696f]" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-[#28251d]">Incremental SIP Calculator</h2>
            <p className="text-xs text-[#7a7974]">Step-up SIP growth with % or fixed annual increase</p>
          </div>
        </div>

        {result ? (
          <div
            className="space-y-4"
            style={{ opacity: panel.showResult ? 1 : 0, transform: panel.showResult ? 'translateY(0)' : 'translateY(20px)', transition: 'opacity 250ms ease, transform 250ms ease' }}
          >
            <div className="bg-white rounded-[8px] shadow-card p-5 space-y-3">
              <p className="text-xs font-semibold text-[#7a7974] uppercase tracking-wide">Results</p>
              <div className="flex flex-col gap-0.5">
                <p className="text-xs text-[#7a7974] font-medium">Invested Amount</p>
                <p className="text-base font-bold text-[#7a7974]">{formatINR(result.investedAmount)}</p>
              </div>
              <div className="flex flex-col gap-0.5">
                <p className="text-xs text-[#7a7974] font-medium">Estimated Returns</p>
                <p className="text-base font-bold text-[#437a22]">{formatINR(result.estimatedReturns)}</p>
              </div>
              <div className="py-4 border-y border-[#f0ede6]">
                <p className="text-xs text-[#7a7974] font-medium mb-1">Total Value</p>
                <p className="text-2xl font-bold text-[#28251d]">{formatINR(result.totalValue)}</p>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1.5 bg-[#01696f]/8 rounded-full px-3 py-1.5">
                  <Star className="w-3.5 h-3.5 text-[#01696f]" />
                  <span className="text-xs font-semibold text-[#01696f]">Your money grew {result.wealthRatio.toFixed(2)}x</span>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-[8px] shadow-card p-5">
              <p className="text-xs font-semibold text-[#7a7974] uppercase tracking-wide mb-4">Corpus Growth & SIP Amount by Year</p>
              <ResponsiveContainer width="100%" height={240}>
                <AreaChart data={result.yearData} margin={{ top: 4, right: 8, bottom: 0, left: 0 }}>
                  <defs>
                    <linearGradient id="sipInvestedGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#9ca3af" stopOpacity={0.25} /><stop offset="95%" stopColor="#9ca3af" stopOpacity={0.05} />
                    </linearGradient>
                    <linearGradient id="sipTotalGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#01696f" stopOpacity={0.25} /><stop offset="95%" stopColor="#01696f" stopOpacity={0.05} />
                    </linearGradient>
                    <linearGradient id="sipAmtGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#b45309" stopOpacity={0.2} /><stop offset="95%" stopColor="#b45309" stopOpacity={0.02} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0ede6" />
                  <XAxis dataKey="year" tick={{ fontSize: 11, fill: '#7a7974' }} axisLine={{ stroke: '#e9e7e1' }} tickLine={false} label={{ value: 'Year', position: 'insideBottom', offset: -2, fontSize: 11, fill: '#7a7974' }} />
                  <YAxis tick={{ fontSize: 11, fill: '#7a7974' }} axisLine={false} tickLine={false} tickFormatter={fmtY} width={44} />
                  <Tooltip content={<ChartTip />} />
                  <Legend wrapperStyle={{ fontSize: 11, color: '#7a7974', paddingTop: 12 }} iconType="circle" iconSize={7} />
                  <Area type="monotone" dataKey="invested" name="Invested" stroke="#9ca3af" strokeWidth={1.5} fill="url(#sipInvestedGrad)" dot={false} activeDot={{ r: 3, fill: '#9ca3af' }} />
                  <Area type="monotone" dataKey="total" name="Total Value" stroke="#01696f" strokeWidth={2} fill="url(#sipTotalGrad)" dot={false} activeDot={{ r: 4, fill: '#01696f' }} />
                  <Area type="monotone" dataKey="sipAmount" name="Monthly SIP" stroke="#b45309" strokeWidth={1.5} strokeDasharray="4 2" fill="url(#sipAmtGrad)" dot={false} activeDot={{ r: 3, fill: '#b45309' }} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
            <div className="flex gap-3">
              <button onClick={panel.openPanel} className="flex items-center gap-1.5 h-9 px-4 rounded-[6px] border border-[#01696f] text-[#01696f] text-sm font-medium hover:bg-[#01696f]/8 transition-colors">
                <RefreshCw className="w-3.5 h-3.5" /> Recalculate
              </button>
              <button onClick={() => panel.reset(DEFAULTS)} className="flex items-center gap-1.5 h-9 px-4 rounded-[6px] border border-[#d4d2cc] text-[#7a7974] text-sm font-medium hover:bg-[#f0ede6] transition-colors">
                <RotateCcw className="w-3.5 h-3.5" /> Reset
              </button>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-[8px] shadow-card p-8 flex flex-col items-center justify-center text-center min-h-[260px] space-y-4">
            <TrendingUp className="w-12 h-12 text-[#d4d2cc]" />
            <div>
              <p className="text-sm font-medium text-[#28251d]">Calculate your step-up SIP growth</p>
              <p className="text-xs text-[#7a7974] mt-1">Answer a few quick questions to see your corpus</p>
            </div>
            <button onClick={panel.openPanel} className="h-10 px-6 rounded-[6px] bg-[#01696f] hover:bg-[#0c4e54] text-white text-sm font-semibold transition-colors">Start</button>
          </div>
        )}
      </div>
      <CalcPanel isOpen={panel.isOpen} onClose={panel.closePanel} onCalculate={() => panel.onCalculate(() => calculateSip(panel.values))} steps={steps} values={panel.values} onChange={panel.onChange} errors={panel.errors} setErrors={panel.setErrors} currentStep={panel.currentStep} setCurrentStep={panel.setCurrentStep} returnToReview={panel.returnToReview} setReturnToReview={panel.setReturnToReview} />
    </>
  );
}
