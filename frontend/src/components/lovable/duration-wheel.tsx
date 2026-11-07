import { useEffect, useRef, useState } from "react";
import {
  Pressable,
  ScrollView,
  Text,
  View,
  type NativeScrollEvent,
  type ScrollViewInstance,
  type NativeSyntheticEvent,
} from "react-native";
import { lovable as c, lovableFont as f } from "@/src/visual/lovable";
import { selectionAsync } from "@/src/haptics";
import {
  WHEEL_ITEM_HEIGHT as ITEM,
  WHEEL_VISIBLE_ROWS as ROWS,
  wheelClamp,
  wheelIndex,
  wheelOffset,
  wheelValues,
} from "@/src/features/duration-wheel";

export type WheelColumn = {
  key: string;
  /** Short unit shown beside the centred row: "h", "min", "s". */
  unit: string;
  /** Spoken name for VoiceOver: "heures", "minutes", "secondes". */
  spoken: string;
  min: number;
  max: number;
  value: number;
  onChange: (value: number) => void;
};

/**
 * Wheels in the style of the iPhone Timer: each column scrolls and snaps on
 * the centred row. VoiceOver users adjust a column by swiping up or down.
 */
export function DurationWheel({
  columns,
  testID = "duration-wheel",
}: {
  columns: WheelColumn[];
  testID?: string;
}) {
  return (
    <View
      testID={testID}
      style={{
        height: ITEM * ROWS,
        flexDirection: "row",
        justifyContent: "center",
        alignSelf: "stretch",
        marginTop: 4,
      }}
    >
      <View
        pointerEvents="none"
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          top: ITEM * Math.floor(ROWS / 2),
          height: ITEM,
          borderRadius: 12,
          borderWidth: 1,
          borderColor: c.border,
          backgroundColor: c.cardRaised,
        }}
      />
      {columns.map((column) => (
        <WheelColumnView
          key={column.key}
          column={column}
          testID={`${testID}-${column.key}`}
        />
      ))}
    </View>
  );
}

function WheelColumnView({
  column,
  testID,
}: {
  column: WheelColumn;
  testID: string;
}) {
  const values = wheelValues(column.min, column.max);
  const value = wheelClamp(column.value, column.min, column.max);
  const index = Math.max(0, values.indexOf(value));
  const scroll = useRef<ScrollViewInstance>(null);
  const settle = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastY = useRef(wheelOffset(index));
  const [shown, setShown] = useState(index);
  const shownRef = useRef(index);
  // Follow outside changes (preset chips, restored draft) without fighting
  // a scroll that is in progress.
  useEffect(() => {
    if (settle.current) return;
    shownRef.current = index;
    setShown(index);
    lastY.current = wheelOffset(index);
    scroll.current?.scrollTo({ y: wheelOffset(index), animated: false });
  }, [index]);
  useEffect(
    () => () => {
      if (settle.current) clearTimeout(settle.current);
    },
    [],
  );
  const commit = (target: number) => {
    if (settle.current) clearTimeout(settle.current);
    settle.current = null;
    const i = Math.max(0, Math.min(values.length - 1, target));
    shownRef.current = i;
    setShown(i);
    lastY.current = wheelOffset(i);
    scroll.current?.scrollTo({ y: wheelOffset(i), animated: true });
    if (values[i] !== value) column.onChange(values[i]);
  };
  const onScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const y = e.nativeEvent.contentOffset.y;
    lastY.current = y;
    const i = wheelIndex(y, values.length);
    if (i !== shownRef.current) {
      shownRef.current = i;
      setShown(i);
      void selectionAsync();
    }
    // Web and slow drags end without a momentum event: settle after a pause.
    if (settle.current) clearTimeout(settle.current);
    settle.current = setTimeout(
      () => commit(wheelIndex(lastY.current, values.length)),
      140,
    );
  };
  const step = (delta: number) => commit(index + delta);
  return (
    <View
      testID={testID}
      accessible
      accessibilityRole="adjustable"
      accessibilityLabel={column.spoken}
      accessibilityValue={{
        min: column.min,
        max: column.max,
        now: value,
        text: `${value} ${column.spoken}`,
      }}
      accessibilityActions={[
        { name: "increment", label: "Augmenter" },
        { name: "decrement", label: "Réduire" },
      ]}
      onAccessibilityAction={(e) => {
        if (e.nativeEvent.actionName === "increment") step(1);
        if (e.nativeEvent.actionName === "decrement") step(-1);
      }}
      style={{ width: 92, flexDirection: "row", alignItems: "center" }}
    >
      <ScrollView
        ref={scroll}
        style={{ width: 56, height: ITEM * ROWS }}
        contentContainerStyle={{ paddingVertical: ITEM * Math.floor(ROWS / 2) }}
        contentOffset={{ x: 0, y: wheelOffset(index) }}
        onLayout={() =>
          scroll.current?.scrollTo({ y: wheelOffset(index), animated: false })
        }
        showsVerticalScrollIndicator={false}
        snapToInterval={ITEM}
        decelerationRate="fast"
        nestedScrollEnabled
        scrollEventThrottle={16}
        onScroll={onScroll}
        onMomentumScrollEnd={(e) =>
          commit(wheelIndex(e.nativeEvent.contentOffset.y, values.length))
        }
        importantForAccessibility="no-hide-descendants"
        accessibilityElementsHidden
      >
        {values.map((n, i) => {
          const distance = Math.abs(i - shown);
          return (
            <Pressable
              key={n}
              testID={`${testID}-${n}`}
              onPress={() => commit(i)}
              style={{ height: ITEM, alignItems: "center", justifyContent: "center" }}
            >
              <Text
                style={{
                  fontFamily: distance === 0 ? f.extrabold : f.semibold,
                  fontSize: distance === 0 ? 22 : 18,
                  lineHeight: ITEM,
                  color: distance === 0 ? c.foreground : c.muted,
                  opacity: distance === 0 ? 1 : distance === 1 ? 0.7 : 0.35,
                  fontVariant: ["tabular-nums"],
                }}
              >
                {String(n).padStart(2, "0")}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>
      <Text
        importantForAccessibility="no"
        style={{
          width: 36,
          fontFamily: f.semibold,
          fontSize: 13,
          lineHeight: 18,
          color: c.muted,
        }}
      >
        {column.unit}
      </Text>
    </View>
  );
}
