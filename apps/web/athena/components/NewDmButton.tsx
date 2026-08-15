/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 *
 * Starting a direct message.
 *
 * The BFF has been able to create and list DMs since chat shipped, and the sidebar has had an
 * empty "Direct messages" group the whole time, because nothing in the product could start one.
 *
 * The roster is loaded when the picker opens, not on every chat render: it is a list nobody sees
 * until they ask for it.
 */
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { PenSquare } from "lucide-react";
import { cn } from "@plane/utils";
import { listWorkspaceMembers, type AthenaWorkspaceMember } from "../api/chatClient";
import { FOCUS_RING } from "../utils/focusRing";
import { useEscapeKey } from "../hooks/useEscapeKey";

interface NewDmButtonProps {
  readonly workspaceSlug: string;
  /** Excluded from the list — the server refuses a DM with yourself, so offering it is a dead end. */
  readonly currentUserId: string | null;
  readonly onStart: (userId: string) => Promise<{ ok: boolean; channelId?: string; error?: string }>;
}

export function NewDmButton(props: NewDmButtonProps) {
  const { workspaceSlug, currentUserId, onStart } = props;
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [members, setMembers] = useState<readonly AthenaWorkspaceMember[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEscapeKey(open, () => setOpen(false));

  useEffect(() => {
    if (!open || members) return;
    listWorkspaceMembers()
      .then((result) => setMembers(result.members.filter((member) => member.id !== currentUserId)))
      .catch(() => setError("Could not load who is here."));
  }, [open, members, currentUserId]);

  async function start(userId: string) {
    setBusy(true);
    const result = await onStart(userId);
    setBusy(false);
    if (result.ok && result.channelId) {
      setOpen(false);
      router.push(`/${workspaceSlug}/chat/${result.channelId}`);
    } else {
      setError(result.error ?? "Could not start that conversation.");
    }
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        aria-label="New direct message"
        aria-expanded={open}
        className={cn(
          "flex size-7 items-center justify-center rounded-md text-tertiary hover:bg-layer-transparent-hover hover:text-primary",
          FOCUS_RING
        )}
      >
        <PenSquare className="size-3.5" strokeWidth={1.75} />
      </button>

      {open && (
        <div className="shadow-md absolute top-full right-0 z-20 mt-1 w-56 rounded-md border border-subtle bg-surface-1 p-1">
          {error && <p className="px-2 py-1.5 text-12 text-danger-primary">{error}</p>}
          {!members && !error && <p className="px-2 py-1.5 text-12 text-tertiary">Loading…</p>}
          {members?.length === 0 && (
            <p className="px-2 py-1.5 text-12 text-tertiary">Nobody else is in this workspace yet.</p>
          )}
          {members?.map((member) => (
            <button
              key={member.id}
              type="button"
              disabled={busy}
              onClick={() => void start(member.id)}
              className={cn(
                "flex w-full items-center rounded px-2 py-1.5 text-left text-13 text-secondary hover:bg-layer-transparent-hover hover:text-primary disabled:opacity-50",
                FOCUS_RING
              )}
            >
              <span className="truncate">{member.email}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
