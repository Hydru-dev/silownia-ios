export const LightBg = '#E8EBF1';
export const LightCard = '#F7F8FB';
export const LightInk = '#17203A';
export const LightMut = '#5C6580';
export const LightLine = '#CBD0DE';
export const LightAcc = '#E8480C';
export const LightAccInk = '#FFFFFF';
export const LightOk = '#1F7A4D';

export const DarkBg = '#10131C';
export const DarkCard = '#191E2B';
export const DarkInk = '#EAEDF6';
export const DarkMut = '#9099B3';
export const DarkLine = '#2B3245';
export const DarkAcc = '#FF6B35';
export const DarkAccInk = '#10131C';
export const DarkOk = '#4CC38A';

export interface AppPalette {
  bg: string;
  card: string;
  ink: string;
  mut: string;
  line: string;
  acc: string;
  accInk: string;
  ok: string;
}

export const LightPalette: AppPalette = {
  bg: LightBg,
  card: LightCard,
  ink: LightInk,
  mut: LightMut,
  line: LightLine,
  acc: LightAcc,
  accInk: LightAccInk,
  ok: LightOk,
};

export const DarkPalette: AppPalette = {
  bg: DarkBg,
  card: DarkCard,
  ink: DarkInk,
  mut: DarkMut,
  line: DarkLine,
  acc: DarkAcc,
  accInk: DarkAccInk,
  ok: DarkOk,
};
