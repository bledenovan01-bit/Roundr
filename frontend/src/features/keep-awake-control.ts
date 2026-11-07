// Wording of the "Écran" button in the chrono command bars.
export function keepAwakeLabel(on: boolean) {
  return on
    ? { text: "Écran", hint: "L’écran reste allumé pendant le chrono. Toucher pour autoriser la veille." }
    : { text: "Écran", hint: "La veille est autorisée. Toucher pour garder l’écran allumé pendant le chrono." };
}
