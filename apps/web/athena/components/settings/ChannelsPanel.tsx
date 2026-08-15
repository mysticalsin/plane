/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 *
 * Channel administration — list, create, rename, set topic, archive, and for a private channel,
 * who is in it. Private is enforced on reads (requireChannelAccess in the BFF), so the roster here
 * is the thing that decides who can open the channel at all.
 */
import { Fragment, useEffect, useState } from "react";
import { Archive, ArchiveRestore, Globe2, Hash, Lock, Pencil, Users } from "lucide-react";
import { Button, Loader } from "@plane/ui";
import { TOAST_TYPE, setToast } from "@plane/propel/toast";
import { cn } from "@plane/utils";
import { ChatEmptyState } from "../ChatEmptyState";
import { ChatErrorState } from "../ChatErrorState";
import { FOCUS_RING } from "../../utils/focusRing";
import { ChannelMembers } from "./ChannelMembers";
import { listWorkspaceMembers } from "./api/chatSettingsClient";
import { useChannelSettings } from "./hooks/useChannelSettings";
import { ChannelFormModal, type ChannelFormValues } from "./shared/ChannelFormModal";
import { SettingsSection } from "./shared/SettingsSection";
import type { ChannelSettings, WorkspaceMember } from "./types";

function ChannelsSkeleton() {
  return (
    <Loader className="flex flex-col gap-2">
      {[...Array(3)].map((_, i) => (
        <Loader.Item key={i} height="44px" width="100%" />
      ))}
    </Loader>
  );
}

function VisibilityBadge(props: { isPrivate: boolean }) {
  const Icon = props.isPrivate ? Lock : Globe2;
  return (
    <span className="inline-flex items-center gap-1.5 text-13 text-secondary">
      <Icon className="size-3.5 flex-shrink-0" strokeWidth={1.75} />
      {props.isPrivate ? "Private" : "Public"}
    </span>
  );
}

interface ChannelRowProps {
  readonly channel: ChannelSettings;
  readonly onEdit: (channel: ChannelSettings) => void;
  readonly onToggleArchive: (channel: ChannelSettings) => void;
  readonly onToggleMembers: (channel: ChannelSettings) => void;
  readonly membersOpen: boolean;
  readonly busy: boolean;
}

function ChannelRow(props: ChannelRowProps) {
  const { channel, onEdit, onToggleArchive, onToggleMembers, membersOpen, busy } = props;
  return (
    <tr className={cn("divide-x divide-subtle text-13 text-secondary", channel.archived && "opacity-60")}>
      <td className="px-3 py-2.5">
        <div className="flex items-center gap-1.5 font-medium text-primary">
          <Hash className="size-3.5 flex-shrink-0 text-tertiary" strokeWidth={1.75} />
          {channel.name}
          {channel.archived && (
            <span className="rounded bg-layer-2 px-1.5 py-0.5 text-11 font-medium tracking-wide text-tertiary uppercase">
              Archived
            </span>
          )}
        </div>
      </td>
      <td className="max-w-72 truncate px-3 py-2.5">{channel.topic ?? "—"}</td>
      <td className="px-3 py-2.5">
        <VisibilityBadge isPrivate={channel.isPrivate} />
      </td>
      <td className="px-3 py-2.5 text-right tabular-nums">{channel.memberCount}</td>
      <td className="px-3 py-2.5">
        <div className="flex items-center justify-end gap-1">
          {channel.isPrivate && (
            <button
              type="button"
              onClick={() => onToggleMembers(channel)}
              disabled={busy}
              aria-label={`${membersOpen ? "Hide" : "Show"} who is in ${channel.name}`}
              aria-expanded={membersOpen}
              className={cn(
                "flex size-8 items-center justify-center rounded-md text-secondary hover:bg-layer-transparent-hover hover:text-primary disabled:opacity-50",
                membersOpen && "bg-layer-transparent-hover text-primary",
                FOCUS_RING
              )}
            >
              <Users className="size-3.5" strokeWidth={1.75} />
            </button>
          )}
          <button
            type="button"
            onClick={() => onEdit(channel)}
            disabled={busy}
            aria-label={`Edit ${channel.name}`}
            className={cn(
              "flex size-8 items-center justify-center rounded-md text-secondary hover:bg-layer-transparent-hover hover:text-primary disabled:opacity-50",
              FOCUS_RING
            )}
          >
            <Pencil className="size-3.5" strokeWidth={1.75} />
          </button>
          <button
            type="button"
            onClick={() => onToggleArchive(channel)}
            disabled={busy}
            aria-label={channel.archived ? `Unarchive ${channel.name}` : `Archive ${channel.name}`}
            className={cn(
              "flex size-8 items-center justify-center rounded-md text-secondary hover:bg-layer-transparent-hover hover:text-primary disabled:opacity-50",
              FOCUS_RING
            )}
          >
            {channel.archived ? (
              <ArchiveRestore className="size-3.5" strokeWidth={1.75} />
            ) : (
              <Archive className="size-3.5" strokeWidth={1.75} />
            )}
          </button>
        </div>
      </td>
    </tr>
  );
}

export function ChannelsPanel() {
  const { status, channels, error, retry, createChannel, updateChannel } = useChannelSettings();
  const [modalOpen, setModalOpen] = useState(false);
  const [editingChannel, setEditingChannel] = useState<ChannelSettings | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [openMembersFor, setOpenMembersFor] = useState<string | null>(null);
  const [workspaceMembers, setWorkspaceMembers] = useState<readonly WorkspaceMember[]>([]);

  // The roster is only needed to offer people to add, so a failure here leaves the membership
  // list readable and the picker empty rather than breaking the panel.
  useEffect(() => {
    let cancelled = false;
    listWorkspaceMembers()
      .then((result) => {
        if (!cancelled) setWorkspaceMembers(result.members);
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, []);

  function openCreate() {
    setEditingChannel(null);
    setModalOpen(true);
  }

  function openEdit(channel: ChannelSettings) {
    setEditingChannel(channel);
    setModalOpen(true);
  }

  async function handleSubmit(values: ChannelFormValues) {
    if (editingChannel) {
      return updateChannel(editingChannel.id, {
        name: values.name,
        topic: values.topic.length > 0 ? values.topic : null,
        isPrivate: values.isPrivate,
      });
    }
    return createChannel({
      name: values.name,
      topic: values.topic.length > 0 ? values.topic : null,
      isPrivate: values.isPrivate,
    });
  }

  async function handleToggleArchive(channel: ChannelSettings) {
    setBusyId(channel.id);
    const result = await updateChannel(channel.id, { archived: !channel.archived });
    setBusyId(null);
    if (!result.ok) {
      setToast({ type: TOAST_TYPE.ERROR, title: "Could not update the channel", message: result.error });
    }
  }

  return (
    <SettingsSection
      title="Channels"
      description="Create, rename and archive the channels your workspace chats in."
      action={
        <Button variant="primary" size="sm" onClick={openCreate}>
          New channel
        </Button>
      }
    >
      {status === "loading" && <ChannelsSkeleton />}
      {status === "error" && <ChatErrorState message={error ?? "Could not load channels."} onRetry={retry} />}
      {status === "ready" && channels.length === 0 && (
        <ChatEmptyState title="No channels yet" description="Create your first channel to start chatting." />
      )}
      {status === "ready" && channels.length > 0 && (
        <div className="overflow-hidden overflow-x-auto rounded-md border border-subtle">
          <table className="w-full min-w-[640px] table-auto">
            <thead className="divide-y divide-subtle bg-surface-2">
              <tr className="divide-x divide-subtle text-13 text-primary">
                <th className="px-3 py-2 text-left font-medium">Name</th>
                <th className="px-3 py-2 text-left font-medium">Topic</th>
                <th className="px-3 py-2 text-left font-medium">Visibility</th>
                <th className="px-3 py-2 text-right font-medium">Members</th>
                <th className="px-3 py-2 text-right font-medium">
                  <span className="sr-only">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-subtle bg-surface-1">
              {channels.map((channel) => (
                <Fragment key={channel.id}>
                  <ChannelRow
                    channel={channel}
                    onEdit={openEdit}
                    onToggleArchive={(c) => void handleToggleArchive(c)}
                    onToggleMembers={(c) => setOpenMembersFor((current) => (current === c.id ? null : c.id))}
                    membersOpen={openMembersFor === channel.id}
                    busy={busyId === channel.id}
                  />
                  {openMembersFor === channel.id && (
                    <tr>
                      <td colSpan={5} className="p-0">
                        <ChannelMembers
                          channelId={channel.id}
                          channelName={channel.name}
                          workspaceMembers={workspaceMembers}
                          onChanged={retry}
                        />
                      </td>
                    </tr>
                  )}
                </Fragment>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <ChannelFormModal
        isOpen={modalOpen}
        channel={editingChannel}
        onClose={() => setModalOpen(false)}
        onSubmit={handleSubmit}
      />
    </SettingsSection>
  );
}
