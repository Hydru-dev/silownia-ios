export interface Recipe {
  id?: number | null;
  cat?: string | null;
  n: string;
  k: number;
  p: number;
  c: number;
  f: number;
  i: string;
  s: string;
}

export interface PlanExercise {
  name: string;
  setsReps: string;
  id?: number | null;
}

export interface PlanDay {
  dayName: string;
  exercises: PlanExercise[];
}

export interface MealEntry {
  id: number;
  d: string;
  t?: string | null;
  n: string;
  k: number;
  p: number;
  c: number;
  f: number;
}

export interface WorkoutSetEntry {
  id: number;
  d: string;
  e: string;
  kg: number;
  r: number;
  s: number;
}

export interface WeightEntry {
  d: string;
  kg: number;
}

export interface BioData {
  w: number;
  h: number;
  a: number;
  x: 'm' | 'k' | string;
  v: string;
  g: 'red' | 'utr' | 'masa' | string;
}

export interface SuppItem {
  id: number;
  n: string;
  dose: string;
}

export interface SleepEntry {
  d: string;
  b: string;
  w: string;
  q: number;
  dp?: number | null;
  lt?: number | null;
}

export interface CustomExercise {
  id: number;
  n: string;
  sr: string;
  day: string;
}

export interface StepGoalConfig {
  v: number;
  g?: string | null;
}

export interface Goals {
  k: number;
  p: number;
}

export interface JournalState {
  goals: Goals;
  meals: MealEntry[];
  sets: WorkoutSetEntry[];
  weights: WeightEntry[];
  bio: BioData | null;
  supps: SuppItem[];
  sl: Record<string, number[]>;
  sleep: SleepEntry[];
  sg: number | null;
  myrec: Recipe[];
  myex: CustomExercise[];
  steps: Record<string, number>;
  stg: StepGoalConfig | null;
  water: Record<string, number>;
  wg: number | null;
}

export const defaultGoals: Goals = {
  k: 2200,
  p: 150,
};

export const defaultJournalState: JournalState = {
  goals: { ...defaultGoals },
  meals: [],
  sets: [],
  weights: [],
  bio: null,
  supps: [],
  sl: {},
  sleep: [],
  sg: 8.0,
  myrec: [],
  myex: [],
  steps: {},
  stg: null,
  water: {},
  wg: null,
};

const MONTHS_SHORT_PL = [
  'sty', 'lut', 'mar', 'kwi', 'maj', 'cze',
  'lip', 'sie', 'wrz', 'paź', 'lis', 'gru',
];

const MONTHS_LONG_PL = [
  'stycznia', 'lutego', 'marca', 'kwietnia', 'maja', 'czerwca',
  'lipca', 'sierpnia', 'września', 'października', 'listopada', 'grudnia',
];

const WEEKDAYS_PL = [
  'Niedziela', 'Poniedziałek', 'Wtorek', 'Środa',
  'Czwartek', 'Piątek', 'Sobota',
];

function parseYmd(d: string): Date | null {
  const parts = d.split('-');
  if (parts.length !== 3) return null;
  const year = parseInt(parts[0], 10);
  const month = parseInt(parts[1], 10) - 1;
  const day = parseInt(parts[2], 10);
  if (isNaN(year) || isNaN(month) || isNaN(day)) return null;
  return new Date(year, month, day, 12, 0, 0);
}

export const DateUtils = {
  ymd(d: Date = new Date()): string {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  },

  dlabel(d: string): string {
    const date = parseYmd(d);
    if (!date) return d;
    return `${date.getDate()} ${MONTHS_SHORT_PL[date.getMonth()]}`;
  },

  weekday(d: string): string {
    const date = parseYmd(d);
    if (!date) return d;
    return WEEKDAYS_PL[date.getDay()] || d;
  },

  longDate(d: string): string {
    const date = parseYmd(d);
    if (!date) return d;
    return `${date.getDate()} ${MONTHS_LONG_PL[date.getMonth()]} ${date.getFullYear()}`;
  },

  shiftDays(d: string, delta: number): string {
    const date = parseYmd(d) || new Date();
    date.setDate(date.getDate() + delta);
    return DateUtils.ymd(date);
  },
};

export function num(v: string | null | undefined): number {
  if (!v || !v.trim()) return 0.0;
  const parsed = parseFloat(v.replace(',', '.'));
  return isNaN(parsed) ? 0.0 : parsed;
}

export function fmtN(n: number): string {
  const rounded = Math.round(n);
  return rounded.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
}

export function dur(b: string, w: string): number {
  const toMin = (t: string): number => {
    const parts = t.split(':');
    const h = parseInt(parts[0] || '0', 10) || 0;
    const m = parseInt(parts[1] || '0', 10) || 0;
    return h * 60 + m;
  };
  let d = toMin(w) - toMin(b);
  if (d <= 0) d += 1440;
  return d;
}

export function hm(m: number): string {
  const hours = Math.floor(m / 60);
  const mins = m % 60;
  return `${hours} h ${String(mins).padStart(2, '0')} min`;
}

export function calcBioTargets(b: BioData | null | undefined): Goals | null {
  if (!b || b.w <= 0 || b.h <= 0 || b.a <= 0) return null;
  const bmr = 10 * b.w + 6.25 * b.h - 5 * b.a + (b.x === 'k' ? -161 : 5);
  const act = parseFloat(b.v) || 1.55;
  const delta = b.g === 'red' ? -400.0 : b.g === 'masa' ? 300.0 : 0.0;
  const t = bmr * act + delta;
  const k = Math.round(Math.max(t, bmr) / 10) * 10;
  const p = Math.round(2 * b.w);
  return { k, p };
}
