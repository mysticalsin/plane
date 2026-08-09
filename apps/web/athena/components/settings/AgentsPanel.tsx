/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 *
 * The mentionable AI-agent roster. Registering an agent here (POST) is what makes it appear
 * in GET /chat/members for @mention autocomplete — see apps/bff/src/routes/chatSettings/
 * agents.ts's module comment. Enabling/disabling is the one field this surface patches inline.
 */
import { useState } from "react";
import { Bot } from "lucide-react";
import { Button, Loader, ToggleSwitch } from "@plane/ui";
import { TOAST_TYPE, setToast } from "@plane/propel/toast";
import { cn } from "@plane/utils";
import { ChatEmptyState } from "../ChatEmptyState";
import { ChatErrorState } from "../ChatErrorState";
import { useAgentSettings } from "./hooks/useAgentSettings";
import { AgentFormModal } from "./shared/AgentFormModal";
import { formatSettingsTimestamp } from "./shared/formatDate";
import { SettingsSection } from "./shared/SettingsSection";
import type { AgentRegistration, ChatModelProvider } from "./types";

const PROVIDER_LABELS: Record<ChatModelProvider, string> = {
  deepseek: "DeepSeek",
  moonshot: "Moonshot",
  anthropic: "Anthropic",
};

function AgentsSkeleton() {
  return (
    <Loader className="flex flex-col gap-2">
      {[...Array(3)].map((_, i) => (
        <Loader.Item key={i} height="44px" width="100%" />
      ))}
    </Loader>
  );
}

interface AgentRowProps {
  readonly agent: AgentRegistration;
  readonly busy: boolean;
  readonly onToggleEnabled: (agent: AgentRegistration) => void;
}

function AgentRow(props: AgentRowProps) {
  const { agent, busy, onToggleEnabled } = props;
  return (
    <tr className={cn("divide-x divide-subtle text-13 text-secondary", !agent.enabled && "opacity-60")}>
      <td className="px-3 py-2.5">
        <div className="flex items-center gap-1.5 font-medium text-primary">
          <Bot className="size-3.5 flex-shrink-0 text-tertiary" strokeWidth={1.75} />
          {agent.name}
        </div>
      </td>
      <td className="px-3 py-2.5">{PROVIDER_LABELS[agent.provider]}</td>
      <td className="font-mono max-w-56 truncate px-3 py-2.5 text-12">{agent.model}</td>
      <td className="px-3 py-2.5">{formatSettingsTimestamp(agent.lastAnsweredAt)}</td>
      <td className="px-3 py-2.5 text-right">
        <ToggleSwitch
          value={agent.enabled}
          onChange={() => onToggleEnabled(agent)}
          disabled={busy}
          label={agent.enabled ? `Disable ${agent.name}` : `Enable ${agent.name}`}
        />
      </td>
    </tr>
  );
}

export function AgentsPanel() {
  const { status, agents, error, retry, registerAgent, updateAgent } = useAgentSettings();
  const [modalOpen, setModalOpen] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);

  async function handleToggleEnabled(agent: AgentRegistration) {
    setBusyId(agent.id);
    const result = await updateAgent(agent.id, { enabled: !agent.enabled });
    setBusyId(null);
    if (!result.ok) {
      setToast({ type: TOAST_TYPE.ERROR, title: "Could not update the agent", message: result.error });
    }
  }

  return (
    <SettingsSection
      title="Agents"
      description="The roster of AI agents mentionable in chat. Registering one here makes it @mentionable."
      action={
        <Button variant="primary" size="sm" onClick={() => setModalOpen(true)}>
          Register agent
        </Button>
      }
    >
      {status === "loading" && <AgentsSkeleton />}
      {status === "error" && <ChatErrorState message={error ?? "Could not load the agent roster."} onRetry={retry} />}
      {status === "ready" && agents.length === 0 && (
        <ChatEmptyState
          title="No agents registered yet"
          description="Register an AI agent to make it @mentionable in chat."
        />
      )}
      {status === "ready" && agents.length > 0 && (
        <div className="overflow-hidden overflow-x-auto rounded-md border border-subtle">
          <table className="w-full min-w-[640px] table-auto">
            <thead className="divide-y divide-subtle bg-surface-2">
              <tr className="divide-x divide-subtle text-13 text-primary">
                <th className="px-3 py-2 text-left font-medium">Name</th>
                <th className="px-3 py-2 text-left font-medium">Provider</th>
                <th className="px-3 py-2 text-left font-medium">Model</th>
                <th className="px-3 py-2 text-left font-medium">Last active</th>
                <th className="px-3 py-2 text-right font-medium">Enabled</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-subtle bg-surface-1">
              {agents.map((agent) => (
                <AgentRow
                  key={agent.id}
                  agent={agent}
                  busy={busyId === agent.id}
                  onToggleEnabled={(a) => void handleToggleEnabled(a)}
                />
              ))}
            </tbody>
          </table>
        </div>
      )}

      <AgentFormModal isOpen={modalOpen} onClose={() => setModalOpen(false)} onSubmit={registerAgent} />
    </SettingsSection>
  );
}
