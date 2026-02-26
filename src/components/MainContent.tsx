'use client';
import React from 'react';
import { Financials, ColRow } from '@/lib/types';
import { calcRatios, calcScores, totalScore, checkGating, LTV_MAX, SECT, COL_CFG, buildImprovementText, FMT_MAP, ScoreResult } from '@/lib/scoring';
import { cn, MetricRow } from './ui';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, Cell } from 'recharts';

// ═══════════════════════════════════════════════════════════════
// MAIN DASHBOARD CONTENT
// ═══════════════════════════════════════════════════════════════
export function DashboardContent({ data, activeTab, colRows }: { data: Financials; activeTab: string; colRows: ColRow[] }) {
    const r = calcRatios(data);
    const res = calcScores(r);
    const score = Math.round(totalScore(res));
    const gatingMsg = checkGating(res);

    const rateCap = Math.max((data.tipoInt || 6) / 100, 0.0001);
    const nCap = Math.max(data.plazo || 5, 1);
    const headroom = r.cfads / 1.25 - r.debt_svc;
    const maxNew = headroom > 0 ? Math.max(headroom / (rateCap + 1 / nCap), 0) : 0;
    const newDS = data.importe * rateCap + data.importe / nCap;
    const combDS = r.debt_svc + newDS;
    const combDSCR = combDS > 0 ? r.cfads / combDS : 99;
    const ltvMaxPct = LTV_MAX[data.tipoCol] || null;

    return (
        <div className="w-full">
            {activeTab === 'scoring' && <ScoringView r={r} res={res} score={score} gatingMsg={gatingMsg} />}
            {activeTab === 'nueva_deuda' && <NuevaDeudaView data={data} r={r} maxNew={maxNew} newDS={newDS} combDSCR={combDSCR} ltvMaxPct={ltvMaxPct} />}
            {activeTab === 'comparables' && <ComparablesView data={data} r={r} />}
            {activeTab === 'covenants' && <CovenantsView r={r} res={res} score={score} />}
            {activeTab === 'colateral' && <ColateralView data={data} r={r} score={score} colRows={colRows} />}
            {activeTab === 'detalle' && <DetalleView res={res} score={score} />}
        </div>
    );
}

// ═══════════════════════════════════════════════════════════════
// SCORING TAB
// ═══════════════════════════════════════════════════════════════
function ScoringView({ r, res, score, gatingMsg }: { r: any; res: Record<string, ScoreResult>; score: number; gatingMsg: string | null }) {
    const colorFn = (c: string) => c === 'verde' ? '#10b981' : c === 'amarillo' ? '#f59e0b' : c === 'naranja' ? '#f97316' : '#ef4444';

    const chartData = Object.entries(res).map(([, val]) => ({
        name: val.nombre, score: val.puntuacion, color: colorFn(val.color)
    }));

    const barData = Object.entries(res).map(([, val]) => ({
        name: val.nombre, contrib: Number(val.contrib.toFixed(2)), color: colorFn(val.color)
    })).sort((a, b) => b.contrib - a.contrib);

    // Top 3 risk factors
    const top3Risks = Object.entries(res)
        .map(([key, v]) => ({ ...v, key, perdida: v.peso - v.contrib }))
        .sort((a, b) => b.perdida - a.perdida)
        .slice(0, 3);

    // Recommendation
    let recIcon: string, recDecision: string, recText: string, recColor: string;
    if (gatingMsg) {
        recIcon = '⛔'; recDecision = 'RECHAZAR'; recColor = 'rose';
        recText = 'La operación incumple una métrica de exclusión (gating). Independientemente del score total, la política de riesgo impide la aprobación.';
    } else if (score >= 70) {
        recIcon = '✅'; recDecision = 'OPERAR'; recColor = 'emerald';
        recText = `Score ${score}/100 — Perfil de riesgo sólido. Se recomienda avanzar con la operación bajo condiciones estándar. DSCR ${r.dscr.toFixed(2)}x.`;
    } else if (score >= 40) {
        recIcon = '⚠️'; recDecision = 'ANALIZAR MÁS'; recColor = 'amber';
        recText = `Score ${score}/100 — Perfil moderado. ${buildImprovementText(r, res)} Ampliar due diligence y exigir covenants reforzados.`;
    } else {
        recIcon = '❌'; recDecision = 'RECHAZAR'; recColor = 'rose';
        recText = `Score ${score}/100 — Perfil elevado. Los ratios no alcanzan umbrales mínimos. Posible revisión con plan de mejora creíble.`;
    }

    return (
        <div className="space-y-6">
            {/* GATING BANNER */}
            {gatingMsg && (
                <div className="bg-rose-950/40 border border-rose-900 border-l-4 border-l-rose-500 p-4">
                    <h3 className="text-rose-500 font-bold text-xs tracking-widest uppercase mb-1 flex items-center gap-2">
                        <span>⛔</span> GATING METRIC — RECHAZO AUTOMÁTICO
                    </h3>
                    <p className="text-rose-200 text-sm">{gatingMsg}</p>
                </div>
            )}

            {/* KPI STRIP */}
            <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
                <KpiBox label="EBITDA" value={`${r.ebitda.toFixed(1)} M€`} sub="Reportado" />
                <KpiBox label="MARGEN EBITDA" value={`${r.ebitda_margin.toFixed(1)}%`} sub="S/ Ventas" />
                <KpiBox label="DFN" value={`${r.dfn.toFixed(1)} M€`} sub="Deuda Neta" />
                <KpiBox label="DFN/EBITDA" value={r.deuda_ebitda < 0 ? 'Caja Neta' : `${r.deuda_ebitda.toFixed(2)}x`} sub="Apalancamiento" />
                <KpiBox label="DSCR" value={`${r.dscr.toFixed(2)}x`} sub="Cobertura" />
                <KpiBox label="LLCR" value={`${r.llcr.toFixed(2)}x`} sub="Loan Life" />
            </div>

            {/* RECOMMENDATION BANNER */}
            <div className={cn("border-l-4 p-5", recColor === 'emerald' ? "bg-emerald-950/30 border-l-emerald-500" : recColor === 'amber' ? "bg-amber-950/30 border-l-amber-500" : "bg-rose-950/30 border-l-rose-500")}>
                <div className="flex items-center gap-3 mb-2">
                    <span className="text-2xl">{recIcon}</span>
                    <span className={cn("text-sm font-bold tracking-widest uppercase", recColor === 'emerald' ? "text-emerald-400" : recColor === 'amber' ? "text-amber-400" : "text-rose-400")}>{recDecision}</span>
                </div>
                <p className="text-sm text-[#ccc] leading-relaxed">{recText}</p>
            </div>

            <div className="grid lg:grid-cols-2 gap-4">
                {/* GAUGE */}
                <div className="bg-[#0a0a0a] border border-[#222] p-5">
                    <h3 className="text-[10px] tracking-[0.2em] text-[#555] font-bold uppercase mb-4 border-b border-[#222] pb-2">SYS_SCORE_GLOBAL</h3>
                    <div className="flex flex-col items-center justify-center p-4">
                        <div className="relative flex items-center justify-center mb-4">
                            <svg className="w-40 h-40 -rotate-90">
                                <circle cx="80" cy="80" r="70" fill="none" stroke="#111" strokeWidth="10" />
                                <circle cx="80" cy="80" r="70" fill="none"
                                    stroke={gatingMsg ? '#ef4444' : score >= 70 ? '#10b981' : score >= 40 ? '#f59e0b' : '#ef4444'}
                                    strokeWidth="10" strokeDasharray="439.8"
                                    strokeDashoffset={439.8 - (439.8 * score) / 100}
                                    className="transition-all duration-1000 ease-out" />
                            </svg>
                            <div className="absolute inset-0 flex flex-col items-center justify-center">
                                <span className="text-5xl font-bold text-white tracking-tighter">{score}</span>
                                <span className="text-[10px] text-[#666] uppercase mt-1 tracking-widest">/ 100</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* BAR CHART */}
                <div className="bg-[#0a0a0a] border border-[#222] p-5">
                    <h3 className="text-[10px] tracking-[0.2em] text-[#555] font-bold uppercase mb-4 border-b border-[#222] pb-2">CONTRIBUCIÓN POR MÉTRICA</h3>
                    <div className="h-48 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={barData} layout="vertical" margin={{ top: 0, right: 30, left: 40, bottom: 0 }}>
                                <XAxis type="number" hide />
                                <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fill: '#888', fontSize: 10 }} />
                                <Tooltip cursor={{ fill: '#1a1a1a' }} contentStyle={{ backgroundColor: '#000', borderColor: '#333' }} />
                                <Bar dataKey="contrib" radius={[0, 4, 4, 0]} barSize={12}>
                                    {barData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.color} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>

            <div className="grid lg:grid-cols-2 gap-4">
                {/* RADAR */}
                <div className="bg-[#0a0a0a] border border-[#222] p-5">
                    <h3 className="text-[10px] tracking-[0.2em] text-[#555] font-bold uppercase mb-4 border-b border-[#222] pb-2">PERFIL DE RIESGO — RADAR</h3>
                    <div className="h-64 w-full flex justify-center">
                        <ResponsiveContainer width="100%" height="100%">
                            <RadarChart cx="50%" cy="50%" outerRadius="80%" data={chartData}>
                                <PolarGrid stroke="#222" />
                                <PolarAngleAxis dataKey="name" tick={{ fill: '#888', fontSize: 9 }} />
                                <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                                <Radar name="Score" dataKey="score" stroke="#0ea5e9" fill="#0ea5e9" fillOpacity={0.2} />
                            </RadarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* TOP 3 RISKS */}
                <div className="space-y-3">
                    <h3 className="text-[10px] tracking-[0.2em] text-[#555] font-bold uppercase mb-2">TOP 3 FACTORES DE RIESGO</h3>
                    {top3Risks.map((f, i) => {
                        const valStr = FMT_MAP[f.key] ? FMT_MAP[f.key].fmt(f.valor) : String(f.valor);
                        return (
                            <div key={f.key} className="bg-[#0a0a0a] border border-[#222] border-l-2 border-l-rose-500/60 p-4">
                                <div className="text-[9px] text-rose-500/70 font-bold uppercase tracking-widest mb-1">#{i + 1} Factor de Riesgo</div>
                                <div className="text-sm font-bold text-white flex items-center gap-2">
                                    {f.nombre} {f.gating && <span className="bg-amber-900/40 text-amber-500 text-[8px] font-bold px-1.5 py-0.5 rounded tracking-widest">GATE</span>}
                                </div>
                                <div className="text-xs text-[#888] mt-1">Valor: {valStr} — Score: {f.puntuacion}/100</div>
                                <div className="text-xs text-rose-400 mt-1 font-bold">Impacto: −{f.perdida.toFixed(1)} pts de contribución potencial</div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* RATIO CARDS GRID */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                {Object.entries(res).map(([k, v]) => (
                    <div key={k} className={cn("border bg-[#000] p-3 border-l-2 relative overflow-hidden transition-colors",
                        v.color === 'verde' ? 'border-emerald-500/50 hover:border-emerald-500' :
                            v.color === 'amarillo' ? 'border-amber-500/50 hover:border-amber-500' :
                                v.color === 'naranja' ? 'border-orange-500/50 hover:border-orange-500' :
                                    'border-rose-500/50 hover:border-rose-500'
                    )}>
                        <div className="flex items-center gap-1 mb-1">
                            <span className="text-[9px] uppercase tracking-widest text-[#777] truncate">{v.nombre}</span>
                            {v.gating && <span className="bg-amber-900/40 text-amber-500 text-[7px] font-bold px-1 py-0.5 rounded tracking-widest">GATE</span>}
                        </div>
                        <div className="text-lg font-mono font-bold text-white mb-1">{FMT_MAP[k] ? FMT_MAP[k].fmt(v.valor) : v.valor}</div>
                        <div className="text-[8px] text-[#555] uppercase tracking-widest">{v.puntuacion} pts × {v.peso}%</div>
                        <div className="absolute bottom-0 left-0 w-full h-1 bg-[#111]">
                            <div className="h-full transition-all duration-500" style={{ width: `${v.puntuacion}%`, backgroundColor: colorFn(v.color) }} />
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

// ═══════════════════════════════════════════════════════════════
// NUEVA DEUDA TAB
// ═══════════════════════════════════════════════════════════════
function NuevaDeudaView({ data, r, maxNew, newDS, combDSCR, ltvMaxPct }: any) {
    const marginNew = maxNew - data.importe;
    const statusClass = combDSCR >= 1.25 ? 'bg-emerald-950/40 text-emerald-500' : combDSCR >= 1.0 ? 'bg-amber-950/40 text-amber-500' : 'bg-rose-950/40 text-rose-500';
    const statusTxt = combDSCR >= 1.25 ? 'VIABLE (DSCR ≥ 1.25x)' : combDSCR >= 1.0 ? 'AJUSTADO (1.0x-1.25x)' : 'NO VIABLE (DSCR < 1.0x)';
    const ltvStatus: 'good' | 'bad' | 'warn' = ltvMaxPct ? (r.ltv <= ltvMaxPct ? 'good' : 'bad') : 'warn';
    const ltvTxt = ltvMaxPct ? (r.ltv <= ltvMaxPct ? `MÁXIMO PERMITIDO: ${ltvMaxPct}%` : `SUPERA LÍMITE DE ${ltvMaxPct}%`) : 'SIN LÍMITE ESTIPULADO';

    return (
        <div className="space-y-6">
            <div className="grid lg:grid-cols-2 gap-4">
                <div className="bg-[#0a0a0a] border border-[#222]">
                    <h3 className="text-[10px] tracking-[0.2em] text-[#555] font-bold uppercase p-4 border-b border-[#222]">CAPACIDAD MAX ENDEUDAMIENTO</h3>
                    <div className="divide-y divide-[#1a1a1a]">
                        <MetricRow label="CFADS DISP." value={`${r.cfads.toFixed(2)} M€`} state="neutral" />
                        <MetricRow label="SERVICIO DEUDA ACTUAL" value={`${r.debt_svc.toFixed(2)} M€`} state="neutral" />
                        <MetricRow label="DSCR ACTUAL" value={`${r.dscr.toFixed(2)}x`} state={r.dscr >= 1.5 ? 'good' : r.dscr >= 1.2 ? 'warn' : 'bad'} />
                        <MetricRow label="IMPORTE MÁX. (DSCR 1.25)" value={maxNew > 0 ? `${maxNew.toFixed(2)} M€` : 'Capacidad agotada'} state={maxNew > 0 ? 'good' : 'bad'} />
                        <MetricRow label="HEADROOM S/ 1.25x" value={r.debt_svc > 0 ? `${(((r.cfads / r.debt_svc - 1.25) / 1.25) * 100).toFixed(1)}%` : '∞'} state="neutral" />
                        <MetricRow label="TIPO INT. / PLAZO" value={`${data.tipoInt}% / ${data.plazo} años`} state="neutral" />
                    </div>
                </div>

                {data.importe > 0 ? (
                    <div className="bg-[#0a0a0a] border border-[#222]">
                        <h3 className="text-[10px] tracking-[0.2em] text-[#555] font-bold uppercase p-4 border-b border-[#222]">ANÁLISIS OPERACIÓN NUEVA</h3>
                        <div className="divide-y divide-[#1a1a1a]">
                            <MetricRow label="IMPORTE SOLICITADO" value={`${data.importe.toFixed(2)} M€`} state="neutral" />
                            <MetricRow label="NUEVO SERVICIO/AÑO" value={`${newDS.toFixed(2)} M€`} state="neutral" />
                            <MetricRow label="DSCR COMBINADO" value={`${combDSCR.toFixed(2)}x`} state={combDSCR >= 1.25 ? 'good' : combDSCR >= 1.0 ? 'warn' : 'bad'} />
                            <MetricRow label="MARGEN VS CAPACIDAD" value={`${marginNew > 0 ? '+' : ''}${marginNew.toFixed(2)} M€`} state={marginNew >= 0 ? 'good' : 'bad'} />
                            <div className="p-4 flex justify-between items-center">
                                <span className="text-[11px] font-bold text-[#888] tracking-widest uppercase">RESULTADO</span>
                                <div className={cn("px-3 py-1 font-bold text-[10px] tracking-widest uppercase", statusClass)}>{statusTxt}</div>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="bg-[#0a0a0a] border border-[#222] p-6 flex flex-col justify-center items-center">
                        <p className="text-[#555] text-sm text-center mb-4">Introduce importe, plazo y tipo de interés en el panel lateral para analizar una operación concreta.</p>
                        <div className="text-xs text-[#777]">
                            Capacidad adicional: <span className={maxNew > 0 ? "text-emerald-400 font-bold" : "text-rose-400 font-bold"}>{maxNew > 0 ? `≈ ${maxNew.toFixed(2)} M€` : 'Agotada'}</span>
                        </div>
                    </div>
                )}
            </div>

            {data.colateral > 0 && data.importe > 0 && r.ltv !== null && (
                <div className="bg-[#0a0a0a] border border-[#222]">
                    <h3 className="text-[10px] tracking-[0.2em] text-[#555] font-bold uppercase p-4 border-b border-[#222]">LTV — COLATERAL</h3>
                    <div className="divide-y divide-[#1a1a1a]">
                        <MetricRow label="TIPO COLATERAL" value={data.tipoCol} state="neutral" />
                        <MetricRow label="VALOR COLATERAL" value={`${data.colateral.toFixed(2)} M€`} state="neutral" />
                        <MetricRow label="LTV CALCULADO" value={`${r.ltv.toFixed(1)}%`} subLabel={ltvTxt} state={ltvStatus} />
                    </div>
                </div>
            )}
        </div>
    );
}

// ═══════════════════════════════════════════════════════════════
// COMPARABLES TAB
// ═══════════════════════════════════════════════════════════════
function ComparablesView({ data, r }: { data: Financials; r: any }) {
    const sect = SECT[data.sector_comp || 'metalurgia'];

    const metrics = [
        { key: 'em', label: 'Margen EBITDA (%)', val: r.ebitda_margin, fmt: (v: number) => v.toFixed(1) + '%', higher: 'better' as const },
        { key: 'dn', label: 'DFN / EBITDA (x)', val: r.deuda_ebitda < 0 ? 0 : r.deuda_ebitda, fmt: (v: number) => v.toFixed(2) + 'x', higher: 'worse' as const },
        { key: 'ds', label: 'DSCR (x)', val: r.dscr, fmt: (v: number) => v.toFixed(2) + 'x', higher: 'better' as const },
        { key: 'dc', label: 'Días Cobro', val: r.dias_cobro, fmt: (v: number) => Math.round(v) + 'd', higher: 'worse' as const },
    ];

    function getPosition(m: typeof metrics[0]) {
        const s = sect[m.key];
        const v = m.val;
        if (m.higher === 'better') {
            if (v >= s.p75) return { pos: 'Top 25%', cls: 'text-emerald-400' };
            if (v >= s.med) return { pos: '25–50%', cls: 'text-cyan-400' };
            if (v >= s.p25) return { pos: '50–75%', cls: 'text-amber-400' };
            return { pos: 'Bottom 25%', cls: 'text-rose-400' };
        } else {
            if (v <= s.p25) return { pos: 'Top 25%', cls: 'text-emerald-400' };
            if (v <= s.med) return { pos: '25–50%', cls: 'text-cyan-400' };
            if (v <= s.p75) return { pos: '50–75%', cls: 'text-amber-400' };
            return { pos: 'Bottom 25%', cls: 'text-rose-400' };
        }
    }

    const pData = metrics.map(m => ({
        name: m.label, 'Esta Empresa': Number(m.val.toFixed(2)), 'Mediana Sector': sect[m.key].med
    }));

    return (
        <div className="space-y-6">
            <div className="bg-[#0a0a0a] border border-[#222] p-5">
                <h3 className="text-[10px] tracking-[0.2em] text-[#555] font-bold uppercase mb-4 border-b border-[#222] pb-2">BENCHMARK SECTORIAL — {sect.n}</h3>
                <div className="overflow-x-auto border border-[#1a1a1a] mb-8">
                    <table className="w-full text-left text-xs text-[#888]">
                        <thead className="text-[9px] uppercase tracking-widest bg-[#111] text-[#666]">
                            <tr>
                                <th className="p-3">Métrica</th>
                                <th className="p-3">p25</th>
                                <th className="p-3">Mediana</th>
                                <th className="p-3">p75</th>
                                <th className="p-3 text-cyan-400 font-bold">ESTA EMPRESA</th>
                                <th className="p-3">POSICIÓN</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[#1a1a1a]">
                            {metrics.map(m => {
                                const { pos, cls } = getPosition(m);
                                const s = sect[m.key];
                                return (
                                    <tr key={m.key} className="hover:bg-[#111] transition-colors">
                                        <td className="p-3 font-bold">{m.label}</td>
                                        <td className="p-3">{m.fmt(s.p25)}</td>
                                        <td className="p-3">{m.fmt(s.med)}</td>
                                        <td className="p-3">{m.fmt(s.p75)}</td>
                                        <td className="p-3 font-mono text-cyan-400 font-bold">{m.fmt(m.val)}</td>
                                        <td className={cn("p-3 font-bold", cls)}>{pos}</td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
                <div className="h-64 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={pData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#222" vertical={false} />
                            <XAxis dataKey="name" stroke="#555" tick={{ fill: '#888', fontSize: 10 }} />
                            <YAxis stroke="#555" tick={{ fill: '#888', fontSize: 10 }} />
                            <Tooltip cursor={{ fill: '#1a1a1a' }} contentStyle={{ backgroundColor: '#000', borderColor: '#333' }} />
                            <Bar dataKey="Esta Empresa" fill="#22d3ee" maxBarSize={50} />
                            <Bar dataKey="Mediana Sector" fill="#525252" maxBarSize={50} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </div>
    );
}

// ═══════════════════════════════════════════════════════════════
// COVENANTS TAB
// ═══════════════════════════════════════════════════════════════
function CovenantsView({ r, res, score }: { r: any; res: Record<string, ScoreResult>; score: number }) {
    const dnCov = Math.min(+(r.deuda_ebitda < 0 ? 2.0 : r.deuda_ebitda * 1.35 + 0.5).toFixed(2), 5.0);
    const dscrCov = Math.max(+(r.dscr * 0.82).toFixed(2), 1.10);
    const capexCov = +((r.ebitda * 0.25)).toFixed(1);

    const covCards = [
        { name: 'DFN / EBITDA máximo', value: `≤ ${dnCov}x`, desc: 'Límite apalancamiento con headroom vs. ratio actual. Revisión semestral.' },
        { name: 'DSCR mínimo', value: `≥ ${dscrCov}x`, desc: 'Cobertura mínima con colchón del 18%. Cálculo s/ los últimos 12 meses.' },
        { name: 'Capex máximo anual', value: `≤ ${capexCov} M€`, desc: 'Cap equivalente al 25% del EBITDA.' },
        {
            name: 'Restricción dividendos', value: score >= 70 ? 'Max 40% NOPAT' : 'Suspensión',
            desc: score >= 70 ? 'Distribución permitida si score > 70 y DFN/EBITDA < techo.' : 'Sin distribuciones mientras score < 70.'
        },
    ];

    const tranches = [
        { label: 'Senior A', spread: score >= 80 ? '175–275 bps' : score >= 70 ? '275–375 bps' : score >= 55 ? '375–500 bps' : 'N/A', a: score >= 55 },
        { label: 'Senior B', spread: score >= 70 ? '375–500 bps' : score >= 55 ? '500–650 bps' : 'N/A', a: score >= 55 },
        { label: 'Mezzanine', spread: score >= 70 ? '600–900 bps' : 'N/A', a: score >= 70 },
        { label: 'Euribor base', spread: 'Euribor 3M/6M', a: true },
    ];

    // Extra conditions based on ratios
    const extras: string[] = [];
    if (r.dscr < 1.5) extras.push('Amortización acelerada: al menos 15% anual del principal pendiente.');
    if (r.deuda_ebitda > 3.0) extras.push('Obligación de desinversión de activos no estratégicos si DFN/EBITDA > techo en 2 semestres consecutivos.');
    if (r.dias_cobro > 90) extras.push('Plan de mejora de capital circulante con revisión trimestral de factoring o confirming.');
    if (res.equipo.puntuacion < 50) extras.push('Nombramiento de CFO independiente o CRO como condición previa al desembolso.');
    if (extras.length === 0) extras.push('Sin condiciones adicionales fuera de los covenants estándar.');
    extras.push('Reporting financiero trimestral con certificación de cumplimiento de covenants.');
    extras.push('Seguro de crédito sobre la cartera de clientes recomendado si concentración top-3 > 50%.');

    return (
        <div className="space-y-6">
            <div className="bg-[#0a0a0a] border border-[#222] p-5">
                <h3 className="text-[10px] tracking-[0.2em] text-[#555] font-bold uppercase mb-4 border-b border-[#222] pb-2">FINANCIAL COVENANTS SUGERIDOS</h3>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    {covCards.map(c => (
                        <div key={c.name} className="border border-[#222] p-4 bg-[#111]">
                            <div className="text-[9px] text-[#666] font-bold uppercase tracking-widest mb-2">{c.name}</div>
                            <div className="text-xl text-amber-500 font-mono font-bold mb-2">{c.value}</div>
                            <div className="text-[9px] text-[#555] leading-relaxed">{c.desc}</div>
                        </div>
                    ))}
                </div>
            </div>

            <div className="bg-[#0a0a0a] border border-[#222] p-5">
                <h3 className="text-[10px] tracking-[0.2em] text-[#555] font-bold uppercase mb-4 border-b border-[#222] pb-2">PRICING SPREADS (VS EURIBOR) — Score {score}/100</h3>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    {tranches.map(t => (
                        <div key={t.label} className={cn("p-4 border rounded-sm", t.a ? "border-cyan-500/30 bg-cyan-950/10" : "border-[#222] bg-[#111] opacity-50")}>
                            <div className="text-[10px] text-[#777] uppercase tracking-widest mb-1">{t.label}</div>
                            <div className={cn("text-lg font-bold font-mono", t.a ? "text-cyan-400" : "text-[#555]")}>{t.spread}</div>
                            <div className="text-[9px] text-[#444] uppercase tracking-widest mt-2">{t.a ? 'Aplicable' : 'Score Insuficiente'}</div>
                        </div>
                    ))}
                </div>
            </div>

            <div className="bg-[#0a0a0a] border border-[#222] p-5">
                <h3 className="text-[10px] tracking-[0.2em] text-[#555] font-bold uppercase mb-4 border-b border-[#222] pb-2">CONDICIONES ADICIONALES</h3>
                <div className="space-y-0 divide-y divide-[#1a1a1a]">
                    {extras.map((e, i) => (
                        <div key={i} className="flex gap-3 items-start py-3">
                            <span className="text-amber-500 font-bold shrink-0">→</span>
                            <span className="text-sm text-[#aaa] leading-relaxed">{e}</span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

// ═══════════════════════════════════════════════════════════════
// COLATERAL TAB — Full analysis with haircuts, LGD, RWA
// ═══════════════════════════════════════════════════════════════
function ColateralView({ data, r, score, colRows }: { data: Financials; r: any; score: number; colRows: ColRow[] }) {
    if (colRows.length === 0) {
        return (
            <div className="bg-[#0a0a0a] border border-[#222] p-8 text-center">
                <p className="text-[#555] text-sm mb-2">Sin activos en el inventario de colateral.</p>
                <p className="text-[#444] text-xs">Añade activos desde el panel lateral (sección Colateral Inventory) para calcular LGD, Recovery Rate y RWA.</p>
            </div>
        );
    }

    const rows = colRows.map(row => {
        const cfg = COL_CFG[row.tipo] || COL_CFG.otros;
        const neto = (row.bruto || 0) * (1 - cfg.haircut);
        const pv = neto / Math.pow(1.08, cfg.execMid);
        return { ...row, ...cfg, neto, pv };
    });

    const totalBruto = rows.reduce((s, row) => s + (row.bruto || 0), 0);
    const totalNeto = rows.reduce((s, row) => s + row.neto, 0);
    const totalPV = rows.reduce((s, row) => s + row.pv, 0);

    const importe = data.importe > 0 ? data.importe : Math.max(r.dfn, 0.001);
    const ltv = totalBruto > 0 ? (importe / totalBruto * 100) : null;
    const recRate = importe > 0 ? Math.min(totalPV / importe * 100, 200) : 0;
    const lgd = Math.max(1 - recRate / 100, 0);
    const ead = importe;
    const pd = score > 70 ? 0.015 : score >= 50 ? 0.035 : 0.07;
    const rwa = ead * pd * lgd * 1.2 * 12.5;
    const expLoss = ead * pd * lgd;

    const kpis = [
        { label: 'LTV', val: ltv !== null ? ltv.toFixed(1) + '%' : 'N/A', sub: 'Deuda / Colateral bruto', cls: ltv === null ? '' : ltv < 50 ? 'text-emerald-400' : ltv < 70 ? 'text-amber-400' : 'text-rose-400' },
        { label: 'Recovery Rate', val: recRate.toFixed(1) + '%', sub: 'Valor neto PV / Deuda', cls: recRate >= 70 ? 'text-emerald-400' : recRate >= 40 ? 'text-amber-400' : 'text-rose-400' },
        { label: 'LGD', val: (lgd * 100).toFixed(1) + '%', sub: 'Loss Given Default', cls: lgd < 0.30 ? 'text-emerald-400' : lgd < 0.60 ? 'text-amber-400' : 'text-rose-400' },
        { label: 'EAD', val: ead.toFixed(2) + ' M€', sub: 'Exposure at Default', cls: 'text-white' },
        { label: 'PD estimada', val: (pd * 100).toFixed(2) + '%', sub: 'Basada en score ' + score, cls: pd <= 0.015 ? 'text-emerald-400' : pd <= 0.035 ? 'text-amber-400' : 'text-rose-400' },
        { label: 'Pérdida esperada', val: expLoss.toFixed(3) + ' M€', sub: 'EAD × PD × LGD', cls: expLoss / ead < 0.01 ? 'text-emerald-400' : expLoss / ead < 0.05 ? 'text-amber-400' : 'text-rose-400' },
        { label: 'RWA estimado', val: rwa.toFixed(2) + ' M€', sub: 'EAD × PD × LGD × 15', cls: 'text-white' },
        { label: 'Recovery PV total', val: totalPV.toFixed(2) + ' M€', sub: 'Descontado al 8%', cls: totalPV >= ead ? 'text-emerald-400' : totalPV >= ead * 0.6 ? 'text-amber-400' : 'text-rose-400' },
        { label: 'Colateral bruto', val: totalBruto.toFixed(2) + ' M€', sub: 'Total inventario', cls: 'text-white' },
        { label: 'Colateral neto', val: totalNeto.toFixed(2) + ' M€', sub: 'Tras haircuts', cls: 'text-white' },
    ];

    // Priority execution table
    const sorted = [...rows].sort((a, b) => a.execMid - b.execMid);
    let cumPV = 0;

    return (
        <div className="space-y-6">
            {/* KPI CARDS */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                {kpis.map(k => (
                    <div key={k.label} className="bg-[#0a0a0a] border border-[#222] p-3">
                        <div className="text-[9px] font-bold text-[#666] uppercase tracking-widest">{k.label}</div>
                        <div className={cn("text-lg font-bold font-mono my-1", k.cls)}>{k.val}</div>
                        <div className="text-[8px] text-[#444] uppercase tracking-widest">{k.sub}</div>
                    </div>
                ))}
            </div>

            {/* INVENTORY TABLE */}
            <div className="bg-[#0a0a0a] border border-[#222] p-5">
                <h3 className="text-[10px] tracking-[0.2em] text-[#555] font-bold uppercase mb-4 border-b border-[#222] pb-2">INVENTARIO DE COLATERAL</h3>
                <div className="overflow-x-auto border border-[#1a1a1a]">
                    <table className="w-full text-left text-xs text-[#888]">
                        <thead className="text-[9px] uppercase tracking-widest bg-[#111] text-[#666]">
                            <tr>
                                <th className="p-3">Tipo</th>
                                <th className="p-3">Descripción</th>
                                <th className="p-3 text-right">Bruto (M€)</th>
                                <th className="p-3 text-right">Haircut</th>
                                <th className="p-3 text-right">Neto (M€)</th>
                                <th className="p-3">Tiempo Ejec.</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[#1a1a1a]">
                            {rows.map((row, i) => (
                                <tr key={i} className="hover:bg-[#111] transition-colors">
                                    <td className="p-3 font-bold">{row.label}</td>
                                    <td className="p-3 text-[#666]">{row.desc || '—'}</td>
                                    <td className="p-3 text-right font-mono">{row.bruto.toFixed(2)}</td>
                                    <td className="p-3 text-right text-rose-400">{Math.round(row.haircut * 100)}%</td>
                                    <td className="p-3 text-right font-mono font-bold">{row.neto.toFixed(2)}</td>
                                    <td className="p-3 text-[#555]">{row.execLabel}</td>
                                </tr>
                            ))}
                        </tbody>
                        <tfoot className="border-t border-[#333] text-[#ccc]">
                            <tr className="font-bold">
                                <td className="p-3" colSpan={2}>TOTAL</td>
                                <td className="p-3 text-right font-mono">{totalBruto.toFixed(2)}</td>
                                <td className="p-3"></td>
                                <td className="p-3 text-right font-mono">{totalNeto.toFixed(2)}</td>
                                <td className="p-3"></td>
                            </tr>
                        </tfoot>
                    </table>
                </div>
                <p className="text-[10px] text-[#444] mt-3">Valores presentes descontados al 8% según tiempo medio de ejecución estimado por tipo de activo.</p>
            </div>

            {/* PRIORITY OF EXECUTION TABLE */}
            <div className="bg-[#0a0a0a] border border-[#222] p-5">
                <h3 className="text-[10px] tracking-[0.2em] text-[#555] font-bold uppercase mb-4 border-b border-[#222] pb-2">PRIORIDAD DE EJECUCIÓN</h3>
                <div className="overflow-x-auto border border-[#1a1a1a]">
                    <table className="w-full text-left text-xs text-[#888]">
                        <thead className="text-[9px] uppercase tracking-widest bg-[#111] text-[#666]">
                            <tr>
                                <th className="p-3">#</th>
                                <th className="p-3">Activo</th>
                                <th className="p-3">Descripción</th>
                                <th className="p-3">Tiempo</th>
                                <th className="p-3 text-right">PV (M€)</th>
                                <th className="p-3 text-right">Cobertura acum.</th>
                                <th className="p-3">Estado</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[#1a1a1a]">
                            {sorted.map((row, i) => {
                                cumPV += row.pv;
                                const cumPct = importe > 0 ? (cumPV / importe * 100) : 0;
                                const covered = cumPV >= importe;
                                return (
                                    <tr key={i} className={cn("transition-colors", covered ? "bg-emerald-950/10" : "hover:bg-[#111]")}>
                                        <td className="p-3 font-bold text-cyan-500">{i + 1}</td>
                                        <td className="p-3 font-bold">{row.label}</td>
                                        <td className="p-3 text-[#666]">{row.desc || '—'}</td>
                                        <td className="p-3"><span className="bg-[#1a1a1a] px-2 py-0.5 rounded text-[10px]">{row.execLabel}</span></td>
                                        <td className="p-3 text-right font-mono font-bold">{row.pv.toFixed(2)}</td>
                                        <td className="p-3 text-right">
                                            <span className={cn("font-bold", cumPct >= 100 ? "text-emerald-400" : cumPct >= 60 ? "text-amber-400" : "text-rose-400")}>
                                                {Math.min(cumPct, 100).toFixed(1)}%
                                            </span>
                                        </td>
                                        <td className="p-3">
                                            {covered
                                                ? <span className="bg-emerald-900/40 text-emerald-400 text-[9px] font-bold px-2 py-1 rounded">✓ Cubierto</span>
                                                : <span className="bg-rose-900/40 text-rose-400 text-[9px] font-bold px-2 py-1 rounded">✗ Déficit {(importe - cumPV).toFixed(2)}M€</span>
                                            }
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}

// ═══════════════════════════════════════════════════════════════
// DETALLE TAB — Full scoring breakdown table
// ═══════════════════════════════════════════════════════════════
function DetalleView({ res, score }: { res: Record<string, ScoreResult>; score: number }) {
    const colorFn = (c: string) => c === 'verde' ? '#10b981' : c === 'amarillo' ? '#f59e0b' : c === 'naranja' ? '#f97316' : '#ef4444';
    const badgeCls = (c: string) => c === 'verde' ? 'bg-emerald-900/40 text-emerald-400' : c === 'amarillo' ? 'bg-amber-900/40 text-amber-400' : c === 'naranja' ? 'bg-orange-900/40 text-orange-400' : 'bg-rose-900/40 text-rose-400';

    return (
        <div className="space-y-6">
            <div className="bg-[#0a0a0a] border border-[#222] p-5">
                <h3 className="text-[10px] tracking-[0.2em] text-[#555] font-bold uppercase mb-4 border-b border-[#222] pb-2">DETALLE COMPLETO DEL SCORING</h3>
                <div className="overflow-x-auto border border-[#1a1a1a]">
                    <table className="w-full text-left text-xs text-[#888]">
                        <thead className="text-[9px] uppercase tracking-widest bg-[#111] text-[#666]">
                            <tr>
                                <th className="p-3">Métrica</th>
                                <th className="p-3">Valor</th>
                                <th className="p-3">Puntuación (0–100)</th>
                                <th className="p-3">Peso</th>
                                <th className="p-3">Contribución</th>
                                <th className="p-3">Semáforo</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[#1a1a1a]">
                            {Object.entries(res).map(([key, rv]) => {
                                const valStr = FMT_MAP[key] ? FMT_MAP[key].fmt(rv.valor) : String(rv.valor);
                                return (
                                    <tr key={key} className="hover:bg-[#111] transition-colors">
                                        <td className="p-3 font-bold flex items-center gap-2">
                                            {rv.gating && <span className="bg-amber-900/40 text-amber-500 text-[7px] font-bold px-1 py-0.5 rounded tracking-widest">GATE</span>}
                                            {rv.nombre}
                                        </td>
                                        <td className="p-3 font-mono">{valStr}</td>
                                        <td className="p-3">
                                            <div className="flex items-center gap-2">
                                                <div className="flex-1 bg-[#1a1a1a] rounded-full h-1.5">
                                                    <div className="h-1.5 rounded-full transition-all duration-500" style={{ width: `${rv.puntuacion}%`, backgroundColor: colorFn(rv.color) }} />
                                                </div>
                                                <span className="font-bold text-white w-8 text-right">{rv.puntuacion}</span>
                                            </div>
                                        </td>
                                        <td className="p-3">{rv.peso}%</td>
                                        <td className="p-3 font-bold text-white">{rv.contrib.toFixed(2)}</td>
                                        <td className="p-3">
                                            <span className={cn("text-[9px] font-bold px-2 py-1 rounded uppercase tracking-widest", badgeCls(rv.color))}>
                                                {rv.color === 'verde' ? 'VERDE' : rv.color === 'amarillo' ? 'AMARILLO' : rv.color === 'naranja' ? 'NARANJA' : 'ROJO'}
                                            </span>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                        <tfoot className="border-t-2 border-[#333]">
                            <tr className="font-bold text-white">
                                <td className="p-3" colSpan={3}>SCORE TOTAL</td>
                                <td className="p-3">100%</td>
                                <td className="p-3">
                                    <span className="text-lg" style={{ color: score >= 70 ? '#10b981' : score >= 40 ? '#f59e0b' : '#ef4444' }}>
                                        {score} / 100
                                    </span>
                                </td>
                                <td className="p-3">
                                    <span className={cn("text-[9px] font-bold px-2 py-1 rounded uppercase tracking-widest",
                                        score >= 70 ? 'bg-emerald-900/40 text-emerald-400' : score >= 40 ? 'bg-amber-900/40 text-amber-400' : 'bg-rose-900/40 text-rose-400'
                                    )}>
                                        {score >= 70 ? 'VERDE' : score >= 40 ? 'AMARILLO' : 'ROJO'}
                                    </span>
                                </td>
                            </tr>
                        </tfoot>
                    </table>
                </div>
            </div>
        </div>
    );
}

// ═══════════════════════════════════════════════════════════════
// SHARED COMPONENTS
// ═══════════════════════════════════════════════════════════════
function KpiBox({ label, value, sub }: { label: string; value: string; sub: string }) {
    return (
        <div className="bg-[#0a0a0a] border border-[#222] p-3 flex flex-col justify-between hover:border-[#333] transition-colors">
            <div className="text-[9px] font-bold text-[#666] uppercase tracking-widest">{label}</div>
            <div className="text-xl font-bold font-mono text-white my-1">{value}</div>
            <div className="text-[8px] text-[#444] uppercase tracking-widest">{sub}</div>
        </div>
    );
}
