/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 *
 * The Polo section: a read-only view onto Polo's opportunities (D:/BIDCRM), laid out like the
 * chat surface's own three-pane shell (see ../ChatShell.tsx) — a header banner, a filterable
 * table, and a detail panel — so the two Athena sections feel like one product.
 */
import { useState } from "react";
import { Info } from "lucide-react";
import { ChatErrorState } from "../ChatErrorState";
import { POLO_WEB_BASE_URL } from "./config";
import { PoloDetailPanel } from "./PoloDetailPanel";
import { PoloFilterBar } from "./PoloFilterBar";
import { PoloOpportunityTable } from "./PoloOpportunityTable";
import { PoloTableSkeleton } from "./PoloSkeletons";
import { usePoloOpportunities } from "./usePoloOpportunities";

export function PoloShell() {
  const { status, opportunities, error, search, setSearch, retry } = usePoloOpportunities();
  const [selectedId, setSelectedId] = useState<string | null>(null);

  return (
    <div className="flex h-full w-full flex-col overflow-hidden">
      <div className="flex items-center gap-2 border-b border-subtle bg-surface-2 px-4 py-2 text-13 text-secondary">
        <Info className="size-3.5 flex-shrink-0 text-tertiary" strokeWidth={1.75} />
        <span>
          Read-only view of Polo — Athena does not write to Polo yet. Every row opens the real record at{" "}
          <span className="font-medium text-primary">{POLO_WEB_BASE_URL}</span>.
        </span>
      </div>

      <div className="flex flex-1 overflow-hidden">
        <div className="flex flex-1 flex-col overflow-hidden">
          <PoloFilterBar search={search} onSearchChange={setSearch} resultCount={opportunities.length} />

          <div className="flex-1 overflow-hidden">
            {status === "loading" && <PoloTableSkeleton />}

            {status === "error" && <ChatErrorState message={error ?? "Could not reach Polo."} onRetry={retry} />}

            {status === "ready" && opportunities.length === 0 && (
              <div className="flex h-full flex-col items-center justify-center gap-1.5 px-6 text-center">
                <p className="text-14 font-medium text-primary">
                  {search ? "No opportunities match this search" : "No opportunities in Polo yet"}
                </p>
                <p className="max-w-sm text-13 text-secondary">
                  {search
                    ? "Try a different customer, opportunity name, or code."
                    : "Once opportunities exist in Polo, they'll show up here automatically."}
                </p>
              </div>
            )}

            {status === "ready" && opportunities.length > 0 && (
              <PoloOpportunityTable opportunities={opportunities} selectedId={selectedId} onSelect={setSelectedId} />
            )}
          </div>
        </div>

        <PoloDetailPanel opportunityId={selectedId} />
      </div>
    </div>
  );
}
