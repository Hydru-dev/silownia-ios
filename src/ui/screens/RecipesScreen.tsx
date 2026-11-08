import React, { useMemo, useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { JournalData } from '../../data/JournalData';
import { DateUtils, MealEntry, Recipe, num } from '../../data/JournalModels';
import {
  AppInput,
  Card,
  ChipButton,
  DayNav,
  Field,
  GoButton,
  ScreenScroll,
  SectionH2,
  SelectField,
  SelectOption,
} from '../components/CommonUi';
import { AppTheme } from '../theme/Theme';
import { AppTab, JournalViewModelType } from '../../viewmodel/JournalViewModel';

const CATEGORIES = ['Redukcja', 'Masa', 'Utrzymanie'];

export const RecipesScreen: React.FC<{ viewModel: JournalViewModelType }> = ({
  viewModel,
}) => {
  const colors = AppTheme.useColors();
  const { state, cur } = viewModel;

  const [rcat, setRcat] = useState('Redukcja');
  const [rq, setRq] = useState('');
  const [rmt, setRmt] = useState('');
  const [rMax, setRMax] = useState(30);

  const [myName, setMyName] = useState('');
  const [myK, setMyK] = useState('');
  const [myP, setMyP] = useState('');
  const [myC, setMyC] = useState('');
  const [myF, setMyF] = useState('');
  const [myIng, setMyIng] = useState('');
  const [mySteps, setMySteps] = useState('');

  const allCategoryRecipes = useMemo(() => {
    const base = JournalData.RECIPES_BY_CAT[rcat] ?? [];
    const custom = state.myrec.filter((r) => r.cat === rcat);
    return [...base, ...custom];
  }, [rcat, state.myrec]);

  const filteredRecipes = useMemo(() => {
    const q = rq.trim().toLowerCase();
    if (!q) return allCategoryRecipes;
    return allCategoryRecipes.filter((r) => r.n.toLowerCase().includes(q));
  }, [allCategoryRecipes, rq]);

  const visibleRecipes = useMemo(
    () => filteredRecipes.slice(0, rMax),
    [filteredRecipes, rMax]
  );

  const rTot = filteredRecipes.length;
  const rShown = visibleRecipes.length;

  const handleAddRecipeToDay = (r: Recipe) => {
    const chosenType = rmt.length > 0 ? rmt : JournalData.guessMt(r.n);
    const newMeal: MealEntry = {
      id: Date.now(),
      d: cur,
      t: chosenType,
      n: r.n,
      k: r.k,
      p: r.p,
      c: r.c,
      f: r.f,
    };
    viewModel.updateState((prev) => ({
      ...prev,
      meals: [...prev.meals, newMeal],
    }));
    viewModel.selectTab(AppTab.DIET);
  };

  const handleAddCustomRecipe = () => {
    const n = myName.trim();
    if (n.length > 0 && myK.trim().length > 0) {
      const newRec: Recipe = {
        id: Date.now(),
        cat: rcat,
        n,
        k: Math.round(num(myK)),
        p: Math.round(num(myP)),
        c: Math.round(num(myC)),
        f: Math.round(num(myF)),
        i: myIng.trim(),
        s: mySteps.trim(),
      };
      viewModel.updateState((prev) => ({
        ...prev,
        myrec: [...prev.myrec, newRec],
      }));
      setMyName('');
      setMyK('');
      setMyP('');
      setMyC('');
      setMyF('');
      setMyIng('');
      setMySteps('');
    }
  };

  const handleDelCustomRecipe = (id: number) => {
    viewModel.updateState((prev) => ({
      ...prev,
      myrec: prev.myrec.filter((r) => r.id !== id),
    }));
  };

  const rmOptions: SelectOption[] = useMemo(
    () => [
      { value: '', label: 'Automatycznie' },
      ...JournalData.MEAL_TYPES.filter((t) => t[0].length > 0).map((t) => ({
        value: t[0],
        label: t[1],
      })),
    ],
    []
  );

  return (
    <ScreenScroll>
      <DayNav title="Przepisy" />

      <View style={styles.catRow}>
        {CATEGORIES.map((k) => (
          <ChipButton
            key={k}
            label={k}
            active={k === rcat}
            onClick={() => {
              setRcat(k);
              setRMax(30);
            }}
            style={{ flex: 1 }}
          />
        ))}
      </View>

      <View style={{ height: 12 }} />
      <AppInput
        value={rq}
        onValueChange={(val) => {
          setRq(val);
          setRMax(30);
        }}
        placeholder="Szukaj przepisu"
      />

      <View style={{ height: 10 }} />
      <SelectField
        label="Dodaj do posiłku"
        value={rmt}
        options={rmOptions}
        onSelect={setRmt}
      />

      <View style={{ height: 10 }} />
      <Text style={{ fontSize: 14, color: colors.mut }}>
        {`Wartości na 1 porcję, szacunkowe. Przepis dodasz do dnia: ${DateUtils.dlabel(
          cur
        )}.`}
      </Text>

      {visibleRecipes.length === 0 ? (
        <Text style={{ fontSize: 15, color: colors.mut, marginTop: 12 }}>
          Brak pasujących przepisów.
        </Text>
      ) : (
        visibleRecipes.map((r, idx) => (
          <Card key={r.id ?? `${r.cat}_${r.n}_${idx}`}>
            <Text
              style={{
                fontSize: 22,
                fontWeight: '700',
                color: colors.ink,
              }}
            >
              {r.n}
            </Text>
            <View style={{ height: 4 }} />
            <Text style={{ fontSize: 14, color: colors.mut, lineHeight: 20 }}>
              {`${r.k} kcal · B ${r.p} · W ${r.c} · T ${r.f}`}
            </Text>
            {r.i.length > 0 && (
              <>
                <View style={{ height: 6 }} />
                <Text
                  style={{ fontSize: 15, color: colors.ink, lineHeight: 22 }}
                >
                  {r.i}
                </Text>
              </>
            )}
            {r.s.length > 0 && (
              <>
                <View style={{ height: 4 }} />
                <Text
                  style={{ fontSize: 14, color: colors.mut, lineHeight: 20 }}
                >
                  {r.s}
                </Text>
              </>
            )}
            <View style={{ height: 8 }} />
            <GoButton
              label="Dodaj do dnia"
              onClick={() => handleAddRecipeToDay(r)}
            />
            {r.id != null && (
              <>
                <View style={{ height: 6 }} />
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <Text style={{ fontSize: 14, color: colors.mut }}>
                    {'Własny przepis · '}
                  </Text>
                  <TouchableOpacity
                    onPress={() => handleDelCustomRecipe(r.id!)}
                  >
                    <Text
                      style={{
                        fontSize: 14,
                        fontWeight: '600',
                        color: colors.acc,
                        textDecorationLine: 'underline',
                      }}
                    >
                      usuń
                    </Text>
                  </TouchableOpacity>
                </View>
              </>
            )}
          </Card>
        ))
      )}

      {rTot > 0 && (
        <>
          <View style={{ height: 10 }} />
          <Text style={{ fontSize: 14, color: colors.mut }}>
            {`Pokazano ${rShown} z ${rTot}.`}
          </Text>
        </>
      )}

      {rTot > rShown && (
        <>
          <View style={{ height: 10 }} />
          <GoButton
            label={`Pokaż więcej (${rTot - rShown})`}
            onClick={() => setRMax((m) => m + 30)}
          />
        </>
      )}

      <SectionH2 text="Dodaj własny przepis" />
      <Card style={{ marginTop: 0 }}>
        <Field label="Nazwa">
          <AppInput value={myName} onValueChange={setMyName} />
        </Field>
        <View style={{ height: 8 }} />

        <View style={styles.rowGap8}>
          <Field label="kcal" style={{ flex: 1 }}>
            <AppInput
              value={myK}
              onValueChange={setMyK}
              keyboardType="decimal-pad"
            />
          </Field>
          <Field label="Białko g" style={{ flex: 1 }}>
            <AppInput
              value={myP}
              onValueChange={setMyP}
              keyboardType="decimal-pad"
            />
          </Field>
          <Field label="Węgl. g" style={{ flex: 1 }}>
            <AppInput
              value={myC}
              onValueChange={setMyC}
              keyboardType="decimal-pad"
            />
          </Field>
          <Field label="Tłuszcz g" style={{ flex: 1 }}>
            <AppInput
              value={myF}
              onValueChange={setMyF}
              keyboardType="decimal-pad"
            />
          </Field>
        </View>

        <View style={{ height: 8 }} />
        <Field label="Składniki">
          <AppInput
            value={myIng}
            onValueChange={setMyIng}
            singleLine={false}
            maxLines={3}
            style={{ height: 70 }}
          />
        </Field>

        <View style={{ height: 8 }} />
        <Field label="Sposób przygotowania">
          <AppInput
            value={mySteps}
            onValueChange={setMySteps}
            singleLine={false}
            maxLines={4}
            style={{ height: 90 }}
          />
        </Field>

        <View style={{ height: 10 }} />
        <GoButton
          label={`Zapisz w kategorii: ${rcat}`}
          onClick={handleAddCustomRecipe}
        />
      </Card>
    </ScreenScroll>
  );
};

const styles = StyleSheet.create({
  catRow: {
    width: '100%',
    paddingTop: 10,
    flexDirection: 'row',
    gap: 8,
  },
  rowGap8: {
    width: '100%',
    flexDirection: 'row',
    gap: 8,
  },
});
