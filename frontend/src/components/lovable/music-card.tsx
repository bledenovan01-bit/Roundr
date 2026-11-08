import { Image, Pressable, Text, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import Svg, { Circle, Path, Rect } from "react-native-svg";
import { decorativeSvgAccessibility } from "@/src/components/svg-compat";
import { useMusicCard } from "@/src/music/use-music-card";
import { lovable as c, lovableFont as f } from "@/src/visual/lovable";

type Glyph = "previous" | "next" | "play" | "pause" | "note" | "music";

// Lucide 0.575.0 geometry, ISC license in docs/lucide-license.txt.
function Icon({ name, size, color }: { name: Glyph; size: number; color: string }) {
  const filled = name === "play" || name === "pause" || name === "previous" || name === "next";
  return (
    <Svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill={filled ? color : "none"}
      stroke={color}
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      {...decorativeSvgAccessibility}
    >
      {name === "play" ? (
        <Path d="M5 5a2 2 0 0 1 3.008-1.728l11.997 6.998a2 2 0 0 1 .003 3.458l-12 7A2 2 0 0 1 5 19z" />
      ) : name === "pause" ? (
        <>
          <Rect x={5} y={3} width={5} height={18} rx={1} />
          <Rect x={14} y={3} width={5} height={18} rx={1} />
        </>
      ) : name === "previous" ? (
        <>
          <Path d="M17.971 4.285A2 2 0 0 1 21 6v12a2 2 0 0 1-3.029 1.715l-9.997-5.998a2 2 0 0 1-.003-3.432z" />
          <Path d="M3 20V4" />
        </>
      ) : name === "next" ? (
        <>
          <Path d="M21 4v16" />
          <Path d="M6.029 4.285A2 2 0 0 0 3 6v12a2 2 0 0 0 3.029 1.715l9.997-5.998a2 2 0 0 0 .003-3.432z" />
        </>
      ) : name === "note" ? (
        <>
          <Circle cx={8} cy={18} r={4} />
          <Path d="M12 18V2l7 4" />
        </>
      ) : (
        <>
          <Path d="M9 18V5l12-2v13M9 8l12-2" />
          <Circle cx={6} cy={18} r={3} />
          <Circle cx={18} cy={16} r={3} />
        </>
      )}
    </Svg>
  );
}

function RoundButton({
  label,
  icon,
  size,
  primary = false,
  disabled,
  onPress,
}: {
  label: string;
  icon: Glyph;
  size: number;
  primary?: boolean;
  disabled: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => ({
        width: size,
        height: size,
        borderRadius: size / 2,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: primary ? c.primary : c.cardRaised,
        borderWidth: primary ? 0 : 1,
        borderColor: c.border,
        opacity: disabled ? 0.35 : pressed ? 0.9 : 1,
      })}
    >
      <Icon name={icon} size={Math.round(size * 0.42)} color={primary ? c.onPrimary : c.foreground} />
    </Pressable>
  );
}

const eyebrow = {
  fontFamily: f.extrabold,
  fontSize: 11,
  lineHeight: 110 / 7,
  letterSpacing: 1.32,
  color: c.muted,
} as const;

/**
 * The single music card, identical whatever source is behind it. Commands are
 * enabled only when the source declares them, and the state shown is always
 * the state read back from the player.
 */
export function MusicCard({
  compact,
  dense = false,
  locked,
  active,
}: {
  compact: boolean;
  /** Shortest slot: the landscape Chrono libre carousel. */
  dense?: boolean;
  locked: boolean;
  active: boolean;
}) {
  const { model, busy, command, run } = useMusicCard(active);
  if (model.kind === "message") {
    return (
      <View style={{ flex: 1, padding: dense ? 6 : compact ? 10 : 14, gap: dense ? 2 : compact ? 6 : 14 }}>
        <Text style={[eyebrow, { textAlign: "center" }]}>MUSIQUE</Text>
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center", gap: dense ? 2 : 6 }}>
          {dense || (compact && model.actions.length) ? null : (
            <View
              style={{
                height: 56,
                width: 56,
                backgroundColor: c.secondary,
                borderWidth: 1,
                borderColor: c.border,
                borderRadius: 14,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Icon name="music" size={26} color={c.muted} />
            </View>
          )}
          <Text style={{ fontFamily: "ManropeRefined-Heavy", fontSize: 14, lineHeight: 19.5, color: c.foreground, textAlign: "center" }}>
            {model.title}
          </Text>
          <Text
            numberOfLines={dense && model.actions.length ? 1 : compact ? 2 : 3}
            style={{ fontFamily: f.semibold, fontSize: 12, lineHeight: 18, color: c.muted, textAlign: "center" }}
          >
            {model.notice ?? model.hint}
          </Text>
          {model.actions.length ? (
            <View style={{ flexDirection: "row", gap: 8, marginTop: 2 }}>
              {model.actions.map((action) => (
                <Pressable
                  key={action.label}
                  accessibilityRole="button"
                  accessibilityLabel={action.label}
                  accessibilityState={{ disabled: locked || busy }}
                  disabled={locked || busy}
                  onPress={() => run(action)}
                  style={({ pressed }) => ({
                    minHeight: 36,
                    paddingHorizontal: 12,
                    borderRadius: 12,
                    borderWidth: 1,
                    borderColor: c.border,
                    backgroundColor: c.cardRaised,
                    alignItems: "center",
                    justifyContent: "center",
                    opacity: locked || busy ? 0.35 : pressed ? 0.9 : 1,
                  })}
                >
                  <Text numberOfLines={1} style={{ fontFamily: "ManropeRefined-Bold", fontSize: 12, lineHeight: 18, color: c.foreground }}>
                    {action.label}
                  </Text>
                </Pressable>
              ))}
            </View>
          ) : null}
        </View>
      </View>
    );
  }
  const art = dense ? 36 : compact ? 44 : 56;
  const side = dense ? 38 : compact ? 42 : 52;
  const main = dense ? 44 : compact ? 50 : 64;
  return (
    <View testID="music-player" style={{ flex: 1, padding: dense ? 6 : compact ? 10 : 16, gap: dense ? 3 : compact ? 8 : 12 }}>
      <Text style={eyebrow}>MUSIQUE</Text>
      <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
        <View style={{ width: art, height: art, borderRadius: 14, overflow: "hidden" }}>
          {model.artworkUri ? (
            <Image
              testID="music-artwork"
              accessibilityIgnoresInvertColors
              source={{ uri: model.artworkUri }}
              style={{ width: art, height: art }}
            />
          ) : (
            <LinearGradient
              colors={["#f43f5e", "#a855f7"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={{ flex: 1, alignItems: "center", justifyContent: "center" }}
            >
              <Icon name="note" size={Math.round(art * 0.46)} color="#ffffff" />
            </LinearGradient>
          )}
        </View>
        <View style={{ flex: 1, gap: 2 }}>
          <Text numberOfLines={1} style={{ fontFamily: f.extrabold, fontSize: 16, lineHeight: 22, color: c.foreground }}>
            {model.title}
          </Text>
          <Text
            numberOfLines={1}
            style={{ fontFamily: f.semibold, fontSize: 13, lineHeight: 18, color: model.notice ? c.amber : c.muted }}
          >
            {model.notice ?? model.artist}
          </Text>
        </View>
        {model.playing ? (
          <View testID="music-playing" style={{ flexDirection: "row", alignItems: "flex-end", gap: 2, height: 18 }}>
            {[8, 18, 12].map((height, i) => (
              <View key={i} style={{ width: 3, height, borderRadius: 2, backgroundColor: c.primary }} />
            ))}
          </View>
        ) : null}
      </View>
      <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 18 }}>
        <RoundButton
          label="Morceau précédent"
          icon="previous"
          size={side}
          disabled={locked || !model.canPrevious}
          onPress={() => void command("previous")}
        />
        <RoundButton
          primary
          label={model.playing ? "Mettre la musique en pause" : "Reprendre la musique"}
          icon={model.playing ? "pause" : "play"}
          size={main}
          disabled={locked || !model.canToggle}
          onPress={() => void command("toggle")}
        />
        <RoundButton
          label="Morceau suivant"
          icon="next"
          size={side}
          disabled={locked || !model.canNext}
          onPress={() => void command("next")}
        />
      </View>
    </View>
  );
}
