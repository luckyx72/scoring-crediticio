/**
 * localStorage-based persistence layer.
 * Replaces SQLite/Prisma for static deployment (GitHub Pages).
 */
import { Financials, ColRow, Company } from './types';

const STORAGE_KEYS = {
    companies: 'tok_companies',
    financials: 'tok_financials', // keyed by companyId
    colRows: 'tok_colrows',       // keyed by companyId
};

function genId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substring(2, 8);
}

// ─── Companies ─────────────────────────────────────────

export function getCompanies(): Company[] {
    if (typeof window === 'undefined') return [];
    try {
        const raw = localStorage.getItem(STORAGE_KEYS.companies);
        return raw ? JSON.parse(raw) : [];
    } catch { return []; }
}

export function saveCompany(name: string, sector: string): Company {
    const companies = getCompanies();
    const existing = companies.find(c => c.name === name);
    if (existing) {
        existing.sector = sector;
        localStorage.setItem(STORAGE_KEYS.companies, JSON.stringify(companies));
        return existing;
    }
    const company: Company = {
        id: genId(),
        name,
        sector,
        createdAt: new Date().toISOString(),
    };
    companies.push(company);
    localStorage.setItem(STORAGE_KEYS.companies, JSON.stringify(companies));
    return company;
}

export function deleteCompany(id: string): void {
    const companies = getCompanies().filter(c => c.id !== id);
    localStorage.setItem(STORAGE_KEYS.companies, JSON.stringify(companies));
    // Also remove associated financials and colrows
    localStorage.removeItem(`${STORAGE_KEYS.financials}_${id}`);
    localStorage.removeItem(`${STORAGE_KEYS.colRows}_${id}`);
}

// ─── Financials ────────────────────────────────────────

export function getFinancials(companyId: string): Financials | null {
    if (typeof window === 'undefined') return null;
    try {
        const raw = localStorage.getItem(`${STORAGE_KEYS.financials}_${companyId}`);
        return raw ? JSON.parse(raw) : null;
    } catch { return null; }
}

export function saveFinancials(companyId: string, data: Financials): void {
    localStorage.setItem(`${STORAGE_KEYS.financials}_${companyId}`, JSON.stringify(data));
}

// ─── ColRows ───────────────────────────────────────────

export function getColRows(companyId: string): ColRow[] {
    if (typeof window === 'undefined') return [];
    try {
        const raw = localStorage.getItem(`${STORAGE_KEYS.colRows}_${companyId}`);
        return raw ? JSON.parse(raw) : [];
    } catch { return []; }
}

export function saveColRows(companyId: string, rows: ColRow[]): void {
    localStorage.setItem(`${STORAGE_KEYS.colRows}_${companyId}`, JSON.stringify(rows));
}

// ─── Bulk export/import for XLSX ───────────────────────

export interface StorageSnapshot {
    companies: Company[];
    financials: Record<string, Financials>;
    colRows: Record<string, ColRow[]>;
}

export function exportAll(): StorageSnapshot {
    const companies = getCompanies();
    const financials: Record<string, Financials> = {};
    const colRows: Record<string, ColRow[]> = {};
    for (const c of companies) {
        const f = getFinancials(c.id);
        if (f) financials[c.id] = f;
        const cr = getColRows(c.id);
        if (cr.length > 0) colRows[c.id] = cr;
    }
    return { companies, financials, colRows };
}

export function importAll(snapshot: StorageSnapshot): void {
    localStorage.setItem(STORAGE_KEYS.companies, JSON.stringify(snapshot.companies));
    for (const [id, data] of Object.entries(snapshot.financials)) {
        saveFinancials(id, data);
    }
    for (const [id, rows] of Object.entries(snapshot.colRows)) {
        saveColRows(id, rows);
    }
}
