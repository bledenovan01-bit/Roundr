import { useEffect, useState } from "react";
import { View, useWindowDimensions } from "react-native";
import type { Session } from "@/src/domain/types";
import { usePreferences } from "@/src/store/preferences";
import {
  announcementScope,
  emptyAnnouncements,
  reduceAnnouncements,
  type AnnouncementQueue,
} from "@/src/features/match-announcements";
import { LiveNoticeBanner } from "../live-notice-banner";

const scopes = new Map<string, AnnouncementQueue>();
export function MatchAnnouncer({
  session,
  now,
}: {
  session: Session;
  now: number;
}) {
  const prefs = usePreferences();
  const { width, height } = useWindowDimensions();
  const [state, setState] = useState(() => {
    const scope = announcementScope(session),
      saved = scopes.get(scope);
    return saved?.current && saved.current.until > Date.now()
      ? saved
      : { ...emptyAnnouncements(scope), fired: saved?.fired ?? [] };
  });
  const [expiry, setExpiry] = useState(0);
  const next = reduceAnnouncements(
    state,
    session,
    Math.max(now, expiry),
    prefs.preparation,
  );
  if (next !== state) setState(next);
  const until = state.current?.until;
  useEffect(() => {
    scopes.set(state.scope, state);
  }, [state]);
  useEffect(() => {
    if (until === undefined) return;
    const id = setTimeout(
      () => setExpiry(Date.now()),
      Math.max(0, until - Date.now()),
    );
    return () => clearTimeout(id);
  }, [until]);
  return (
    <View
      pointerEvents="none"
      style={{
        minHeight: width > height && height <= 500 ? 40 : 46,
        justifyContent: "center",
      }}
    >
      <LiveNoticeBanner notice={state.current} variant="lovable" />
    </View>
  );
}
