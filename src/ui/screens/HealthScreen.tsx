import React, { useEffect, useMemo, useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { JournalData } from '../../data/JournalData';
import {
  DateUtils,
  SleepEntry,
   dur,
  fmtN,
  hm,
  num,
} from '../../data/JournalModels';
import {
  AppInput,
  Bar,
  Card,
  ChartCanvas,
  ChartPoint,
  ChipButton,
  DayNav,
  Field,
  GoButton,
  MiniButton,
  MultiBar,
  ScreenScroll,
  SectionH2,
  SelectField,
  SelectOption,
  TimePickerField,
} from '../components/CommonUi';
import { AppTheme } from '../theme/Theme';
import { JournalViewModelType } from '../../viewmodel/JournalViewModel';

export const HealthScreen: React.FC<{ viewModel: JournalViewModelType }> = ({
  viewModel,
}) => {
  const colors = AppTheme.useColors();
  const { state, cur, today } = viewModel;

  const [exactSteps, setExactSteps] = useState('');
  const goal = viewModel.stGoal();
  const [customGoalInput, setCustomGoalInput] = useState(goal.toString());

  useEffect(() => {
    setCustomGoalInput(goal.toString());
  }, [goal]);

  const [rstA, setRstA] = useState(''); // 'd' | 'a' | 'w' | ''

  useEffect(() => {
    if (!rstA) return;
    const t = setTimeout(() => setRstA(''), 4000);
    return () => clearTimeout(t);
  }, [rstA]);

  // Hydration state
  const waterMl = viewModel.waterDay(cur);
  const waterGoalMl = viewModel.waterGoal();
  const defaultWaterGoalMl = viewModel.waterDefaultGoal();
  const [exactWater, setExactWater] = useState('');
  const [waterGoalInput, setWaterGoalInput] = useState(
    waterGoalMl.toString()
  );

  useEffect(() => {
    setWaterGoalInput(waterGoalMl.toString());
  }, [waterGoalMl]);

  const addWater = (delta: number) => {
    viewModel.updateState((prev) => {
      const curVal = prev.water[cur] ?? 0;
      return {
        ...prev,
        water: {
          ...prev.water,
          [cur]: Math.max(0, curVal + delta),
        },
      };
    });
  };

  const handleSetExactWater = () => {
    if (exactWater.trim().length > 0) {
      const valMl = Math.max(0, Math.round(num(exactWater)));
      viewModel.updateState((prev) => ({
        ...prev,
        water: { ...prev.water, [cur]: valMl },
      }));
      setExactWater('');
    }
  };

  const handleResetDayWater = () => {
    if (rstA !== 'w') {
      setRstA('w');
    } else {
      viewModel.updateState((prev) => {
        const next = { ...prev.water };
        delete next[cur];
        return { ...prev, water: next };
      });
      setRstA('');
    }
  };

  const handleSetWaterGoalForm = () => {
    const v = Math.round(num(waterGoalInput));
    if (v >= 500 && v <= 10000) {
      viewModel.updateState((prev) => ({ ...prev, wg: v }));
    }
  };

  const handleResetWaterGoalDefault = () => {
    viewModel.updateState((prev) => ({ ...prev, wg: null }));
  };

  // Sleep state
  const sleepList = state.sleep;
  const curSleep = useMemo(
    () => sleepList.find((s) => s.d === cur),
    [sleepList, cur]
  );
  const sleepGoal = state.sg ?? 8.0;

  const [bedTime, setBedTime] = useState(curSleep?.b ?? '23:00');
  const [wakeTime, setWakeTime] = useState(curSleep?.w ?? '07:00');
  const [sleepQuality, setSleepQuality] = useState(
    curSleep?.q?.toString() ?? '3'
  );
  const [deepSleep, setDeepSleep] = useState(
    curSleep?.dp != null ? curSleep.dp.toString() : ''
  );
  const [lightSleep, setLightSleep] = useState(
    curSleep?.lt != null ? curSleep.lt.toString() : ''
  );
  const [sleepErr, setSleepErr] = useState('');

  useEffect(() => {
    setBedTime(curSleep?.b ?? '23:00');
    setWakeTime(curSleep?.w ?? '07:00');
    setSleepQuality(curSleep?.q?.toString() ?? '3');
    setDeepSleep(curSleep?.dp != null ? curSleep.dp.toString() : '');
    setLightSleep(curSleep?.lt != null ? curSleep.lt.toString() : '');
    setSleepErr('');
  }, [cur, curSleep]);

  const [sgInput, setSgInput] = useState(
    sleepGoal.toString().replace(/\.0$/, '')
  );

  useEffect(() => {
    setSgInput(sleepGoal.toString().replace(/\.0$/, ''));
  }, [sleepGoal]);

  // Steps calculations
  const bioG = state.bio?.g ?? 'utr';
  const rPreset =
    JournalData.STEP_GOALS[bioG] ?? JournalData.STEP_GOALS.utr;
  const n = viewModel.stDay(cur);
  const b = state.bio;
  const weightKg = b?.w ?? 70.0;
  const stride = b?.h != null && b.h > 0 ? (b.h * 0.415) / 100.0 : 0.7;
  const km = (n * stride) / 1000.0;
  const kc = n * 0.0005 * weightKg;

  const addSteps = (delta: number) => {
    viewModel.updateState((prev) => {
      const curVal = prev.steps[cur] ?? 0;
      return {
        ...prev,
        steps: {
          ...prev.steps,
          [cur]: Math.max(0, curVal + delta),
        },
      };
    });
  };

  const handleSetExactSteps = () => {
    if (exactSteps.trim().length > 0) {
      const valSteps = Math.max(0, Math.round(num(exactSteps)));
      viewModel.updateState((prev) => ({
        ...prev,
        steps: { ...prev.steps, [cur]: valSteps },
      }));
      setExactSteps('');
    }
  };

  const handleResetDaySteps = () => {
    if (rstA !== 'd') {
      setRstA('d');
    } else {
      viewModel.updateState((prev) => {
        const next = { ...prev.steps };
        delete next[cur];
        return { ...prev, steps: next };
      });
      setRstA('');
    }
  };

  const handleResetAllSteps = () => {
    if (rstA !== 'a') {
      setRstA('a');
    } else {
      viewModel.updateState((prev) => ({ ...prev, steps: {} }));
      setRstA('');
    }
  };

  const handleSetGoalPreset = (valTarget: number) => {
    viewModel.updateState((prev) => ({
      ...prev,
      stg: { v: valTarget, g: bioG },
    }));
  };

  const handleSetGoalForm = () => {
    const v = Math.round(num(customGoalInput));
    if (v >= 1000 && v <= 50000) {
      viewModel.updateState((prev) => ({ ...prev, stg: { v } }));
    }
  };

  const handleResetGoalDefault = () => {
    viewModel.updateState((prev) => ({ ...prev, stg: null }));
  };

  // Last 7 days stats
  const last7Dates = useMemo(() => {
    const list: string[] = [];
    for (let i = 0; i < 7; i++) {
      list.push(DateUtils.shiftDays(today, -i));
    }
    return list;
  }, [today]);

  const vals7 = last7Dates.map((d) => viewModel.stDay(d)).filter((x) => x > 0);
  const avgSteps =
    vals7.length > 0
      ? vals7.reduce((a, bVal) => a + bVal, 0) / vals7.length
      : 0.0;
  const hitSteps = last7Dates.filter((d) => viewModel.stDay(d) >= goal).length;

  const stepChartKeys = useMemo(
    () =>
      Object.keys(state.steps)
        .filter((d) => (state.steps[d] ?? 0) > 0)
        .sort()
        .slice(-14),
    [state.steps]
  );

  // Hydration 7-day stats & chart
  const waterVals7 = last7Dates
    .map((d) => viewModel.waterDay(d))
    .filter((x) => x > 0);
  const avgWater =
    waterVals7.length > 0
      ? waterVals7.reduce((a, bVal) => a + bVal, 0) / waterVals7.length
      : 0.0;
  const hitWater = last7Dates.filter(
    (d) => viewModel.waterDay(d) >= waterGoalMl
  ).length;
  const waterChartKeys = useMemo(
    () =>
      Object.keys(state.water)
        .filter((d) => (state.water[d] ?? 0) > 0)
        .sort()
        .slice(-14),
    [state.water]
  );

  // Sleep handlers
  const handleSaveSleep = () => {
    const dpVal =
      deepSleep.trim().length === 0
        ? null
        : Math.max(0, Math.round(num(deepSleep)));
    const ltVal =
      lightSleep.trim().length === 0
        ? null
        : Math.max(0, Math.round(num(lightSleep)));
    const tot = dur(bedTime, wakeTime);
    if ((dpVal ?? 0) + (ltVal ?? 0) > tot) {
      setSleepErr(
        `Głęboki i płytki sen razem nie mogą być dłuższe niż cała noc (${hm(
          tot
        )}).`
      );
    } else {
      setSleepErr('');
      const entry: SleepEntry = {
        d: cur,
        b: bedTime.trim() || '23:00',
        w: wakeTime.trim() || '07:00',
        q: parseInt(sleepQuality, 10) || 3,
        dp: dpVal,
        lt: ltVal,
      };
      viewModel.updateState((prev) => ({
        ...prev,
        sleep: [...prev.sleep.filter((s) => s.d !== cur), entry],
      }));
    }
  };

  const handleDelSleep = () => {
    viewModel.updateState((prev) => ({
      ...prev,
      sleep: prev.sleep.filter((s) => s.d !== cur),
    }));
  };

  const handleSaveSleepGoal = () => {
    const targetH = Math.min(14.0, Math.max(4.0, num(sgInput)));
    viewModel.updateState((prev) => ({ ...prev, sg: targetH }));
  };

  const last14Sleep = useMemo(
    () =>
      [...state.sleep].sort((a, bVal) => a.d.localeCompare(bVal.d)).slice(-14),
    [state.sleep]
  );
  const last7Sleep = useMemo(() => last14Sleep.slice(-7), [last14Sleep]);
  const deepList = useMemo(
    () => last7Sleep.filter((s) => s.dp != null),
    [last7Sleep]
  );
  const lightList = useMemo(
    () => last7Sleep.filter((s) => s.lt != null),
    [last7Sleep]
  );

  const qualityOptions: SelectOption[] = useMemo(
    () =>
      [1, 2, 3, 4, 5].map((i) => ({
        value: i.toString(),
        label: `${i} z 5`,
      })),
    []
  );

  const waterLiters = waterMl / 1000.0;
  const glassesCount = waterMl / 250.0;

  return (
    <ScreenScroll>
      <DayNav
        cur={cur}
        today={today}
        onShift={(d) => viewModel.shift(d)}
        onDateSelected={(d) => viewModel.setCur(d)}
      />

      {/* Kroki */}
      <SectionH2 text="Kroki" />
      <Card style={{ marginTop: 0 }}>
        <View style={styles.heroRow}>
          <Text style={[styles.heroBigNum, { color: colors.ink }]}>
            {fmtN(n)}
          </Text>
          <View style={{ alignItems: 'flex-end' }}>
            <Text style={{ fontSize: 15, color: colors.mut }}>
              {`cel ${fmtN(goal)} `}
            </Text>
            <Text
              style={{
                fontSize: 15,
                color: colors.mut,
                textAlign: 'right',
              }}
            >
              {n >= goal
                ? 'cel osiągnięty'
                : `brakuje ${fmtN(goal - n)}`}
            </Text>
          </View>
        </View>

        <View style={{ height: 10 }} />
        <Bar pct={goal > 0 ? (n / goal) * 100.0 : 0.0} over={n >= goal} />

        <View style={{ height: 10 }} />
        <Text style={{ fontSize: 14, color: colors.mut }}>
          {`≈ ${km.toFixed(1)} km · ok. ${Math.round(
            kc
          )} kcal (orientacyjnie)`}
        </Text>

        <View style={{ height: 12 }} />
        <View style={styles.flowRow}>
          {[500, 1000, 2000, 5000].map((x) => (
            <ChipButton
              key={x}
              label={`+ ${fmtN(x)}`}
              onClick={() => addSteps(x)}
            />
          ))}
          <ChipButton label="− 1 000" onClick={() => addSteps(-1000)} />
        </View>

        <View style={{ height: 12 }} />
        <View style={[styles.rowGap8, { alignItems: 'flex-end' }]}>
          <Field label="Ustaw dokładną liczbę" style={{ flex: 1 }}>
            <AppInput
              value={exactSteps}
              onValueChange={setExactSteps}
              keyboardType="number-pad"
              placeholder="np. 8500"
            />
          </Field>
          <GoButton label="Zapisz" onClick={handleSetExactSteps} />
        </View>

        <View style={{ height: 10 }} />
        <View style={styles.flowRow}>
          <ChipButton
            label={
              rstA === 'd'
                ? 'Na pewno? Dotknij ponownie'
                : 'Wyzeruj ten dzień'
            }
            active={rstA === 'd'}
            onClick={handleResetDaySteps}
          />
          <ChipButton
            label={
              rstA === 'a'
                ? 'Na pewno? Dotknij ponownie'
                : 'Usuń historię kroków'
            }
            active={rstA === 'a'}
            onClick={handleResetAllSteps}
          />
        </View>
      </Card>

      {/* Statystyki 7 dni */}
      <Card>
        <View style={styles.statsEvenRow}>
          <View style={styles.statCol}>
            <Text style={[styles.statVal, { color: colors.ink }]}>
              {avgSteps > 0 ? fmtN(avgSteps) : '–'}
            </Text>
            <Text style={[styles.statLbl, { color: colors.mut }]}>
              średnio dziennie (7 dni)
            </Text>
          </View>
          <View style={styles.statCol}>
            <Text style={[styles.statVal, { color: colors.ink }]}>
              {`${hitSteps} / 7`}
            </Text>
            <Text style={[styles.statLbl, { color: colors.mut }]}>
              dni z osiągniętym celem
            </Text>
          </View>
        </View>
      </Card>

      {stepChartKeys.length > 1 && (
        <Card>
          <ChartCanvas
            pts={stepChartKeys.map((d) => ({
              d,
              y: state.steps[d] ?? 0,
            }))}
          />
        </Card>
      )}

      {/* Ile kroków dziennie? */}
      <Card>
        <Text style={{ fontSize: 16, fontWeight: '600', color: colors.ink }}>
          Ile kroków dziennie?
        </Text>
        <View style={{ height: 6 }} />
        <Text style={{ fontSize: 14, color: colors.mut }}>
          {`Twój cel w profilu: ${rPreset.label}${
            state.bio?.g != null
              ? ''
              : ' (ustawisz go w zakładce Profil)'
          }.`}
        </Text>

        {(['red', 'utr', 'masa'] as const).map((k) => {
          const x = JournalData.STEP_GOALS[k];
          return (
            <View key={k} style={styles.presetRow}>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 16, color: colors.ink }}>
                  {`${x.label}${k === bioG ? ' · twój cel' : ''}`}
                </Text>
                <Text style={{ fontSize: 13, color: colors.mut }}>
                  {`${fmtN(x.min)}–${fmtN(x.max)} kroków, cel ${fmtN(
                    x.target
                  )}`}
                </Text>
              </View>
              <MiniButton
                label="Ustaw cel"
                onClick={() => handleSetGoalPreset(x.target)}
              />
            </View>
          );
        })}

        <View style={{ height: 12 }} />
        <View style={[styles.rowGap8, { alignItems: 'flex-end' }]}>
          <Field label="Własny cel kroków dziennie" style={{ flex: 1 }}>
            <AppInput
              value={customGoalInput}
              onValueChange={setCustomGoalInput}
              keyboardType="number-pad"
              placeholder="np. 9000"
            />
          </Field>
          <GoButton label="Zapisz cel" onClick={handleSetGoalForm} />
        </View>

        {state.stg != null && (
          <TouchableOpacity
            style={{ marginTop: 8 }}
            onPress={handleResetGoalDefault}
          >
            <Text
              style={{
                fontSize: 14,
                fontWeight: '600',
                color: colors.acc,
                textDecorationLine: 'underline',
              }}
            >
              {`Przywróć cel domyślny (${fmtN(rPreset.target)})`}
            </Text>
          </TouchableOpacity>
        )}
      </Card>

      {/* Śledzenie nawodnienia */}
      <SectionH2 text="Śledzenie nawodnienia" />
      <Card style={{ marginTop: 0 }}>
        <View style={styles.heroRow}>
          <View>
            <Text
              style={{
                fontSize: 48,
                fontWeight: '700',
                color: colors.ink,
                lineHeight: 50,
              }}
            >
              {`${fmtN(waterMl)} ml`}
            </Text>
            <Text style={{ fontSize: 14, color: colors.mut }}>
              {`${waterLiters.toFixed(2).replace('.', ',')} l · ok. ${glassesCount
                .toFixed(1)
                .replace('.', ',')} szklanek`}
            </Text>
          </View>
          <View style={{ alignItems: 'flex-end' }}>
            <Text style={{ fontSize: 15, color: colors.mut }}>
              {`cel ${fmtN(waterGoalMl)} ml`}
            </Text>
            <Text
              style={{
                fontSize: 15,
                color: colors.mut,
                textAlign: 'right',
              }}
            >
              {waterMl >= waterGoalMl
                ? 'cel osiągnięty'
                : `brakuje ${fmtN(waterGoalMl - waterMl)} ml`}
            </Text>
          </View>
        </View>

        <View style={{ height: 10 }} />
        <Bar
          pct={waterGoalMl > 0 ? (waterMl / waterGoalMl) * 100.0 : 0.0}
          over={waterMl >= waterGoalMl}
        />

        <View style={{ height: 12 }} />
        <View style={styles.flowRow}>
          {(
            [
              [200, '+ 200 ml'],
              [250, '+ 250 ml (szklanka)'],
              [500, '+ 500 ml (butelka)'],
              [750, '+ 750 ml (bidon)'],
            ] as [number, string][]
          ).map(([ml, label]) => (
            <ChipButton
              key={ml}
              label={label}
              onClick={() => addWater(ml)}
            />
          ))}
          <ChipButton label="− 250 ml" onClick={() => addWater(-250)} />
        </View>

        <View style={{ height: 12 }} />
        <View style={[styles.rowGap8, { alignItems: 'flex-end' }]}>
          <Field label="Ustaw dokładną ilość (ml)" style={{ flex: 1 }}>
            <AppInput
              value={exactWater}
              onValueChange={setExactWater}
              keyboardType="number-pad"
              placeholder="np. 2250"
            />
          </Field>
          <GoButton label="Zapisz" onClick={handleSetExactWater} />
        </View>

        <View style={{ height: 10 }} />
        <ChipButton
          label={
            rstA === 'w'
              ? 'Na pewno? Dotknij ponownie'
              : 'Wyzeruj wodę z tego dnia'
          }
          active={rstA === 'w'}
          onClick={handleResetDayWater}
        />
      </Card>

      {/* Statystyki nawodnienia 7 dni */}
      <Card>
        <View style={styles.statsEvenRow}>
          <View style={styles.statCol}>
            <Text style={[styles.statVal26, { color: colors.ink }]}>
              {avgWater > 0 ? `${fmtN(Math.round(avgWater))} ml` : '–'}
            </Text>
            <Text style={[styles.statLbl, { color: colors.mut }]}>
              średnio dziennie (7 dni)
            </Text>
          </View>
          <View style={styles.statCol}>
            <Text style={[styles.statVal26, { color: colors.ink }]}>
              {`${hitWater} / 7`}
            </Text>
            <Text style={[styles.statLbl, { color: colors.mut }]}>
              dni z osiągniętym celem
            </Text>
          </View>
        </View>

        {waterChartKeys.length > 1 && (
          <>
            <View style={{ height: 8 }} />
            <Text style={{ fontSize: 14, color: colors.mut }}>
              Wypita woda w kolejnych dniach (litry)
            </Text>
            <ChartCanvas
              pts={waterChartKeys.map((d) => ({
                d,
                y: (state.water[d] ?? 0) / 1000.0,
              }))}
            />
          </>
        )}
      </Card>

      {/* Cel nawodnienia */}
      <Card>
        <Text style={{ fontSize: 16, fontWeight: '600', color: colors.ink }}>
          Cel dziennego nawodnienia
        </Text>
        <View style={{ height: 6 }} />
        <Text style={{ fontSize: 14, color: colors.mut, lineHeight: 20 }}>
          {`Zalecane bazowe spożycie to ok. 35 ml na każdy kilogram masy ciała (dla Ciebie: ${fmtN(
            defaultWaterGoalMl
          )} ml). W dni treningowe warto wypić o 500–1000 ml więcej.`}
        </Text>
        <View style={{ height: 10 }} />
        <View style={[styles.rowGap8, { alignItems: 'flex-end' }]}>
          <Field label="Własny cel wody (ml)" style={{ flex: 1 }}>
            <AppInput
              value={waterGoalInput}
              onValueChange={setWaterGoalInput}
              keyboardType="number-pad"
              placeholder="np. 3000"
            />
          </Field>
          <GoButton label="Zapisz cel" onClick={handleSetWaterGoalForm} />
        </View>

        {state.wg != null && (
          <TouchableOpacity
            style={{ marginTop: 8 }}
            onPress={handleResetWaterGoalDefault}
          >
            <Text
              style={{
                fontSize: 14,
                fontWeight: '600',
                color: colors.acc,
                textDecorationLine: 'underline',
              }}
            >
              {`Przywróć cel domyślny (${fmtN(defaultWaterGoalMl)} ml)`}
            </Text>
          </TouchableOpacity>
        )}
      </Card>

      {/* Sen */}
      <SectionH2 text="Sen" />
      <Card style={{ marginTop: 0 }}>
        <View style={styles.rowGap8}>
          <TimePickerField
            label="Poszedłem spać"
            value={bedTime}
            onValueChange={setBedTime}
            style={{ flex: 1 }}
          />
          <TimePickerField
            label="Wstałem"
            value={wakeTime}
            onValueChange={setWakeTime}
            style={{ flex: 1 }}
          />
        </View>

        <View style={{ height: 8 }} />
        <SelectField
          label="Jakość snu"
          value={sleepQuality}
          options={qualityOptions}
          onSelect={setSleepQuality}
        />

        <View style={{ height: 8 }} />
        <View style={styles.rowGap8}>
          <Field label="Głęboki sen (min)" style={{ flex: 1 }}>
            <AppInput
              value={deepSleep}
              onValueChange={setDeepSleep}
              keyboardType="number-pad"
              placeholder="opcjonalnie"
            />
          </Field>
          <Field label="Płytki sen (min)" style={{ flex: 1 }}>
            <AppInput
              value={lightSleep}
              onValueChange={setLightSleep}
              keyboardType="number-pad"
              placeholder="opcjonalnie"
            />
          </Field>
        </View>

        <View style={{ height: 10 }} />
        <GoButton
          label={curSleep != null ? 'Zaktualizuj sen' : 'Zapisz sen'}
          onClick={handleSaveSleep}
        />

        {sleepErr.length > 0 && (
          <>
            <View style={{ height: 6 }} />
            <Text style={{ fontSize: 14, color: colors.acc }}>{sleepErr}</Text>
          </>
        )}

        <View style={{ height: 6 }} />
        <Text style={{ fontSize: 14, color: colors.mut }}>
          Dzień oznacza poranek, w którym wstałeś.
        </Text>
      </Card>

      {/* Podsumowanie snu z dzisiaj */}
      {curSleep != null &&
        (() => {
          const mi = dur(curSleep.b, curSleep.w);
          const goalMi = Math.round(sleepGoal * 60);
          const over = mi >= goalMi;
          const hasStages = curSleep.dp != null || curSleep.lt != null;
          const dp = curSleep.dp ?? 0;
          const lt = curSleep.lt ?? 0;
          const rest = Math.max(0, mi - dp - lt);
          const pc = (x: number) => (mi > 0 ? Math.floor((x * 100) / mi) : 0);

          return (
            <Card>
              <View style={styles.heroRow}>
                <Text
                  style={{
                    fontSize: 44,
                    fontWeight: '700',
                    color: colors.ink,
                  }}
                >
                  {hm(mi)}
                </Text>
                <Text
                  style={{
                    fontSize: 15,
                    color: colors.mut,
                    textAlign: 'right',
                    lineHeight: 20,
                  }}
                >
                  {`cel ${sleepGoal.toFixed(0)} h\n` +
                    (over
                      ? 'cel osiągnięty'
                      : `brakuje ${hm(Math.max(0, goalMi - mi))}`)}
                </Text>
              </View>

              <View style={{ height: 10 }} />
              <Bar
                pct={goalMi > 0 ? (mi / goalMi) * 100.0 : 0.0}
                over={over}
              />

              {hasStages && (
                <>
                  <View style={{ height: 14 }} />
                  <MultiBar total={mi} dp={dp} lt={lt} rest={rest} />
                  <View style={{ height: 14 }} />

                  <View style={styles.statsEvenRow}>
                    <View style={styles.statCol}>
                      <Text
                        style={{
                          fontSize: 22,
                          fontWeight: '700',
                          color: colors.acc,
                        }}
                      >
                        {hm(dp)}
                      </Text>
                      <Text style={{ fontSize: 13, color: colors.mut }}>
                        {`głęboki (${pc(dp)}%)`}
                      </Text>
                    </View>
                    <View style={styles.statCol}>
                      <Text
                        style={{
                          fontSize: 22,
                          fontWeight: '700',
                          color: colors.ok,
                        }}
                      >
                        {hm(lt)}
                      </Text>
                      <Text style={{ fontSize: 13, color: colors.mut }}>
                        {`płytki (${pc(lt)}%)`}
                      </Text>
                    </View>
                    <View style={styles.statCol}>
                      <Text
                        style={{
                          fontSize: 22,
                          fontWeight: '700',
                          color: colors.ink,
                        }}
                      >
                        {hm(rest)}
                      </Text>
                      <Text style={{ fontSize: 13, color: colors.mut }}>
                        {`pozostałe (${pc(rest)}%)`}
                      </Text>
                    </View>
                  </View>
                </>
              )}

              <View style={{ height: 10 }} />
              <TouchableOpacity onPress={handleDelSleep}>
                <Text
                  style={{
                    fontSize: 14,
                    fontWeight: '600',
                    color: colors.acc,
                    textDecorationLine: 'underline',
                  }}
                >
                  Usuń wpis
                </Text>
              </TouchableOpacity>
            </Card>
          );
        })()}

      {/* Ostatnie noce */}
      <SectionH2 text="Ostatnie noce" />
      <Card style={{ marginTop: 0 }}>
        {last7Sleep.length > 0 &&
          (() => {
            const avgSleepMi = Math.round(
              last7Sleep
                .map((s) => dur(s.b, s.w))
                .reduce((a, bVal) => a + bVal, 0) / last7Sleep.length
            );
            const avgQuality =
              last7Sleep.map((s) => s.q).reduce((a, bVal) => a + bVal, 0) /
              last7Sleep.length;

            return (
              <>
                <View style={styles.statsEvenRow}>
                  <View style={styles.statCol}>
                    <Text style={[styles.statVal, { color: colors.ink }]}>
                      {hm(avgSleepMi)}
                    </Text>
                    <Text style={[styles.statLbl, { color: colors.mut }]}>
                      {`średnio (${last7Sleep.length} nocy)`}
                    </Text>
                  </View>
                  <View style={styles.statCol}>
                    <Text style={[styles.statVal, { color: colors.ink }]}>
                      {`${avgQuality.toFixed(1)} / 5`}
                    </Text>
                    <Text style={[styles.statLbl, { color: colors.mut }]}>
                      średnia jakość
                    </Text>
                  </View>
                </View>
                <View style={{ height: 10 }} />
                <Text style={{ fontSize: 14, color: colors.mut }}>
                  Godziny snu w kolejnych dniach
                </Text>
              </>
            );
          })()}

        <ChartCanvas
          pts={last14Sleep.map((s) => ({
            d: s.d,
            y: dur(s.b, s.w) / 60.0,
          }))}
        />

        {(deepList.length > 0 || lightList.length > 0) && (
          <View style={[styles.statsEvenRow, { marginTop: 12 }]}>
            {deepList.length > 0 && (
              <View style={styles.statCol}>
                <Text
                  style={{
                    fontSize: 24,
                    fontWeight: '700',
                    color: colors.ink,
                  }}
                >
                  {hm(
                    Math.round(
                      deepList
                        .map((s) => s.dp ?? 0)
                        .reduce((a, bVal) => a + bVal, 0) / deepList.length
                    )
                  )}
                </Text>
                <Text style={{ fontSize: 13, color: colors.mut }}>
                  średnio głęboki sen
                </Text>
              </View>
            )}
            {lightList.length > 0 && (
              <View style={styles.statCol}>
                <Text
                  style={{
                    fontSize: 24,
                    fontWeight: '700',
                    color: colors.ink,
                  }}
                >
                  {hm(
                    Math.round(
                      lightList
                        .map((s) => s.lt ?? 0)
                        .reduce((a, bVal) => a + bVal, 0) / lightList.length
                    )
                  )}
                </Text>
                <Text style={{ fontSize: 13, color: colors.mut }}>
                  średnio płytki sen
                </Text>
              </View>
            )}
          </View>
        )}
      </Card>

      <Card>
        <View style={[styles.rowGap8, { alignItems: 'flex-end' }]}>
          <Field label="Cel snu w godzinach" style={{ flex: 1 }}>
            <AppInput
              value={sgInput}
              onValueChange={setSgInput}
              keyboardType="decimal-pad"
            />
          </Field>
          <GoButton label="Zapisz" onClick={handleSaveSleepGoal} />
        </View>
      </Card>

      <Card>
        <Text style={{ fontSize: 16, fontWeight: '600', color: colors.ink }}>
          Sen a regeneracja
        </Text>
        <View style={{ height: 6 }} />
        <Text style={{ fontSize: 14, color: colors.mut, lineHeight: 20 }}>
          Do regeneracji po treningu celuj w 7–9 godzin. Pomaga stała pora
          wstawania, mniej ekranu przed snem i kofeina najpóźniej we wczesnych
          godzinach popołudnia.
        </Text>
      </Card>
    </ScreenScroll>
  );
};

const styles = StyleSheet.create({
  heroRow: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  heroBigNum: {
    fontSize: 58,
    fontWeight: '700',
    lineHeight: 58,
  },
  flowRow: {
    width: '100%',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
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
  statVal26: {
    fontSize: 26,
    fontWeight: '700',
  },
  statLbl: {
    fontSize: 13,
    textAlign: 'center',
  },
  presetRow: {
    width: '100%',
    marginTop: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
});
