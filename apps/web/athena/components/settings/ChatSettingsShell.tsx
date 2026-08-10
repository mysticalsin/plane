/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 *
 * The chat settings surface's own shell — a section nav plus one panel at a time, the same
 * "narrow left rail, wide content" shape as ChannelSidebar + MessagePane (../ChatShell.tsx),
 * so this reads as part of the same product rather than a bolted-on settings page. Client-side
 * section state (not per-section routes) because none of these six panels need a shareable
 * deep link yet, and it keeps this build entirely inside the one route entry it owns.
 */
import { useState } from "react";
import { cn } from "@plane/utils";
import { FOCUS_RING } from "../../utils/focusRing";
import { AgentsPanel } from "./AgentsPanel";
import { ChannelsPanel } from "./ChannelsPanel";
import { IdentityPanel } from "./IdentityPanel";
import { McpPanel } from "./McpPanel";
import { ModelPanel } from "./ModelPanel";
import { NotificationsPanel } from "./NotificationsPanel";
import { ProvidersPanel } from "./ProvidersPanel";
import { RelayPanel } from "./RelayPanel";

type SettingsSectionId = "relay" | "identity" | "channels" | "agents" | "model" | "mcp" | "providers" | "notifications";

const SECTIONS: readonly { id: SettingsSectionId; label: string }[] = [
  { id: "relay", label: "Relay" },
  { id: "identity", label: "Your identity" },
  { id: "channels", label: "Channels" },
  { id: "agents", label: "Agents" },
  // Model sits directly under Agents: picking who answers and what answers is one decision,
  // and both are upstream of the BYO-key panel most workspaces never need to open.
  { id: "model", label: "Model" },
  { id: "mcp", label: "MCP servers" },
  { id: "providers", label: "Model providers" },
  { id: "notifications", label: "Notifications" },
];

function renderSection(id: SettingsSectionId) {
  switch (id) {
    case "relay":
      return <RelayPanel />;
    case "identity":
      return <IdentityPanel />;
    case "channels":
      return <ChannelsPanel />;
    case "agents":
      return <AgentsPanel />;
    case "model":
      return <ModelPanel />;
    case "mcp":
      return <McpPanel />;
    case "providers":
      return <ProvidersPanel />;
    case "notifications":
      return <NotificationsPanel />;
  }
}

export function ChatSettingsShell() {
  const [activeSection, setActiveSection] = useState<SettingsSectionId>("relay");

  return (
    <div className="flex h-full w-full overflow-hidden">
      <nav
        aria-label="Chat settings sections"
        className="flex h-full w-60 flex-shrink-0 flex-col gap-0.5 border-r border-subtle bg-surface-1 p-2"
      >
        <h2 className="px-2 py-2 text-14 font-semibold text-primary">Chat settings</h2>
        {SECTIONS.map((section) => (
          <button
            key={section.id}
            type="button"
            aria-current={activeSection === section.id ? "page" : undefined}
            onClick={() => setActiveSection(section.id)}
            className={cn(
              "flex min-h-9 items-center rounded-md px-2.5 py-1.5 text-left text-13",
              FOCUS_RING,
              activeSection === section.id
                ? "bg-layer-transparent-active font-medium text-primary"
                : "text-secondary hover:bg-layer-transparent-hover"
            )}
          >
            {section.label}
          </button>
        ))}
      </nav>
      <div className="flex-1 overflow-y-auto p-6">
        <div className="mx-auto max-w-3xl">{renderSection(activeSection)}</div>
      </div>
    </div>
  );
}
