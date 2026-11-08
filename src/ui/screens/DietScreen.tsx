import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { JournalData } from '../../data/JournalData';
import { MealEntry, SuppItem, num } from '../../data/JournalModels';
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
  SelectField,
  SelectOption,
} from '../components/CommonUi';
import { AppTheme } from '../theme/Theme';
import { JournalViewModelType } from '../../viewmodel/JournalViewModel';

export const DietScreen: React.FC<{ viewModel: JournalViewModelType }> = ({
  viewModel,
}) => {
  const colors = AppTheme.useColors();
  const { state, cur, mt, today } = viewModel;

  const scrollRef = useRef<ScrollView>(null);
  const nameInputRef = useRef<TextInput>(null);

  const [mealName, setMealName] = useState('');
  const [mealK, setMealK] = useState('');
  const [mealP, setMealP] = useState('');
  const [mealC, setMealC] = useState('');
  const [mealF, setMealF] = useState('');

  const [goalK, setGoalK] = useState(state.goals.k.toString());
  const [goalP, setGoalP] = useState(state.goals.p.toString());

  useEffect(() => {
    setGoalK(state.goals.k.toString());
  }, [state.goals.k]);

  useEffect(() => {
    setGoalP(state.goals.p.toString());
  }, [state.goals.p]);

  const [suppName, setSuppName] = useState('');
  const [suppDose, setSuppDose] = useState('');

  const dayMeals = useMemo(
    () => state.meals.filter((m) => m.d === cur),
    [state.meals, cur]
  );

  const kTotal = dayMeals.reduce((acc, m) => acc + m.k, 0);
  const pTotal = dayMeals.reduce((acc, m) => acc + m.p, 0);
  const cTotal = dayMeals.reduce((acc, m) => acc + m.c, 0);
  const fTotal = dayMeals.reduce((acc, m) => acc + m.f, 0);

  const goals = state.goals;
  const pct = goals.k > 0 ? (kTotal / goals.k) * 100.0 : 0.0;
  const left = goals.k - kTotal;

  const handleAddMeal = () => {
    const trimmed = mealName.trim();
    if (trimmed.length > 0 && mealK.trim().length > 0) {
      const newMeal: MealEntry = {
        id: Date.now(),
        d: cur,
        t: mt,
        n: trimmed,
        k: num(mealK),
        p: num(mealP),
        c: num(mealC),
        f: num(mealF),
      };
      viewModel.updateState((prev) => ({
        ...prev,
        meals: [...prev.meals, newMeal],
      }));
      setMealName('');
      setMealK('');
      setMealP('');
      setMealC('');
      setMealF('');
    }
  };

  const handleReMeal = (id: number) => {
    const found = state.meals.find((m) => m.id === id);
    if (found) {
      const reMeal: MealEntry = {
        ...found,
        id: Date.now(),
        d: cur,
        t: found.t ?? mt,
      };
      viewModel.updateState((prev) => ({
        ...prev,
        meals: [...prev.meals, reMeal],
      }));
    }
  };

  const handleDelMeal = (id: number) => {
    viewModel.updateState((prev) => ({
      ...prev,
      meals: prev.meals.filter((m) => m.id !== id),
    }));
  };

  const handleSetGoals = () => {
    const newK = Math.max(500, Math.round(num(goalK)));
    const newP = Math.max(20, Math.round(num(goalP)));
    viewModel.updateState((prev) => ({
      ...prev,
      goals: { k: newK, p: newP },
    }));
  };

  const recentMeals = useMemo(() => {
    const list: MealEntry[] = [];
    const seen = new Set<string>();
    [...state.meals].reverse().forEach((m) => {
      if (!seen.has(m.n) && list.length < 6) {
        seen.add(m.n);
        list.push(m);
      }
    });
    return list;
  }, [state.meals]);

  const suppsList = state.supps;
  const doneSupps = state.sl[cur] ?? [];
  const doneCount = suppsList.filter((s) => doneSupps.includes(s.id)).length;
  const availablePresets = JournalData.PRESET_SUPPS.filter(
    (p) => !suppsList.some((s) => s.n === p[0])
  );

  const addSupp = (n: string, dose: string) => {
    if (n.trim().length > 0) {
      const item: SuppItem = {
        id: Date.now() + Math.floor(Math.random() * 1000),
        n: n.trim(),
        dose: dose.trim(),
      };
      viewModel.updateState((prev) => ({
        ...prev,
        supps: [...prev.supps, item],
      }));
    }
  };

  const toggleSupp = (id: number) => {
    viewModel.updateState((prev) => {
      const sl = { ...prev.sl };
      const list = [...(sl[cur] ?? [])];
      const idx = list.indexOf(id);
      if (idx >= 0) list.splice(idx, 1);
      else list.push(id);
      sl[cur] = list;
      return { ...prev, sl };
    });
  };

  const delSupp = (id: number) => {
    viewModel.updateState((prev) => ({
      ...prev,
      supps: prev.supps.filter((s) => s.id !== id),
    }));
  };

  const mealSelectOptions: SelectOption[] = useMemo(
    () =>
      JournalData.MEAL_TYPES.filter((t) => t[0].length > 0).map((t) => ({
        value: t[0],
        label: t[1],
      })),
    []
  );

  return (
    <ScreenScroll scrollViewRef={scrollRef}>
      <DayNav
        cur={cur}
        today={today}
        onShift={(d) => viewModel.shift(d)}
        onDateSelected={(d) => viewModel.setCur(d)}
      />

      {/* Hero Card */}
      <Card>
        <View style={styles.heroTopRow}>
          <Text style={[styles.heroKcalText, { color: colors.ink }]}>
            {Math.round(kTotal)}
          </Text>
          <Text style={[styles.heroRightText, { color: colors.mut }]}>
            {`z ${goals.k} kcal\n` +
              (left >= 0
                ? `zostało ${Math.round(left)}`
                : `ponad o ${Math.round(-left)}`)}
          </Text>
        </View>

        <View style={{ height: 10 }} />
        <Bar pct={pct} />
        <View style={{ height: 14 }} />

        <View style={styles.macrosRow}>
          <View style={styles.macroCol}>
            <Text style={[styles.macroVal, { color: colors.ink }]}>
              {Math.round(pTotal)} g
            </Text>
            <Text style={[styles.macroLbl, { color: colors.mut }]}>
              białko (cel {goals.p})
            </Text>
          </View>
          <View style={styles.macroCol}>
            <Text style={[styles.macroVal, { color: colors.ink }]}>
              {Math.round(cTotal)} g
            </Text>
            <Text style={[styles.macroLbl, { color: colors.mut }]}>
              węglowodany
            </Text>
          </View>
          <View style={styles.macroCol}>
            <Text style={[styles.macroVal, { color: colors.ink }]}>
              {Math.round(fTotal)} g
            </Text>
            <Text style={[styles.macroLbl, { color: colors.mut }]}>
              tłuszcze
            </Text>
          </View>
        </View>
      </Card>

      {/* Dodaj posiłek */}
      <SectionH2 text="Dodaj posiłek" />
      <Card style={{ marginTop: 0 }}>
        <Field label="Nazwa">
          <AppInput
            value={mealName}
            onValueChange={setMealName}
            placeholder="np. owsianka z bananem"
            inputRef={nameInputRef}
          />
        </Field>
        <View style={{ height: 8 }} />
        <SelectField
          label="Posiłek"
          value={mt}
          options={mealSelectOptions}
          onSelect={(val) => viewModel.setMt(val)}
        />
        <View style={{ height: 8 }} />

        <View style={styles.rowGap8}>
          <Field label="kcal" style={{ flex: 1 }}>
            <AppInput
              value={mealK}
              onValueChange={setMealK}
              keyboardType="decimal-pad"
            />
          </Field>
          <Field label="Białko g" style={{ flex: 1 }}>
            <AppInput
              value={mealP}
              onValueChange={setMealP}
              keyboardType="decimal-pad"
            />
          </Field>
          <Field label="Węgl. g" style={{ flex: 1 }}>
            <AppInput
              value={mealC}
              onValueChange={setMealC}
              keyboardType="decimal-pad"
            />
          </Field>
          <Field label="Tłuszcz g" style={{ flex: 1 }}>
            <AppInput
              value={mealF}
              onValueChange={setMealF}
              keyboardType="decimal-pad"
            />
          </Field>
        </View>
        <View style={{ height: 10 }} />
        <GoButton label="Dodaj posiłek" onClick={handleAddMeal} />
      </Card>

      {/* Posiłki */}
      <SectionH2 text="Posiłki" />
      {JournalData.MEAL_TYPES.map((t) => {
        const list = dayMeals.filter((m) => (m.t ?? '') === t[0]);
        if (!t[0] && list.length === 0) return null;

        return (
          <Card key={`meal_group_${t[0]}`}>
            <View style={styles.groupHeaderRow}>
              <Text style={[styles.groupTitle, { color: colors.ink }]}>
                {t[1]}
              </Text>
              <View style={styles.rowCenter}>
                {list.length > 0 && (
                  <Text
                    style={{
                      fontSize: 14,
                      color: colors.mut,
                      marginRight: 8,
                    }}
                  >
                    {Math.round(list.reduce((s, m) => s + m.k, 0))} kcal
                  </Text>
                )}
                {t[0].length > 0 && (
                  <MiniButton
                    label="+ Dodaj"
                    onClick={() => {
                      viewModel.setMt(t[0]);
                      scrollRef.current?.scrollTo({ y: 0, animated: true });
                      setTimeout(() => nameInputRef.current?.focus(), 200);
                    }}
                  />
                )}
              </View>
            </View>

            {list.map((m, index) => (
              <React.Fragment key={m.id}>
                {index > 0 && (
                  <View
                    style={[styles.divider, { backgroundColor: colors.line }]}
                  />
                )}
                <View style={styles.itemRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 16, color: colors.ink }}>
                      {m.n}
                    </Text>
                    <Text style={{ fontSize: 13, color: colors.mut }}>
                      {`${Math.round(m.k)} kcal · B ${Math.round(
                        m.p
                      )} · W ${Math.round(m.c)} · T ${Math.round(m.f)}`}
                    </Text>
                  </View>
                  <TouchableOpacity
                    style={styles.delCircleBtn}
                    onPress={() => handleDelMeal(m.id)}
                  >
                    <Text style={{ fontSize: 22, color: colors.mut }}>×</Text>
                  </TouchableOpacity>
                </View>
              </React.Fragment>
            ))}
          </Card>
        );
      })}

      {/* Szybko dodaj ponownie */}
      {recentMeals.length > 0 && (
        <>
          <SectionH2 text="Szybko dodaj ponownie" />
          <Card style={{ marginTop: 0 }}>
            {recentMeals.map((m, index) => (
              <React.Fragment key={`recent_${m.id}`}>
                {index > 0 && (
                  <View
                    style={[styles.divider, { backgroundColor: colors.line }]}
                  />
                )}
                <View style={styles.recentRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 16, color: colors.ink }}>
                      {m.n}
                    </Text>
                    <Text style={{ fontSize: 13, color: colors.mut }}>
                      {`${Math.round(m.k)} kcal · B ${Math.round(m.p)}`}
                    </Text>
                  </View>
                  <GoButton
                    label="Dodaj"
                    onClick={() => handleReMeal(m.id)}
                  />
                </View>
              </React.Fragment>
            ))}
          </Card>
        </>
      )}

      {/* Cele dzienne */}
      <SectionH2 text="Cele dzienne" />
      <Card style={{ marginTop: 0 }}>
        <View style={[styles.rowGap8, { alignItems: 'flex-end' }]}>
          <Field label="kcal" style={{ flex: 1 }}>
            <AppInput
              value={goalK}
              onValueChange={setGoalK}
              keyboardType="number-pad"
            />
          </Field>
          <Field label="Białko g" style={{ flex: 1 }}>
            <AppInput
              value={goalP}
              onValueChange={setGoalP}
              keyboardType="number-pad"
            />
          </Field>
          <GoButton label="Zapisz" onClick={handleSetGoals} />
        </View>
      </Card>

      {/* Suplementy */}
      <SectionH2 text="Suplementy" />
      <Card style={{ marginTop: 0 }}>
        {suppsList.length === 0 ? (
          <Text style={{ fontSize: 15, color: colors.mut }}>
            Dodaj suplementy, które bierzesz, a każdego dnia odhaczysz je tutaj.
          </Text>
        ) : (
          <>
            <Text style={{ fontSize: 14, color: colors.mut }}>
              {`Wzięte tego dnia: ${doneCount} z ${suppsList.length}`}
            </Text>
            <View style={{ height: 8 }} />
            {suppsList.map((s, index) => {
              const isDone = doneSupps.includes(s.id);
              return (
                <React.Fragment key={s.id}>
                  {index > 0 && (
                    <View
                      style={[styles.divider, { backgroundColor: colors.line }]}
                    />
                  )}
                  <View style={styles.recentRow}>
                    <TouchableOpacity
                      style={styles.suppToggleRow}
                      onPress={() => toggleSupp(s.id)}
                      activeOpacity={0.7}
                    >
                      <View
                        style={[
                          styles.checkbox,
                          {
                            backgroundColor: isDone ? colors.ok : 'transparent',
                            borderColor: isDone ? colors.ok : colors.line,
                          },
                        ]}
                      >
                        {isDone && (
                          <Text
                            style={{
                              color: '#FFFFFF',
                              fontWeight: '700',
                              fontSize: 16,
                            }}
                          >
                            ✓
                          </Text>
                        )}
                      </View>
                      <View>
                        <Text style={{ fontSize: 16, color: colors.ink }}>
                          {s.n}
                        </Text>
                        {s.dose.length > 0 && (
                          <Text style={{ fontSize: 13, color: colors.mut }}>
                            {s.dose}
                          </Text>
                        )}
                      </View>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.delCircleBtn}
                      onPress={() => delSupp(s.id)}
                    >
                      <Text style={{ fontSize: 22, color: colors.mut }}>×</Text>
                    </TouchableOpacity>
                  </View>
                </React.Fragment>
              );
            })}
          </>
        )}
      </Card>

      {availablePresets.length > 0 && (
        <>
          <View style={{ height: 10 }} />
          <View style={styles.flowRow}>
            {availablePresets.map((p) => (
              <ChipButton
                key={p[0]}
                label={`+ ${p[0]}`}
                onClick={() => addSupp(p[0], p[1])}
              />
            ))}
          </View>
        </>
      )}

      <Card>
        <View style={[styles.rowGap8, { alignItems: 'flex-end' }]}>
          <Field label="Własny suplement" style={{ flex: 1 }}>
            <AppInput value={suppName} onValueChange={setSuppName} />
          </Field>
          <Field label="Dawka" style={{ flex: 1 }}>
            <AppInput value={suppDose} onValueChange={setSuppDose} />
          </Field>
          <GoButton
            label="Dodaj"
            onClick={() => {
              addSupp(suppName, suppDose);
              setSuppName('');
              setSuppDose('');
            }}
          />
        </View>
      </Card>

      <View style={{ height: 10 }} />
      <Text style={{ fontSize: 14, color: colors.mut }}>
        Dawkę dobierz według opakowania. Przy chorobach lub lekach zapytaj
        lekarza albo farmaceutę.
      </Text>
    </ScreenScroll>
  );
};

const styles = StyleSheet.create({
  heroTopRow: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  heroKcalText: {
    fontSize: 58,
    fontWeight: '700',
    lineHeight: 58,
  },
  heroRightText: {
    fontSize: 15,
    textAlign: 'right',
    lineHeight: 20,
  },
  macrosRow: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-evenly',
  },
  macroCol: {
    alignItems: 'center',
  },
  macroVal: {
    fontSize: 24,
    fontWeight: '700',
  },
  macroLbl: {
    fontSize: 13,
  },
  rowGap8: {
    width: '100%',
    flexDirection: 'row',
    gap: 8,
  },
  groupHeaderRow: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  groupTitle: {
    fontSize: 20,
    fontWeight: '700',
  },
  rowCenter: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  divider: {
    width: '100%',
    height: 1,
  },
  itemRow: {
    width: '100%',
    paddingVertical: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  recentRow: {
    width: '100%',
    paddingVertical: 8,
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
  suppToggleRow: {
    flex: 1,
    paddingVertical: 4,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  checkbox: {
    width: 26,
    height: 26,
    borderRadius: 8,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  flowRow: {
    width: '100%',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
});
