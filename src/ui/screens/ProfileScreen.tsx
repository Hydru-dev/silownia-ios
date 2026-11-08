import React, { useEffect, useMemo, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { BioData, calcBioTargets, num } from '../../data/JournalModels';
import {
  AppInput,
  Card,
  DayNav,
  Field,
  GoButton,
  ScreenScroll,
  SelectField,
  SelectOption,
} from '../components/CommonUi';
import { AppTheme } from '../theme/Theme';
import { AppTab, JournalViewModelType } from '../../viewmodel/JournalViewModel';

const SEX_OPTIONS: SelectOption[] = [
  { value: 'm', label: 'Mężczyzna' },
  { value: 'k', label: 'Kobieta' },
];

const ACTIVITY_OPTIONS: SelectOption[] = [
  { value: '1.375', label: 'Mała (do 3 treningów tygodniowo)' },
  { value: '1.55', label: 'Umiarkowana (3–5 treningów)' },
  { value: '1.725', label: 'Duża (6–7 treningów)' },
];

const GOAL_OPTIONS: SelectOption[] = [
  { value: 'red', label: 'Redukcja masy' },
  { value: 'utr', label: 'Utrzymanie' },
  { value: 'masa', label: 'Zwiększenie masy' },
];

export const ProfileScreen: React.FC<{ viewModel: JournalViewModelType }> = ({
  viewModel,
}) => {
  const colors = AppTheme.useColors();
  const { state, today } = viewModel;
  const b = state.bio;

  const [w, setW] = useState(b?.w != null ? b.w.toString() : '');
  const [h, setH] = useState(b?.h != null ? b.h.toString() : '');
  const [a, setA] = useState(b?.a != null && b.a > 0 ? b.a.toString() : '');
  const [x, setX] = useState(b?.x ?? 'm');
  const [v, setV] = useState(b?.v ?? '1.55');
  const [g, setG] = useState(b?.g ?? 'utr');

  useEffect(() => {
    setW(b?.w != null ? b.w.toString() : '');
    setH(b?.h != null ? b.h.toString() : '');
    setA(b?.a != null && b.a > 0 ? b.a.toString() : '');
    setX(b?.x ?? 'm');
    setV(b?.v ?? '1.55');
    setG(b?.g ?? 'utr');
  }, [b]);

  const handleSaveBio = () => {
    const wNum = num(w);
    const hNum = num(h);
    if (wNum > 0 && hNum > 0) {
      const nextBio: BioData = {
        w: wNum,
        h: hNum,
        a: Math.round(num(a)),
        x,
        v,
        g,
      };
      viewModel.updateState((prev) => {
        const filteredWeights = prev.weights.filter((wt) => wt.d !== today);
        return {
          ...prev,
          bio: nextBio,
          weights: [...filteredWeights, { d: today, kg: wNum }],
        };
      });
    }
  };

  const targets = useMemo(() => calcBioTargets(b), [b]);

  const handleApplyGoals = () => {
    if (targets != null) {
      viewModel.updateState((prev) => ({
        ...prev,
        goals: targets,
      }));
      viewModel.selectTab(AppTab.DIET);
    }
  };

  const bmi =
    b?.w != null && b.w > 0 && b.h > 0
      ? b.w / Math.pow(b.h / 100.0, 2.0)
      : null;

  return (
    <ScreenScroll>
      <DayNav title="Profil" />

      <Card>
        <View style={styles.rowGap8}>
          <Field label="Waga kg" style={{ flex: 1 }}>
            <AppInput
              value={w}
              onValueChange={setW}
              keyboardType="decimal-pad"
            />
          </Field>
          <Field label="Wzrost cm" style={{ flex: 1 }}>
            <AppInput
              value={h}
              onValueChange={setH}
              keyboardType="number-pad"
            />
          </Field>
        </View>

        <View style={{ height: 8 }} />
        <View style={styles.rowGap8}>
          <Field label="Wiek" style={{ flex: 1 }}>
            <AppInput
              value={a}
              onValueChange={setA}
              keyboardType="number-pad"
            />
          </Field>
          <SelectField
            label="Płeć"
            value={x}
            options={SEX_OPTIONS}
            onSelect={setX}
            style={{ flex: 1 }}
          />
        </View>

        <View style={{ height: 8 }} />
        <SelectField
          label="Aktywność"
          value={v}
          options={ACTIVITY_OPTIONS}
          onSelect={setV}
        />

        <View style={{ height: 8 }} />
        <SelectField
          label="Cel"
          value={g}
          options={GOAL_OPTIONS}
          onSelect={setG}
        />

        <View style={{ height: 10 }} />
        <GoButton label="Zapisz profil" onClick={handleSaveBio} />

        <View style={{ height: 6 }} />
        <Text style={{ fontSize: 14, color: colors.mut }}>
          Zapis dodaje też dzisiejszą wagę do wykresu w Postępach.
        </Text>
      </Card>

      {b != null && b.w > 0 && b.h > 0 && bmi != null && (
        <>
          <Card>
            <View style={styles.statsEvenRow}>
              <View style={styles.statCol}>
                <Text style={[styles.statVal, { color: colors.ink }]}>
                  {`${b.w} kg · ${Math.round(b.h)} cm`}
                </Text>
                <Text style={[styles.statLbl, { color: colors.mut }]}>
                  aktualne dane
                </Text>
              </View>
              <View style={styles.statCol}>
                <Text style={[styles.statVal, { color: colors.ink }]}>
                  {bmi.toFixed(1)}
                </Text>
                <Text style={[styles.statLbl, { color: colors.mut }]}>
                  BMI (nie rozróżnia mięśni od tłuszczu)
                </Text>
              </View>
            </View>
          </Card>

          {targets != null ? (
            <Card>
              <Text
                style={{ fontSize: 16, fontWeight: '600', color: colors.ink }}
              >
                Orientacyjne cele dzienne
              </Text>
              <View style={{ height: 6 }} />
              <Text
                style={{ fontSize: 14, color: colors.mut, lineHeight: 20 }}
              >
                {`${targets.k} kcal i ${targets.p} g białka (2 g na kg masy ciała). To szacunek: po 2–3 tygodniach skoryguj kalorie według zmiany wagi.`}
              </Text>
              <View style={{ height: 8 }} />
              <GoButton
                label="Ustaw jako cele dzienne"
                onClick={handleApplyGoals}
              />
            </Card>
          ) : (
            <>
              <View style={{ height: 10 }} />
              <Text style={{ fontSize: 14, color: colors.mut }}>
                Podaj wiek, a wyliczę orientacyjne kalorie i białko.
              </Text>
            </>
          )}
        </>
      )}
    </ScreenScroll>
  );
};

const styles = StyleSheet.create({
  rowGap8: {
    width: '100%',
    flexDirection: 'row',
    gap: 8,
  },
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
});
