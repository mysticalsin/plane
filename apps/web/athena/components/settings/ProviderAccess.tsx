/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 *
 * Who may add a model provider key here, and whose key is answering right now.
 *
 * Sits above the key cards because it answers the question people arrive with — "can I add my
 * own key?" — before showing them fields they may not be allowed to use. Presentational: the
 * fetching and the mutations live in useProviderPolicy.
 */
import { ShieldCheck, Users } from "lucide-react";
import { Button } from "@plane/ui";
import { PROVIDER_LABELS } from "./providerLabels";
import type { ChatModelProvider, ProviderPolicy } from "./types";

interface ProviderAccessProps {
  readonly policy: ProviderPolicy;
  readonly busy: boolean;
  /** Providers with a key stored — only those can be made active. */
  readonly connectedProviders: readonly ChatModelProvider[];
  readonly onChangePolicy: (policy: ProviderPolicy["policy"]) => void;
  readonly onChangeActiveProvider: (provider: ChatModelProvider | null) => void;
}

export function ProviderAccess(props: ProviderAccessProps) {
  const { policy, busy, connectedProviders, onChangePolicy, onChangeActiveProvider } = props;
  const membersMayManage = policy.policy === "members";

  return (
    <div className="flex flex-col gap-3 rounded-md border border-subtle bg-surface-2 p-3">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-start gap-2.5">
          {membersMayManage ? (
            <Users className="mt-0.5 size-4 flex-shrink-0 text-tertiary" strokeWidth={1.75} />
          ) : (
            <ShieldCheck className="mt-0.5 size-4 flex-shrink-0 text-tertiary" strokeWidth={1.75} />
          )}
          <div className="flex flex-col gap-0.5">
            <span className="text-13 font-medium text-primary">
              {membersMayManage ? "Anyone here can add a key" : "Only admins can add a key"}
            </span>
            <span className="text-12 leading-relaxed text-secondary">
              A provider key decides who gets billed and which vendor sees this workspace&apos;s conversations.
            </span>
          </div>
        </div>

        {policy.isAdmin && (
          <Button
            variant="neutral-primary"
            size="sm"
            disabled={busy}
            onClick={() => onChangePolicy(membersMayManage ? "admins_only" : "members")}
          >
            {membersMayManage ? "Restrict to admins" : "Let members add keys"}
          </Button>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-x-3 gap-y-2 border-t border-subtle pt-3">
        <span className="text-12 text-secondary">
          Answering with:{" "}
          <span className="text-primary">
            {policy.activeProvider ? PROVIDER_LABELS[policy.activeProvider] : "Athena's default route"}
          </span>
        </span>

        {policy.canManageKeys && (
          <div className="ml-auto flex flex-wrap items-center gap-2">
            {connectedProviders
              .filter((provider) => provider !== policy.activeProvider)
              .map((provider) => (
                <Button
                  key={provider}
                  variant="neutral-primary"
                  size="sm"
                  disabled={busy}
                  onClick={() => onChangeActiveProvider(provider)}
                >
                  Use {PROVIDER_LABELS[provider]}
                </Button>
              ))}
            {policy.activeProvider && (
              <Button variant="neutral-primary" size="sm" disabled={busy} onClick={() => onChangeActiveProvider(null)}>
                Use Athena&apos;s default
              </Button>
            )}
          </div>
        )}
      </div>

      {!policy.canManageKeys && (
        <p className="text-12 text-tertiary">
          Ask a workspace admin to add a key, or to allow members to add their own.
        </p>
      )}
    </div>
  );
}
