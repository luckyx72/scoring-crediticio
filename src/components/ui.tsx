import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

export function MetricRow({ label, value, subLabel, state, gating = false }: {
    label: string;
    value: string | number;
    subLabel?: string;
    state: 'good' | 'warn' | 'bad' | 'neutral';
    gating?: boolean;
}) {
    const stateColors = {
        good: 'text-emerald-500',
        warn: 'text-amber-500',
        bad: 'text-rose-500',
        neutral: 'text-white'
    };

    return (
        <div className="flex items-center justify-between p-3 hover:bg-[#111] transition-colors">
            <div className="flex flex-col">
                <div className="flex items-center gap-2">
                    <span className="text-[11px] font-bold text-[#888] tracking-widest">{label}</span>
                    {gating && <span className="bg-amber-900/40 text-amber-500 text-[8px] font-bold px-1.5 py-0.5 rounded tracking-widest uppercase">Gate</span>}
                </div>
                {subLabel && <span className="text-[9px] text-[#444] uppercase tracking-widest leading-tight mt-0.5">{subLabel}</span>}
            </div>
            <span className={cn("text-xs font-bold font-mono tracking-widest", stateColors[state])}>{value}</span>
        </div>
    );
}

export function InputField({ label, value, onChange }: { label: string, value: number, onChange: (e: React.ChangeEvent<HTMLInputElement>) => void }) {
    return (
        <div className="flex flex-col gap-1">
            <label className="text-[10px] font-bold text-[#666] uppercase tracking-widest">{label}</label>
            <input
                type="number"
                step="0.1"
                value={value === 0 ? '' : value}
                onChange={onChange}
                className="w-full bg-[#111] border border-[#222] px-3 py-1.5 text-xs text-white transition-all hover:bg-[#1a1a1a] focus:bg-[#1a1a1a] focus:border-amber-500/50 focus:text-amber-500 outline-none"
                placeholder="0"
            />
        </div>
    );
}
