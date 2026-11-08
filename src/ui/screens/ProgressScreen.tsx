import React, { useMemo, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { DateUtils, WeightEntry, num } from '../../data/JournalModels';
import {
  AppInput,
  Card,
  ChartCanvas,
  ChartPoint,
  DatePickerField,
  DayNav,
  Field,
  GoButton,
  ScreenScroll,
  SectionH2,
  SelectField,
} from '../components/CommonUi';
import { AppTheme } from '../theme/Theme';
import { JournalViewModelType } from '../../viewmodel/JournalViewModel';

export const ProgressScreen: React.FC<{ viewModel: JournalViewModelType }> = ({
  viewModel,
}) => {
  const colors = AppTheme.useColors();
  const { state, today } = viewModel;

  const [weightKg, setWeightKg] = useState('');
  const [weightDate, setWeightDate] = useState(today);
  const [selectedEx, setSelectedEx] = useState('');

  const sortedWeights = useMemo(
    () => [...state.weights].sort((a, b) => a.d.localeCompare(b.d)),
    [state.weights]
  );

  // Last 7 days stats
  const { avgKcal, trainDays } = useMemo(() => {
    const week: string[] = [];
    for (let i = 0; i < 7; i++) {
      week.push(DateUtils.shiftDays(today, -i));
    }
    const daysWithMeals = week.filter((d) =>
      state.meals.some((m) => m.d === d)
    );
    const kc =
      daysWithMeals.length > 0
        ? Math.round(
            state.meals
              .filter((m) => week.includes(m.d))
              .reduce((acc, m) => acc + m.k, 0) / daysWithMeals.length
          )
        : 0;
    const tr = week.filter((d) => state.sets.some((s) => s.d === d)).length;
    return { avgKcal: kc, trainDays: tr };
  }, [state.meals, state.sets, today]);

  const handleAddWeight = () => {
    if (weightKg.trim().length > 0) {
      const d = /^\d{4}-\d{2}-\d{2}$/.test(weightDate.trim())
        ? weightDate.trim()
        : today;
      const valKg = num(weightKg);
      if (valKg > 0) {
        viewModel.updateState((prev) => {
          const filtered = prev.weights.filter((w) => w.d !== d);
          return {
            ...prev,
            weights: [...filtered, { d, kg: valKg } as WeightEntry],
          };
        });
        setWeightKg('');
      }
    }
  };

  const loggedExercises = useMemo(() => {
    const set = new Set<string>();
    state.sets.forEach((s) => set.add(s.e));
    return Array.from(set).sort((a, b) => a.localeCompare(b, 'pl'));
  }, [state.sets]);

  const activeEx = loggedExercises.includes(selectedEx)
    ? selectedEx
    : loggedExercises[0] ?? '';

  const strengthPts: ChartPoint[] = useMemo(() => {
    if (!activeEx) return [];
    const byDate: Record<string, number> = {};
    state.sets
      .filter((s) => s.e === activeEx)
      .forEach((s) => {
        const prev = byDate[s.d] ?? 0.0;
        if (s.kg > prev) byDate[s.d] = s.kg;
      });
    return Object.keys(byDate)
      .sort()
      .map((d) => ({ d, y: byDate[d] ?? 0.0 }));
  }, [activeEx, state.sets]);

  const maxStrengthRecord =
    strengthPts.length > 0 ? Math.max(...strengthPts.map((p) => p.y)) : 0.0;

  const weightDiff =
    sortedWeights.length > 1
      ? sortedWeights[sortedWeights.length - 1].kg - sortedWeights[0].kg
      : 0.0;

  return (
    <ScreenScroll>
      <DayNav title="Postępy" />

      {/* 7 dni podsumowanie */}
      <Card>
        <View style={styles.statsEvenRow}>
          <View style={styles.statCol}>
            <Text style={[styles.statVal, { color: colors.ink }]}>
              {avgKcal > 0 ? `${avgKcal}` : '–'}
            </Text>
            <Text style={[styles.statLbl, { color: colors.mut }]}>
              średnie kcal / dzień (7 dni)
            </Text>
          </View>
          <View style={styles.statCol}>
            <Text style={[styles.statVal, { color: colors.ink }]}>
              {`${trainDays}`}
            </Text>
            <Text style={[styles.statLbl, { color: colors.mut }]}>
              dni z treningiem (7 dni)
            </Text>
          </View>
        </View>
      </Card>

      {/* Waga ciała */}
      <SectionH2 text="Waga ciała" />
      <Card style={{ marginTop: 0 }}>
        <View style={[styles.rowGap8, { alignItems: 'flex-end' }]}>
          <Field label="Waga kg" style={{ flex: 1 }}>
            <AppInput
              value={weightKg}
              onValueChange={setWeightKg}
              keyboardType="decimal-pad"
            />
          </Field>
          <DatePickerField
            label="Data"
            value={weightDate}
            onValueChange={setWeightDate}
            style={{ flex: 1 }}
          />
          <GoButton label="Zapisz" onClick={handleAddWeight} />
        </View>
      </Card>

      <Card>
        {sortedWeights.length > 0 && (
          <>
            <View style={styles.statsEvenRow}>
              <View style={styles.statCol}>
                <Text style={[styles.statVal, { color: colors.ink }]}>
                  {`${sortedWeights[sortedWeights.length - 1].kg} kg`}
                </Text>
                <Text style={[styles.statLbl, { color: colors.mut }]}>
                  ostatni pomiar
                </Text>
              </View>
              <View style={styles.statCol}>
                <Text style={[styles.statVal, { color: colors.ink }]}>
                  {sortedWeights.length > 1
                    ? `${weightDiff > 0 ? '+' : ''}${weightDiff.toFixed(1)} kg`
                    : '–'}
                </Text>
                <Text style={[styles.statLbl, { color: colors.mut }]}>
                  zmiana od początku
                </Text>
              </View>
            </View>
            <View style={{ height: 4 }} />
          </>
        )}

        <ChartCanvas
          pts={sortedWeights.map((w) => ({ d: w.d, y: w.kg }))}
        />
      </Card>

      {/* Siła */}
      <SectionH2 text="Siła" />
      <Card style={{ marginTop: 0 }}>
        {loggedExercises.length === 0 ? (
          <Text style={{ fontSize: 15, color: colors.mut }}>
            Zapisz pierwsze serie w zakładce Trening, a tu pojawi się wykres.
          </Text>
        ) : (
          <>
            <SelectField
              label="Ćwiczenie"
              value={activeEx}
              options={loggedExercises.map((ex) => ({
                value: ex,
                label: ex,
              }))}
              onSelect={setSelectedEx}
            />
            <View style={{ height: 8 }} />
            <Text style={{ fontSize: 14, color: colors.mut }}>
              Najcięższa seria w danym dniu (kg)
            </Text>
            <ChartCanvas pts={strengthPts} />
            {strengthPts.length > 0 && (
              <>
                <View style={{ height: 6 }} />
                <Text
                  style={{
                    fontSize: 15,
                    fontWeight: '600',
                    color: colors.ink,
                  }}
                >
                  {`Rekord: ${maxStrengthRecord} kg`}
                </Text>
              </>
            )}
          </>
        )}
      </Card>
    </ScreenScroll>
  );
};

const styles = StyleSheet.create({
  statsEvenRow: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-evenly',
  },
  statCol: {
    flex: 1,
    alignItems: 'center',
  },
  statVal: {
    fontSize: 28,
    fontWeight: '700',
  },
  statLbl: {
    fontSize: 13,
    textAlign: 'center',
  },
  rowGap8: {
    width: '100%',
    flexDirection: 'row',
    gap: 8,
  },
});
