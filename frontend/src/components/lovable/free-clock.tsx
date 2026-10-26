import { svgRotation } from "@/src/components/svg-compat";
import { useEffect, useState } from "react";
import { freeViews } from "@/src/features/free-live-state";
import {
  AccessibilityInfo,
  Animated,
  Text,
  View,
  useWindowDimensions,
} from "react-native";
import Svg, { Circle, G, Line, Text as SvgText, TSpan } from "react-native-svg";
import { lovable as c, lovableFont as f } from "@/src/visual/lovable";
import type { FreeTimerDisplay } from "@/src/domain/free-timer";
import type { freeReadout } from "@/src/features/free-live-state";
import { TimerDigits } from "./timer-digits";

type Readout = ReturnType<typeof freeReadout>;
export function FreeDigits({
  r,
  size,
  ring = false,
}: {
  r: Readout;
  size: number;
  ring?: boolean;
}) {
  return <TimerDigits main={r.main} cents={r.cents} size={size} ratio={ring ? 0.42 : 0.5} ring={ring} testID="free-digits" />;
}

export function FreeClock({ r, view }: { r: Readout; view: FreeTimerDisplay }) {
  const { width, height } = useWindowDimensions(),
    land = width > height,
    short = !land && height <= 720;
  const eye = {
    fontFamily: f.extrabold,
    fontSize: 11,
    lineHeight: 16.5,
    letterSpacing: 1.32,
    color: c.muted,
    textAlign: "center" as const,
  };
  if (view === "numeric")
    return (
      <View
        style={{
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
          gap: 16,
          paddingTop: 16,
          paddingHorizontal: 22,
        }}
      >
        <Text style={eye}>{r.label}</Text>
        <FreeDigits r={r} size={land ? 40 : width <= 340 ? 42 : 48} />
        {r.progress !== null ? (
          <View
            accessibilityRole="progressbar"
            accessibilityValue={{
              min: 0,
              max: 100,
              now: Math.round(r.progress * 100),
            }}
            style={{
              height: 10,
              width: "100%",
              borderRadius: 99,
              backgroundColor: c.mutedSurface,
              overflow: "hidden",
            }}
          >
            <View
              style={{
                height: 10,
                width: `${r.progress * 100}%`,
                backgroundColor: c.primary,
                borderRadius: 99,
              }}
            />
          </View>
        ) : null}
      </View>
    );
  if (view === "circular") {
    const size = land ? 104 : height < 620 ? 122 : short ? 146 : 174,
      rad = 62,
      len = 2 * Math.PI * rad,
      a = (((r.ms / 1000) % 60) * Math.PI) / 30;
    return (
      <View
        style={{
          flex: 1,
          alignItems: "center",
          justifyContent: "center",
          paddingTop: 16,
          paddingHorizontal: 22,
        }}
      >
        <View style={{ width: size, height: size }}>
          <Svg width={size} height={size} viewBox="0 0 140 140">
            <G {...svgRotation(-90, 70, 70)}>
              <Circle
                cx={70}
                cy={70}
                r={rad}
                fill="none"
                stroke={c.mutedSurface}
                strokeWidth={9}
              />
              {r.progress === null ? (
                <Circle
                  cx={70 + Math.cos(a) * rad}
                  cy={70 + Math.sin(a) * rad}
                  r={6}
                  fill={c.primary}
                />
              ) : (
                <Circle
                  cx={70}
                  cy={70}
                  r={rad}
                  fill="none"
                  stroke={c.primary}
                  strokeWidth={9}
                  strokeLinecap="round"
                  strokeDasharray={len}
                  strokeDashoffset={len * (1 - r.progress)}
                />
              )}
            </G>
          </Svg>
          <View
            style={{
              position: "absolute",
              inset: 0,
              alignItems: "center",
              justifyContent: "center",
              gap: 6,
            }}
          >
            <Text
              style={[
                eye,
                {
                  fontSize: land ? 7 : 9,
                  lineHeight: land ? 10.5 : 13.5,
                  letterSpacing: land ? 0 : 1.08,
                },
              ]}
            >
              {r.progress === null ? "SANS LIMITE" : r.label}
            </Text>
            <FreeDigits r={r} size={land ? 24 : 36} ring />
          </View>
        </View>
      </View>
    );
  }
  const size = land ? 120 : short ? 160 : width <= 340 ? 164 : 186,
    sec = (r.ms / 1000) % 60,
    min = (r.ms / 60000) % 30,
    R = 88,
    C = 2 * Math.PI * R;
  return (
    <View
      style={{
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
        gap: 6,
        paddingTop: 16,
        paddingHorizontal: 22,
      }}
    >
      <Svg
        style={{ flexShrink: 0 }}
        width={size}
        height={size}
        viewBox="0 0 200 200"
        accessibilityRole="image"
        accessibilityLabel={`Cadran : ${r.main}${r.cents}`}
      >
        <Circle
          cx={100}
          cy={100}
          r={96}
          fill={c.cardRaised}
          stroke={c.border}
          strokeWidth={2}
        />
        {r.progress !== null ? (
          <Circle
            cx={100}
            cy={100}
            r={R}
            fill="none"
            stroke={c.primary}
            strokeWidth={4}
            strokeLinecap="round"
            opacity={0.55}
            strokeDasharray={C}
            strokeDashoffset={C * r.progress}
            {...svgRotation(-90, 100, 100)}
          />
        ) : null}
        {Array.from({ length: 60 }, (_, i) => {
          const a = (i * Math.PI) / 30,
            big = i % 5 === 0;
          return (
            <Line
              key={i}
              x1={100 + Math.sin(a) * (big ? 74 : 79)}
              y1={100 - Math.cos(a) * (big ? 74 : 79)}
              x2={100 + Math.sin(a) * 83}
              y2={100 - Math.cos(a) * 83}
              stroke={big ? c.foreground : c.muted}
              strokeWidth={big ? 2.4 : 1}
            />
          );
        })}
        {Array.from({ length: 12 }, (_, i) => {
          const a = (i * Math.PI) / 6;
          return (
            <SvgText
              key={i}
              x={100 + Math.sin(a) * 62}
              y={103.5 - Math.cos(a) * 62}
              textAnchor="middle"
              fill={c.muted}
              fontFamily="ManropeRefined-Bold"
              fontSize={10}
            >
              {i === 0 ? 60 : i * 5}
            </SvgText>
          );
        })}
        <G x={100} y={132}>
          <Circle r={15} fill="none" stroke={c.border} strokeWidth={1.5} />
          <Line
            x1={0}
            y1={0}
            x2={Math.sin((min * Math.PI) / 15) * 11}
            y2={-Math.cos((min * Math.PI) / 15) * 11}
            stroke={c.foreground}
            strokeWidth={2}
            strokeLinecap="round"
          />
        </G>
        <Line
          x1={100}
          y1={114}
          x2={100}
          y2={24}
          stroke={c.primary}
          strokeWidth={2.6}
          strokeLinecap="round"
          {...svgRotation(sec * 6, 100, 100)}
        />
        <Circle cx={100} cy={100} r={5} fill={c.primary} />
        <SvgText
          x={100}
          y={80}
          textAnchor="middle"
          fontFamily={f.extrabold}
          fontSize={15}
          fill={c.foreground}
          stroke={c.cardRaised}
          strokeWidth={3}
          strokeLinejoin="round"
        >
          {r.main}
          <TSpan fontSize={10} fill={c.muted}>
            {r.cents}
          </TSpan>
        </SvgText>
        <SvgText
          x={100}
          y={80}
          textAnchor="middle"
          fill={c.foreground}
          fontFamily={f.extrabold}
          fontSize={15}
        >
          {r.main}
          <TSpan fontSize={10} fill={c.muted}>
            {r.cents}
          </TSpan>
        </SvgText>
      </Svg>
      <Text style={[eye, { fontSize: 9, lineHeight: 13.5, letterSpacing: 0 }]}>
        {r.label}
      </Text>
    </View>
  );
}

// Three mounted pages, translated only after an explicit selection/gesture.
export function FreeClockTrack({
  r,
  selected,
}: {
  r: Readout;
  selected: FreeTimerDisplay;
}) {
  const [width, setWidth] = useState(0),
    [offset] = useState(() => new Animated.Value(0)),
    [reduced, setReduced] = useState(false);
  useEffect(() => {
    let active = true;
    void AccessibilityInfo.isReduceMotionEnabled().then((v) => {
      if (active) setReduced(v);
    });
    const subscription = AccessibilityInfo.addEventListener(
      "reduceMotionChanged",
      setReduced,
    );
    return () => {
      active = false;
      subscription.remove();
    };
  }, []);
  useEffect(() => {
    const animation = Animated.timing(offset, {
      toValue: -width * freeViews.indexOf(selected),
      duration: reduced ? 0 : 350,
      useNativeDriver: true,
    });
    animation.start();
    return () => animation.stop();
  }, [offset, width, selected, reduced]);
  return (
    <View
      onLayout={(e) => setWidth(e.nativeEvent.layout.width)}
      style={{ flex: 1 }}
    >
      <Animated.View
        style={{
          height: "100%",
          width: width * 3,
          flexDirection: "row",
          transform: [{ translateX: offset }],
        }}
      >
        {freeViews.map((view) => (
          <View
            key={view}
            aria-hidden={view !== selected}
            accessibilityElementsHidden={view !== selected}
            importantForAccessibility={
              view !== selected ? "no-hide-descendants" : "auto"
            }
            style={{ width, height: "100%" }}
          >
            <FreeClock r={r} view={view} />
          </View>
        ))}
      </Animated.View>
    </View>
  );
}
