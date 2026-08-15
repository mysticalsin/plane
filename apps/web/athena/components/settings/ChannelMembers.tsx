/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 *
 * Who can see a private channel.
 *
 * Only reachable for a channel that is actually private: an open channel is readable by the whole
 * workspace, so a roster for it would be a list you cannot change the meaning of. Opens on demand
 * rather than loading every channel's membership up front — a settings table with twenty channels
 * would otherwise fire twenty requests to render a column nobody expanded.
 */
import { useCallback, useEffect, useState } from "react";
import { UserMinus, UserPlus } from "lucide-react";
import { Button, CustomSelect, Loader } from "@plane/ui";
import { ChatApiError } from "../../api/http";
import { FOCUS_RING } from "../../utils/focusRing";
import { addChannelMember, listChannelMembers, removeChannelMember } from "./api/chatSettingsClient";
import type { ChannelMember, WorkspaceMember } from "./types";

interface ChannelMembersProps {
  readonly channelId: string;
  readonly channelName: string;
  /** Everyone in the workspace, so the picker only offers people who can legitimately be added. */
  readonly workspaceMembers: readonly WorkspaceMember[];
  readonly onChanged: () => void;
}

export function ChannelMembers(props: ChannelMembersProps) {
  const { channelId, channelName, workspaceMembers, onChanged } = props;
  const [members, setMembers] = useState<readonly ChannelMember[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [selected, setSelected] = useState<string | null>(null);

  const load = useCallback(() => {
    listChannelMembers(channelId)
      .then((result) => setMembers(result.members))
      .catch((cause: unknown) =>
        setError(cause instanceof ChatApiError ? cause.message : "Could not load who is in this channel.")
      );
  }, [channelId]);

  useEffect(load, [load]);

  function run(work: Promise<{ members: readonly ChannelMember[] }>) {
    setBusy(true);
    setError(null);
    work
      .then((result) => {
        setMembers(result.members);
        setSelected(null);
        onChanged();
      })
      .catch((cause: unknown) => setError(cause instanceof ChatApiError ? cause.message : "That did not work."))
      .finally(() => setBusy(false));
  }

  if (!members) {
    return (
      <Loader>
        <Loader.Item height="60px" width="100%" />
      </Loader>
    );
  }

  const inChannel = new Set(members.map((member) => member.userId));
  const addable = workspaceMembers.filter((member) => !inChannel.has(member.id));
  const selectedLabel = addable.find((member) => member.id === selected)?.email ?? "Add someone";

  return (
    <div className="flex flex-col gap-2.5 border-t border-subtle bg-layer-1 px-3 py-3">
      {error && <p className="text-12 text-danger-primary">{error}</p>}

      <div className="flex flex-wrap gap-1.5">
        {members.map((member) => (
          <span
            key={member.userId}
            className="inline-flex items-center gap-1.5 rounded-full border border-subtle px-2.5 py-1 text-12 text-secondary"
          >
            {member.displayName}
            <button
              type="button"
              disabled={busy}
              onClick={() => run(removeChannelMember(channelId, member.userId))}
              aria-label={`Remove ${member.displayName} from ${channelName}`}
              className={`text-tertiary hover:text-danger-primary disabled:opacity-50 ${FOCUS_RING}`}
            >
              <UserMinus className="size-3.5" strokeWidth={1.75} />
            </button>
          </span>
        ))}
        {members.length === 0 && <span className="text-12 text-tertiary">Nobody can see this channel yet.</span>}
      </div>

      {addable.length > 0 ? (
        <div className="flex flex-wrap items-center gap-2">
          <CustomSelect
            value={selected}
            onChange={(next: string) => setSelected(next)}
            label={selectedLabel}
            buttonClassName={`border border-subtle-1 bg-layer-2 !rounded-md ${FOCUS_RING}`}
            input
          >
            {addable.map((member) => (
              <CustomSelect.Option key={member.id} value={member.id}>
                {member.email}
              </CustomSelect.Option>
            ))}
          </CustomSelect>
          <Button
            variant="neutral-primary"
            size="sm"
            disabled={busy || !selected}
            onClick={() => selected && run(addChannelMember(channelId, selected))}
            prependIcon={<UserPlus className="size-3.5" strokeWidth={1.75} />}
          >
            Add
          </Button>
        </div>
      ) : (
        <span className="text-12 text-tertiary">Everyone in this workspace is already in this channel.</span>
      )}
    </div>
  );
}
