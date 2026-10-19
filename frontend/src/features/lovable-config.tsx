import { Text, View } from "react-native";
import type { ClassicConfig, MaracanaConfig, Team } from "@/src/domain/types";
import { LovableConfigFrame, useLovableConfigCards } from "@/src/components/lovable/configuration";
import { lovable, lovableFont } from "@/src/visual/lovable";

export function LovableConfig({ config, onChange, teams, onTeams, onBack, onLaunch, errors, disabled }: {
  config: ClassicConfig | MaracanaConfig; onChange: (config: ClassicConfig | MaracanaConfig) => void; teams: Team[]; onTeams: (teams: Team[]) => void;
  onBack: () => void; onLaunch: () => void; errors: string[]; disabled: boolean;
}) {
  const otherErrors = errors.filter(error => error !== "Chaque équipe doit avoir un nom." && error !== "Deux équipes portent le même nom.");
  const cards = useLovableConfigCards({ config, onChange, teams, onTeams, extra: otherErrors.length ? <View testID="config-errors" style={{ gap: 8 }}>{otherErrors.map(error => <Text key={error} accessibilityRole="alert" style={{ fontFamily: lovableFont.regular, fontSize: 13, color: lovable.error }}>{error}</Text>)}</View> : undefined });
  return <LovableConfigFrame mode={config.mode} onBack={onBack} onLaunch={onLaunch} disabled={disabled}>{cards}</LovableConfigFrame>;
}
