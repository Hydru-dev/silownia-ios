import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  BioData,
  CustomExercise,
  Goals,
  JournalState,
  MealEntry,
  Recipe,
  SleepEntry,
  StepGoalConfig,
  SuppItem,
  WeightEntry,
  WorkoutSetEntry,
  defaultGoals,
  defaultJournalState,
} from './JournalModels';

const STORAGE_KEY = 'dziennik-v1';

export class JournalRepository {
  async loadState(): Promise<JournalState> {
    try {
      const jsonStr = await AsyncStorage.getItem(STORAGE_KEY);
      if (!jsonStr) return { ...defaultJournalState };
      const json = JSON.parse(jsonStr);

      const goalsObj = json.goals;
      const goals: Goals = goalsObj
        ? {
            k: typeof goalsObj.k === 'number' ? goalsObj.k : 2200,
            p: typeof goalsObj.p === 'number' ? goalsObj.p : 150,
          }
        : { ...defaultGoals };

      const meals: MealEntry[] = Array.isArray(json.meals)
        ? json.meals.map((m: any) => ({
            id: typeof m.id === 'number' ? m.id : Date.now(),
            d: String(m.d ?? ''),
            t: m.t ? String(m.t) : null,
            n: String(m.n ?? ''),
            k: Number(m.k ?? 0),
            p: Number(m.p ?? 0),
            c: Number(m.c ?? 0),
            f: Number(m.f ?? 0),
          }))
        : [];

      const sets: WorkoutSetEntry[] = Array.isArray(json.sets)
        ? json.sets.map((s: any) => ({
            id: typeof s.id === 'number' ? s.id : Date.now(),
            d: String(s.d ?? ''),
            e: String(s.e ?? ''),
            kg: Number(s.kg ?? 0),
            r: Math.round(Number(s.r ?? 0)),
            s: Math.round(Number(s.s ?? 1)),
          }))
        : [];

      const weights: WeightEntry[] = Array.isArray(json.weights)
        ? json.weights.map((w: any) => ({
            d: String(w.d ?? ''),
            kg: Number(w.kg ?? 0),
          }))
        : [];

      const bio: BioData | null = json.bio
        ? {
            w: Number(json.bio.w ?? 0),
            h: Number(json.bio.h ?? 0),
            a: Math.round(Number(json.bio.a ?? 0)),
            x: String(json.bio.x ?? 'm'),
            v: String(json.bio.v ?? '1.55'),
            g: String(json.bio.g ?? 'utr'),
          }
        : null;

      const supps: SuppItem[] = Array.isArray(json.supps)
        ? json.supps.map((s: any) => ({
            id: typeof s.id === 'number' ? s.id : Date.now(),
            n: String(s.n ?? ''),
            dose: String(s.dose ?? ''),
          }))
        : [];

      const sl: Record<string, number[]> = {};
      if (json.sl && typeof json.sl === 'object') {
        Object.keys(json.sl).forEach((k) => {
          const arr = json.sl[k];
          if (Array.isArray(arr)) {
            sl[k] = arr.map((id: any) => Number(id));
          }
        });
      }

      const sleep: SleepEntry[] = Array.isArray(json.sleep)
        ? json.sleep.map((se: any) => ({
            d: String(se.d ?? ''),
            b: String(se.b ?? '23:00'),
            w: String(se.w ?? '07:00'),
            q: typeof se.q === 'number' ? se.q : 3,
            dp: se.dp != null ? Number(se.dp) : null,
            lt: se.lt != null ? Number(se.lt) : null,
          }))
        : [];

      const sg = json.sg != null ? Number(json.sg) : 8.0;

      const myrec: Recipe[] = Array.isArray(json.myrec)
        ? json.myrec.map((r: any) => ({
            id: r.id != null ? Number(r.id) : null,
            cat: r.cat ? String(r.cat) : null,
            n: String(r.n ?? ''),
            k: Math.round(Number(r.k ?? 0)),
            p: Math.round(Number(r.p ?? 0)),
            c: Math.round(Number(r.c ?? 0)),
            f: Math.round(Number(r.f ?? 0)),
            i: String(r.i ?? ''),
            s: String(r.s ?? ''),
          }))
        : [];

      const myex: CustomExercise[] = Array.isArray(json.myex)
        ? json.myex.map((e: any) => ({
            id: typeof e.id === 'number' ? e.id : Date.now(),
            n: String(e.n ?? ''),
            sr: String(e.sr ?? ''),
            day: String(e.day ?? ''),
          }))
        : [];

      const steps: Record<string, number> = {};
      if (json.steps && typeof json.steps === 'object') {
        Object.keys(json.steps).forEach((k) => {
          steps[k] = Math.round(Number(json.steps[k] ?? 0));
        });
      }

      const stg: StepGoalConfig | null = json.stg
        ? {
            v: Math.round(Number(json.stg.v ?? 8000)),
            g: json.stg.g ? String(json.stg.g) : null,
          }
        : null;

      const water: Record<string, number> = {};
      if (json.water && typeof json.water === 'object') {
        Object.keys(json.water).forEach((k) => {
          water[k] = Math.round(Number(json.water[k] ?? 0));
        });
      }

      const wg: number | null = json.wg != null ? Math.round(Number(json.wg)) : null;

      return {
        goals,
        meals,
        sets,
        weights,
        bio,
        supps,
        sl,
        sleep,
        sg,
        myrec,
        myex,
        steps,
        stg,
        water,
        wg,
      };
    } catch {
      return { ...defaultJournalState };
    }
  }

  async saveState(state: JournalState): Promise<void> {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      // Ignore persistence errors
    }
  }
}

export const journalRepository = new JournalRepository();
