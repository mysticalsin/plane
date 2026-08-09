/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 *
 * Per-channel mute / mention-only, persisted per user (see apps/bff/src/routes/chatSettings/
 * notifications.ts's module comment — two members can mute the same channel independently).
 * Each toggle PATCHes only its own field, matching the backend's COALESCE upsert so flipping
 * mention-only never silently resets a mute the user already set.
 */
import { useState } from "react";
import { BellOff } from "lucide-react";
import { Loader, ToggleSwitch } from "@plane/ui";
import { TOAST_TYPE, setToast } from "@plane/propel/toast";
import { cn } from "@plane/utils";
import { ChatEmptyState } from "../ChatEmptyState";
import { ChatErrorState } from "../ChatErrorState";
import { useNotificationSettings } from "./hooks/useNotificationSettings";
import { SettingsSection } from "./shared/SettingsSection";
import type { NotificationPref } from "./types";

function NotificationsSkeleton() {
  return (
    <Loader className="flex flex-col gap-2">
      {[...Array(3)].map((_, i) => (
        <Loader.Item key={i} height="44px" width="100%" />
      ))}
    </Loader>
  );
}

interface PrefRowProps {
  readonly pref: NotificationPref;
  readonly busy: boolean;
  readonly onToggleMuted: (pref: NotificationPref) => void;
  readonly onToggleMentionOnly: (pref: NotificationPref) => void;
}

function PrefRow(props: PrefRowProps) {
  const { pref, busy, onToggleMuted, onToggleMentionOnly } = props;
  return (
    <tr className={cn("divide-x divide-subtle text-13 text-secondary", pref.muted && "opacity-70")}>
      <td className="px-3 py-2.5">
        <div className="flex items-center gap-1.5 font-medium text-primary">
          {pref.muted && <BellOff className="size-3.5 flex-shrink-0 text-tertiary" strokeWidth={1.75} />}
          {pref.channelName}
        </div>
      </td>
      <td className="px-3 py-2.5 text-right">
        <ToggleSwitch
          value={pref.muted}
          onChange={() => onToggleMuted(pref)}
          disabled={busy}
          label={pref.muted ? `Unmute ${pref.channelName}` : `Mute ${pref.channelName}`}
        />
      </td>
      <td className="px-3 py-2.5 text-right">
        <ToggleSwitch
          value={pref.mentionOnly}
          onChange={() => onToggleMentionOnly(pref)}
          disabled={busy || pref.muted}
          label={
            pref.mentionOnly ? `Turn off mention-only for ${pref.channelName}` : `Mentions only for ${pref.channelName}`
          }
        />
      </td>
    </tr>
  );
}

export function NotificationsPanel() {
  const { status, prefs, error, retry, updatePref } = useNotificationSettings();
  const [busyId, setBusyId] = useState<string | null>(null);

  async function handleUpdate(pref: NotificationPref, patch: { muted?: boolean; mentionOnly?: boolean }) {
    setBusyId(pref.channelId);
    const result = await updatePref(pref.channelId, patch);
    setBusyId(null);
    if (!result.ok) {
      setToast({ type: TOAST_TYPE.ERROR, title: "Could not update this preference", message: result.error });
    }
  }

  return (
    <SettingsSection
      title="Notifications"
      description="Mute a channel, or limit it to mentions only — set per person, per channel."
    >
      {status === "loading" && <NotificationsSkeleton />}
      {status === "error" && (
        <ChatErrorState message={error ?? "Could not load notification preferences."} onRetry={retry} />
      )}
      {status === "ready" && prefs.length === 0 && (
        <ChatEmptyState
          title="No channels yet"
          description="Join or create a channel to set its notification preferences."
        />
      )}
      {status === "ready" && prefs.length > 0 && (
        <div className="overflow-hidden overflow-x-auto rounded-md border border-subtle">
          <table className="w-full min-w-[480px] table-auto">
            <thead className="divide-y divide-subtle bg-surface-2">
              <tr className="divide-x divide-subtle text-13 text-primary">
                <th className="px-3 py-2 text-left font-medium">Channel</th>
                <th className="px-3 py-2 text-right font-medium">Muted</th>
                <th className="px-3 py-2 text-right font-medium">Mentions only</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-subtle bg-surface-1">
              {prefs.map((pref) => (
                <PrefRow
                  key={pref.channelId}
                  pref={pref}
                  busy={busyId === pref.channelId}
                  onToggleMuted={(p) => void handleUpdate(p, { muted: !p.muted })}
                  onToggleMentionOnly={(p) => void handleUpdate(p, { mentionOnly: !p.mentionOnly })}
                />
              ))}
            </tbody>
          </table>
        </div>
      )}
    </SettingsSection>
  );
}
