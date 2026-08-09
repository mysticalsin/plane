/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 *
 * The channel switcher — Slack's left rail crossed with Linear's dense, borderless list
 * rows (hover surface only, no resting card background; see tailwind-config/AGENTS.md's
 * "Sidebar Menu Items" pattern). Grouped exactly as the build brief asks: project
 * channels, workspace channels, direct messages.
 */

import { Hash, Users } from "lucide-react";
import Link from "next/link";
import { cn } from "@plane/utils";
import type { ChatChannel } from "../types/chat";
import type { GroupedChannels } from "../utils/groupChannels";
import { FOCUS_RING } from "../utils/focusRing";
import { ChannelSidebarSkeleton } from "./ChatSkeletons";
import { ChatErrorState } from "./ChatErrorState";

interface ChannelSidebarProps {
  readonly workspaceSlug: string;
  readonly grouped: GroupedChannels;
  readonly activeChannelId: string | null;
  readonly status: "loading" | "error" | "ready";
  readonly error: string | null;
  readonly onRetry: () => void;
}

function channelHref(workspaceSlug: string, channel: ChatChannel): string {
  if (channel.kind === "PROJECT" && channel.projectId) {
    return `/${workspaceSlug}/projects/${channel.projectId}/chat`;
  }
  return `/${workspaceSlug}/chat/${channel.id}`;
}

function ChannelRow(props: { workspaceSlug: string; channel: ChatChannel; isActive: boolean }) {
  const { workspaceSlug, channel, isActive } = props;
  const Icon = channel.kind === "DM" ? Users : Hash;
  return (
    <Link
      href={channelHref(workspaceSlug, channel)}
      className={cn(
        "flex min-h-9 items-center gap-2 rounded-md px-2 py-1.5 text-13",
        FOCUS_RING,
        isActive
          ? "bg-layer-transparent-active font-medium text-primary"
          : "text-secondary hover:bg-layer-transparent-hover"
      )}
    >
      <Icon className="size-3.5 flex-shrink-0 text-tertiary" strokeWidth={1.75} />
      <span className="truncate">{channel.name}</span>
    </Link>
  );
}

function ChannelGroup(props: {
  label: string;
  workspaceSlug: string;
  channels: readonly ChatChannel[];
  activeChannelId: string | null;
}) {
  const { label, workspaceSlug, channels, activeChannelId } = props;
  if (channels.length === 0) return null;
  return (
    <div className="flex flex-col gap-0.5">
      <p className="px-2 py-1 text-11 font-medium tracking-wide text-tertiary uppercase">{label}</p>
      {channels.map((channel) => (
        <ChannelRow
          key={channel.id}
          workspaceSlug={workspaceSlug}
          channel={channel}
          isActive={channel.id === activeChannelId}
        />
      ))}
    </div>
  );
}

export function ChannelSidebar(props: ChannelSidebarProps) {
  const { workspaceSlug, grouped, activeChannelId, status, error, onRetry } = props;

  return (
    <aside className="flex h-full w-60 flex-shrink-0 flex-col border-r border-subtle bg-surface-1">
      <div className="border-b border-subtle px-3 py-3">
        <h2 className="text-14 font-semibold text-primary">Chat</h2>
      </div>
      <div className="flex-1 overflow-y-auto p-2">
        {status === "loading" && <ChannelSidebarSkeleton />}
        {status === "error" && <ChatErrorState message={error ?? "Could not load channels."} onRetry={onRetry} />}
        {status === "ready" && (
          <div className="flex flex-col gap-3">
            <ChannelGroup
              label="Project channels"
              workspaceSlug={workspaceSlug}
              channels={grouped.project}
              activeChannelId={activeChannelId}
            />
            <ChannelGroup
              label="Workspace channels"
              workspaceSlug={workspaceSlug}
              channels={grouped.workspace}
              activeChannelId={activeChannelId}
            />
            <ChannelGroup
              label="Direct messages"
              workspaceSlug={workspaceSlug}
              channels={grouped.dm}
              activeChannelId={activeChannelId}
            />
            {grouped.project.length === 0 && grouped.workspace.length === 0 && grouped.dm.length === 0 && (
              <p className="px-2 py-1 text-13 text-secondary">No channels yet.</p>
            )}
          </div>
        )}
      </div>
    </aside>
  );
}
