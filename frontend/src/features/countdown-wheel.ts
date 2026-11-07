// Columns of the countdown duration wheel. Same limits as the former
// steppers (23 h 59 min 59 s), so saved configurations keep their values.
export const countdownWheelColumns = [
  ["h", "h", "heures", 23],
  ["m", "min", "minutes", 59],
  ["s", "s", "secondes", 59],
] as const;
