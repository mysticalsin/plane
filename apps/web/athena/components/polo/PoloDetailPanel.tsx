/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */
import type { ReactNode } from "react";
import { ExternalLink } from "lucide-react";
import { Button } from "@plane/ui";
import { cn } from "@plane/utils";
import { ChatEmptyState } from "../ChatEmptyState";
import { ChatErrorState } from "../ChatErrorState";
import { FOCUS_RING } from "../../utils/focusRing";
import { POLO_WEB_BASE_URL } from "./config";
import { formatPoloMoney } from "./format";
import { PoloDetailSkeleton } from "./PoloSkeletons";
import { usePoloOpportunity } from "./usePoloOpportunity";

interface PoloDetailPanelProps {
  readonly opportunityId: string | null;
}

function Field(props: { label: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-11 font-medium tracking-wide text-tertiary uppercase">{props.label}</span>
      <span className="text-13 text-primary">{props.children}</span>
    </div>
  );
}

export function PoloDetailPanel(props: PoloDetailPanelProps) {
  const { opportunityId } = props;
  const { status, opportunity, error, retry } = usePoloOpportunity(opportunityId);

  return (
    <aside className="flex h-full w-80 flex-shrink-0 flex-col border-l border-subtle bg-surface-1">
      <div className="border-b border-subtle px-4 py-3">
        <h2 className="text-14 font-semibold text-primary">Opportunity</h2>
      </div>
      <div className="flex-1 overflow-y-auto">
        {!opportunityId && (
          <ChatEmptyState title="No opportunity selected" description="Pick a row to see its details here." />
        )}
        {opportunityId && status === "loading" && <PoloDetailSkeleton />}
        {opportunityId && status === "error" && (
          <ChatErrorState message={error ?? "Could not load this opportunity."} onRetry={retry} />
        )}
        {opportunityId && status === "ready" && opportunity && (
          <div className="flex flex-col gap-4 p-4">
            <div>
              <p className="text-11 font-medium tracking-wide text-tertiary uppercase">{opportunity.code}</p>
              <h3 className="text-14 font-semibold text-primary">{opportunity.name}</h3>
            </div>
            <Field label="Customer">{opportunity.customer}</Field>
            <Field label="Stage">{opportunity.stage ?? "—"}</Field>
            <Field label="Value">{formatPoloMoney(opportunity.value)}</Field>
            <Field label="Probability">{opportunity.probability}%</Field>
            <Field label="Close date">{opportunity.dueDate ?? "—"}</Field>
            <Field label="Owner">{opportunity.owner ?? "Unassigned"}</Field>
            <Field label="Industry">{opportunity.industry ?? "—"}</Field>
            <a
              href={`${POLO_WEB_BASE_URL}/opportunities/${encodeURIComponent(opportunity.id)}`}
              target="_blank"
              rel="noreferrer"
              className={cn("w-fit", FOCUS_RING)}
            >
              <Button variant="neutral-primary" size="sm" className="gap-1.5">
                <ExternalLink className="size-3.5" strokeWidth={1.75} />
                Open in Polo
              </Button>
            </a>
          </div>
        )}
      </div>
    </aside>
  );
}
