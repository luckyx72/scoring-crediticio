export const PESOS = {
    dscr: { peso: 25.0, nombre: 'DSCR', gating: true },
    deuda_ebitda: { peso: 20.0, nombre: 'DFN / EBITDA', gating: true },
    llcr: { peso: 15.0, nombre: 'LLCR', gating: false },
    ebitda_margin: { peso: 10.0, nombre: 'Margen EBITDA', gating: false },
    ltv: { peso: 10.0, nombre: 'LTV Colateral', gating: false },
    ffo_dfn: { peso: 10.0, nombre: 'FFO / DFN', gating: false },
    dias_cobro: { peso: 5.0, nombre: 'Días de Cobro', gating: false },
    equipo: { peso: 1.25, nombre: 'Equipo Directivo', gating: false },
    concentracion: { peso: 1.25, nombre: 'Diversif. Clientes', gating: false },
    antiguedad: { peso: 1.25, nombre: 'Antigüedad Negocio', gating: false },
    ciclicidad: { peso: 1.25, nombre: 'Estabilidad Sector', gating: false },
};

function linScore(v: number, pts: number[][]) {
    if (v <= pts[0][0]) return pts[0][1];
    if (v >= pts[pts.length - 1][0]) return pts[pts.length - 1][1];
    for (let i = 0; i < pts.length - 1; i++) {
        const [v0, p0] = pts[i], [v1, p1] = pts[i + 1];
        if (v >= v0 && v <= v1) return Math.round(p0 + (p1 - p0) * (v - v0) / (v1 - v0));
    }
    return 0;
}

export const LTV_MAX: Record<string, number | null> = { inmueble: 60, maquinaria: 40, cuentas_cobrar: 70, stock: 50, mixto: 55, ninguno: null };

export const SCORE_FNS: Record<string, (v: any) => number> = {
    dscr: v => linScore(v, [[0, 0], [1.0, 19], [1.2, 49], [1.5, 80], [2.5, 100]]),
    deuda_ebitda: v => v < 0 ? 100 : linScore(v, [[0, 100], [2.5, 80], [4.0, 40], [7.0, 0]]),
    llcr: v => linScore(v, [[0, 0], [1.0, 19], [1.2, 49], [1.4, 80], [2.0, 100]]),
    ebitda_margin: v => linScore(v, [[-5, 0], [0, 10], [8, 40], [15, 80], [25, 100]]),
    ltv: v => v === null ? 55 : linScore(v, [[0, 100], [50, 80], [60, 50], [70, 20], [100, 0]]),
    ffo_dfn: v => linScore(v, [[0, 10], [15, 40], [20, 80], [35, 100]]),
    dias_cobro: v => linScore(v, [[0, 100], [45, 80], [90, 40], [180, 0]]),
    equipo: v => ({ 1: 0, 2: 25, 3: 50, 4: 75, 5: 100 }[Math.round(v)] || 0),
    concentracion: v => ({ 1: 0, 2: 25, 3: 50, 4: 75, 5: 100 }[Math.round(v)] || 0),
    antiguedad: v => ({ 1: 0, 2: 25, 3: 50, 4: 75, 5: 100 }[Math.round(v)] || 0),
    ciclicidad: v => ({ 1: 0, 2: 25, 3: 50, 4: 75, 5: 100 }[Math.round(v)] || 0),
};

export const SECT: Record<string, any> = {
    metalurgia: { n: 'Metalurgia / Fab. metal', em: { p25: 7, med: 11, p75: 16 }, dn: { p25: 1.5, med: 2.8, p75: 4.2 }, ds: { p25: 1.0, med: 1.4, p75: 1.9 }, dc: { p25: 45, med: 65, p75: 90 } },
    quimica: { n: 'Química / Plásticos', em: { p25: 9, med: 14, p75: 20 }, dn: { p25: 1.2, med: 2.3, p75: 3.8 }, ds: { p25: 1.1, med: 1.5, p75: 2.1 }, dc: { p25: 40, med: 58, p75: 80 } },
    alimentacion: { n: 'Alimentación / Bebidas', em: { p25: 8, med: 12, p75: 18 }, dn: { p25: 1.0, med: 2.0, p75: 3.5 }, ds: { p25: 1.2, med: 1.6, p75: 2.3 }, dc: { p25: 30, med: 45, p75: 65 } },
    automocion: { n: 'Automoción / Componentes', em: { p25: 6, med: 10, p75: 15 }, dn: { p25: 1.8, med: 3.0, p75: 4.5 }, ds: { p25: 0.9, med: 1.3, p75: 1.8 }, dc: { p25: 50, med: 72, p75: 100 } },
    papel_carton: { n: 'Papel / Cartón', em: { p25: 10, med: 15, p75: 21 }, dn: { p25: 1.3, med: 2.5, p75: 4.0 }, ds: { p25: 1.1, med: 1.5, p75: 2.0 }, dc: { p25: 35, med: 55, p75: 75 } },
    construccion: { n: 'Construcción industrial', em: { p25: 5, med: 9, p75: 14 }, dn: { p25: 2.0, med: 3.2, p75: 5.0 }, ds: { p25: 0.8, med: 1.2, p75: 1.7 }, dc: { p25: 60, med: 85, p75: 120 } },
    energia: { n: 'Energía / Renovables', em: { p25: 30, med: 45, p75: 60 }, dn: { p25: 3.0, med: 4.5, p75: 6.5 }, ds: { p25: 1.3, med: 1.7, p75: 2.2 }, dc: { p25: 25, med: 40, p75: 60 } },
    logistica: { n: 'Logística / Transporte', em: { p25: 6, med: 10, p75: 15 }, dn: { p25: 1.5, med: 2.7, p75: 4.2 }, ds: { p25: 1.0, med: 1.4, p75: 1.9 }, dc: { p25: 30, med: 50, p75: 70 } },
};

export function calcRatios(d: any) {
    const ebitda = d.ebitda;
    const ventas = Math.max(d.ventas, 0.001);
    const dfn = d.deuda_bruta - d.caja;
    const ebitda_margin = ebitda / ventas * 100;
    const deuda_ebitda = ebitda > 0 ? dfn / ebitda : (dfn <= 0 ? -1 : 99);
    const dias_cobro = d.clientes / ventas * 365;
    const dias_pago = d.proveedores / ventas * 365;
    const liquidez = d.pasivo_corriente > 0 ? d.activo_corriente / d.pasivo_corriente : 99;

    const cfads = ebitda - d.imp_pagado - (d.capex_mant || 0);

    const vida_media = Math.max(d.vida_media || 5, 0.5);
    const amort = Math.max(dfn, 0) / vida_media;
    const debt_svc = d.gastos_fin + amort;
    const dscr = debt_svc > 0 ? cfads / debt_svc : (cfads > 0 ? 99 : 0);

    const loanBase = d.importe > 0 ? d.importe : Math.max(dfn, 0.001);
    const rate = Math.max((d.tipo_int || 6) / 100, 0.0001);
    const n_loan = d.importe > 0 ? Math.max(d.plazo || 5, 1) : Math.max(vida_media, 1);
    const pvFactor = (1 - Math.pow(1 + rate, -n_loan)) / rate;
    const llcr = loanBase > 0 ? (cfads * pvFactor) / loanBase : 99;

    let ltv = null;
    if (d.colateral > 0) {
        ltv = (loanBase / d.colateral) * 100;
    }

    const ffo = ebitda - d.gastos_fin - d.imp_pagado;
    const ffo_dfn = dfn > 0 ? (ffo / dfn * 100) : (ffo > 0 ? 100 : 10);

    return {
        ebitda, ventas, dfn, ebitda_margin, deuda_ebitda,
        dias_cobro, dias_pago, liquidez, cfads, debt_svc,
        dscr, llcr, ltv, ffo, ffo_dfn, amort, vida_media, loanBase, n_loan, rate,
        tipo_col: d.tipo_col, colateral: d.colateral,
        importe: d.importe, plazo: d.plazo, tipo_int: d.tipo_int,
        gastos_fin: d.gastos_fin
    };
}

export function calcScores(r: any) {
    const res: any = {};
    for (const [key, cfg] of Object.entries(PESOS)) {
        const val = r[key] !== undefined ? r[key] : null;
        const sc = SCORE_FNS[key](val);
        const contrib = sc * cfg.peso / 100;
        const color = sc >= 80 ? 'verde' : sc >= 50 ? 'amarillo' : sc >= 20 ? 'naranja' : 'rojo';
        res[key] = {
            valor: val, puntuacion: sc, peso: cfg.peso, contrib, color,
            nombre: cfg.nombre, gating: cfg.gating
        };
    }
    return res;
}

export function totalScore(res: any) {
    return Object.values(res).reduce((s: any, v: any) => s + v.contrib, 0);
}

export function checkGating(res: any) {
    const dscrFails = res.dscr.puntuacion < 20;
    const dfnFails = res.deuda_ebitda.puntuacion < 40;
    if (dscrFails && dfnFails) return 'DSCR < 1.0x y DFN/EBITDA > 4.0x simultáneamente: doble incumplimiento de métricas de exclusión. Operación rechazada automáticamente independientemente del score total.';
    if (dscrFails) return 'DSCR < 1.0x: el CFADS no cubre el servicio de la deuda. Umbral mínimo absoluto incumplido. Operación rechazada automáticamente.';
    if (dfnFails) return 'DFN/EBITDA > 4.0x: nivel de apalancamiento fuera del umbral de mercado para deuda senior. Operación rechazada automáticamente.';
    return null;
}
