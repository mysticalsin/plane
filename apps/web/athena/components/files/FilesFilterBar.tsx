/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 *
 * Plain native <select> for the two filters rather than @plane/ui's CustomSelect — a filter
 * dropdown with a handful of options needs none of CustomSelect's search/multi-level menu
 * machinery, and a native select is keyboard- and screen-reader-accessible for free.
 */
import { Search } from "lucide-react";
import { Input } from "@plane/ui";
import { cn } from "@plane/utils";
import { FOCUS_RING } from "../../utils/focusRing";
import type { ChatChannel } from "../../types/chat";
import type { EngagementOption } from "./engagementsApi";

interface FilesFilterBarProps {
  readonly search: string;
  readonly onSearchChange: (value: string) => void;
  readonly engagementId: string;
  readonly onEngagementChange: (value: string) => void;
  readonly channelId: string;
  readonly onChannelChange: (value: string) => void;
  readonly engagements: readonly EngagementOption[];
  readonly channels: readonly ChatChannel[];
  readonly resultCount: number;
}

const SELECT_CLASSES = cn(
  "h-full rounded-md border border-subtle-1 bg-transparent px-2.5 py-1.5 text-13 text-primary",
  FOCUS_RING
);

export function FilesFilterBar(props: FilesFilterBarProps) {
  const {
    search,
    onSearchChange,
    engagementId,
    onEngagementChange,
    channelId,
    onChannelChange,
    engagements,
    channels,
    resultCount,
  } = props;

  return (
    <div className="flex flex-wrap items-center gap-3 border-b border-subtle px-4 py-3">
      <div className="relative w-64 max-w-full">
        <Search
          className="pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-tertiary"
          strokeWidth={1.75}
        />
        <Input
          mode="transparent"
          inputSize="sm"
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Search by file name…"
          aria-label="Search files by name"
          className={cn("w-full border border-subtle-1 pl-8", FOCUS_RING)}
        />
      </div>

      <select
        value={engagementId}
        onChange={(e) => onEngagementChange(e.target.value)}
        aria-label="Filter by engagement"
        className={SELECT_CLASSES}
      >
        <option value="">All engagements</option>
        {engagements.map((engagement) => (
          <option key={engagement.id} value={engagement.id}>
            {engagement.name}
          </option>
        ))}
      </select>

      <select
        value={channelId}
        onChange={(e) => onChannelChange(e.target.value)}
        aria-label="Filter by channel"
        className={SELECT_CLASSES}
      >
        <option value="">All channels</option>
        {channels.map((channel) => (
          <option key={channel.id} value={channel.id}>
            #{channel.name}
          </option>
        ))}
      </select>

      <span className="ml-auto text-13 text-tertiary">
        {resultCount} {resultCount === 1 ? "file" : "files"}
      </span>
    </div>
  );
}
