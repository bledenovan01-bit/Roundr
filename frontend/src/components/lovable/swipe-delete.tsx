import { useRef, type ReactNode } from "react";
import { Pressable, StyleSheet, type StyleProp, type ViewStyle } from "react-native";
import Swipeable, { type SwipeableMethods } from "react-native-gesture-handler/ReanimatedSwipeable";
import { LovableIcon } from "./icon";
import { lovable, themed } from "@/src/visual/lovable";

/** Wraps a press handler of the row so it is ignored right after a swipe. */
export type SwipeGuard = (action: () => void) => () => void;

// Releasing the finger at the end of a swipe also reaches the row's own
// buttons as a tap. Taps that follow a drag this closely are not intentional.
const DRAG_GRACE_MS = 600;

/**
 * Swipe left on a row to reveal a delete button. The row keeps its own visible
 * delete control: the gesture is a shortcut, never the only way. `onDelete`
 * opens the same confirmation as that control. Pass a render function to get a
 * guard for the row's buttons: it drops the tap that ends a swipe, and a tap on
 * an open row closes it instead of opening something.
 */
export function SwipeToDelete({ label, onDelete, testID, containerStyle, children }: {
  label: string;
  onDelete: () => void;
  testID?: string;
  containerStyle?: StyleProp<ViewStyle>;
  children: ReactNode | ((guard: SwipeGuard) => ReactNode);
}) {
  const swipeable = useRef<SwipeableMethods>(null);
  const draggedAt = useRef(0);
  const open = useRef(false);
  const dragged = () => { draggedAt.current = Date.now(); };
  const guard: SwipeGuard = action => () => {
    if (Date.now() - draggedAt.current < DRAG_GRACE_MS) return;
    if (open.current) { swipeable.current?.close(); return; }
    action();
  };
  // The page colour behind the row hides the red action in its rounded corners until it is swiped.
  return <Swipeable ref={swipeable} containerStyle={containerStyle} childrenContainerStyle={styles.row} overshootRight={false} rightThreshold={32}
    onSwipeableOpenStartDrag={dragged} onSwipeableCloseStartDrag={dragged}
    onSwipeableWillOpen={() => { open.current = true; }} onSwipeableWillClose={() => { open.current = false; }}
    renderRightActions={() => (
      <Pressable testID={testID} accessibilityRole="button" accessibilityLabel={label}
        onPress={() => { swipeable.current?.close(); onDelete(); }}
        style={({ pressed }) => [styles.action, pressed && styles.pressed]}>
        <LovableIcon name="trash" color={lovable.onError} size={23} />
      </Pressable>
    )}>
    {typeof children === "function" ? children(guard) : children}
  </Swipeable>;
}

const styles = themed(() => StyleSheet.create({
  row: { backgroundColor: lovable.background },
  action: { width: 64, marginLeft: 6, borderRadius: 16, backgroundColor: lovable.error, alignItems: "center", justifyContent: "center" },
  pressed: { opacity: 0.85 },
}));
