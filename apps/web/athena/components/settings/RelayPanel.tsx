/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 *
 * Read-only Buzz connection status — relay URL, community host, live health with latency.
 * No PATCH exists for this panel by design (see the route's own module comment); every
 * control here is a status readout, not an editable field.
 */
import type { ReactNode } from "react";
import { CheckCircle2, XCircle } from "lucide-react";
import { Loader } from "@plane/ui";
import { ChatErrorState } from "../ChatErrorState";
import { useRelaySettings } from "./hooks/useRelaySettings";
import { SettingsSection } from "./shared/SettingsSection";

function RelaySkeleton() {
  return (
    <Loader className="flex flex-col gap-3">
      <Loader.Item height="52px" width="100%" />
      <Loader.Item height="52px" width="100%" />
      <Loader.Item height="52px" width="60%" />
    </Loader>
  );
}

function StatRow(props: { label: string; children: ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-subtle px-4 py-3 last:border-b-0">
      <span className="text-13 text-secondary">{props.label}</span>
      <span className="font-mono text-13 text-primary">{props.children}</span>
    </div>
  );
}

export function RelayPanel() {
  const { status, relay, error, retry } = useRelaySettings();

  return (
    <SettingsSection
      title="Relay"
      description="The Buzz relay Athena's chat surface signs and reads every message through."
    >
      {status === "loading" && <RelaySkeleton />}
      {status === "error" && <ChatErrorState message={error ?? "Could not reach the Buzz relay."} onRetry={retry} />}
      {status === "ready" && relay && (
        <div className="overflow-hidden rounded-md border border-subtle bg-surface-1">
          <StatRow label="Relay URL">{relay.relayUrl}</StatRow>
          <StatRow label="Community host">{relay.communityHost}</StatRow>
          <div className="flex items-center justify-between gap-4 px-4 py-3">
            <span className="text-13 text-secondary">Health</span>
            <div className="flex items-center gap-2">
              {relay.health.ok ? (
                <CheckCircle2 className="size-4 text-success-primary" strokeWidth={1.75} />
              ) : (
                <XCircle className="size-4 text-danger-primary" strokeWidth={1.75} />
              )}
              <span className="text-13 font-medium text-primary">{relay.health.ok ? "Connected" : "Unreachable"}</span>
              <span className="font-mono text-12 text-tertiary">{relay.health.latencyMs}ms</span>
            </div>
          </div>
          {!relay.health.ok && relay.health.error && (
            <p className="border-t border-subtle bg-danger-subtle px-4 py-2 text-12 text-danger-primary">
              {relay.health.error}
            </p>
          )}
        </div>
      )}
    </SettingsSection>
  );
}
