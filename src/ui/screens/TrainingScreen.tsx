import React, { useMemo, useRef, useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { JournalData } from '../../data/JournalData';
import {
  CustomExercise,
  DateUtils,
  PlanDay,
  PlanExercise,
  WorkoutSetEntry,
  fmtN,
  num,
} from '../../data/JournalModels';
import {
  AppInput,
  Bar,
  Card,
  ChipButton,
  DayNav,
  Field,
  GoButton,
  MiniButton,
  ScreenScroll,
  SectionH2,
} from '../components/CommonUi';
import { AppTheme } from '../theme/Theme';
import { JournalViewModelType } from '../../viewmodel/JournalViewModel';

export const TrainingScreen: React.FC<{ viewModel: JournalViewModelType }> = ({
  viewModel,
}) => {
  const colors = AppTheme.useColors();
  const {
    state,
    cur,
    pe,
    today,
    restTimerSeconds: restSeconds,
    restTimerTotal: restTotal,
  } = viewModel;

  const scrollRef = useRef<ScrollView>(null);
  const kgInputRef = useRef<TextInput>(null);

  const [kg, setKg] = useState('');
  const [reps, setReps] = useState('');
  const [setsCount, setSetsCount] = useState('1');
  const [showSuggestions, setShowSuggestions] = useState(false);

  const [plan, setPlan] = useState('FBW 3 dni');
  const [eq, setEq] = useState('');
  const [exg, setExg] = useState('Klatka');
  const [exMax, setExMax] = useState(40);

  const [customExName, setCustomExName] = useState('');
  const [customExSr, setCustomExSr] = useState('');
  const [customExDay, setCustomExDay] = useState('');

  const todaySets = useMemo(
    () => state.sets.filter((s) => s.d === cur),
    [state.sets, cur]
  );

  const lastEntry = useMemo(
    () => (pe.trim().length > 0 ? viewModel.lastOf(pe.trim()) : null),
    [pe, viewModel]
  );

  const exNames = useMemo(() => viewModel.getExerciseNames(), [viewModel]);

  const matchingSuggestions = useMemo(() => {
    const q = pe.trim().toLowerCase();
    if (!q || !showSuggestions) return [];
    return exNames
      .filter((n) => n.toLowerCase().includes(q) && n.toLowerCase() !== q)
      .slice(0, 6);
  }, [pe, showSuggestions, exNames]);

  const handleFillLast = () => {
    if (lastEntry) {
      setKg(lastEntry.kg.toString());
      setReps(lastEntry.r.toString());
      setSetsCount(lastEntry.s.toString());
    }
  };

  const handleAddSet = () => {
    const eName = pe.trim();
    if (eName.length > 0 && kg.trim().length > 0 && reps.trim().length > 0) {
      const newSet: WorkoutSetEntry = {
        id: Date.now(),
        d: cur,
        e: eName,
        kg: num(kg),
        r: Math.round(num(reps)),
        s: Math.max(1, Math.round(num(setsCount))),
      };
      viewModel.updateState((prev) => ({
        ...prev,
        sets: [...prev.sets, newSet],
      }));
      setShowSuggestions(false);
      setKg('');
      setReps('');
      setSetsCount('1');
      viewModel.startRestTimer(120);
    }
  };

  const handleDelSet = (id: number) => {
    viewModel.updateState((prev) => ({
      ...prev,
      sets: prev.sets.filter((s) => s.id !== id),
    }));
  };

  const handleUseExercise = (name: string) => {
    viewModel.setPe(name);
    setShowSuggestions(false);
    scrollRef.current?.scrollTo({ y: 0, animated: true });
    setTimeout(() => kgInputRef.current?.focus(), 200);
  };

  const planKeys = useMemo(
    () => [...Object.keys(JournalData.WORKOUT_PLANS), 'Mój plan'],
    []
  );

  const currentPlanDays: PlanDay[] = useMemo(() => {
    if (plan !== 'Mój plan') {
      return JournalData.WORKOUT_PLANS[plan] ?? [];
    }
    const myExList = state.myex;
    if (myExList.length === 0) {
      return [
        {
          dayName:
            'Nie masz jeszcze własnych ćwiczeń. Dodaj pierwsze poniżej.',
          exercises: [],
        },
      ];
    }
    const groups: Record<string, PlanExercise[]> = {};
    const daysOrder: string[] = [];
    myExList.forEach((x) => {
      const d = x.day.length > 0 ? x.day : 'Mój plan';
      if (!groups[d]) {
        groups[d] = [];
        daysOrder.push(d);
      }
      groups[d].push({ name: x.n, setsReps: x.sr, id: x.id });
    });
    return daysOrder.map((d) => ({ dayName: d, exercises: groups[d] ?? [] }));
  }, [plan, state.myex]);

  const filteredLibrary = useMemo(() => {
    const q = eq.trim().toLowerCase();
    const list: string[] = [];
    Object.entries(JournalData.EXERCISE_LIBRARY).forEach(([k, items]) => {
      if (q.length > 0 || k === exg) {
        items.forEach((n) => {
          if (!q || n.toLowerCase().includes(q)) {
            list.push(n);
          }
        });
      }
    });
    return list;
  }, [eq, exg]);

  const handleAddCustomEx = () => {
    const n = customExName.trim();
    if (n.length > 0) {
      const newEx: CustomExercise = {
        id: Date.now(),
        n,
        sr: customExSr.trim(),
        day: customExDay.trim(),
      };
      viewModel.updateState((prev) => ({
        ...prev,
        myex: [...prev.myex, newEx],
      }));
      setPlan('Mój plan');
      setCustomExName('');
      setCustomExSr('');
      setCustomExDay('');
    }
  };

  const handleDelCustomEx = (id: number) => {
    viewModel.updateState((prev) => ({
      ...prev,
      myex: prev.myex.filter((e) => e.id !== id),
    }));
  };

  const totalVolume = todaySets.reduce(
    (acc, s) => acc + Math.floor(s.kg * s.r * s.s),
    0
  );

  return (
    <ScreenScroll scrollViewRef={scrollRef}>
      <DayNav
        cur={cur}
        today={today}
        onShift={(d) => viewModel.shift(d)}
        onDateSelected={(d) => viewModel.setCur(d)}
      />

      {/* Dodaj serię */}
      <SectionH2 text="Dodaj serię" />
      <Card style={{ marginTop: 0 }}>
        <Field label="Ćwiczenie">
          <AppInput
            value={pe}
            onValueChange={(val) => {
              viewModel.setPe(val);
              setShowSuggestions(true);
            }}
            placeholder="np. Przysiad ze sztangą"
          />
        </Field>

        {matchingSuggestions.length > 0 && (
          <View
            style={[
              styles.suggestionsBox,
              { backgroundColor: colors.bg, borderColor: colors.line },
            ]}
          >
            {matchingSuggestions.map((s, idx) => (
              <React.Fragment key={s}>
                {idx > 0 && (
                  <View
                    style={[styles.divider, { backgroundColor: colors.line }]}
                  />
                )}
                <TouchableOpacity
                  style={styles.suggestionItem}
                  onPress={() => {
                    viewModel.setPe(s);
                    setShowSuggestions(false);
                  }}
                >
                  <Text style={{ fontSize: 15, color: colors.ink }}>{s}</Text>
                </TouchableOpacity>
              </React.Fragment>
            ))}
          </View>
        )}

        {lastEntry != null && (
          <View style={styles.lastEntryRow}>
            <Text style={{ fontSize: 14, color: colors.mut }}>
              {`Ostatnio (${DateUtils.dlabel(lastEntry.d)}): ${
                lastEntry.kg
              } kg × ${lastEntry.r} × ${lastEntry.s} `}
            </Text>
            <TouchableOpacity onPress={handleFillLast}>
              <Text
                style={{
                  fontSize: 14,
                  fontWeight: '600',
                  color: colors.acc,
                  textDecorationLine: 'underline',
                }}
              >
                użyj
              </Text>
            </TouchableOpacity>
          </View>
        )}

        <View style={{ height: 8 }} />
        <View style={styles.rowGap8}>
          <Field label="Ciężar kg" style={{ flex: 1 }}>
            <AppInput
              value={kg}
              onValueChange={setKg}
              keyboardType="decimal-pad"
              inputRef={kgInputRef}
            />
          </Field>
          <Field label="Powtórzenia" style={{ flex: 1 }}>
            <AppInput
              value={reps}
              onValueChange={setReps}
              keyboardType="number-pad"
            />
          </Field>
          <Field label="Serie" style={{ flex: 1 }}>
            <AppInput
              value={setsCount}
              onValueChange={setSetsCount}
              keyboardType="number-pad"
            />
          </Field>
        </View>

        <View style={{ height: 10 }} />
        <GoButton label="Zapisz serię" onClick={handleAddSet} />
      </Card>

      {/* Timer przerwy */}
      <Card>
        <View style={styles.timerHeaderRow}>
          <View style={{ flex: 1 }}>
            <Text
              style={{
                fontSize: 15,
                fontWeight: '600',
                color: colors.ink,
              }}
            >
              Przerwa między seriami
            </Text>
            {restSeconds > 0 ? (
              <Text
                style={{
                  fontSize: 34,
                  fontWeight: '700',
                  color: colors.acc,
                }}
              >
                {`${Math.floor(restSeconds / 60)}:${String(
                  restSeconds % 60
                ).padStart(2, '0')}`}
              </Text>
            ) : (
              <Text style={{ fontSize: 13, color: colors.mut }}>
                Uruchamia się automatycznie po zapisaniu serii
              </Text>
            )}
          </View>
          {restSeconds > 0 && (
            <View style={{ flexDirection: 'row', gap: 8 }}>
              <MiniButton
                label="+30 s"
                onClick={() => viewModel.addRestTime(30)}
              />
              <MiniButton
                label="Stop"
                onClick={() => viewModel.stopRestTimer()}
              />
            </View>
          )}
        </View>

        {restSeconds > 0 && restTotal > 0 && (
          <>
            <View style={{ height: 8 }} />
            <Bar pct={(restSeconds / restTotal) * 100.0} />
          </>
        )}

        <View style={{ height: 10 }} />
        <View style={styles.rowGap8}>
          {(
            [
              [60, '1 min'],
              [90, '90 s'],
              [120, '2 min'],
              [180, '3 min'],
            ] as [number, string][]
          ).map(([sec, label]) => (
            <ChipButton
              key={sec}
              label={label}
              active={restSeconds > 0 && restTotal === sec}
              onClick={() => viewModel.startRestTimer(sec)}
              style={{ flex: 1 }}
            />
          ))}
        </View>
      </Card>

      {/* Dzisiejszy trening */}
      <SectionH2 text="Dzisiejszy trening" />
      <Card style={{ marginTop: 0 }}>
        {todaySets.length === 0 ? (
          <Text style={{ fontSize: 15, color: colors.mut }}>
            Nic jeszcze nie zapisano.
          </Text>
        ) : (
          <>
            {todaySets.map((s, index) => (
              <React.Fragment key={s.id}>
                {index > 0 && (
                  <View
                    style={[styles.divider, { backgroundColor: colors.line }]}
                  />
                )}
                <View style={styles.setRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 16, color: colors.ink }}>
                      {s.e}
                    </Text>
                    <Text style={{ fontSize: 13, color: colors.mut }}>
                      {`${s.kg} kg × ${s.r} powt. × ${s.s} ${
                        s.s === 1 ? 'seria' : 'serie'
                      }`}
                    </Text>
                  </View>
                  <TouchableOpacity
                    style={styles.delCircleBtn}
                    onPress={() => handleDelSet(s.id)}
                  >
                    <Text style={{ fontSize: 22, color: colors.mut }}>×</Text>
                  </TouchableOpacity>
                </View>
              </React.Fragment>
            ))}

            <View style={{ height: 8 }} />
            <Text style={{ fontSize: 14, color: colors.mut }}>
              {`Objętość: ${fmtN(totalVolume)} kg`}
            </Text>
          </>
        )}
      </Card>

      {/* Przykładowe plany */}
      <SectionH2 text="Przykładowe plany" />
      <View style={styles.flowRow}>
        {planKeys.map((k) => (
          <ChipButton
            key={k}
            label={k}
            active={k === plan}
            onClick={() => setPlan(k)}
          />
        ))}
      </View>

      {currentPlanDays.map((day) => (
        <Card key={`plan_${plan}_${day.dayName}`}>
          <Text
            style={{
              fontSize: 16,
              fontWeight: '600',
              color: colors.ink,
            }}
          >
            {day.dayName}
          </Text>
          {day.exercises.map((ex, idx) => (
            <View key={`${ex.name}_${idx}`} style={{ marginTop: 6 }}>
              <TouchableOpacity
                style={[
                  styles.exerciseBox,
                  { backgroundColor: colors.bg, borderColor: colors.line },
                ]}
                onPress={() => handleUseExercise(ex.name)}
                activeOpacity={0.75}
              >
                <Text style={{ fontSize: 16, color: colors.ink, flex: 1 }}>
                  {ex.name}
                </Text>
                {ex.setsReps.length > 0 && (
                  <Text style={{ fontSize: 14, color: colors.mut }}>
                    {ex.setsReps}
                  </Text>
                )}
              </TouchableOpacity>
              {ex.id != null && (
                <TouchableOpacity
                  style={{ marginTop: 2 }}
                  onPress={() => handleDelCustomEx(ex.id!)}
                >
                  <Text
                    style={{
                      fontSize: 13,
                      fontWeight: '600',
                      color: colors.acc,
                      textDecorationLine: 'underline',
                    }}
                  >
                    usuń ćwiczenie
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          ))}
        </Card>
      ))}

      <Card>
        <Text style={{ fontSize: 16, fontWeight: '600', color: colors.ink }}>
          Jak robić progres
        </Text>
        <View style={{ height: 6 }} />
        <Text style={{ fontSize: 14, color: colors.mut, lineHeight: 20 }}>
          Zostań przy tym samym ciężarze, aż we wszystkich seriach zrobisz górną
          liczbę powtórzeń. Wtedy dodaj 2,5 kg i wróć do dolnego zakresu. Między
          seriami w ćwiczeniach wielostawowych odpoczywaj 2–3 minuty. Dotknij
          ćwiczenia, żeby wpisać je do formularza na górze.
        </Text>
      </Card>

      {/* Biblioteka ćwiczeń */}
      <SectionH2
        text={`Biblioteka ćwiczeń (${JournalData.TOTAL_LIBRARY_EXERCISES})`}
      />
      <AppInput
        value={eq}
        onValueChange={(val) => {
          setEq(val);
          setExMax(40);
        }}
        placeholder="Szukaj ćwiczenia"
      />

      {eq.length === 0 && (
        <>
          <View style={{ height: 10 }} />
          <View style={styles.flowRow}>
            {Object.keys(JournalData.EXERCISE_LIBRARY).map((k) => (
              <ChipButton
                key={k}
                label={k}
                active={k === exg}
                onClick={() => {
                  setExg(k);
                  setExMax(40);
                }}
              />
            ))}
          </View>
        </>
      )}

      <Card>
        {filteredLibrary.length === 0 ? (
          <Text style={{ fontSize: 15, color: colors.mut }}>
            Nic nie znaleziono.
          </Text>
        ) : (
          <>
            {filteredLibrary.slice(0, exMax).map((n, index) => (
              <TouchableOpacity
                key={n}
                style={[
                  styles.exerciseBox,
                  {
                    backgroundColor: colors.bg,
                    borderColor: colors.line,
                    marginTop: index > 0 ? 6 : 0,
                  },
                ]}
                onPress={() => handleUseExercise(n)}
                activeOpacity={0.75}
              >
                <Text style={{ fontSize: 16, color: colors.ink }}>{n}</Text>
              </TouchableOpacity>
            ))}

            {filteredLibrary.length > exMax && (
              <>
                <View style={{ height: 10 }} />
                <GoButton
                  label={`Pokaż więcej (${filteredLibrary.length - exMax})`}
                  onClick={() => setExMax((m) => m + 40)}
                />
              </>
            )}
          </>
        )}
      </Card>
      <View style={{ height: 6 }} />
      <Text style={{ fontSize: 14, color: colors.mut }}>
        Dotknij ćwiczenia, żeby wpisać je do formularza serii na górze.
      </Text>

      {/* Dodaj własne ćwiczenie */}
      <SectionH2 text="Dodaj własne ćwiczenie" />
      <Card style={{ marginTop: 0 }}>
        <Field label="Nazwa ćwiczenia">
          <AppInput
            value={customExName}
            onValueChange={setCustomExName}
            placeholder="np. Face pull"
          />
        </Field>
        <View style={{ height: 8 }} />
        <View style={styles.rowGap8}>
          <Field label="Serie × powtórzenia" style={{ flex: 1 }}>
            <AppInput
              value={customExSr}
              onValueChange={setCustomExSr}
              placeholder="3×12"
            />
          </Field>
          <Field label="Dzień planu" style={{ flex: 1 }}>
            <AppInput
              value={customExDay}
              onValueChange={setCustomExDay}
              placeholder="np. Dzień A"
            />
          </Field>
        </View>
        <View style={{ height: 10 }} />
        <GoButton label="Dodaj do Mojego planu" onClick={handleAddCustomEx} />
      </Card>
    </ScreenScroll>
  );
};

const styles = StyleSheet.create({
  suggestionsBox: {
    width: '100%',
    marginTop: 4,
    borderRadius: 10,
    borderWidth: 1,
    overflow: 'hidden',
  },
  suggestionItem: {
    width: '100%',
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  lastEntryRow: {
    marginTop: 6,
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  rowGap8: {
    width: '100%',
    flexDirection: 'row',
    gap: 8,
  },
  timerHeaderRow: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  divider: {
    width: '100%',
    height: 1,
  },
  setRow: {
    width: '100%',
    paddingVertical: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  delCircleBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  flowRow: {
    width: '100%',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  exerciseBox: {
    width: '100%',
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
});
