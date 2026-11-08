import React, { useMemo, useState } from 'react';
import {
  FlatList,
  KeyboardTypeOptions,
  LayoutChangeEvent,
  Modal,
  Pressable,
  ScrollView,
  StyleProp,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  ViewStyle,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Circle, Line, Path, Text as SvgText } from 'react-native-svg';
import { DateUtils } from '../../data/JournalModels';
import { AppTheme } from '../theme/Theme';
import { AppTab, AppTabEntries, AppTabLabels } from '../../viewmodel/JournalViewModel';

export const ScreenScroll: React.FC<{
  style?: StyleProp<ViewStyle>;
  scrollViewRef?: React.RefObject<ScrollView>;
  children: React.ReactNode;
}> = ({ style, scrollViewRef, children }) => {
  const colors = AppTheme.useColors();

  return (
    <SafeAreaView
      edges={['top']}
      style={[
        styles.screenContainer,
        { backgroundColor: colors.bg },
        style,
      ]}
    >
      <ScrollView
        ref={scrollViewRef}
        style={styles.maxWidthContainer}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        {children}
      </ScrollView>
    </SafeAreaView>
  );
};

export const ScreenLazyColumn: React.FC<{
  style?: StyleProp<ViewStyle>;
  scrollViewRef?: React.RefObject<ScrollView>;
  children: React.ReactNode;
}> = ({ style, scrollViewRef, children }) => {
  return (
    <ScreenScroll style={style} scrollViewRef={scrollViewRef}>
      {children}
    </ScreenScroll>
  );
};

interface DateModalPickerProps {
  visible: boolean;
  value: string;
  onClose: () => void;
  onSelect: (ymd: string) => void;
}

const DateModalPicker: React.FC<DateModalPickerProps> = ({
  visible,
  value,
  onClose,
  onSelect,
}) => {
  const colors = AppTheme.useColors();
  const parts = value.split('-');
  const now = new Date();
  const [year, setYear] = useState<number>(
    parseInt(parts[0], 10) || now.getFullYear()
  );
  const [month, setMonth] = useState<number>(
    parseInt(parts[1], 10) || now.getMonth() + 1
  );
  const [day, setDay] = useState<number>(
    parseInt(parts[2], 10) || now.getDate()
  );

  React.useEffect(() => {
    if (visible) {
      const p = value.split('-');
      const d = new Date();
      setYear(parseInt(p[0], 10) || d.getFullYear());
      setMonth(parseInt(p[1], 10) || d.getMonth() + 1);
      setDay(parseInt(p[2], 10) || d.getDate());
    }
  }, [visible, value]);

  const daysInMonth = new Date(year, month, 0).getDate();
  const clampedDay = Math.min(day, daysInMonth);

  const handleConfirm = () => {
    const formatted = `${String(year).padStart(4, '0')}-${String(month).padStart(
      2,
      '0'
    )}-${String(clampedDay).padStart(2, '0')}`;
    onSelect(formatted);
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.modalBackdrop} onPress={onClose}>
        <Pressable
          style={[
            styles.modalCard,
            { backgroundColor: colors.card, borderColor: colors.line },
          ]}
          onPress={(e) => e.stopPropagation()}
        >
          <Text style={[styles.modalTitle, { color: colors.ink }]}>
            Wybierz datę
          </Text>

          <View style={styles.pickerRow}>
            <View style={styles.pickerCol}>
              <Text style={[styles.pickerLabel, { color: colors.mut }]}>Rok</Text>
              <View style={styles.stepperRow}>
                <TouchableOpacity
                  style={[styles.stepBtn, { borderColor: colors.line }]}
                  onPress={() => setYear((y) => y - 1)}
                >
                  <Text style={{ color: colors.ink, fontSize: 18 }}>−</Text>
                </TouchableOpacity>
                <Text style={[styles.pickerVal, { color: colors.ink }]}>{year}</Text>
                <TouchableOpacity
                  style={[styles.stepBtn, { borderColor: colors.line }]}
                  onPress={() => setYear((y) => y + 1)}
                >
                  <Text style={{ color: colors.ink, fontSize: 18 }}>+</Text>
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.pickerCol}>
              <Text style={[styles.pickerLabel, { color: colors.mut }]}>Miesiąc</Text>
              <View style={styles.stepperRow}>
                <TouchableOpacity
                  style={[styles.stepBtn, { borderColor: colors.line }]}
                  onPress={() => setMonth((m) => (m <= 1 ? 12 : m - 1))}
                >
                  <Text style={{ color: colors.ink, fontSize: 18 }}>−</Text>
                </TouchableOpacity>
                <Text style={[styles.pickerVal, { color: colors.ink }]}>
                  {String(month).padStart(2, '0')}
                </Text>
                <TouchableOpacity
                  style={[styles.stepBtn, { borderColor: colors.line }]}
                  onPress={() => setMonth((m) => (m >= 12 ? 1 : m + 1))}
                >
                  <Text style={{ color: colors.ink, fontSize: 18 }}>+</Text>
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.pickerCol}>
              <Text style={[styles.pickerLabel, { color: colors.mut }]}>Dzień</Text>
              <View style={styles.stepperRow}>
                <TouchableOpacity
                  style={[styles.stepBtn, { borderColor: colors.line }]}
                  onPress={() =>
                    setDay((d) => (d <= 1 ? daysInMonth : Math.min(daysInMonth, d) - 1))
                  }
                >
                  <Text style={{ color: colors.ink, fontSize: 18 }}>−</Text>
                </TouchableOpacity>
                <Text style={[styles.pickerVal, { color: colors.ink }]}>
                  {String(clampedDay).padStart(2, '0')}
                </Text>
                <TouchableOpacity
                  style={[styles.stepBtn, { borderColor: colors.line }]}
                  onPress={() => setDay((d) => (d >= daysInMonth ? 1 : d + 1))}
                >
                  <Text style={{ color: colors.ink, fontSize: 18 }}>+</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>

          <View style={styles.modalActions}>
            <TouchableOpacity onPress={onClose} style={styles.modalBtn}>
              <Text style={{ color: colors.mut, fontSize: 15, fontWeight: '600' }}>
                Anuluj
              </Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={handleConfirm} style={styles.modalBtn}>
              <Text style={{ color: colors.acc, fontSize: 15, fontWeight: '700' }}>
                OK
              </Text>
            </TouchableOpacity>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
};

interface TimeModalPickerProps {
  visible: boolean;
  value: string;
  onClose: () => void;
  onSelect: (hmStr: string) => void;
}

const TimeModalPicker: React.FC<TimeModalPickerProps> = ({
  visible,
  value,
  onClose,
  onSelect,
}) => {
  const colors = AppTheme.useColors();
  const parts = value.split(':');
  const [hour, setHour] = useState<number>(parseInt(parts[0], 10) || 23);
  const [minute, setMinute] = useState<number>(parseInt(parts[1], 10) || 0);

  React.useEffect(() => {
    if (visible) {
      const p = value.split(':');
      const h = parseInt(p[0], 10);
      const m = parseInt(p[1], 10);
      setHour(isNaN(h) ? 23 : h);
      setMinute(isNaN(m) ? 0 : m);
    }
  }, [visible, value]);

  const handleConfirm = () => {
    const formatted = `${String(hour).padStart(2, '0')}:${String(minute).padStart(
      2,
      '0'
    )}`;
    onSelect(formatted);
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.modalBackdrop} onPress={onClose}>
        <Pressable
          style={[
            styles.modalCard,
            { backgroundColor: colors.card, borderColor: colors.line },
          ]}
          onPress={(e) => e.stopPropagation()}
        >
          <Text style={[styles.modalTitle, { color: colors.ink }]}>
            Wybierz godzinę
          </Text>

          <View style={styles.pickerRow}>
            <View style={styles.pickerCol}>
              <Text style={[styles.pickerLabel, { color: colors.mut }]}>Godzina</Text>
              <View style={styles.stepperRow}>
                <TouchableOpacity
                  style={[styles.stepBtn, { borderColor: colors.line }]}
                  onPress={() => setHour((h) => (h <= 0 ? 23 : h - 1))}
                >
                  <Text style={{ color: colors.ink, fontSize: 18 }}>−</Text>
                </TouchableOpacity>
                <Text style={[styles.pickerVal, { color: colors.ink }]}>
                  {String(hour).padStart(2, '0')}
                </Text>
                <TouchableOpacity
                  style={[styles.stepBtn, { borderColor: colors.line }]}
                  onPress={() => setHour((h) => (h >= 23 ? 0 : h + 1))}
                >
                  <Text style={{ color: colors.ink, fontSize: 18 }}>+</Text>
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.pickerCol}>
              <Text style={[styles.pickerLabel, { color: colors.mut }]}>Minuta</Text>
              <View style={styles.stepperRow}>
                <TouchableOpacity
                  style={[styles.stepBtn, { borderColor: colors.line }]}
                  onPress={() => setMinute((m) => (m - 5 < 0 ? 55 : m - 5))}
                >
                  <Text style={{ color: colors.ink, fontSize: 18 }}>−</Text>
                </TouchableOpacity>
                <Text style={[styles.pickerVal, { color: colors.ink }]}>
                  {String(minute).padStart(2, '0')}
                </Text>
                <TouchableOpacity
                  style={[styles.stepBtn, { borderColor: colors.line }]}
                  onPress={() => setMinute((m) => (m + 5 >= 60 ? 0 : m + 5))}
                >
                  <Text style={{ color: colors.ink, fontSize: 18 }}>+</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>

          <View style={styles.modalActions}>
            <TouchableOpacity onPress={onClose} style={styles.modalBtn}>
              <Text style={{ color: colors.mut, fontSize: 15, fontWeight: '600' }}>
                Anuluj
              </Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={handleConfirm} style={styles.modalBtn}>
              <Text style={{ color: colors.acc, fontSize: 15, fontWeight: '700' }}>
                OK
              </Text>
            </TouchableOpacity>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
};

export const DayNav: React.FC<{
  title?: string;
  cur?: string;
  today?: string;
  onShift?: (delta: number) => void;
  onDateSelected?: (d: string) => void;
}> = ({ title, cur = '', today = '', onShift, onDateSelected }) => {
  const colors = AppTheme.useColors();
  const [calendarOpen, setCalendarOpen] = useState(false);

  if (title != null) {
    return (
      <View style={styles.dayNavTitleBox}>
        <Text style={[styles.dayNavTitleText, { color: colors.ink }]}>
          {title}
        </Text>
      </View>
    );
  }

  return (
    <>
      <View style={styles.dayNavRow}>
        <TouchableOpacity
          style={[
            styles.dayNavCircleBtn,
            { backgroundColor: colors.card, borderColor: colors.line },
          ]}
          onPress={() => onShift?.(-1)}
          activeOpacity={0.7}
        >
          <Text style={[styles.dayNavArrow, { color: colors.ink }]}>‹</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.dayNavCenter}
          disabled={!onDateSelected}
          onPress={() => setCalendarOpen(true)}
          activeOpacity={0.7}
        >
          <Text style={[styles.dayNavTitleText, { color: colors.ink }]}>
            {cur === today ? 'Dziś' : DateUtils.weekday(cur)}
          </Text>
          <Text style={[styles.dayNavSubText, { color: colors.mut }]}>
            {DateUtils.longDate(cur)}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.dayNavCircleBtn,
            { backgroundColor: colors.card, borderColor: colors.line },
          ]}
          onPress={() => onShift?.(1)}
          activeOpacity={0.7}
        >
          <Text style={[styles.dayNavArrow, { color: colors.ink }]}>›</Text>
        </TouchableOpacity>
      </View>

      {onDateSelected && (
        <DateModalPicker
          visible={calendarOpen}
          value={cur}
          onClose={() => setCalendarOpen(false)}
          onSelect={onDateSelected}
        />
      )}
    </>
  );
};

export const SectionH2: React.FC<{
  text: string;
  style?: StyleProp<ViewStyle>;
}> = ({ text, style }) => {
  const colors = AppTheme.useColors();
  return (
    <View style={[styles.sectionH2Container, style]}>
      <Text style={[styles.sectionH2Text, { color: colors.ink }]}>{text}</Text>
    </View>
  );
};

export const Card: React.FC<{
  style?: StyleProp<ViewStyle>;
  children: React.ReactNode;
}> = ({ style, children }) => {
  const colors = AppTheme.useColors();
  return (
    <View
      style={[
        styles.card,
        { backgroundColor: colors.card, borderColor: colors.line },
        style,
      ]}
    >
      {children}
    </View>
  );
};

export const Bar: React.FC<{
  pct: number;
  style?: StyleProp<ViewStyle>;
  over?: boolean;
}> = ({ pct, style, over = false }) => {
  const colors = AppTheme.useColors();
  const clamped = Math.min(100, Math.max(0, pct));

  return (
    <View
      style={[
        styles.barTrack,
        { backgroundColor: colors.line },
        style,
      ]}
    >
      <View
        style={[
          styles.barFill,
          {
            width: `${clamped}%`,
            backgroundColor: over ? colors.ok : colors.acc,
          },
        ]}
      />
    </View>
  );
};

export const MultiBar: React.FC<{
  total: number;
  dp: number;
  lt: number;
  rest: number;
  style?: StyleProp<ViewStyle>;
}> = ({ total, dp, lt, rest, style }) => {
  const colors = AppTheme.useColors();
  if (total <= 0) return null;

  const dpPct = Math.min(1, Math.max(0, dp / total));
  const ltPct = Math.min(1, Math.max(0, lt / total));
  const restPct = Math.min(1, Math.max(0, rest / total));

  return (
    <View
      style={[
        styles.multiBarTrack,
        { backgroundColor: colors.line },
        style,
      ]}
    >
      {dpPct > 0 && (
        <View style={{ flex: dpPct, backgroundColor: colors.acc }} />
      )}
      {ltPct > 0 && (
        <View style={{ flex: ltPct, backgroundColor: colors.ok }} />
      )}
      {restPct > 0 && (
        <View style={{ flex: restPct, backgroundColor: colors.mut }} />
      )}
    </View>
  );
};

export const GoButton: React.FC<{
  label: string;
  onClick: () => void;
  style?: StyleProp<ViewStyle>;
}> = ({ label, onClick, style }) => {
  const colors = AppTheme.useColors();
  return (
    <TouchableOpacity
      style={[
        styles.goButton,
        { backgroundColor: colors.acc },
        style,
      ]}
      onPress={onClick}
      activeOpacity={0.8}
    >
      <Text style={[styles.goButtonText, { color: colors.accInk }]}>
        {label}
      </Text>
    </TouchableOpacity>
  );
};

export const MiniButton: React.FC<{
  label: string;
  onClick: () => void;
  style?: StyleProp<ViewStyle>;
}> = ({ label, onClick, style }) => {
  const colors = AppTheme.useColors();
  return (
    <TouchableOpacity
      style={[
        styles.miniButton,
        { backgroundColor: colors.bg, borderColor: colors.line },
        style,
      ]}
      onPress={onClick}
      activeOpacity={0.75}
    >
      <Text style={[styles.miniButtonText, { color: colors.ink }]}>
        {label}
      </Text>
    </TouchableOpacity>
  );
};

export const ChipButton: React.FC<{
  label: string;
  active?: boolean;
  onClick: () => void;
  style?: StyleProp<ViewStyle>;
}> = ({ label, active = false, onClick, style }) => {
  const colors = AppTheme.useColors();
  return (
    <TouchableOpacity
      style={[
        styles.chipButton,
        {
          backgroundColor: active ? colors.acc : colors.card,
          borderColor: active ? colors.acc : colors.line,
        },
        style,
      ]}
      onPress={onClick}
      activeOpacity={0.75}
    >
      <Text
        style={[
          styles.chipButtonText,
          { color: active ? colors.accInk : colors.ink },
        ]}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );
};

export const Field: React.FC<{
  label: string;
  style?: StyleProp<ViewStyle>;
  children: React.ReactNode;
}> = ({ label, style, children }) => {
  const colors = AppTheme.useColors();
  return (
    <View style={[styles.fieldContainer, style]}>
      <Text style={[styles.fieldLabel, { color: colors.mut }]}>{label}</Text>
      {children}
    </View>
  );
};

export const AppInput: React.FC<{
  value: string;
  onValueChange: (val: string) => void;
  style?: StyleProp<ViewStyle>;
  placeholder?: string;
  keyboardType?: KeyboardTypeOptions;
  singleLine?: boolean;
  maxLines?: number;
  inputRef?: React.RefObject<TextInput>;
}> = ({
  value,
  onValueChange,
  style,
  placeholder = '',
  keyboardType = 'default',
  singleLine = true,
  maxLines = 1,
  inputRef,
}) => {
  const colors = AppTheme.useColors();
  const [focused, setFocused] = useState(false);

  return (
    <TextInput
      ref={inputRef}
      value={value}
      onChangeText={onValueChange}
      placeholder={placeholder}
      placeholderTextColor={colors.mut}
      keyboardType={keyboardType}
      multiline={!singleLine}
      numberOfLines={maxLines}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
      style={[
        styles.appInput,
        {
          color: colors.ink,
          backgroundColor: colors.bg,
          borderColor: focused ? colors.acc : colors.line,
          textAlignVertical: singleLine ? 'center' : 'top',
        },
        style as any,
      ]}
    />
  );
};

export const TimePickerField: React.FC<{
  label: string;
  value: string;
  onValueChange: (val: string) => void;
  style?: StyleProp<ViewStyle>;
}> = ({ label, value, onValueChange, style }) => {
  const colors = AppTheme.useColors();
  const [open, setOpen] = useState(false);

  return (
    <Field label={label} style={style}>
      <TouchableOpacity
        style={[
          styles.pickerTrigger,
          { backgroundColor: colors.bg, borderColor: colors.line },
        ]}
        onPress={() => setOpen(true)}
        activeOpacity={0.75}
      >
        <Text style={{ fontSize: 16, color: colors.ink }}>{value}</Text>
        <Text style={{ fontSize: 14 }}>🕒</Text>
      </TouchableOpacity>
      <TimeModalPicker
        visible={open}
        value={value}
        onClose={() => setOpen(false)}
        onSelect={onValueChange}
      />
    </Field>
  );
};

export const DatePickerField: React.FC<{
  label: string;
  value: string;
  onValueChange: (val: string) => void;
  style?: StyleProp<ViewStyle>;
}> = ({ label, value, onValueChange, style }) => {
  const colors = AppTheme.useColors();
  const [open, setOpen] = useState(false);

  return (
    <Field label={label} style={style}>
      <TouchableOpacity
        style={[
          styles.pickerTrigger,
          { backgroundColor: colors.bg, borderColor: colors.line },
        ]}
        onPress={() => setOpen(true)}
        activeOpacity={0.75}
      >
        <Text style={{ fontSize: 16, color: colors.ink }}>{value}</Text>
        <Text style={{ fontSize: 14 }}>📅</Text>
      </TouchableOpacity>
      <DateModalPicker
        visible={open}
        value={value}
        onClose={() => setOpen(false)}
        onSelect={onValueChange}
      />
    </Field>
  );
};

export interface SelectOption {
  value: string;
  label: string;
}

export const SelectField: React.FC<{
  value: string;
  options: SelectOption[];
  onSelect: (val: string) => void;
  style?: StyleProp<ViewStyle>;
  label?: string;
}> = ({ value, options, onSelect, style, label }) => {
  const colors = AppTheme.useColors();
  const [openDialog, setOpenDialog] = useState(false);

  const currentLabel = useMemo(
    () => options.find((o) => o.value === value)?.label ?? value,
    [options, value]
  );

  const trigger = (
    <TouchableOpacity
      style={[
        styles.selectTrigger,
        { backgroundColor: colors.bg, borderColor: colors.line },
      ]}
      onPress={() => setOpenDialog(true)}
      activeOpacity={0.75}
    >
      <Text
        style={[styles.selectTriggerText, { color: colors.ink }]}
        numberOfLines={1}
      >
        {currentLabel}
      </Text>
      <Text style={{ fontSize: 14, color: colors.mut }}>▾</Text>
    </TouchableOpacity>
  );

  return (
    <>
      {label != null ? (
        <Field label={label} style={style}>
          {trigger}
        </Field>
      ) : (
        <View style={style}>{trigger}</View>
      )}

      <Modal
        visible={openDialog}
        transparent
        animationType="fade"
        onRequestClose={() => setOpenDialog(false)}
      >
        <Pressable
          style={styles.modalBackdrop}
          onPress={() => setOpenDialog(false)}
        >
          <Pressable
            style={[
              styles.modalCard,
              { backgroundColor: colors.card, borderColor: colors.line },
            ]}
            onPress={(e) => e.stopPropagation()}
          >
            <Text style={[styles.modalTitle, { color: colors.ink }]}>
              {label ?? 'Wybierz opcję'}
            </Text>

            <FlatList
              data={options}
              keyExtractor={(item, idx) => `${item.value}_${idx}`}
              style={{ maxHeight: 350 }}
              renderItem={({ item: opt }) => {
                const selected = opt.value === value;
                return (
                  <TouchableOpacity
                    style={[
                      styles.selectOptionRow,
                      {
                        backgroundColor: selected
                          ? colors.bg
                          : 'transparent',
                      },
                    ]}
                    onPress={() => {
                      onSelect(opt.value);
                      setOpenDialog(false);
                    }}
                  >
                    <Text
                      style={{
                        fontSize: 16,
                        fontWeight: selected ? '600' : '400',
                        color: selected ? colors.acc : colors.ink,
                        flex: 1,
                      }}
                    >
                      {opt.label}
                    </Text>
                    {selected && (
                      <Text
                        style={{
                          fontSize: 16,
                          fontWeight: '700',
                          color: colors.acc,
                        }}
                      >
                        ✓
                      </Text>
                    )}
                  </TouchableOpacity>
                );
              }}
            />

            <View style={styles.modalActions}>
              <TouchableOpacity
                onPress={() => setOpenDialog(false)}
                style={styles.modalBtn}
              >
                <Text
                  style={{ color: colors.acc, fontSize: 15, fontWeight: '600' }}
                >
                  Zamknij
                </Text>
              </TouchableOpacity>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
};

export interface ChartPoint {
  d: string;
  y: number;
}

export const ChartCanvas: React.FC<{
  pts: ChartPoint[];
  style?: StyleProp<ViewStyle>;
}> = ({ pts, style }) => {
  const colors = AppTheme.useColors();
  const [width, setWidth] = useState(320);

  if (pts.length < 2) {
    return (
      <Text
        style={[
          { fontSize: 15, color: colors.mut, marginTop: 6 },
          style as any,
        ]}
      >
        Potrzeba co najmniej dwóch pomiarów, żeby narysować wykres.
      </Text>
    );
  }

  const height = 165;
  const paddingLeft = 40;
  const paddingRight = 10;
  const bottomAreaHeight = 24;
  const topAreaHeight = 16;
  const chartHeight = height - bottomAreaHeight - topAreaHeight;

  const ys = pts.map((p) => p.y);
  let lo = Math.min(...ys);
  let hi = Math.max(...ys);
  if (hi === lo) {
    hi += 1.0;
    lo -= 1.0;
  }

  const getX = (i: number): number => {
    const count = pts.length - 1;
    return paddingLeft + (i / count) * Math.max(10, width - paddingLeft - paddingRight);
  };

  const getY = (v: number): number => {
    const ratio = (v - lo) / (hi - lo);
    return topAreaHeight + (1 - ratio) * chartHeight;
  };

  const yHi = getY(hi);
  const yLo = getY(lo);

  const pathD = pts
    .map((p, i) => {
      const px = getX(i);
      const py = getY(p.y);
      return `${i === 0 ? 'M' : 'L'} ${px.toFixed(1)} ${py.toFixed(1)}`;
    })
    .join(' ');

  const firstDateLabel = DateUtils.dlabel(pts[0].d);
  const lastDateLabel = DateUtils.dlabel(pts[pts.length - 1].d);

  const onLayout = (e: LayoutChangeEvent) => {
    const w = e.nativeEvent.layout.width;
    if (w > 0) setWidth(w);
  };

  return (
    <View style={[{ width: '100%', height, marginTop: 8 }, style]} onLayout={onLayout}>
      <Svg width={width} height={height}>
        <Line
          x1={paddingLeft}
          y1={yHi}
          x2={width - paddingRight}
          y2={yHi}
          stroke={colors.line}
          strokeWidth={1}
        />
        <Line
          x1={paddingLeft}
          y1={yLo}
          x2={width - paddingRight}
          y2={yLo}
          stroke={colors.line}
          strokeWidth={1}
        />

        <SvgText
          x={0}
          y={yHi + 4}
          fill={colors.mut}
          fontSize={11}
        >
          {hi.toFixed(1)}
        </SvgText>
        <SvgText
          x={0}
          y={yLo + 4}
          fill={colors.mut}
          fontSize={11}
        >
          {lo.toFixed(1)}
        </SvgText>

        <Path
          d={pathD}
          fill="none"
          stroke={colors.acc}
          strokeWidth={2.5}
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {pts.map((p, i) => (
          <Circle
            key={`${p.d}_${i}`}
            cx={getX(i)}
            cy={getY(p.y)}
            r={3.5}
            fill={colors.acc}
          />
        ))}

        <SvgText
          x={paddingLeft}
          y={height - 4}
          fill={colors.mut}
          fontSize={11}
          textAnchor="start"
        >
          {firstDateLabel}
        </SvgText>
        <SvgText
          x={width - paddingRight}
          y={height - 4}
          fill={colors.mut}
          fontSize={11}
          textAnchor="end"
        >
          {lastDateLabel}
        </SvgText>
      </Svg>
    </View>
  );
};

export const AppBottomBar: React.FC<{
  currentTab: AppTab;
  onTabSelected: (tab: AppTab) => void;
  style?: StyleProp<ViewStyle>;
}> = ({ currentTab, onTabSelected, style }) => {
  const colors = AppTheme.useColors();

  return (
    <SafeAreaView
      edges={['bottom']}
      style={[
        styles.bottomBarSurface,
        { backgroundColor: colors.card, borderTopColor: colors.line },
        style,
      ]}
    >
      <View style={styles.bottomBarRow}>
        {AppTabEntries.map((tab) => {
          const isSelected = tab === currentTab;
          return (
            <TouchableOpacity
              key={tab}
              style={styles.bottomBarTab}
              onPress={() => onTabSelected(tab)}
              activeOpacity={0.75}
            >
              <View
                style={[
                  styles.bottomBarIndicator,
                  {
                    backgroundColor: isSelected
                      ? colors.acc
                      : 'transparent',
                  },
                ]}
              />
              <Text
                style={[
                  styles.bottomBarLabel,
                  { color: isSelected ? colors.ink : colors.mut },
                ]}
                numberOfLines={1}
              >
                {AppTabLabels[tab]}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  screenContainer: {
    flex: 1,
    alignItems: 'center',
  },
  maxWidthContainer: {
    width: '100%',
    maxWidth: 560,
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 24,
  },
  dayNavTitleBox: {
    width: '100%',
    paddingVertical: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayNavTitleText: {
    fontSize: 28,
    fontWeight: '700',
    textAlign: 'center',
  },
  dayNavSubText: {
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'center',
  },
  dayNavRow: {
    width: '100%',
    paddingVertical: 4,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dayNavCircleBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayNavArrow: {
    fontSize: 24,
    fontWeight: '600',
    lineHeight: 26,
  },
  dayNavCenter: {
    flex: 1,
    borderRadius: 8,
    paddingVertical: 2,
    alignItems: 'center',
  },
  sectionH2Container: {
    paddingTop: 22,
    paddingBottom: 10,
  },
  sectionH2Text: {
    fontSize: 22,
    fontWeight: '700',
  },
  card: {
    width: '100%',
    marginTop: 12,
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
  },
  barTrack: {
    width: '100%',
    height: 12,
    borderRadius: 6,
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    borderRadius: 6,
  },
  multiBarTrack: {
    width: '100%',
    height: 12,
    borderRadius: 6,
    flexDirection: 'row',
    overflow: 'hidden',
  },
  goButton: {
    borderRadius: 10,
    minHeight: 46,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  goButtonText: {
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  miniButton: {
    borderRadius: 20,
    borderWidth: 1,
    minHeight: 40,
    paddingHorizontal: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  miniButtonText: {
    fontSize: 15,
    fontWeight: '600',
    textAlign: 'center',
  },
  chipButton: {
    borderRadius: 22,
    borderWidth: 1,
    minHeight: 44,
    paddingHorizontal: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chipButtonText: {
    fontSize: 15,
    fontWeight: '600',
    textAlign: 'center',
  },
  fieldContainer: {
    gap: 4,
  },
  fieldLabel: {
    fontSize: 13,
  },
  appInput: {
    width: '100%',
    minHeight: 44,
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 15,
  },
  pickerTrigger: {
    width: '100%',
    minHeight: 52,
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  selectTrigger: {
    width: '100%',
    minHeight: 44,
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  selectTriggerText: {
    fontSize: 15,
    flex: 1,
    marginRight: 8,
  },
  selectOptionRow: {
    width: '100%',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalCard: {
    width: '100%',
    maxWidth: 420,
    borderRadius: 14,
    borderWidth: 1,
    padding: 16,
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '600',
    marginBottom: 12,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 16,
    marginTop: 12,
  },
  modalBtn: {
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  pickerRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginVertical: 10,
    gap: 8,
  },
  pickerCol: {
    alignItems: 'center',
    flex: 1,
  },
  pickerLabel: {
    fontSize: 13,
    marginBottom: 6,
  },
  stepperRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  stepBtn: {
    width: 32,
    height: 32,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pickerVal: {
    fontSize: 16,
    fontWeight: '700',
    minWidth: 36,
    textAlign: 'center',
  },
  bottomBarSurface: {
    width: '100%',
    borderTopWidth: 1,
  },
  bottomBarRow: {
    width: '100%',
    flexDirection: 'row',
  },
  bottomBarTab: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 2,
    alignItems: 'center',
  },
  bottomBarIndicator: {
    width: '100%',
    height: 3,
    marginBottom: 4,
  },
  bottomBarLabel: {
    fontSize: 13,
    fontWeight: '700',
    textAlign: 'center',
  },
});
