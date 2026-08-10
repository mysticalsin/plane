/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 *
 * What you can actually @mention right now, read from the same endpoint the composer's mention
 * picker uses.
 *
 * This exists because the roster below it lists *registrations*, and an agent can be mentionable
 * without one: the standalone agent runtime brings its own Nostr key and is added as a chat
 * identity directly, so a perfectly working agent showed up nowhere in settings while answering
 * questions in chat. "No agents registered yet" next to a live, replying agent is worse than no
 * information — it tells someone to go set up a thing that is already running.
 */
import { useEffect, useState } from "react";
import { AtSign, Bot } from "lucide-react";
import { Loader } from "@plane/ui";
import { listChatMembers } from "../../api/chatClient";
import type { ChatMember } from "../../types/chat";

export function MentionableAgents() {
  const [agents, setAgents] = useState<readonly ChatMember[] | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;
    listChatMembers()
      .then((response) => {
        if (cancelled) return;
        setAgents(response.members.filter((member) => member.kind === "AGENT"));
      })
      .catch(() => {
        if (!cancelled) setFailed(true);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  // Silent on failure: this is a supporting read next to the real roster, and an error box for it
  // would sit above the panel that still works perfectly well.
  if (failed) return null;

  if (agents === null) {
    return (
      <Loader className="flex flex-col gap-2">
        <Loader.Item height="56px" />
      </Loader>
    );
  }

  return (
    <div className="flex flex-col gap-2 rounded-md border border-subtle bg-layer-1 p-3">
      <h4 className="flex items-center gap-1.5 text-12 font-medium tracking-wide text-secondary uppercase">
        <AtSign className="size-3.5" strokeWidth={1.75} /> Mentionable in chat right now
      </h4>
      {agents.length === 0 ? (
        <p className="text-12 text-tertiary">
          No agents are mentionable yet. Register one below, or start the agent runtime — see docs/agents/README.md.
        </p>
      ) : (
        <>
          <ul className="flex flex-wrap gap-2">
            {agents.map((agent) => (
              <li
                key={agent.id}
                className="flex items-center gap-1.5 rounded-full border border-subtle-1 px-2.5 py-1 text-12 text-primary"
              >
                <Bot className="size-3.5 flex-shrink-0 text-tertiary" strokeWidth={1.75} />
                <span>@{agent.displayName}</span>
              </li>
            ))}
          </ul>
          <p className="text-11 text-tertiary">
            Type <span className="font-mono">@</span> in any channel to pick one. An agent running outside Athena
            appears here without a registration row below.
          </p>
        </>
      )}
    </div>
  );
}
