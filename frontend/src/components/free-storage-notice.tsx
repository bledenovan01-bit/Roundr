import { Text, View } from "react-native";
import { PrimaryButton } from "./primary-button";
import { resolveLegacyRecovery, retryStorage, useStore } from "@/src/store/session-store";
import { useTheme } from "@/src/theme";

export function FreeStorageNotice() {
  const error = useStore(s => s.saveError);
  const info = useStore(s => s.storageInfo);
  const recovery = useStore(s => s.legacyRecovery);
  const loading = useStore(s => s.loading);
  const replacing = useStore(s => s.replacingFreeTimer);
  const { colors } = useTheme();
  if (!error && !info && recovery === null && !replacing) return null;
  return <View style={{ gap: 8, padding: 12 }} accessibilityLiveRegion="polite">
    {replacing ? <Text style={{ color: colors.onSurface }}>Enregistrement en cours… La séance précédente est conservée en cas d’échec.</Text> : null}
    {error ? <><Text style={{ color: colors.error }}>{error}</Text><PrimaryButton label="Réessayer la sauvegarde" variant="secondary" disabled={loading || replacing} onPress={() => { void retryStorage(); }} /></> : null}
    {info ? <Text style={{ color: colors.onSurface }}>{info}</Text> : null}
    {recovery !== null ? <>
      <Text style={{ color: colors.onSurface }}>Une ancienne migration ne permet pas de savoir si ces chronos ont été supprimés volontairement. Les originaux sont conservés. Choisis de récupérer les chronos absents ou de garder ta liste actuelle.</Text>
      {recovery.length ? <Text style={{ color: colors.onSurface }}>{recovery.map(p => p.name).join(" · ")}</Text> : null}
      <PrimaryButton label={`Récupérer les anciens chronos (${recovery.length})`} variant="secondary" onPress={() => { void resolveLegacyRecovery(true); }} />
      <PrimaryButton label="Garder ma liste sans récupération" variant="ghost" onPress={() => { void resolveLegacyRecovery(false); }} />
    </> : null}
  </View>;
}
