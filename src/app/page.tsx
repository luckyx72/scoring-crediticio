'use client';

import { useState, useEffect, useRef } from 'react';
import { Database, Save, Upload, Download, Activity, PlusCircle, TerminalSquare, Layers, Plus, Trash2 } from 'lucide-react';
import { cn, InputField } from '@/components/ui';
import { Financials, DEFAULT_FINANCIALS_TUBACEX, DEFAULT_COL_ROWS_TUBACEX, Company, ColRow, EXAMPLES } from '@/lib/types';
import { COL_CFG } from '@/lib/scoring';
import { DashboardContent } from '@/components/MainContent';

export default function TokenOriginateDashboard() {
    const [activeView, setActiveView] = useState<'calculator' | 'database'>('calculator');
    const [activeTab, setActiveTab] = useState('scoring');
    const [data, setData] = useState<Financials>(DEFAULT_FINANCIALS_TUBACEX);
    const [colRows, setColRows] = useState<ColRow[]>(DEFAULT_COL_ROWS_TUBACEX);

    // DB State
    const [companies, setCompanies] = useState<Company[]>([]);
    const [selectedCompanyId, setSelectedCompanyId] = useState<string | null>(null);
    const [companyNameStr, setCompanyNameStr] = useState("Tubacex (Ejemplo)");
    const [isSaving, setIsSaving] = useState(false);

    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        fetchCompanies();
    }, []);

    // Update colateral value from inventory total
    useEffect(() => {
        const invTotal = colRows.reduce((s, r) => s + (r.bruto || 0), 0);
        if (invTotal > 0 && invTotal !== data.colateral) {
            setData(prev => ({ ...prev, colateral: invTotal }));
        }
    }, [colRows]);

    const fetchCompanies = async () => {
        try {
            const res = await fetch('/api/companies');
            if (res.ok) setCompanies(await res.json());
        } catch (e) { console.error(e); }
    };

    const loadFinancials = async (companyId: string, companyName: string) => {
        try {
            const res = await fetch(`/api/financials/${companyId}`);
            if (res.ok) {
                const d = await res.json();
                if (d && d.length > 0) setData({ ...DEFAULT_FINANCIALS_TUBACEX, ...d[0] });
            }
            setSelectedCompanyId(companyId);
            setCompanyNameStr(companyName);
            setActiveView('calculator');
        } catch (e) { console.error(e); }
    };

    const handleSave = async () => {
        setIsSaving(true);
        try {
            let companyId = selectedCompanyId;
            if (!companyId) {
                const resName = prompt("Company Name:", companyNameStr);
                if (!resName) { setIsSaving(false); return; }
                const cRes = await fetch('/api/companies', { method: 'POST', body: JSON.stringify({ name: resName, sector: data.sector_comp || 'Industrial' }) });
                const cData = await cRes.json();
                companyId = cData.id;
                setCompanyNameStr(resName);
                setSelectedCompanyId(companyId);
                fetchCompanies();
            }
            if (companyId) {
                await fetch(`/api/financials/${companyId}`, { method: 'POST', body: JSON.stringify({ year: new Date().getFullYear(), ...data }) });
                alert(`Model saved to database under ${companyNameStr}`);
            }
        } catch (e) { alert("Error saving model"); } finally { setIsSaving(false); }
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files?.[0]) return;
        const formData = new FormData();
        formData.append('file', e.target.files[0]);
        try {
            const res = await fetch('/api/import', { method: 'POST', body: formData });
            if (res.ok) { alert("XLSX Imported Successfully"); fetchCompanies(); }
            else alert("Upload Failed");
            if (fileInputRef.current) fileInputRef.current.value = "";
        } catch (err) { alert("Upload Error"); }
    };

    const handleInput = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>, key: keyof Financials) => {
        setData(prev => ({
            ...prev,
            [key]: e.target.type === 'number' ? Number(e.target.value) || 0 : e.target.value,
        }));
    };

    const loadExample = (name: string) => {
        const ex = EXAMPLES[name];
        if (!ex) return;
        setData(ex.data);
        setColRows(ex.colRows || []);
        setCompanyNameStr(ex.label);
        setSelectedCompanyId(null);
    };

    const addColRow = () => setColRows(prev => [...prev, { tipo: 'inmueble', desc: '', bruto: 0 }]);
    const removeColRow = (i: number) => setColRows(prev => prev.filter((_, idx) => idx !== i));
    const updateColRow = (i: number, field: keyof ColRow, val: string | number) => {
        setColRows(prev => prev.map((row, idx) => idx === i ? { ...row, [field]: field === 'bruto' ? (Number(val) || 0) : val } : row));
    };

    const TABS = [
        { id: 'scoring', label: 'SCORING' },
        { id: 'nueva_deuda', label: 'NUEVA DEUDA' },
        { id: 'comparables', label: 'COMPARABLES' },
        { id: 'covenants', label: 'COVENANTS' },
        { id: 'colateral', label: 'COLATERAL' },
        { id: 'detalle', label: 'DETALLE' },
    ];

    return (
        <div className="flex min-h-screen flex-col md:flex-row w-full font-mono bg-[#050505] text-[#b3b3b3]">
            <input type="file" ref={fileInputRef} className="hidden" accept=".xlsx" onChange={handleFileUpload} />

            {/* ──────────── SIDEBAR ──────────── */}
            <aside className="w-full md:w-80 border-r border-[#1a1a1a] bg-[#0A0A0A] shrink-0 flex flex-col h-screen overflow-y-auto pb-6"
                style={{ scrollbarWidth: 'none' }}>
                <div className="sticky top-0 bg-[#0A0A0A] z-10 pt-6 px-6 pb-2">
                    <div className="flex items-center gap-2 border-b border-[#1a1a1a] pb-4 mb-4">
                        <TerminalSquare className="w-5 h-5 text-amber-500" />
                        <span className="font-bold text-sm text-amber-500 tracking-tight uppercase">TOK_ORIGINATE</span>
                    </div>
                    <nav className="flex flex-col gap-1 mb-4">
                        <button onClick={() => setActiveView('calculator')}
                            className={cn("w-full flex items-center justify-between px-3 py-2 text-[10px] font-bold tracking-widest uppercase transition-colors rounded-sm",
                                activeView === 'calculator' ? "bg-amber-500/10 text-amber-500 border border-amber-500/30" : "hover:bg-[#111] text-[#888] hover:text-white border border-transparent")}>
                            <div className="flex items-center gap-2"><Activity className="w-3.5 h-3.5" /> DD_ANALYTICS</div>
                            <span className="opacity-50">CTRL_1</span>
                        </button>
                        <button onClick={() => setActiveView('database')}
                            className={cn("w-full flex items-center justify-between px-3 py-2 text-[10px] font-bold tracking-widest uppercase transition-colors rounded-sm",
                                activeView === 'database' ? "bg-cyan-500/10 text-cyan-400 border border-cyan-500/30" : "hover:bg-[#111] text-[#888] hover:text-white border border-transparent")}>
                            <div className="flex items-center gap-2"><Database className="w-3.5 h-3.5" /> DB_RECORDS</div>
                            <span className="opacity-50">CTRL_2</span>
                        </button>
                    </nav>

                    {/* EXAMPLE PRESETS */}
                    <div className="flex gap-1 mb-4">
                        {Object.entries(EXAMPLES).map(([key, ex]) => (
                            <button key={key} onClick={() => loadExample(key)}
                                className="flex-1 text-[8px] font-bold tracking-wider bg-[#111] border border-[#222] text-[#777] px-1 py-1.5 hover:bg-[#1a1a1a] hover:text-white transition-colors uppercase truncate">
                                {ex.label.split(' ')[0]}
                            </button>
                        ))}
                    </div>
                </div>

                {/* INPUTS PANEL */}
                <div className="px-5 space-y-6 flex-1">
                    <section>
                        <h3 className="text-[10px] font-bold tracking-[0.2em] text-[#555] pb-2 border-b border-[#222] mb-3">P&L STATEMENT</h3>
                        <div className="space-y-2">
                            <InputField label="Ventas Netas" value={data.ventas} onChange={(e) => handleInput(e as any, 'ventas')} />
                            <InputField label="EBITDA" value={data.ebitda} onChange={(e) => handleInput(e as any, 'ebitda')} />
                            <InputField label="Gastos Financieros" value={data.gastosFinancieros} onChange={(e) => handleInput(e as any, 'gastosFinancieros')} />
                            <InputField label="Impuestos (Caja)" value={data.impPagado} onChange={(e) => handleInput(e as any, 'impPagado')} />
                            <InputField label="Capex Mantenimiento" value={data.capexMant} onChange={(e) => handleInput(e as any, 'capexMant')} />
                        </div>
                    </section>

                    <section>
                        <h3 className="text-[10px] font-bold tracking-[0.2em] text-[#555] pb-2 border-b border-[#222] mb-3">BALANCE SHEET</h3>
                        <div className="grid grid-cols-2 gap-2">
                            <InputField label="Activo Corr." value={data.activoCorriente} onChange={(e) => handleInput(e as any, 'activoCorriente')} />
                            <InputField label="Pasivo Corr." value={data.pasivoCorriente} onChange={(e) => handleInput(e as any, 'pasivoCorriente')} />
                            <InputField label="Deuda Bruta" value={data.deudaBruta} onChange={(e) => handleInput(e as any, 'deudaBruta')} />
                            <InputField label="Caja & Eq." value={data.caja} onChange={(e) => handleInput(e as any, 'caja')} />
                            <InputField label="Clientes" value={data.clientes} onChange={(e) => handleInput(e as any, 'clientes')} />
                            <InputField label="Proveedores" value={data.proveedores} onChange={(e) => handleInput(e as any, 'proveedores')} />
                        </div>
                        <div className="mt-2"><InputField label="Vida Media Deuda (Años)" value={data.vidaMedia} onChange={(e) => handleInput(e as any, 'vidaMedia')} /></div>
                    </section>

                    <section>
                        <h3 className="text-[10px] font-bold tracking-[0.2em] text-[#555] pb-2 border-b border-[#222] mb-3">NEW FACILITY & COL.</h3>
                        <div className="space-y-2">
                            <InputField label="Importe Solicitado" value={data.importe} onChange={(e) => handleInput(e as any, 'importe')} />
                            <div className="grid grid-cols-2 gap-2">
                                <InputField label="Plazo" value={data.plazo} onChange={(e) => handleInput(e as any, 'plazo')} />
                                <InputField label="Tipo Interés %" value={data.tipoInt} onChange={(e) => handleInput(e as any, 'tipoInt')} />
                            </div>
                            <InputField label="Importe Colateral" value={data.colateral} onChange={(e) => handleInput(e as any, 'colateral')} />
                            <div className="flex flex-col gap-1 mt-1">
                                <label className="text-[9px] font-bold text-[#666] uppercase tracking-widest">Tipo Colateral</label>
                                <select value={data.tipoCol} onChange={(e) => handleInput(e as any, 'tipoCol')} className="w-full bg-[#111] border border-[#222] px-2 py-1.5 text-xs text-white outline-none focus:border-amber-500">
                                    <option value="inmueble">Inmueble</option><option value="maquinaria">Maquinaria</option>
                                    <option value="cuentas_cobrar">Cuentas Cobrar</option><option value="stock">Stock</option>
                                    <option value="mixto">Mixto</option><option value="ninguno">Ninguno</option>
                                </select>
                            </div>
                        </div>
                    </section>

                    <section>
                        <h3 className="text-[10px] font-bold tracking-[0.2em] text-[#555] pb-2 border-b border-[#222] mb-3">QUALITATIVE FACTORS</h3>
                        <div className="grid grid-cols-2 gap-2">
                            <InputField label="Equipo Dir (1-5)" value={data.equipo} onChange={(e) => handleInput(e as any, 'equipo')} />
                            <InputField label="Div. Client (1-5)" value={data.concentracion} onChange={(e) => handleInput(e as any, 'concentracion')} />
                            <InputField label="Antigüedad (1-5)" value={data.antiguedad} onChange={(e) => handleInput(e as any, 'antiguedad')} />
                            <InputField label="Estab Sector (1-5)" value={data.ciclicidad} onChange={(e) => handleInput(e as any, 'ciclicidad')} />
                        </div>
                    </section>

                    {/* COLLATERAL INVENTORY */}
                    <section>
                        <div className="flex items-center justify-between pb-2 border-b border-[#222] mb-3">
                            <h3 className="text-[10px] font-bold tracking-[0.2em] text-[#555]">COLLATERAL INVENTORY</h3>
                            <button onClick={addColRow} className="text-[9px] flex items-center gap-1 text-cyan-400 hover:text-cyan-300 transition"><Plus className="w-3 h-3" /> Add</button>
                        </div>
                        <div className="space-y-2">
                            {colRows.map((row, i) => (
                                <div key={i} className="bg-[#111] border border-[#222] p-2 space-y-1.5 group relative">
                                    <button onClick={() => removeColRow(i)} className="absolute top-1 right-1 text-rose-500/50 hover:text-rose-400 opacity-0 group-hover:opacity-100 transition-opacity"><Trash2 className="w-3 h-3" /></button>
                                    <select value={row.tipo} onChange={e => updateColRow(i, 'tipo', e.target.value)}
                                        className="w-full bg-[#0a0a0a] border border-[#222] px-2 py-1 text-[10px] text-white outline-none focus:border-cyan-500">
                                        {Object.entries(COL_CFG).map(([k, v]) => (<option key={k} value={k}>{v.label}</option>))}
                                    </select>
                                    <input value={row.desc} onChange={e => updateColRow(i, 'desc', e.target.value)} placeholder="Descripción..."
                                        className="w-full bg-[#0a0a0a] border border-[#222] px-2 py-1 text-[10px] text-[#888] outline-none focus:border-cyan-500" />
                                    <div className="flex items-center gap-1">
                                        <input type="number" value={row.bruto || ''} onChange={e => updateColRow(i, 'bruto', e.target.value)} step="0.1" placeholder="M€"
                                            className="flex-1 bg-[#0a0a0a] border border-[#222] px-2 py-1 text-[10px] text-white outline-none focus:border-cyan-500" />
                                        <span className="text-[8px] text-[#555] font-bold tracking-wider">M€ BRUTO</span>
                                    </div>
                                </div>
                            ))}
                            {colRows.length === 0 && <p className="text-[9px] text-[#555] text-center py-2">Sin activos. Click + Add para añadir.</p>}
                        </div>
                    </section>
                </div>

                {/* BOTTOM FIXED ACTIONS */}
                <div className="px-5 pt-6 mt-6 border-t border-[#1a1a1a] sticky bottom-0 bg-[#0A0A0A]">
                    <div className="flex flex-col gap-2">
                        <button onClick={() => { setSelectedCompanyId(null); setCompanyNameStr("New Company"); setData(DEFAULT_FINANCIALS_TUBACEX); setColRows([]); setActiveView('calculator'); }}
                            className="flex items-center justify-start gap-2 w-full px-3 py-2 border border-[#333] hover:border-amber-500 text-amber-500 text-[10px] uppercase font-bold tracking-widest transition-all">
                            <PlusCircle className="w-3.5 h-3.5" /> NEW_MODEL
                        </button>
                        <div className="grid grid-cols-2 gap-2">
                            <button onClick={() => fileInputRef.current?.click()} className="flex items-center justify-center gap-2 w-full px-3 py-2 bg-[#111] hover:bg-[#222] border border-[#222] text-[#aaa] text-[10px] uppercase font-bold tracking-widest transition-all">
                                <Upload className="w-3.5 h-3.5" /> IMP_XLS
                            </button>
                            <button onClick={() => window.location.href = '/api/export'} className="flex items-center justify-center gap-2 w-full px-3 py-2 bg-[#111] hover:bg-[#222] border border-[#222] text-[#aaa] text-[10px] uppercase font-bold tracking-widest transition-all">
                                <Download className="w-3.5 h-3.5" /> EXP_DB
                            </button>
                        </div>
                    </div>
                </div>
            </aside>

            {/* ──────────── MAIN CONTENT ──────────── */}
            <main className="flex-1 overflow-y-auto bg-[#000] relative">
                <header className="h-10 border-b border-[#1a1a1a] flex items-center px-6 bg-[#000] sticky top-0 z-20 text-[10px] uppercase tracking-widest text-[#666]">
                    <span>SYST: ONLINE</span> <span className="mx-3 text-[#333]">|</span>
                    <span>NODE: TOK_ORIG</span> <span className="mx-3 text-[#333]">|</span>
                    <span className="text-amber-500">OP: {activeView === 'calculator' ? companyNameStr : 'MASTER_DB'}</span>
                </header>

                <div className="p-6 md:p-8 max-w-7xl mx-auto h-full">
                    {activeView === 'calculator' && (
                        <div className="animate-in fade-in duration-300">
                            <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 pb-4 border-b border-[#1a1a1a]">
                                <div>
                                    <h1 className="text-2xl font-bold tracking-tight text-white mb-2 uppercase">RISK_ASSESSMENT_MODEL</h1>
                                    <div className="flex items-center gap-4 text-xs font-bold uppercase tracking-widest">
                                        <span className="text-[#666]">Target: <span className="text-amber-500">{companyNameStr}</span></span>
                                        <span className="text-[#666]">Sector: <select value={data.sector_comp} onChange={e => handleInput(e as any, 'sector_comp')} className="bg-transparent text-cyan-400 outline-none hover:underline cursor-pointer">
                                            <option value="metalurgia">Metalurgia</option><option value="quimica">Química</option><option value="alimentacion">Alimentación</option>
                                            <option value="automocion">Automoción</option><option value="papel_carton">Papel/Cartón</option><option value="construccion">Construcción</option>
                                            <option value="energia">Energía</option><option value="logistica">Logística</option>
                                        </select></span>
                                    </div>
                                </div>
                                <div className="flex mt-4 md:mt-0 gap-2">
                                    <button onClick={() => window.print()} className="flex items-center gap-2 px-4 py-2 text-[10px] font-bold tracking-widest border border-[#333] bg-[#111] text-[#aaa] hover:bg-[#222] hover:text-white transition-colors uppercase">
                                        <Download className="w-3.5 h-3.5" /> PDF_EXPORT
                                    </button>
                                    <button onClick={handleSave} disabled={isSaving} className="flex items-center gap-2 px-4 py-2 text-[10px] font-bold tracking-widest border border-emerald-900 bg-emerald-950/30 text-emerald-500 hover:bg-emerald-900/50 hover:text-emerald-400 transition-colors uppercase">
                                        <Save className="w-3.5 h-3.5" /> {isSaving ? 'COMMITTING...' : 'COMMIT_DB'}
                                    </button>
                                </div>
                            </div>

                            {/* TABS SELECTOR */}
                            <div className="flex flex-wrap items-center gap-1 border-b border-[#1a1a1a] mb-6 pb-2">
                                {TABS.map(tab => (
                                    <button
                                        key={tab.id}
                                        onClick={() => setActiveTab(tab.id)}
                                        className={cn(
                                            "px-3 py-2 text-[10px] font-bold uppercase tracking-widest transition-colors border-b-2",
                                            activeTab === tab.id ? "text-amber-500 border-amber-500 bg-amber-500/5" : "text-[#666] border-transparent hover:text-[#ccc] hover:bg-[#111]"
                                        )}>
                                        {tab.label}
                                    </button>
                                ))}
                            </div>

                            <DashboardContent data={data} activeTab={activeTab} colRows={colRows} />
                        </div>
                    )}

                    {activeView === 'database' && (
                        <div className="animate-in fade-in duration-300">
                            <div className="flex items-start justify-between mb-6 pb-4 border-b border-[#1a1a1a]">
                                <div>
                                    <h1 className="text-xl font-bold tracking-tight text-white mb-1 uppercase">DATABASE_RECORDS</h1>
                                    <p className="text-xs text-[#666] uppercase tracking-wider">Storage: SQLite_Local</p>
                                </div>
                            </div>
                            <div className="bg-[#0a0a0a] border border-[#222] p-0 overflow-x-auto">
                                <table className="w-full text-left text-xs text-[#888] min-w-max">
                                    <thead className="text-[10px] uppercase font-bold tracking-widest bg-[#111] text-[#666] border-b border-[#222]">
                                        <tr>
                                            <th className="p-4">ID_HASH</th>
                                            <th className="p-4">ENTITY_NAME</th>
                                            <th className="p-4">SECTOR</th>
                                            <th className="p-4">DATE</th>
                                            <th className="p-4 text-right">ACTION</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-[#1a1a1a]">
                                        {companies.map(c => (
                                            <tr key={c.id} className="hover:bg-[#111] transition-colors">
                                                <td className="p-4 font-mono text-cyan-500/50">{c.id.substring(0, 8)}</td>
                                                <td className="p-4 text-[#ccc] font-bold">{c.name}</td>
                                                <td className="p-4 text-[#555]">{c.sector || 'N/A'}</td>
                                                <td className="p-4 font-mono">{new Date(c.createdAt).toLocaleDateString()}</td>
                                                <td className="p-4 text-right">
                                                    <button onClick={() => loadFinancials(c.id, c.name)} className="text-amber-500 hover:text-amber-400 font-bold tracking-wider text-[10px] uppercase px-3 py-1 border border-amber-500/30 rounded-sm hover:bg-amber-500/10 transition-colors">Load</button>
                                                </td>
                                            </tr>
                                        ))}
                                        {companies.length === 0 && <tr><td colSpan={5} className="p-8 text-center text-[#555] uppercase tracking-widest text-[10px]">NO_RECORDS_FOUND</td></tr>}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                </div>
            </main>

            {/* Hide Next.js dev toast */}
            <style dangerouslySetInnerHTML={{ __html: `nextjs-portal { display: none; }` }} />
        </div>
    );
}
