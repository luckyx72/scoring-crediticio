import React from 'react';
import { Financials } from '@/lib/types';
import { calcRatios, calcScores, totalScore, checkGating, LTV_MAX, SECT } from '@/lib/scoring';
import { cn, MetricRow } from './ui';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, Cell } from 'recharts';

export function DashboardContent({ data, activeTab }: { data: Financials; activeTab: string }) {
    const r = calcRatios(data);
    const res = calcScores({ ...r, equipo: data.equipo, concentracion: data.concentracion, antiguedad: data.antiguedad, ciclicidad: data.ciclicidad });
    const score = Math.round(totalScore(res) as number);
    const gatingMsg = checkGating(res);

    // Derived calculations for Nueva Deuda
    const rateCap = Math.max((data.tipoInt || 6) / 100, 0.0001);
    const nCap = Math.max(data.plazo || 5, 1);
    const headroom = r.cfads / 1.25 - r.debt_svc;
    const maxNew = headroom > 0 ? Math.max(headroom / (rateCap + 1 / nCap), 0) : 0;

    const importe = data.importe;
    const newDS = importe * rateCap + importe / nCap;
    const combDS = r.debt_svc + newDS;
    const combDSCR = combDS > 0 ? r.cfads / combDS : 99;

    const ltvMaxPct = LTV_MAX[data.tipoCol] || null;

    return (
        <div className="w-full">
            {/* TABS HEADER */}
            {/* 
        We use activeTab passed down for navigation if we want, or handle internal sub-tabs.
        Since we only have one main scroll view now, we'll render sections conditionally.
      */}

            {activeTab === 'scoring' && (
                <ScoringView data={data} r={r} res={res} score={score} gatingMsg={gatingMsg} />
            )}

            {activeTab === 'nueva_deuda' && (
                <NuevaDeudaView data={data} r={r} maxNew={maxNew} newDS={newDS} combDSCR={combDSCR} ltvMaxPct={ltvMaxPct} />
            )}

            {activeTab === 'comparables' && (
                <ComparablesView data={data} r={r} />
            )}

            {activeTab === 'covenants' && (
                <CovenantsView data={data} r={r} res={res} score={score} />
            )}
        </div>
    );
}

function ScoringView({ data, r, res, score, gatingMsg }: any) {
    const chartData = Object.entries(res).map(([key, val]: any) => ({
        name: val.nombre,
        score: val.puntuacion,
        color: val.color === 'verde' ? '#10b981' : val.color === 'amarillo' ? '#f59e0b' : val.color === 'naranja' ? '#f97316' : '#ef4444'
    }));

    const barData = Object.entries(res).map(([key, val]: any) => ({
        name: val.nombre,
        contrib: Number(val.contrib.toFixed(2)),
        color: val.color === 'verde' ? '#10b981' : val.color === 'amarillo' ? '#f59e0b' : val.color === 'naranja' ? '#f97316' : '#ef4444'
    })).sort((a, b) => b.contrib - a.contrib);

    return (
        <div className="space-y-6 animate-in fade-in duration-300">

            {gatingMsg && (
                <div className="bg-rose-950/40 border border-rose-900 border-l-4 border-l-rose-500 p-4 rounded-sm">
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

            <div className="grid lg:grid-cols-2 gap-4">
                <div className="bg-[#0a0a0a] border border-[#222] p-5">
                    <h3 className="text-[10px] tracking-[0.2em] text-[#555] font-bold uppercase mb-4 border-b border-[#222] pb-2">SYS_SCORE_GLOBAL</h3>
                    <div className="flex flex-col items-center justify-center p-4">
                        <div className="relative flex items-center justify-center mb-6">
                            <svg className="w-40 h-40 -rotate-90">
                                <circle cx="80" cy="80" r="70" fill="none" stroke="#111" strokeWidth="10" />
                                <circle
                                    cx="80" cy="80" r="70" fill="none"
                                    stroke={gatingMsg ? '#ef4444' : score >= 70 ? '#10b981' : score >= 40 ? '#f59e0b' : '#ef4444'}
                                    strokeWidth="10"
                                    strokeDasharray="439.8"
                                    strokeDashoffset={439.8 - (439.8 * score) / 100}
                                    className="transition-all duration-1000 ease-out"
                                />
                            </svg>
                            <div className="absolute inset-0 flex flex-col items-center justify-center">
                                <span className="text-5xl font-bold text-white tracking-tighter drop-shadow-lg">{score}</span>
                                <span className="text-[10px] text-[#666] uppercase mt-1 tracking-widest">/ 100</span>
                            </div>
                        </div>
                    </div>
                </div>

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
                <div className="bg-[#0a0a0a] border border-[#222] p-5">
                    <h3 className="text-[10px] tracking-[0.2em] text-[#555] font-bold uppercase mb-4 border-b border-[#222] pb-2">PERFIL DE RIESGO - RADAR</h3>
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

                <div className="grid grid-cols-2 gap-3 content-start">
                    {Object.entries(res).map(([k, v]: any) => (
                        <div key={k} className={cn("border bg-[##000] p-3 border-l-2 relative overflow-hidden",
                            v.color === 'verde' ? 'border-emerald-500/50 hover:border-emerald-500' :
                                v.color === 'amarillo' ? 'border-amber-500/50 hover:border-amber-500' :
                                    v.color === 'naranja' ? 'border-orange-500/50 hover:border-orange-500' :
                                        'border-rose-500/50 hover:border-rose-500'
                        )}>
                            <div className="text-[9px] uppercase tracking-widest text-[#777] mb-1 truncate">{v.nombre}</div>
                            <div className="text-lg font-mono font-bold text-white mb-2">{typeof v.valor === 'number' && v.valor >= 0 ? v.valor.toFixed(1) : v.valor}</div>
                            <div className="absolute bottom-0 left-0 w-full h-1 bg-[#111]">
                                <div className="h-full" style={{ width: `${v.puntuacion}%`, backgroundColor: v.color === 'verde' ? '#10b981' : v.color === 'amarillo' ? '#f59e0b' : v.color === 'naranja' ? '#f97316' : '#ef4444' }}></div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

function NuevaDeudaView({ data, r, maxNew, newDS, combDSCR, ltvMaxPct }: any) {
    const marginNew = maxNew - data.importe;
    const statusClass = combDSCR >= 1.25 ? 'bg-emerald-950/40 text-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.2)]' : combDSCR >= 1.0 ? 'bg-amber-950/40 text-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.2)]' : 'bg-rose-950/40 text-rose-500 shadow-[0_0_10px_rgba(239,68,68,0.2)]';
    const statusTxt = combDSCR >= 1.25 ? 'VIABLE (DSCR ≥ 1.25x)' : combDSCR >= 1.0 ? 'AJUSTADO (1.0x-1.25x)' : 'NO VIABLE (DSCR < 1.0x)';

    const ltvStatus = ltvMaxPct ? (r.ltv <= ltvMaxPct ? 'good' : 'bad') : 'warn';
    const ltvTxt = ltvMaxPct ? (r.ltv <= ltvMaxPct ? `MÁXIMO PERMITIDO: ${ltvMaxPct}%` : `SUPERA LÍMITE DE ${ltvMaxPct}%`) : 'SIN LÍMITE ESTIPULADO';

    return (
        <div className="space-y-6 animate-in fade-in duration-300">
            <div className="grid lg:grid-cols-2 gap-4">
                <div className="bg-[#0a0a0a] border border-[#222]">
                    <h3 className="text-[10px] tracking-[0.2em] text-[#555] font-bold uppercase p-4 border-b border-[#222]">ANÁLISIS DE DEUDA NUEVA</h3>
                    <div className="divide-y divide-[#1a1a1a]">
                        <MetricRow label="IMPORTE SOLICITADO" value={`${data.importe.toFixed(2)} M€`} state="neutral" />
                        <MetricRow label="NUEVO SERVICIO/AÑO" value={`${newDS.toFixed(2)} M€`} state="neutral" />
                        <MetricRow label="DSCR COMBINADO" value={`${combDSCR.toFixed(2)}x`} state={combDSCR >= 1.25 ? 'good' : combDSCR >= 1.0 ? 'warn' : 'bad'} />
                        <MetricRow label="MARGEN VS CAPACIDAD MÁX." value={`${marginNew > 0 ? '+' : ''}${marginNew.toFixed(2)} M€`} state={marginNew >= 0 ? 'good' : 'bad'} />
                        <div className="p-4 flex justify-between items-center">
                            <span className="text-[11px] font-bold text-[#888] tracking-widest uppercase">TEST RESULT</span>
                            <div className={cn("px-3 py-1 font-bold text-[10px] tracking-widest uppercase", statusClass)}>{statusTxt}</div>
                        </div>
                    </div>
                </div>

                <div className="bg-[#0a0a0a] border border-[#222]">
                    <h3 className="text-[10px] tracking-[0.2em] text-[#555] font-bold uppercase p-4 border-b border-[#222]">CAPACIDAD MAX ENDEUDAMIENTO</h3>
                    <div className="divide-y divide-[#1a1a1a]">
                        <MetricRow label="CFADS DISP." value={`${r.cfads.toFixed(2)} M€`} state="neutral" />
                        <MetricRow label="SERVICIO DEUDA ACTUAL" value={`${r.debt_svc.toFixed(2)} M€`} state="neutral" />
                        <MetricRow label="IMPORTE MÁX. (DSCR 1.25)" value={`${maxNew.toFixed(2)} M€`} state="good" />
                        <MetricRow label="HEADROOM" value={r.debt_svc > 0 ? `${(((r.cfads / r.debt_svc - 1.25) / 1.25) * 100).toFixed(1)}%` : '∞'} state="neutral" />
                    </div>
                </div>
            </div>

            {data.colateral > 0 && data.importe > 0 && (
                <div className="bg-[#0a0a0a] border border-[#222]">
                    <h3 className="text-[10px] tracking-[0.2em] text-[#555] font-bold uppercase p-4 border-b border-[#222]">LTV - COLLATERAL</h3>
                    <div className="divide-y divide-[#1a1a1a]">
                        <MetricRow label="VALOR COLATERAL" value={`${data.colateral.toFixed(2)} M€`} subLabel={`TIPO: ${data.tipoCol}`} state="neutral" />
                        <MetricRow label="LTV CALCULADO" value={`${r.ltv.toFixed(1)}%`} subLabel={ltvTxt} state={ltvStatus} />
                    </div>
                </div>
            )}
        </div>
    );
}

function ComparablesView({ data, r }: any) {
    const sect = SECT[data.sector_comp || 'metalurgia'];
    const pData = [
        { name: 'Margen EBITDA', 'Esta Empresa': r.ebitda_margin, 'Mediana Sector': sect.em.med },
        { name: 'DSCR', 'Esta Empresa': r.dscr, 'Mediana Sector': sect.ds.med },
        { name: 'Días Cobro', 'Esta Empresa': r.dias_cobro, 'Mediana Sector': sect.dc.med }
    ];

    return (
        <div className="space-y-6 animate-in fade-in duration-300">
            <div className="bg-[#0a0a0a] border border-[#222] p-5">
                <h3 className="text-[10px] tracking-[0.2em] text-[#555] font-bold uppercase mb-4 border-b border-[#222] pb-2">BENCHMARK SECTORIAL — {sect.n}</h3>

                <div className="overflow-x-auto border border-[#1a1a1a] mb-8">
                    <table className="w-full text-left text-xs text-[#888]">
                        <thead className="text-[9px] uppercase tracking-widest bg-[#111] text-[#666]">
                            <tr>
                                <th className="p-3">Métrica</th>
                                <th className="p-3">p25 Sector</th>
                                <th className="p-3 font-bold text-[#888]">Mediana Sector</th>
                                <th className="p-3">p75 Sector</th>
                                <th className="p-3 text-cyan-400 font-bold">ESTA EMPRESA</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[#1a1a1a]">
                            <tr className="hover:bg-[#111] transition-colors">
                                <td className="p-3 font-bold">Margen EBITDA</td>
                                <td className="p-3">{sect.em.p25}%</td><td className="p-3">{sect.em.med}%</td><td className="p-3">{sect.em.p75}%</td>
                                <td className="p-3 font-mono text-cyan-400 font-bold">{r.ebitda_margin.toFixed(1)}%</td>
                            </tr>
                            <tr className="hover:bg-[#111] transition-colors">
                                <td className="p-3 font-bold">DFN / EBITDA</td>
                                <td className="p-3">{sect.dn.p25}x</td><td className="p-3">{sect.dn.med}x</td><td className="p-3">{sect.dn.p75}x</td>
                                <td className="p-3 font-mono text-cyan-400 font-bold">{r.deuda_ebitda < 0 ? '0.0' : r.deuda_ebitda.toFixed(2)}x</td>
                            </tr>
                            <tr className="hover:bg-[#111] transition-colors">
                                <td className="p-3 font-bold">DSCR</td>
                                <td className="p-3">{sect.ds.p25}x</td><td className="p-3">{sect.ds.med}x</td><td className="p-3">{sect.ds.p75}x</td>
                                <td className="p-3 font-mono text-cyan-400 font-bold">{r.dscr.toFixed(2)}x</td>
                            </tr>
                            <tr className="hover:bg-[#111] transition-colors">
                                <td className="p-3 font-bold">Días Cobro</td>
                                <td className="p-3">{sect.dc.p25}d</td><td className="p-3">{sect.dc.med}d</td><td className="p-3">{sect.dc.p75}d</td>
                                <td className="p-3 font-mono text-cyan-400 font-bold">{Math.round(r.dias_cobro)}d</td>
                            </tr>
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

function CovenantsView({ data, r, res, score }: any) {
    const dnCov = Math.min(+(r.deuda_ebitda < 0 ? 2.0 : r.deuda_ebitda * 1.35 + 0.5).toFixed(2), 5.0);
    const dscrCov = Math.max(+(r.dscr * 0.82).toFixed(2), 1.10);
    const capexCov = +((r.ebitda * 0.25)).toFixed(1);

    const tranches = [
        { label: 'Senior A', spread: score >= 80 ? '175-275 bps' : score >= 70 ? '275-375 bps' : score >= 55 ? '375-500 bps' : 'N/A', a: score >= 55 },
        { label: 'Senior B', spread: score >= 70 ? '375-500 bps' : score >= 55 ? '500-650 bps' : 'N/A', a: score >= 55 },
        { label: 'Mezzanine', spread: score >= 70 ? '600-900 bps' : 'N/A', a: score >= 70 },
    ];

    return (
        <div className="space-y-6 animate-in fade-in duration-300">
            <div className="bg-[#0a0a0a] border border-[#222] p-5">
                <h3 className="text-[10px] tracking-[0.2em] text-[#555] font-bold uppercase mb-4 border-b border-[#222] pb-2">FINANCIAL COVENANTS SUGERIDOS</h3>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    <CovCard title="DFN / EBITDA MAX" val={`≤ ${dnCov}x`} />
                    <CovCard title="DSCR MIN" val={`≥ ${dscrCov}x`} />
                    <CovCard title="CAPEX MAX" val={`≤ ${capexCov} M€`} />
                    <CovCard title="DIVIDENDOS" val={score >= 70 ? 'MAX 40% NOPAT' : 'SUSPENSIÓN'} />
                </div>
            </div>

            <div className="bg-[#0a0a0a] border border-[#222] p-5">
                <h3 className="text-[10px] tracking-[0.2em] text-[#555] font-bold uppercase mb-4 border-b border-[#222] pb-2">PRICING SPREADS (VS EURIBOR)</h3>
                <div className="grid grid-cols-3 gap-4">
                    {tranches.map(t => (
                        <div key={t.label} className={cn("p-4 border rounded-sm", t.a ? "border-cyan-500/30 bg-cyan-950/10" : "border-[#222] bg-[#111] opacity-50")}>
                            <div className="text-[10px] text-[#777] uppercase tracking-widest mb-1">{t.label}</div>
                            <div className={cn("text-lg font-bold font-mono", t.a ? "text-cyan-400" : "text-[#555]")}>{t.spread}</div>
                            <div className="text-[9px] text-[#444] uppercase tracking-widest mt-2">{t.a ? 'Aplicable' : 'Score Insuficiente'}</div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

function KpiBox({ label, value, sub }: { label: string; value: string; sub: string }) {
    return (
        <div className="bg-[#0a0a0a] border border-[#222] p-3 flex flex-col justify-between hover:border-[#333] transition-colors">
            <div className="text-[9px] font-bold text-[#666] uppercase tracking-widest">{label}</div>
            <div className="text-xl font-bold font-mono text-white my-1">{value}</div>
            <div className="text-[8px] text-[#444] uppercase tracking-widest">{sub}</div>
        </div>
    );
}

function CovCard({ title, val }: { title: string; val: string }) {
    return (
        <div className="border border-[#222] p-4 bg-[#111]">
            <div className="text-[9px] text-[#666] font-bold uppercase tracking-widest mb-2">{title}</div>
            <div className="text-xl text-amber-500 font-mono font-bold">{val}</div>
        </div>
    );
}
