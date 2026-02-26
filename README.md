# TokenOriginate — Credit Risk Scoring & Debt Structuring Platform

> Herramienta interna de due diligence crediticio para originación de deuda PYME. Scoring cuantitativo, análisis de colateral y estructuración de covenants.

---

## Qué es

TokenOriginate es la plataforma analítica de una boutique de originación de deuda para PYMEs industriales y logísticas (€500K–€5M). Automatiza el análisis crediticio que tradicionalmente se hace en Excel, generando un scoring cuantificado, recomendaciones de estructuración y pricing indicativo.

El modelo cubre las **fases 1–3 de la cadena de valor**: prospección → due diligence financiero → estructuración de la deuda. El output es un informe de riesgo completo listo para presentar a una plataforma tokenizadora o a un fondo de deuda privada.

---

## Modelo de Scoring

### Métricas y pesos

| Métrica | Peso | Gating | Descripción |
|---------|------|--------|-------------|
| **DSCR** | 25% | ✅ | Debt Service Coverage Ratio. CFADS / Servicio deuda (principal + intereses). Gate: < 1.0x = rechazo automático |
| **DFN / EBITDA** | 20% | ✅ | Apalancamiento neto. Gate: > 4.0x = rechazo automático |
| **LLCR** | 15% | — | Loan Life Coverage Ratio. PV de CFADS sobre vida del préstamo / saldo |
| **Margen EBITDA** | 10% | — | EBITDA / Ventas × 100. Mide eficiencia operativa |
| **LTV Colateral** | 10% | — | Loan-to-Value. Importe / Valor colateral bruto |
| **FFO / DFN** | 10% | — | Funds From Operations / Deuda Financiera Neta |
| **Días de Cobro** | 5% | — | DSO = Clientes / Ventas × 365. Presión de circulante |
| **Cualitativos** | 5% | — | Equipo directivo, diversificación clientes, antigüedad, ciclicidad sector (1.25% cada uno, escala 1–5) |

### Fórmulas clave

- **CFADS** = EBITDA − Impuestos pagados − Capex mantenimiento
- **Servicio deuda** = Gastos financieros + (DFN / Vida media deuda)
- **DSCR** = CFADS / Servicio deuda
- **LLCR** = (CFADS × Factor PV anualidad) / Saldo préstamo
- **FFO** = EBITDA − Gastos financieros − Impuestos pagados

### Scoring lineal por tramos

Cada métrica se puntúa de 0 a 100 mediante interpolación lineal entre breakpoints calibrados a estándares de mercado europeo para deuda senior.

Ejemplo DSCR: `< 1.0x → 0–19 pts` | `1.0–1.2x → 20–49 pts` | `1.2–1.5x → 50–79 pts` | `> 1.5x → 80–100 pts`

**Score total** = Σ (puntuación métrica × peso) → Escala 0–100.

### Gating metrics

Métricas de exclusión que provocan rechazo automático independientemente del score agregado:
- DSCR < 1.0x (el CFADS no cubre servicio de deuda)
- DFN/EBITDA > 4.0x (apalancamiento fuera de umbral de mercado para senior)

---

## Módulos de análisis

### 1. Scoring (Pestaña principal)

- 6 KPIs ejecutivos: EBITDA, Margen, DFN, Apalancamiento, DSCR, LLCR
- **Recomendación automática**: `OPERAR` (≥70) / `ANALIZAR MÁS` (40–70) / `RECHAZAR` (<40)
- Texto de mejora específico: identifica las 3 métricas más débiles y cuantifica el gap al siguiente threshold (e.g. "DSCR actual 1.05x → necesita subir a 1.2x (↑15%)")
- Top 3 factores de riesgo por pérdida de contribución potencial
- Gauge global + radar de perfil + bar chart de contribución por métrica
- 11 cards individuales con valor, score, peso y semáforo

### 2. Nueva Deuda

- Capacidad máxima de endeudamiento a DSCR = 1.25x
- Análisis de operación concreta: DSCR combinado (existente + nueva), headroom, margen vs. capacidad
- LTV check contra límites por tipo de colateral (inmueble 60%, maquinaria 40%, cuentas a cobrar 70%, stock 50%)

### 3. Comparables sectoriales

Benchmark contra percentiles de mercado (p25, mediana, p75) por sector:

| Sector | Disponible |
|--------|-----------|
| Metalurgia / Fab. metal | ✅ |
| Química / Plásticos | ✅ |
| Alimentación / Bebidas | ✅ |
| Automoción / Componentes | ✅ |
| Papel / Cartón | ✅ |
| Construcción industrial | ✅ |
| Energía / Renovables | ✅ |
| Logística / Transporte | ✅ |

Posicionamiento automático: Top 25%, 25–50%, 50–75%, Bottom 25%.

### 4. Covenants & Pricing

- **Covenants sugeridos** calculados dinámicamente: DFN/EBITDA máximo (ratio × 1.35 + buffer), DSCR mínimo (ratio × 0.82, piso 1.10x), Capex cap (25% EBITDA), política de dividendos
- **Pricing indicativo** por tramos (Senior A, Senior B, Mezzanine) en bps sobre Euribor
- **Condiciones extra** automáticas según perfil: amortización acelerada si DSCR < 1.5x, desinversión forzada si apalancamiento > 3.0x, plan de circulante si DSO > 90d, CFO independiente si equipo < 50 pts

### 5. Colateral — Análisis de garantías

Inventario dinámico de activos con valoración ajustada:

| Tipo activo | Haircut | Tiempo ejecución |
|-------------|---------|-----------------|
| Nave industrial / Inmueble | 40% | 24–48 meses |
| Maquinaria | 60% | 6–12 meses |
| Stock / Inventario | 50% | 1–3 meses |
| Cuentas a cobrar | 30% | 3–6 meses |

**KPIs derivados**: LTV, Recovery Rate (PV descontado al 8%), LGD, EAD, PD estimada (basada en score), Pérdida Esperada, RWA estimado.

**Tabla de prioridad de ejecución**: activos ordenados por velocidad de liquidación, con cobertura acumulada vs. deuda.

### 6. Detalle

Tabla completa de scoring con las 11 métricas: valor, puntuación (barra 0–100), peso, contribución, semáforo (VERDE / AMARILLO / NARANJA / ROJO). Footer con score total.

---

## Casos de ejemplo precargados

| Nombre | Sector | Perfil | Score aprox. |
|--------|--------|--------|-------------|
| **Tubacex** | Metalurgia | Investment grade, 767.5M€ ventas, DSCR ~1.05x | ~56 (Amarillo) |
| **Empresa AA** | Química | Sólida, 200M€ ventas, bajo apalancamiento | ~85 (Verde) |
| **Empresa C** | Construcción | Distressed, DSCR 0.11x, DFN/EBITDA 12.2x | ~15 (Rojo) |

Los datos de Tubacex incluyen inventario de colateral: naves industriales Amurrio/Llodio (180M€), líneas de producción (95M€), cartera Oil & Gas (120M€).

---

## Datos y persistencia

- **Base de datos local**: SQLite vía Prisma ORM. Permite guardar múltiples empresas con datos financieros por año.
- **Import/Export XLSX**: Carga masiva de datos desde Excel. La plantilla está en el repositorio.
- **PDF**: Export vía `window.print()` con CSS `@media print` que oculta UI y genera informe limpio.

---

## Stack técnico

| Capa | Tecnología |
|------|-----------|
| Frontend | Next.js 16 (App Router), React, TypeScript |
| Gráficos | Recharts (radar, bar, responsive containers) |
| Estilos | Tailwind CSS v4, JetBrains Mono |
| Base de datos | SQLite + Prisma 6 |
| Excel | SheetJS (xlsx) |

---

## Instalación

```bash
git clone https://github.com/luckyx72/scoring-crediticio.git
cd scoring-crediticio
npm install
npx prisma generate
npx prisma db push
npm run dev
```

Abrir `http://localhost:3000`.

---

## Estructura del proyecto

```
src/
├── app/
│   ├── page.tsx              # Dashboard principal, state management, sidebar
│   ├── layout.tsx            # Layout global, fuente JetBrains Mono
│   ├── globals.css           # Tailwind config + print styles
│   └── api/                  # REST endpoints (companies, financials, import, export)
├── components/
│   ├── MainContent.tsx       # 6 tabs: Scoring, NuevaDeuda, Comparables, Covenants, Colateral, Detalle
│   └── ui.tsx                # MetricRow, InputField, cn()
├── lib/
│   ├── scoring.ts            # Motor de scoring: ratios, scores, gating, benchmarks, colateral config
│   ├── types.ts              # Interfaces (Financials, ColRow, Company), ejemplos precargados
│   ├── prisma.ts             # Singleton Prisma client
│   └── xlsx.ts               # Import/export Excel
prisma/
└── schema.prisma             # Modelo de datos: Company, FinancialData
```

---

## Equipo

| Perfil | Rol |
|--------|-----|
| **Javier** (ADE + Business Analytics) | Due diligence crediticio, estructuración, modelo financiero |
| **Alejandro** (Marketing — Boston) | Posicionamiento, leads B2B, approach comercial |
| **Carlos** (Ingeniería — UC3M) | Análisis de datos, automatización scoring, documentación técnica |

---

## Disclaimer

Documentación interna de trabajo. Las cifras son estimaciones orientativas sujetas a validación de mercado. No constituye asesoramiento financiero.

*v0.2 · Febrero 2026*
