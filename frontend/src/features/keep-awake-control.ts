// Wording of the "Écran" button in the chrono command bars.
export function keepAwakeLabel(on: boolean) {
  return on
    ? { text: "Écran allumé", hint: "L’écran reste allumé pendant le chrono. Toucher pour autoriser la veille." }
    : { text: "Veille autorisée", hint: "Le sifflet ne sonne pas lorsque Roundr est en arrière-plan. Touche pour garder l’écran allumé." };
}
