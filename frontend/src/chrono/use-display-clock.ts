// Horloge d'affichage haute fréquence pour le chrono (centièmes).
// IMPORTANT : cette horloge ne sert QU'À L'AFFICHAGE. Elle n'écrit jamais
// dans le store et ne déclenche aucune sauvegarde. La logique (transitions de
// phase, alertes, archivage) reste pilotée par le tick 250ms du store et par
// des horodatages fiables (le moteur chrono calcule l'écoulé depuis Date.now()).
//
// requestAnimationFrame se met en pause automatiquement quand l'app/onglet
// passe en arrière-plan puis reprend au retour : au réveil on relit Date.now()
// donc le rattrapage de temps est exact, sans rafale.
import { useEffect, useState } from "react";

export function useDisplayClock(active: boolean, intervalMs = 60): number {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    // Inactive callers render their persisted paused time, not this clock.
    if (!active) return;
    let mounted = true;
    let raf = 0;
    let last = 0;
    const loop = () => {
      if (!mounted) return;
      const t = Date.now();
      // Throttle ~16 fps : fluide pour les centièmes, léger pour la batterie.
      if (t - last >= intervalMs) {
        last = t;
        setNow(t);
      }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => {
      mounted = false;
      if (raf) cancelAnimationFrame(raf);
    };
  }, [active, intervalMs]);
  return now;
}
