/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 *
 * Hand-rolled rather than @plane/ui's <Table> primitive: that primitive has no per-row click
 * hook, and a row here needs to be a single keyboard-operable target (select for the detail
 * panel), not per-cell handlers. Column classNames (divide-y divide-subtle, text-13, px-2.5
 * py-2) are lifted from packages/ui/src/tables/table.tsx so the visual result still matches.
 */
import { ExternalLink } from "lucide-react";
import { cn } from "@plane/utils";
import { FOCUS_RING } from "../../utils/focusRing";
import { POLO_WEB_BASE_URL } from "./config";
import { formatPoloMoney } from "./format";
import type { PoloOpportunity } from "./types";

interface PoloOpportunityTableProps {
  readonly opportunities: readonly PoloOpportunity[];
  readonly selectedId: string | null;
  readonly onSelect: (id: string) => void;
}

function formatCloseDate(dueDate: string | null): string {
  if (!dueDate) return "—";
  const parsed = new Date(`${dueDate}T00:00:00Z`);
  if (Number.isNaN(parsed.getTime())) return dueDate;
  return parsed.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric", timeZone: "UTC" });
}

function poloOpportunityUrl(id: string): string {
  return `${POLO_WEB_BASE_URL}/opportunities/${encodeURIComponent(id)}`;
}

export function PoloOpportunityTable(props: PoloOpportunityTableProps) {
  const { opportunities, selectedId, onSelect } = props;

  return (
    <div className="overflow-auto">
      <table className="w-full table-auto whitespace-nowrap">
        <thead className="sticky top-0 divide-y divide-subtle bg-surface-1">
          <tr className="divide-x divide-subtle text-13 text-primary">
            <th className="px-2.5 py-2 text-left font-medium">Code</th>
            <th className="px-2.5 py-2 text-left font-medium">Customer</th>
            <th className="px-2.5 py-2 text-left font-medium">Name</th>
            <th className="px-2.5 py-2 text-left font-medium">Stage</th>
            <th className="px-2.5 py-2 text-right font-medium">Value</th>
            <th className="px-2.5 py-2 text-left font-medium">Close date</th>
            <th className="px-2.5 py-2 text-left font-medium">
              <span className="sr-only">Open in Polo</span>
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-subtle">
          {opportunities.map((opportunity) => {
            const isSelected = opportunity.id === selectedId;
            return (
              <tr
                key={opportunity.id}
                // A <tr> cannot be a <button>, and the whole row is the click target, so role=button
                // on the row is the correct expression here rather than a nested control.
                // oxlint-disable-next-line jsx-a11y/prefer-tag-over-role
                role="button"
                tabIndex={0}
                aria-current={isSelected ? "true" : undefined}
                onClick={() => onSelect(opportunity.id)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    onSelect(opportunity.id);
                  }
                }}
                className={cn(
                  "cursor-pointer divide-x divide-subtle text-13 text-secondary hover:bg-layer-transparent-hover",
                  FOCUS_RING,
                  isSelected && "bg-layer-transparent-active"
                )}
              >
                <td className="px-2.5 py-2 font-medium text-primary">{opportunity.code}</td>
                <td className="max-w-48 truncate px-2.5 py-2">{opportunity.customer}</td>
                <td className="max-w-64 truncate px-2.5 py-2">{opportunity.name}</td>
                <td className="px-2.5 py-2">{opportunity.stage ?? "—"}</td>
                <td className="px-2.5 py-2 text-right tabular-nums">{formatPoloMoney(opportunity.value)}</td>
                <td className="px-2.5 py-2">{formatCloseDate(opportunity.dueDate)}</td>
                <td className="px-2.5 py-2">
                  <a
                    href={poloOpportunityUrl(opportunity.id)}
                    target="_blank"
                    rel="noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className={cn(
                      "inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-secondary hover:text-primary hover:underline",
                      FOCUS_RING
                    )}
                    aria-label={`Open ${opportunity.code} in Polo (opens in a new tab)`}
                  >
                    <ExternalLink className="size-3.5" strokeWidth={1.75} />
                    Polo
                  </a>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
