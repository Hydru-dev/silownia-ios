import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { Vibration } from 'react-native';
import { Accelerometer, Pedometer } from 'expo-sensors';
import {
  DateUtils,
  JournalState,
  WorkoutSetEntry,
  defaultJournalState,
} from '../data/JournalModels';
import { JournalData } from '../data/JournalData';
import { journalRepository } from '../data/JournalRepository';

export enum AppTab {
  DIET = 'DIET',
  RECIPES = 'RECIPES',
  TRAINING = 'TRAINING',
  HEALTH = 'HEALTH',
  PROGRESS = 'PROGRESS',
  PROFILE = 'PROFILE',
}

export const AppTabLabels: Record<AppTab, string> = {
  [AppTab.DIET]: 'Dieta',
  [AppTab.RECIPES]: 'Przepisy',
  [AppTab.TRAINING]: 'Trening',
  [AppTab.HEALTH]: 'Zdrowie',
  [AppTab.PROGRESS]: 'Postępy',
  [AppTab.PROFILE]: 'Profil',
};

export const AppTabEntries: AppTab[] = [
  AppTab.DIET,
  AppTab.RECIPES,
  AppTab.TRAINING,
  AppTab.HEALTH,
  AppTab.PROGRESS,
  AppTab.PROFILE,
];

export interface JournalViewModelType {
  state: JournalState;
  today: string;
  cur: string;
  mt: string;
  pe: string;
  selectedTab: AppTab;
  restTimerSeconds: number;
  restTimerTotal: number;
  selectTab: (tab: AppTab) => void;
  setCur: (d: string) => void;
  shift: (days: number) => void;
  setMt: (type: string) => void;
  setPe: (exercise: string) => void;
  updateState: (updater: (prev: JournalState) => JournalState) => void;
  getExerciseNames: () => string[];
  lastOf: (exerciseName: string) => WorkoutSetEntry | null;
  stGoal: () => number;
  stDay: (d: string) => number;
  waterDefaultGoal: () => number;
  waterGoal: () => number;
  waterDay: (d: string) => number;
  startRestTimer: (seconds?: number) => void;
  addRestTime: (deltaSeconds: number) => void;
  stopRestTimer: () => void;
  startStepSensor: () => void;
}

const JournalViewModelContext = createContext<JournalViewModelType | null>(null);

export const JournalViewModelProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [state, setState] = useState<JournalState>(defaultJournalState);
  const today = useMemo(() => DateUtils.ymd(), []);
  const [cur, setCur] = useState<string>(today);
  const [mt, setMt] = useState<string>(() => JournalData.defMt());
  const [pe, setPe] = useState<string>('');
  const [selectedTab, setSelectedTab] = useState<AppTab>(AppTab.DIET);
  const [restTimerSeconds, setRestTimerSeconds] = useState<number>(0);
  const [restTimerTotal, setRestTimerTotal] = useState<number>(120);

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const pedometerSubRef = useRef<{ remove: () => void } | null>(null);
  const accelSubRef = useRef<{ remove: () => void } | null>(null);
  const lastPedometerStepsRef = useRef<number | null>(null);
  const stFilterRef = useRef<number>(9.81);
  const stUpRef = useRef<boolean>(false);
  const stLastRef = useRef<number>(0);

  const updateState = useCallback(
    (updater: (prev: JournalState) => JournalState) => {
      setState((prev) => {
        const updated = updater(prev);
        journalRepository.saveState(updated);
        return updated;
      });
    },
    []
  );

  const notifyRestFinished = useCallback(() => {
    try {
      Vibration.vibrate(500);
    } catch {
      // Ignore vibration errors
    }
  }, []);

  const stopRestTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    setRestTimerSeconds(0);
  }, []);

  const startRestTimer = useCallback(
    (seconds: number = 120) => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      setRestTimerTotal(seconds);
      setRestTimerSeconds(seconds);

      timerRef.current = setInterval(() => {
        setRestTimerSeconds((prev) => {
          if (prev <= 1) {
            if (timerRef.current) {
              clearInterval(timerRef.current);
              timerRef.current = null;
            }
            notifyRestFinished();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    },
    [notifyRestFinished]
  );

  const addRestTime = useCallback(
    (deltaSeconds: number) => {
      setRestTimerSeconds((prev) => {
        const next = Math.max(0, prev + deltaSeconds);
        if (next === 0) {
          if (timerRef.current) {
            clearInterval(timerRef.current);
            timerRef.current = null;
          }
          return 0;
        }
        setRestTimerTotal((tot) => (next > tot ? next : tot));
        return next;
      });
    },
    []
  );

  const startStepSensor = useCallback(async () => {
    try {
      pedometerSubRef.current?.remove();
      accelSubRef.current?.remove();
      pedometerSubRef.current = null;
      accelSubRef.current = null;

      const isPedometerAvailable = await Pedometer.isAvailableAsync().catch(
        () => false
      );
      if (isPedometerAvailable) {
        const perm = await Pedometer.requestPermissionsAsync().catch(() => null);
        if (!perm || perm.granted) {
          lastPedometerStepsRef.current = null;
          pedometerSubRef.current = Pedometer.watchStepCount((result) => {
            const total = result.steps;
            const prevTotal = lastPedometerStepsRef.current;
            lastPedometerStepsRef.current = total;
            const delta = prevTotal != null ? total - prevTotal : total;
            if (delta >= 1 && delta <= 500) {
              const currentDay = DateUtils.ymd();
              updateState((prev) => {
                const prevSteps = prev.steps[currentDay] ?? 0;
                return {
                  ...prev,
                  steps: {
                    ...prev.steps,
                    [currentDay]: prevSteps + delta,
                  },
                };
              });
            }
          });
          return;
        }
      }

      // Fallback to accelerometer if pedometer is unavailable
      const isAccelAvailable = await Accelerometer.isAvailableAsync().catch(
        () => false
      );
      if (isAccelAvailable) {
        stFilterRef.current = 9.81;
        stUpRef.current = false;
        stLastRef.current = Date.now();
        Accelerometer.setUpdateInterval(60);
        accelSubRef.current = Accelerometer.addListener(({ x, y, z }) => {
          const ax = x * 9.81;
          const ay = y * 9.81;
          const az = z * 9.81;
          const m = Math.sqrt(ax * ax + ay * ay + az * az);
          const t = Date.now();
          stFilterRef.current = stFilterRef.current * 0.6 + m * 0.4;
          const d = stFilterRef.current - 9.81;

          if (d > 0.7 && !stUpRef.current && t - stLastRef.current > 320) {
            stUpRef.current = true;
            stLastRef.current = t;
            const currentDay = DateUtils.ymd();
            updateState((prev) => {
              const prevSteps = prev.steps[currentDay] ?? 0;
              return {
                ...prev,
                steps: {
                  ...prev.steps,
                  [currentDay]: prevSteps + 1,
                },
              };
            });
          } else if (d < 0.15) {
            stUpRef.current = false;
          }
        });
      }
    } catch {
      // Ignore sensor setup errors on unsupported environments
    }
  }, [updateState]);

  useEffect(() => {
    let mounted = true;
    journalRepository.loadState().then((loaded) => {
      if (mounted) {
        setState(loaded);
      }
    });
    startStepSensor();

    return () => {
      mounted = false;
      if (timerRef.current) clearInterval(timerRef.current);
      pedometerSubRef.current?.remove();
      accelSubRef.current?.remove();
    };
  }, [startStepSensor]);

  const selectTab = useCallback((tab: AppTab) => {
    setSelectedTab(tab);
  }, []);

  const shift = useCallback((days: number) => {
    setCur((prev) => DateUtils.shiftDays(prev, days));
  }, []);

  const getExerciseNames = useCallback((): string[] => {
    const seen = new Set<string>();
    state.sets.forEach((s) => seen.add(s.e));
    JournalData.BASE_EXERCISES.forEach((e) => seen.add(e));
    state.myex.forEach((e) => seen.add(e.n));
    Object.values(JournalData.EXERCISE_LIBRARY).forEach((list) => {
      list.forEach((item) => seen.add(item));
    });
    return Array.from(seen).sort((a, b) => a.localeCompare(b, 'pl'));
  }, [state.sets, state.myex]);

  const lastOf = useCallback(
    (exerciseName: string): WorkoutSetEntry | null => {
      const target = exerciseName.trim().toLowerCase();
      if (!target) return null;
      const filtered = state.sets.filter(
        (s) => s.e.toLowerCase() === target && s.d < cur
      );
      if (filtered.length === 0) return null;
      filtered.sort((a, b) => {
        if (a.d !== b.d) return b.d.localeCompare(a.d);
        return b.id - a.id;
      });
      return filtered[0];
    },
    [state.sets, cur]
  );

  const stGoal = useCallback((): number => {
    const stg = state.stg;
    if (stg && stg.v > 0) return stg.v;
    const g = state.bio?.g ?? 'utr';
    return JournalData.STEP_GOALS[g]?.target ?? 8000;
  }, [state.stg, state.bio]);

  const stDay = useCallback(
    (d: string): number => {
      return state.steps[d] ?? 0;
    },
    [state.steps]
  );

  const waterDefaultGoal = useCallback((): number => {
    const w = state.bio?.w;
    if (w != null && w > 0) {
      const raw = Math.floor((w * 35.0) / 50.0) * 50;
      return Math.min(6000, Math.max(1500, raw));
    }
    return 2500;
  }, [state.bio]);

  const waterGoal = useCallback((): number => {
    const wg = state.wg;
    if (wg != null && wg > 0) return wg;
    return waterDefaultGoal();
  }, [state.wg, waterDefaultGoal]);

  const waterDay = useCallback(
    (d: string): number => {
      return state.water[d] ?? 0;
    },
    [state.water]
  );

  const value = useMemo<JournalViewModelType>(
    () => ({
      state,
      today,
      cur,
      mt,
      pe,
      selectedTab,
      restTimerSeconds,
      restTimerTotal,
      selectTab,
      setCur,
      shift,
      setMt,
      setPe,
      updateState,
      getExerciseNames,
      lastOf,
      stGoal,
      stDay,
      waterDefaultGoal,
      waterGoal,
      waterDay,
      startRestTimer,
      addRestTime,
      stopRestTimer,
      startStepSensor,
    }),
    [
      state,
      today,
      cur,
      mt,
      pe,
      selectedTab,
      restTimerSeconds,
      restTimerTotal,
      selectTab,
      shift,
      updateState,
      getExerciseNames,
      lastOf,
      stGoal,
      stDay,
      waterDefaultGoal,
      waterGoal,
      waterDay,
      startRestTimer,
      addRestTime,
      stopRestTimer,
      startStepSensor,
    ]
  );

  return (
    <JournalViewModelContext.Provider value={value}>
      {children}
    </JournalViewModelContext.Provider>
  );
};

export function useJournalViewModel(): JournalViewModelType {
  const ctx = useContext(JournalViewModelContext);
  if (!ctx) {
    throw new Error(
      'useJournalViewModel must be used within a JournalViewModelProvider'
    );
  }
  return ctx;
}
