/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 *
 * A timestamp in the reader's own timezone, without breaking hydration.
 *
 * This app is server-rendered. Formatting a date in local time during render produces one string
 * on the server (whose timezone is the container's, UTC) and a different one in the browser, which
 * is a hydration mismatch — React 418, forty-odd of them on any channel with messages, and React
 * throwing away the server tree and re-rendering the whole subtree to recover.
 *
 * So the first pass — the one that must match the server byte for byte — is formatted in UTC, and
 * the local rendering is swapped in from an effect after mount, which React is perfectly happy
 * with. The visible cost is that a timestamp is briefly UTC on first paint; the alternative is a
 * console full of errors and a re-render of every message list.
 */
import { useEffect, useState } from "react";

type TimeFormat = "time" | "date" | "datetime";

const OPTIONS: Record<TimeFormat, Intl.DateTimeFormatOptions> = {
  time: { hour: "numeric", minute: "2-digit" },
  date: { year: "numeric", month: "short", day: "numeric" },
  datetime: { year: "numeric", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" },
};

interface LocalTimeProps {
  /** ISO 8601, as every Athena timestamp is on the wire. */
  readonly iso: string;
  /** Named `format`, not `style` — `style` on a component reads as the DOM style prop. */
  readonly format?: TimeFormat;
  /** Rendered when the value is absent or unparseable — "Never", "—", whatever fits the caller. */
  readonly fallback?: string;
}

export function LocalTime(props: LocalTimeProps) {
  const { iso, format = "datetime", fallback = "—" } = props;
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  const parsed = new Date(iso);
  if (Number.isNaN(parsed.getTime())) {
    return <>{fallback}</>;
  }

  // Both the timezone AND the locale have to be pinned before mount: the server's locale is the
  // container's, and "Aug" against "août" is the same hydration mismatch as the wrong hour.
  const locale = mounted ? undefined : "en-GB";
  const options = mounted ? OPTIONS[format] : { ...OPTIONS[format], timeZone: "UTC" };
  return <time dateTime={iso}>{parsed.toLocaleString(locale, options)}</time>;
}
