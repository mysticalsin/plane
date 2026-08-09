/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useCallback, useEffect, useState } from "react";
import { ChatApiError } from "../../../api/http";
import { createChannelSetting, listChannelSettings, updateChannelSetting } from "../api/chatSettingsClient";
import type { ChannelSettings, CreateChannelInput, SettingsFetchStatus, UpdateChannelInput } from "../types";

export interface UseChannelSettingsResult {
  readonly status: SettingsFetchStatus;
  readonly channels: readonly ChannelSettings[];
  readonly error: string | null;
  readonly retry: () => void;
  readonly createChannel: (input: CreateChannelInput) => Promise<{ ok: boolean; error?: string }>;
  readonly updateChannel: (id: string, input: UpdateChannelInput) => Promise<{ ok: boolean; error?: string }>;
}

function upsert(list: readonly ChannelSettings[], channel: ChannelSettings): readonly ChannelSettings[] {
  const existingIndex = list.findIndex((c) => c.id === channel.id);
  if (existingIndex === -1) return [...list, channel];
  const next = list.slice();
  next[existingIndex] = channel;
  return next;
}

export function useChannelSettings(): UseChannelSettingsResult {
  const [status, setStatus] = useState<SettingsFetchStatus>("loading");
  const [channels, setChannels] = useState<readonly ChannelSettings[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setStatus("loading");
    setError(null);
    listChannelSettings()
      .then((res) => {
        if (cancelled) return;
        setChannels(res.channels);
        setStatus("ready");
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        setError(err instanceof ChatApiError ? err.message : "Could not load channels.");
        setStatus("error");
      });
    return () => {
      cancelled = true;
    };
  }, [attempt]);

  const retry = useCallback(() => setAttempt((n) => n + 1), []);

  const createChannel = useCallback(async (input: CreateChannelInput) => {
    try {
      const created = await createChannelSetting(input);
      setChannels((prev) => upsert(prev, created));
      return { ok: true };
    } catch (err) {
      return { ok: false, error: err instanceof ChatApiError ? err.message : "Could not create the channel." };
    }
  }, []);

  const updateChannel = useCallback(async (id: string, input: UpdateChannelInput) => {
    try {
      const updated = await updateChannelSetting(id, input);
      setChannels((prev) => upsert(prev, updated));
      return { ok: true };
    } catch (err) {
      return { ok: false, error: err instanceof ChatApiError ? err.message : "Could not update the channel." };
    }
  }, []);

  return { status, channels, error, retry, createChannel, updateChannel };
}
