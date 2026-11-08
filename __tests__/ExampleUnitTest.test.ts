import { calcBioTargets, dur, fmtN, hm, num } from '../src/data/JournalModels';

function assertEquals<T>(expected: T, actual: T, message?: string): void {
  if (expected !== actual) {
    throw new Error(
      `${message ? message + ': ' : ''}Expected ${expected}, got ${actual}`
    );
  }
}

export function runUnitTests(): void {
  // addition_isCorrect
  assertEquals(4, 2 + 2);

  // journal_helpers_work
  assertEquals(12.5, num('12,5'));
  assertEquals('10 000', fmtN(10000));
  assertEquals(480, dur('23:00', '07:00'));
  assertEquals('8 h 00 min', hm(480));

  const targets = calcBioTargets({
    w: 80,
    h: 180,
    a: 25,
    x: 'm',
    v: '1.55',
    g: 'utr',
  });
  if (!targets) {
    throw new Error('Expected calcBioTargets to return non-null Goals');
  }
  assertEquals(160, targets.p);
}
