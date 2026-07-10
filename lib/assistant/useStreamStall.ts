import { useEffect, useMemo, useState } from "react";
import type { UIMessage } from "ai";

export const STREAM_STALL_MS = 800;
const TICK_MS = 200;

function fingerprintLastMessage(messages: UIMessage[]): string {
  const last = messages[messages.length - 1];
  if (!last) {
    return "";
  }
  return JSON.stringify({ id: last.id, parts: last.parts });
}

/** True when streaming has had no new chunks for STREAM_STALL_MS. */
export function useStreamStall(status: string, messages: UIMessage[]): boolean {
  const [lastActivityAt, setLastActivityAt] = useState<number | null>(null);
  const [now, setNow] = useState(() => Date.now());

  const streamFingerprint = useMemo(
    () => fingerprintLastMessage(messages),
    [messages],
  );

  useEffect(() => {
    if (status === "streaming" || status === "submitted") {
      setLastActivityAt(Date.now());
    } else {
      setLastActivityAt(null);
    }
  }, [streamFingerprint, status]);

  useEffect(() => {
    if (status !== "streaming" && status !== "submitted") {
      return;
    }
    const id = setInterval(() => setNow(Date.now()), TICK_MS);
    return () => clearInterval(id);
  }, [status]);

  return (
    status === "streaming" &&
    lastActivityAt !== null &&
    now - lastActivityAt >= STREAM_STALL_MS
  );
}
