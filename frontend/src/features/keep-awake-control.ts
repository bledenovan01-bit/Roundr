// Wording of the "Écran" button in the chrono command bars.
export function keepAwakeLabel(on: boolean) {
  return on
    ? { text: "Écran allumé", hint: "L’écran reste allumé pendant le chrono. Toucher pour autoriser la veille." }
    : { text: "Veille autorisée", hint: "L’écran peut se mettre en veille ; la fin est signalée par une notification si tu l’as autorisée. Touche pour garder l’écran allumé." };
}
