'use client';

import { useState, useEffect, useRef } from 'react';
import { Database, Save, Upload, Download, Activity, PlusCircle, TerminalSquare } from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// ── TYPES ──

interface Financials {
  ventas: number;
  ebitda: number;
  gastosFinancieros: number;
  impPagado: number;
  capexMant: number;
  deudaBruta: number;
  caja: number;
  activoCorriente: number;
  pasivoCorriente: number;
  clientes: number;
  proveedores: number;
  vidaMedia: number;
  importe: number;
  plazo: number;
  tipoInt: number;
  colateral: number;
  tipoCol: string;
  equipo: number;
  concentracion: number;
  antiguedad: number;
  ciclicidad: number;
}

const DEFAULT_FINANCIALS: Financials = {
  ventas: 100,
  ebitda: 15,
  gastosFinancieros: 2.5,
  impPagado: 2,
  capexMant: 2,
  deudaBruta: 35,
  caja: 8,
  activoCorriente: 45,
  pasivoCorriente: 28,
  clientes: 22,
  proveedores: 18,
  vidaMedia: 5,
  importe: 0,
  plazo: 5,
  tipoInt: 6,
  colateral: 0,
  tipoCol: 'ninguno',
  equipo: 3,
  concentracion: 3,
  antiguedad: 3,
  ciclicidad: 3
};

interface Company {
  id: string;
  name: string;
  sector: string | null;
  createdAt: string;
}

// ── COMPONENT ──

export default function TokenOriginateDashboard() {
  const [activeTab, setActiveTab] = useState<'calculator' | 'database'>('calculator');
  const [data, setData] = useState<Financials>(DEFAULT_FINANCIALS);

  // DB State
  const [companies, setCompanies] = useState<Company[]>([]);
  const [selectedCompanyId, setSelectedCompanyId] = useState<string | null>(null);
  const [companyNameStr, setCompanyNameStr] = useState("Tubacex (Ejemplo)");
  const [isSaving, setIsSaving] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchCompanies();
  }, []);

  const fetchCompanies = async () => {
    try {
      const res = await fetch('/api/companies');
      if (res.ok) {
        const d = await res.json();
        setCompanies(d);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const loadFinancials = async (companyId: string, companyName: string) => {
    try {
      const res = await fetch(`/api/financials/${companyId}`);
      if (res.ok) {
        const d = await res.json();
        if (d && d.length > 0) {
          setData({
            ...DEFAULT_FINANCIALS,
            ...d[0] // Load most recent year
          });
        }
      }
      setSelectedCompanyId(companyId);
      setCompanyNameStr(companyName);
      setActiveTab('calculator');
    } catch (e) {
      console.error(e);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      let companyId = selectedCompanyId;
      // If we don't have a selected company, create one based on the current name string
      if (!companyId) {
        const resName = prompt("Company Name:", companyNameStr);
        if (!resName) { setIsSaving(false); return; }

        const cRes = await fetch('/api/companies', {
          method: 'POST',
          body: JSON.stringify({ name: resName, sector: 'Industrial' })
        });
        const cData = await cRes.json();
        companyId = cData.id;
        setCompanyNameStr(resName);
        setSelectedCompanyId(companyId);
        fetchCompanies();
      }

      // Save financials
      if (companyId) {
        await fetch(`/api/financials/${companyId}`, {
          method: 'POST',
          body: JSON.stringify({
            year: new Date().getFullYear(),
            ...data
          })
        });
        alert(`Model saved to database under ${companyNameStr}`);
      }
    } catch (e) {
      alert("Error saving model");
    } finally {
      setIsSaving(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.[0]) return;
    const file = e.target.files[0];
    const formData = new FormData();
    formData.append('file', file);
    try {
      const res = await fetch('/api/import', {
        method: 'POST',
        body: formData
      });
      if (res.ok) {
        alert("XLSX Imported Successfully");
        fetchCompanies();
        if (fileInputRef.current) fileInputRef.current.value = "";
      } else {
        alert("Upload Failed");
      }
    } catch (err) {
      alert("Upload Error");
    }
  };

  const handleExport = () => {
    window.location.href = '/api/export';
  };

  // Formulas mapped from index.html -> Javascript logic
  const ebitda = data.ebitda;
  const ventas = Math.max(data.ventas, 0.001);
  const dfn = data.deudaBruta - data.caja;
  const ebitdaMargin = (ebitda / ventas) * 100;
  const dfnEbitda = ebitda > 0 ? dfn / ebitda : (dfn <= 0 ? -1 : 99);
  const diasCobro = (data.clientes / ventas) * 365;
  const diasPago = (data.proveedores / ventas) * 365;
  const liquidez = data.pasivoCorriente > 0 ? (data.activoCorriente / data.pasivoCorriente) : 99;

  const cfads = ebitda - data.impPagado - data.capexMant;
  const vidaMedia = Math.max(data.vidaMedia, 0.5);
  const amort = Math.max(dfn, 0) / vidaMedia;
  const debtSvc = data.gastosFinancieros + amort;
  const dscr = debtSvc > 0 ? cfads / debtSvc : (cfads > 0 ? 99 : 0);

  const loanBase = data.importe > 0 ? data.importe : Math.max(dfn, 0.001);
  const rate = Math.max(data.tipoInt / 100, 0.0001);
  const nLoan = data.importe > 0 ? Math.max(data.plazo, 1) : Math.max(vidaMedia, 1);
  const pvFactor = (1 - Math.pow(1 + rate, -nLoan)) / rate;
  const llcr = loanBase > 0 ? (cfads * pvFactor) / loanBase : 99;

  // LTV Logic
  const LTV_MAX_VALS: Record<string, number | null> = { inmueble: 60, maquinaria: 40, cuentas_cobrar: 70, stock: 50, mixto: 55, ninguno: null };
  const ltvMax = LTV_MAX_VALS[data.tipoCol];
  const ltv = data.colateral > 0 && data.importe > 0 ? (data.importe / data.colateral) * 100 : 0;

  // Basic scoring logic recreated from index.html (0-100)
  // using very simplified interpolation approximations for the UI visualizer
  let score = 100;
  if (dscr < 1.0) score -= 25;
  else if (dscr < 1.25) score -= 15;

  if (dfnEbitda > 4) score -= 25;
  else if (dfnEbitda > 2.5) score -= 15;

  if (llcr < 1.0) score -= 15;
  if (ebitdaMargin < 5) score -= 10;

  score = Math.max(0, Math.min(100, score));

  // Handlers
  const handleInput = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>, key: keyof Financials) => {
    setData((prev) => ({
      ...prev,
      [key]: e.target.type === 'number' ? Number(e.target.value) || 0 : e.target.value,
    }));
  };

  return (
    <div className="flex min-h-screen flex-col md:flex-row w-full font-mono bg-[#050505] text-[#b3b3b3]">
      <input type="file" ref={fileInputRef} className="hidden" accept=".xlsx" onChange={handleFileUpload} />

      {/* SIDEBAR */}
      <aside className="w-full md:w-64 border-r border-[#1a1a1a] bg-[#0A0A0A] shrink-0 flex flex-col justify-between py-6">
        <div>
          <div className="flex items-center gap-2 px-6 pb-6 border-b border-[#1a1a1a] mb-4">
            <TerminalSquare className="w-5 h-5 text-amber-500" />
            <span className="font-bold text-sm text-amber-500 tracking-tight uppercase">TOK_ORIGINATE</span>
          </div>

          <nav className="space-y-1 px-3">
            <button
              onClick={() => setActiveTab('calculator')}
              className={cn(
                "w-full flex items-center gap-3 px-3 py-2 text-xs transition-colors",
                activeTab === 'calculator'
                  ? "bg-[#1f1f1f] text-amber-500 font-semibold border-l-2 border-amber-500"
                  : "hover:bg-[#111] text-[#888] hover:text-[#ccc] border-l-2 border-transparent"
              )}
            >
              <Activity className="w-4 h-4" />
              DD_ANALYTICS
            </button>
            <button
              onClick={() => setActiveTab('database')}
              className={cn(
                "w-full flex items-center gap-3 px-3 py-2 text-xs transition-colors",
                activeTab === 'database'
                  ? "bg-[#1f1f1f] text-cyan-400 font-semibold border-l-2 border-cyan-400"
                  : "hover:bg-[#111] text-[#888] hover:text-[#ccc] border-l-2 border-transparent"
              )}
            >
              <Database className="w-4 h-4" />
              DB_RECORDS
            </button>
          </nav>

          <div className="mt-8 px-6">
            <h3 className="text-[10px] font-bold tracking-[0.2em] text-[#555] pb-2 border-b border-[#222] mb-3">INDEX_ENTITIES</h3>
            {companies.length === 0 ? (
              <p className="text-[10px] text-[#444] italic">Empty DB</p>
            ) : (
              <ul className="space-y-1">
                {companies.map(c => (
                  <li key={c.id}>
                    <button
                      onClick={() => loadFinancials(c.id, c.name)}
                      className={cn(
                        "text-[11px] w-full text-left truncate transition-colors px-2 py-1 flex items-center gap-2",
                        selectedCompanyId === c.id ? "text-cyan-400 bg-[#111]" : "text-[#777] hover:text-[#fff] hover:bg-[#111]"
                      )}
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-cyan-500/50"></span>
                      {c.name}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        <div className="px-5 pt-6 space-y-2">
          <button
            onClick={() => { setSelectedCompanyId(null); setCompanyNameStr("New Company"); setData(DEFAULT_FINANCIALS); setActiveTab('calculator'); }}
            className="flex items-center justify-start gap-2 w-full px-3 py-2 bg-transparent hover:bg-[#111] border border-[#333] hover:border-amber-500 text-amber-500 text-xs rounded transition-all">
            <PlusCircle className="w-3.5 h-3.5" />
            NEW_MODEL
          </button>
          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center justify-start gap-2 w-full px-3 py-2 bg-[#111] hover:bg-[#222] border border-[#222] text-[#aaa] text-xs rounded transition-all">
            <Upload className="w-3.5 h-3.5" />
            IMPORT_XLSX
          </button>
          <button
            onClick={handleExport}
            className="flex items-center justify-start gap-2 w-full px-3 py-2 bg-[#111] hover:bg-[#222] border border-[#222] text-[#aaa] text-xs rounded transition-all">
            <Download className="w-3.5 h-3.5" />
            EXPORT_DB
          </button>
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <main className="flex-1 overflow-y-auto">
        <header className="h-10 border-b border-[#1a1a1a] flex items-center px-6 bg-[#000] sticky top-0 z-10 text-[10px] uppercase tracking-widest text-[#666]">
          <span>SYST: ONLINE</span> <span className="mx-3">|</span>
          <span>NODE: TOK_ORIG</span> <span className="mx-3">|</span>
          <span className="text-amber-500">OP: {activeTab === 'calculator' ? companyNameStr : 'MASTER_DB'}</span>
        </header>

        <div className="p-6 max-w-7xl mx-auto">
          {activeTab === 'calculator' && (
            <div className="animate-in fade-in duration-300">
              <div className="flex items-start justify-between mb-6 pb-4 border-b border-[#1a1a1a]">
                <div>
                  <h1 className="text-xl font-bold tracking-tight text-white mb-1 uppercase">RISK_ASSESSMENT_MODEL</h1>
                  <p className="text-xs text-[#666] uppercase tracking-wider">Target: <span className="text-amber-500">{companyNameStr}</span></p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={handleSave}
                    disabled={isSaving}
                    className="flex items-center gap-2 px-4 py-1.5 text-xs font-bold border border-emerald-900 bg-emerald-950/30 text-emerald-500 hover:bg-emerald-900/50 hover:text-emerald-400 transition-colors">
                    <Save className="w-3.5 h-3.5" />
                    {isSaving ? 'COMMITTING...' : 'COMMIT_DB'}
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
                {/* INPUTS COLUMN */}
                <div className="xl:col-span-2 space-y-4">
                  {/* P&L Section */}
                  <section className="bg-[#0a0a0a] border border-[#222] p-4">
                    <h2 className="text-[10px] font-bold tracking-[0.2em] text-[#888] uppercase mb-4 pb-2 border-b border-[#222]">PROFIT_LOSS_STMT /// (EUR_M)</h2>
                    <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
                      <InputField label="Revenue (Net)" value={data.ventas} onChange={(e) => handleInput(e as any, 'ventas')} />
                      <InputField label="EBITDA" value={data.ebitda} onChange={(e) => handleInput(e as any, 'ebitda')} />
                      <InputField label="Fin_Expenses" value={data.gastosFinancieros} onChange={(e) => handleInput(e as any, 'gastosFinancieros')} />
                      <InputField label="Taxes_Paid" value={data.impPagado} onChange={(e) => handleInput(e as any, 'impPagado')} />
                      <InputField label="Maint_Capex" value={data.capexMant} onChange={(e) => handleInput(e as any, 'capexMant')} />
                    </div>
                  </section>

                  {/* Balance Sheet Section */}
                  <section className="bg-[#0a0a0a] border border-[#222] p-4">
                    <h2 className="text-[10px] font-bold tracking-[0.2em] text-[#888] uppercase mb-4 pb-2 border-b border-[#222]">BAL_SHEET /// (EUR_M)</h2>
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                      <InputField label="Gross_Debt" value={data.deudaBruta} onChange={(e) => handleInput(e as any, 'deudaBruta')} />
                      <InputField label="Cash_Eq" value={data.caja} onChange={(e) => handleInput(e as any, 'caja')} />
                      <InputField label="Current_Assets" value={data.activoCorriente} onChange={(e) => handleInput(e as any, 'activoCorriente')} />
                      <InputField label="Current_Liab." value={data.pasivoCorriente} onChange={(e) => handleInput(e as any, 'pasivoCorriente')} />
                      <InputField label="Receivables" value={data.clientes} onChange={(e) => handleInput(e as any, 'clientes')} />
                      <InputField label="Payables" value={data.proveedores} onChange={(e) => handleInput(e as any, 'proveedores')} />
                      <div className="lg:col-span-2">
                        <InputField label="Avg._Debt_Life (Years)" value={data.vidaMedia} onChange={(e) => handleInput(e as any, 'vidaMedia')} />
                      </div>
                    </div>
                  </section>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Debt Origin Section */}
                    <section className="bg-[#0a0a0a] border border-[#222] p-4">
                      <h2 className="text-[10px] font-bold tracking-[0.2em] text-[#888] uppercase mb-4 pb-2 border-b border-[#222]">NEW_FACILITY</h2>
                      <div className="grid grid-cols-1 gap-3">
                        <InputField label="Amount_Req" value={data.importe} onChange={(e) => handleInput(e as any, 'importe')} />
                        <div className="grid grid-cols-2 gap-3">
                          <InputField label="Term_Years" value={data.plazo} onChange={(e) => handleInput(e as any, 'plazo')} />
                          <InputField label="Int._Rate (%)" value={data.tipoInt} onChange={(e) => handleInput(e as any, 'tipoInt')} />
                        </div>
                        <InputField label="Collateral_Value" value={data.colateral} onChange={(e) => handleInput(e as any, 'colateral')} />
                        <div className="flex flex-col gap-1">
                          <label className="text-[10px] font-bold text-[#666] uppercase tracking-widest">Collateral_Type</label>
                          <select
                            value={data.tipoCol}
                            onChange={(e) => handleInput(e as any, 'tipoCol')}
                            className="w-full bg-[#111] border border-[#222] px-3 py-1.5 text-xs text-white transition-all hover:bg-[#1a1a1a] focus:bg-[#1a1a1a] focus:border-amber-500/50 focus:text-amber-500 outline-none"
                          >
                            <option value="ninguno">None</option>
                            <option value="inmueble">Real Estate</option>
                            <option value="maquinaria">Machinery</option>
                            <option value="cuentas_cobrar">Receivables</option>
                            <option value="stock">Inventory</option>
                            <option value="mixto">Mixed</option>
                          </select>
                        </div>
                      </div>
                    </section>

                    {/* Qual Section */}
                    <section className="bg-[#0a0a0a] border border-[#222] p-4">
                      <h2 className="text-[10px] font-bold tracking-[0.2em] text-[#888] uppercase mb-4 pb-2 border-b border-[#222]">QUALITATIVE_SCORE (1-5)</h2>
                      <div className="grid grid-cols-2 gap-3">
                        <InputField label="Mgmt_Team" value={data.equipo} onChange={(e) => handleInput(e as any, 'equipo')} />
                        <InputField label="Client_Div." value={data.concentracion} onChange={(e) => handleInput(e as any, 'concentracion')} />
                        <InputField label="Business_Age" value={data.antiguedad} onChange={(e) => handleInput(e as any, 'antiguedad')} />
                        <InputField label="Ind._Stability" value={data.ciclicidad} onChange={(e) => handleInput(e as any, 'ciclicidad')} />
                      </div>
                    </section>
                  </div>
                </div>

                {/* RESULTS COLUMN */}
                <div className="space-y-4">
                  {/* Score Card */}
                  <div className="bg-[#0a0a0a] border border-[#222] p-5 flex flex-col items-center justify-center relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-bl from-amber-500/10 to-transparent pointer-events-none"></div>
                    <div className="text-[10px] tracking-[0.2em] text-[#555] uppercase mb-4 w-full text-left">SYS_SCORE</div>

                    <div className="relative flex items-center justify-center mb-3">
                      <svg className="w-28 h-28 -rotate-90 drop-shadow-[0_0_8px_rgba(255,183,77,0.2)]">
                        <circle cx="56" cy="56" r="48" fill="none" stroke="#111" strokeWidth="6" />
                        <circle
                          cx="56" cy="56" r="48" fill="none"
                          stroke={score > 80 ? '#10b981' : score > 50 ? '#f59e0b' : '#ef4444'}
                          strokeWidth="6"
                          strokeDasharray="301.59"
                          strokeDashoffset={301.59 - (301.59 * score) / 100}
                          className="transition-all duration-1000 ease-out"
                        />
                      </svg>
                      <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <span className="text-3xl font-bold text-white tracking-widest leading-none drop-shadow-[0_0_10px_rgba(255,255,255,0.2)]">{score}</span>
                      </div>
                    </div>

                    <div className={cn(
                      "px-3 py-1 text-[10px] font-bold border uppercase tracking-widest w-full text-center",
                      score > 80 ? "bg-emerald-950/30 text-emerald-500 border-emerald-900/50" :
                        score > 50 ? "bg-amber-950/30 text-amber-500 border-amber-900/50" :
                          "bg-rose-950/30 text-rose-500 border-rose-900/50"
                    )}>
                      {score > 80 ? 'STATUS: OPTIMAL_A' : score > 50 ? 'STATUS: WARN_B' : 'STATUS: CRIT_C'}
                    </div>
                  </div>

                  {/* Key Ratios */}
                  <div className="bg-[#0a0a0a] border border-[#222]">
                    <h2 className="text-[10px] font-bold tracking-[0.2em] text-[#555] p-3 border-b border-[#222]">KPI_TELEMETRY</h2>
                    <div className="divide-y divide-[#1a1a1a]">
                      <MetricRow label="EBITDA_M" value={`${ebitdaMargin.toFixed(1)}%`} subLabel="MARGIN" state="neutral" />
                      <MetricRow label="NET_DEBT" value={`${dfn.toFixed(1)} M`} subLabel="DFN" state="neutral" />

                      <MetricRow
                        label="LEV_RATIO"
                        value={`${dfnEbitda.toFixed(2)}x`}
                        subLabel="(DFN/EBITDA)"
                        state={dfnEbitda < 2.5 ? 'good' : dfnEbitda < 4.0 ? 'warn' : 'bad'}
                      />
                      <MetricRow
                        label="DSCR"
                        value={`${dscr.toFixed(2)}x`}
                        subLabel="(DEBT_SVC_COV)"
                        state={dscr > 1.25 ? 'good' : dscr > 1.0 ? 'warn' : 'bad'}
                      />
                      <MetricRow
                        label="LLCR"
                        value={`${llcr.toFixed(2)}x`}
                        subLabel="(LOAN_LIFE_COV)"
                        state={llcr > 1.4 ? 'good' : llcr > 1.0 ? 'warn' : 'bad'}
                      />

                      {data.importe > 0 && data.colateral > 0 && ltvMax && (
                        <MetricRow
                          label="LTV"
                          value={`${ltv.toFixed(1)}%`}
                          subLabel={`MAX: ${ltvMax}%`}
                          state={ltv < ltvMax ? 'good' : 'bad'}
                        />
                      )}

                      <MetricRow label="DSO" value={`${Math.round(diasCobro)}d`} subLabel="RECEIVABLES_DAYS" state="neutral" />
                      <MetricRow label="DPO" value={`${Math.round(diasPago)}d`} subLabel="PAYABLES_DAYS" state="neutral" />
                      <MetricRow label="CUR_RATIO" value={`${liquidez.toFixed(2)}x`} subLabel="LIQUIDITY" state="neutral" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'database' && (
            <div className="animate-in fade-in duration-300">
              <div className="flex items-start justify-between mb-6 pb-4 border-b border-[#1a1a1a]">
                <div>
                  <h1 className="text-xl font-bold tracking-tight text-white mb-1 uppercase">DATABASE_RECORDS</h1>
                  <p className="text-xs text-[#666] uppercase tracking-wider">Storage: SQLite_Local</p>
                </div>
              </div>

              <div className="bg-[#0a0a0a] border border-[#222] p-0">
                <table className="w-full text-left text-xs text-[#888]">
                  <thead className="text-[10px] uppercase font-bold tracking-widest bg-[#111] text-[#666] border-b border-[#222]">
                    <tr>
                      <th className="p-3">ID_HASH</th>
                      <th className="p-3">ENTITY_NAME</th>
                      <th className="p-3">SECTOR</th>
                      <th className="p-3">REGISTERED_AT</th>
                      <th className="p-3 text-right">ACTION</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#1a1a1a]">
                    {companies.map(c => (
                      <tr key={c.id} className="hover:bg-[#111] transition-colors">
                        <td className="p-3 font-mono text-cyan-500/50">{c.id.substring(0, 8)}</td>
                        <td className="p-3 text-[#ccc] font-bold">{c.name}</td>
                        <td className="p-3">{c.sector || 'N/A'}</td>
                        <td className="p-3">{new Date(c.createdAt).toLocaleDateString()}</td>
                        <td className="p-3 text-right">
                          <button
                            onClick={() => loadFinancials(c.id, c.name)}
                            className="text-amber-500 hover:text-amber-400 font-bold tracking-wider text-[10px] uppercase">
                            Load_Model
                          </button>
                        </td>
                      </tr>
                    ))}
                    {companies.length === 0 && (
                      <tr>
                        <td colSpan={5} className="p-8 text-center text-[#555] uppercase tracking-widest text-[10px]">
                          NO_RECORDS_FOUND
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

// ── SUB-COMPONENTS ──

function InputField({ label, value, onChange }: { label: string, value: number, onChange: (e: React.ChangeEvent<HTMLInputElement>) => void }) {
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

function MetricRow({ label, value, subLabel, state }: {
  label: string;
  value: string | number;
  subLabel?: string;
  state: 'good' | 'warn' | 'bad' | 'neutral'
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
        <span className="text-[11px] font-bold text-[#888] tracking-widest">{label}</span>
        {subLabel && <span className="text-[9px] text-[#444] uppercase tracking-widest">{subLabel}</span>}
      </div>
      <span className={cn("text-xs font-bold font-mono tracking-widest", stateColors[state])}>{value}</span>
    </div>
  );
}
