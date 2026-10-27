import { useCallback, useState } from "react";
import {
  BackHandler,
  Linking,
  Pressable,
  Text,
  TextInput,
  View,
} from "react-native";
import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import {
  ConfigCard,
  Options,
  configStyles,
} from "@/src/components/lovable/configuration";
import { PhaseAction, PhaseFrame } from "@/src/components/lovable/phase2b-ui";
import { LovableIcon } from "@/src/components/lovable/icon";
import { LovableIntro } from "@/src/components/lovable/intro";
import { VolumeSlider } from "@/src/components/volume-slider";
import {
  setPreferences,
  usePreferences,
  type EventSound,
} from "@/src/store/preferences";
import { dispatchSession, useStore } from "@/src/store/session-store";
import { playSound, SOUND_CATALOG } from "@/src/audio/sounds";
import { soundPreviewContext } from "@/src/audio/sound-identity";
import { freeReadout } from "@/src/features/free-live-state";
import { matchProjection } from "@/src/features/match-presentation";
import {
  settingsReturn,
  settingsRotation,
  settingsSessionLabel,
  settingsFreeLabel,
} from "./settings-state";
import { lovable as c, lovableFont as f } from "@/src/visual/lovable";

const events = [
  ["startSound", "Début du match"],
  ["goalSound", "But marqué"],
  ["minuteSound", "1 minute restante"],
  ["periodSound", "Fin de période"],
  ["endSound", "Fin du match"],
  ["warmupSound", "Échauffement"],
] as const;
const options: { value: EventSound; label: string }[] = [
  { value: "off", label: "Aucun son" },
  ...SOUND_CATALOG.map((s) => ({ value: s.key, label: s.title })),
];

export default function LovableSettings() {
  const router = useRouter(),
    { from } = useLocalSearchParams<{ from?: string }>();
  const p = usePreferences(),
    session = useStore((s) => s.session),
    free = useStore((s) => s.freeTimer),
    now = useStore((s) => s.now);
  const saveError = useStore((s) => s.saveError);
  const [advanced, setAdvanced] = useState(false),
    [intro, setIntro] = useState(false);
  const [linkError, setLinkError] = useState<string | null>(null);
  const target = settingsReturn(from, session, free);
  const back = () => (router.canGoBack() ? router.back() : router.replace("/"));
  const openIssue = async (title: string) => {
    try {
      await Linking.openURL(
        `https://github.com/bledenovan01-bit/Roundr/issues/new?title=${encodeURIComponent(title)}`,
      );
      setLinkError(null);
    } catch {
      setLinkError("Impossible d’ouvrir l’assistance. Réessayez.");
    }
  };
  useFocusEffect(
    useCallback(() => {
      if (!advanced && !intro) return;
      const subscription = BackHandler.addEventListener(
        "hardwareBackPress",
        () => {
          if (intro) setIntro(false);
          else setAdvanced(false);
          return true;
        },
      );
      return () => subscription.remove();
    }, [advanced, intro]),
  );
  if (intro) return <LovableIntro onStart={() => router.replace("/")} />;
  const cards = [];
  if (p.error || linkError || saveError)
    cards.push(
      <Text
        key="error"
        accessibilityRole="alert"
        style={{ color: c.error, fontFamily: f.regular }}
      >
        {p.error || linkError || saveError}
      </Text>,
    );
  if (advanced) {
    cards.push(
      <ConfigCard key="volume" title="Volume des sons">
        <VolumeSlider
          value={p.volume}
          onChange={(volume) => {
            void setPreferences({ volume });
          }}
        />
      </ConfigCard>,
    );
    cards.push(
      <ToggleCard
        key="prep"
        title="Annonces de préparation"
        hint="Messages dans Roundr pour les équipes du prochain match."
        on={p.preparation}
        set={(preparation) => {
          void setPreferences({ preparation });
        }}
      />,
    );
    cards.push(
      <ToggleCard
        key="additional"
        title="Temps additionnel par défaut"
        hint="Pour les anciennes configurations personnalisées. Les nouveaux formats conservent leurs réglages de lancement."
        on={p.additional}
        set={(additional) => {
          void setPreferences({ additional });
        }}
      />,
    );
    for (const [key, title] of events)
      cards.push(
        <ConfigCard key={key} title={title}>
          <Options
            value={p[key]}
            options={options}
            flexible
            onChange={(value) => {
              void setPreferences({ [key]: value });
            }}
          />
          <PhaseAction
            kind="secondary"
            label="Écouter ce son"
            testID={`preview-${key}`}
            disabled={p[key] === "off"}
            onPress={() => {
              const sound = p[key];
              if (sound !== "off") void playSound(sound, soundPreviewContext(key));
            }}
          />
        </ConfigCard>,
      );
    cards.push(
      <ConfigCard key="help" title="Assistance">
        <PhaseAction
          kind="secondary"
          label="Signaler un problème"
          onPress={() => {
            void openIssue("Problème Roundr");
          }}
        />
        <PhaseAction
          kind="secondary"
          label="Envoyer un retour"
          onPress={() => {
            void openIssue("Retour Roundr");
          }}
        />
        <Text style={configStyles.hint}>Roundr · Version 1.0.0</Text>
        <Text style={configStyles.hint}>
          Moins d’organisation, plus de jeu.
        </Text>
      </ConfigCard>,
    );
  } else {
    if (target) {
      const isFree = target === "/chrono-libre/run",
        live = session?.live;
      const time =
        isFree && free
          ? freeReadout(free, now).main
          : live && session
            ? matchProjection(session, now).main
            : null;
      const seconds =
        isFree && free
          ? (free.steps[free.stepIndex]?.durationMs ?? 0) / 1000
          : live
            ? (live.periodMs[live.periodIndex] ?? 0) / 1000
            : 0;
      cards.push(
        <ConfigCard
          key="session"
          title="Session en cours"
          hint={
            isFree && free
              ? settingsFreeLabel(free)
              : session
                ? settingsSessionLabel(session)
                : undefined
          }
        >
          {time ? (
            <Text
              style={[
                configStyles.hint,
                { marginTop: 0, fontFamily: f.semibold },
              ]}
            >
              {time}
            </Text>
          ) : null}
          <Text
            style={[
              configStyles.hint,
              { marginTop: 0, fontFamily: f.semibold },
            ]}
          >
            Les règles, équipes et durées restent celles de cette session.
          </Text>
          <View style={{ gap: 6 }}>
            <Text
              style={[
                configStyles.hint,
                { marginTop: 0, fontSize: 13, lineHeight: 19.5 },
              ]}
            >
              Durée de la période
            </Text>
            <TextInput
              accessibilityLabel="Durée de la période"
              editable={false}
              value={`${seconds} s`}
              style={[configStyles.input, { opacity: 0.6 }]}
            />
          </View>
        </ConfigCard>,
      );
    }
    if (session?.config.mode === "maracana" && session.status === "active") {
      const config = session.config;
      cards.push(
        <ConfigCard key="rotation" title="Règle de rotation">
          <Options
            value={config.rotation ?? "classic"}
            options={[
              { value: "classic", label: "Rotation classique" },
              { value: "winnerStays", label: "Le gagnant reste" },
            ]}
            onChange={(rotation) =>
              dispatchSession((s) => settingsRotation(s, { rotation }), {
                silent: true,
              })
            }
          />
        </ConfigCard>,
      );
      if (config.rotation === "winnerStays" && session.teams.length >= 4)
        cards.push(
          <ConfigCard key="draw" title="En cas de match nul">
            <Options
              flexible
              value={config.drawRule4 ?? "oneLeaves"}
              options={[
                { value: "oneLeaves", label: "Une équipe sort" },
                { value: "bothLeave", label: "Les deux équipes sortent" },
              ]}
              onChange={(drawRule4) =>
                dispatchSession((s) => settingsRotation(s, { drawRule4 }), {
                  silent: true,
                })
              }
            />
          </ConfigCard>,
        );
    }
    cards.push(
      <ToggleCard
        key="sounds"
        title="Sons et effets"
        hint="Réglage général de l'application"
        on={p.sounds}
        set={(sounds) => {
          void setPreferences({ sounds });
        }}
      />,
    );
    cards.push(
      <ToggleCard
        key="vibrate"
        title="Vibrations"
        hint="À chaque but et en fin de match"
        on={p.vibrations}
        set={(vibrations) => {
          void setPreferences({ vibrations });
        }}
      />,
    );
    cards.push(
      <ToggleCard
        key="awake"
        title="Écran toujours allumé"
        hint="Pendant un match"
        on={p.keepAwake}
        set={(keepAwake) => {
          void setPreferences({ keepAwake });
        }}
      />,
    );
    cards.push(
      <ConfigCard
        key="about"
        title="À propos"
        hint="Roundr · maquette interactive V0"
      >
        <PhaseAction
          kind="secondary"
          label="Revoir l'introduction"
          onPress={() => setIntro(true)}
        />
      </ConfigCard>,
    );
  }
  return (
    <PhaseFrame
      title={advanced ? "Réglages avancés" : "Paramètres"}
      onBack={advanced ? () => setAdvanced(false) : back}
      distributeRows
      right={
        !advanced ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Réglages avancés"
            onPress={() => setAdvanced(true)}
            style={{
              width: 44,
              height: 44,
              alignItems: "center",
              justifyContent: "center",
              borderRadius: 14,
            }}
          >
            <LovableIcon name="settings" color={c.muted} size={20} />
          </Pressable>
        ) : undefined
      }
      footer={
        target ? (
          <PhaseAction
            label={
              target === "/chrono-libre/run"
                ? "Retour à la session"
                : "Retour au match"
            }
            icon="play"
            onPress={() => {
              if (router.canGoBack()) router.back();
              else router.replace(target);
            }}
          />
        ) : undefined
      }
    >
      {cards}
    </PhaseFrame>
  );
}

function ToggleCard({
  title,
  hint,
  on,
  set,
}: {
  title: string;
  hint?: string;
  on: boolean;
  set: (value: boolean) => void;
}) {
  return (
    <ConfigCard
      title={title}
      hint={hint}
      right={
        <Pressable
          accessibilityRole="switch"
          accessibilityLabel={title}
          accessibilityState={{ checked: on }}
          aria-checked={on}
          hitSlop={7}
          onPress={() => set(!on)}
          style={{
            width: 50,
            height: 30,
            flexShrink: 0,
            borderRadius: 999,
            backgroundColor: on ? c.primary : c.mutedSurface,
            justifyContent: "center",
          }}
        >
          <View
            style={{
              width: 24,
              height: 24,
              borderRadius: 12,
              backgroundColor: on ? c.onPrimary : c.foreground,
              marginLeft: on ? 23 : 3,
            }}
          />
        </Pressable>
      }
    />
  );
}
