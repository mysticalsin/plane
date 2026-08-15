/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 *
 * One bid package: its estimate history, its pricing history, and the controls that move it.
 *
 * The screen is built around the thing that makes this different from a spreadsheet — every
 * estimate and price that ever existed is still here, and you can see which one an approval was
 * pinned to. Superseded versions are shown, dimmed, rather than hidden: "what did we commit to in
 * v2" is the question this exists to answer.
 */
import { useCallback, useEffect, useState } from "react";
import { Check, History, Lock } from "lucide-react";
import { Button, Loader } from "@plane/ui";
import { ChatApiError } from "../../api/http";
import { LocalTime } from "../LocalTime";
import { addPricing, approvePricing, listEstimates, listPricing, transitionBid } from "../../api/bidsClient";
import { formatMarginPct, formatMoney } from "./money";
import { NewEstimateModal } from "./NewEstimateModal";
import type { BidPackage, EstimateVersion, PricingVersion } from "../../types/bids";

/** Mirrors BID_TRANSITIONS in packages/domain/src/transitions.ts. The server is still the
 * authority — this only decides which buttons are worth showing. */
const NEXT_STATES: Record<string, readonly string[]> = {
  DRAFT: ["QUALIFICATION"],
  QUALIFICATION: ["BID_NO_BID_REVIEW"],
  BID_NO_BID_REVIEW: ["IN_PREPARATION", "LOST"],
  IN_PREPARATION: ["INTERNAL_REVIEW"],
  INTERNAL_REVIEW: ["CHANGES_REQUIRED", "APPROVED_FOR_SUBMISSION"],
  CHANGES_REQUIRED: ["IN_PREPARATION"],
  APPROVED_FOR_SUBMISSION: ["SUBMITTED"],
  SUBMITTED: ["CLARIFICATION_NEGOTIATION", "WON", "LOST"],
  CLARIFICATION_NEGOTIATION: ["SUBMITTED", "WON", "LOST"],
  WON: [],
  LOST: [],
  CANCELLED: [],
};

function humanState(state: string): string {
  return state
    .toLowerCase()
    .replace(/_/g, " ")
    .replace(/^\w/, (c) => c.toUpperCase());
}

function StatusPill(props: { status: string }) {
  const tone =
    props.status === "APPROVED"
      ? "border-accent-primary text-accent-primary"
      : props.status === "SUPERSEDED"
        ? "border-subtle text-tertiary"
        : "border-subtle-1 text-secondary";
  return (
    <span className={`flex-shrink-0 rounded-full border px-2 py-0.5 text-11 ${tone}`}>
      {props.status.toLowerCase().replace(/_/g, " ")}
    </span>
  );
}

function EstimateCard(props: { estimate: EstimateVersion }) {
  const { estimate } = props;
  const superseded = estimate.status === "SUPERSEDED";
  const { totals } = estimate;

  return (
    <li className={`flex flex-col gap-3 rounded-md border border-subtle p-4 ${superseded ? "opacity-60" : ""}`}>
      <div className="flex items-center gap-2">
        <span className="text-13 font-medium text-primary">Estimate v{estimate.versionNumber}</span>
        <StatusPill status={estimate.status} />
        <span className="ml-auto text-11 text-tertiary">
          <LocalTime iso={estimate.createdAt} format="date" />
        </span>
      </div>

      <dl className="grid grid-cols-2 gap-x-6 gap-y-1.5 sm:grid-cols-3">
        {[
          ["Revenue", formatMoney(totals.revenue)],
          ["Employee cost", formatMoney(totals.loadedEmployeeCost)],
          ["Subcontractor", formatMoney(totals.subcontractorCost)],
          ["Expenses", formatMoney(totals.expense)],
          ["Contingency", formatMoney(totals.contingency)],
          ["Gross profit", formatMoney(totals.grossProfit)],
        ].map(([label, value]) => (
          <div key={label} className="flex flex-col">
            <dt className="text-11 text-tertiary">{label}</dt>
            <dd className="font-mono text-13 text-primary tabular-nums">{value}</dd>
          </div>
        ))}
        <div className="flex flex-col">
          <dt className="text-11 text-tertiary">Gross margin</dt>
          <dd className="font-mono text-13 font-medium text-primary tabular-nums">
            {formatMarginPct(totals.grossMarginPct)}
          </dd>
        </div>
      </dl>

      <details className="text-12">
        <summary className="cursor-pointer text-tertiary">{estimate.lines.length} line(s)</summary>
        <ul className="mt-2 flex flex-col divide-y divide-subtle rounded-md border border-subtle">
          {estimate.lines.map((line) => (
            <li key={`${line.role}-${line.plannedHours}`} className="flex items-center gap-3 px-3 py-1.5">
              <span className="flex-1 truncate text-primary">{line.role}</span>
              <span className="font-mono text-tertiary tabular-nums">{line.plannedHours} h</span>
              {line.expense && (
                <span className="font-mono text-tertiary tabular-nums">{formatMoney(line.expense)}</span>
              )}
            </li>
          ))}
        </ul>
      </details>
    </li>
  );
}

interface BidDetailProps {
  readonly bid: BidPackage;
  readonly onChanged: (bid: BidPackage) => void;
}

export function BidDetail(props: BidDetailProps) {
  const { bid } = props;
  const [estimates, setEstimates] = useState<readonly EstimateVersion[] | null>(null);
  const [pricing, setPricing] = useState<readonly PricingVersion[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [discount, setDiscount] = useState("0");
  const [attempt, setAttempt] = useState(0);
  const [estimating, setEstimating] = useState(false);

  const reload = useCallback(() => setAttempt((n) => n + 1), []);

  useEffect(() => {
    let cancelled = false;
    setError(null);
    Promise.all([listEstimates(bid.id), listPricing(bid.id)])
      .then(([e, p]) => {
        if (cancelled) return;
        setEstimates(e.estimates);
        setPricing(p.pricing);
      })
      .catch((cause: unknown) => {
        if (cancelled) return;
        setError(cause instanceof ChatApiError ? cause.message : "Could not load this bid.");
      });
    return () => {
      cancelled = true;
    };
  }, [bid.id, attempt]);

  const run = (work: () => Promise<unknown>) => {
    setBusy(true);
    setActionError(null);
    work()
      .then(() => reload())
      .catch((cause: unknown) => {
        setActionError(cause instanceof ChatApiError ? cause.message : "That did not work.");
      })
      .finally(() => setBusy(false));
  };

  const currentEstimate = estimates?.find((e) => e.status !== "SUPERSEDED") ?? estimates?.[0];
  const nextStates = NEXT_STATES[bid.state] ?? [];

  if (error) {
    return (
      <div className="flex flex-col items-start gap-2 p-6">
        <p className="text-danger text-13">{error}</p>
        <Button variant="neutral-primary" size="sm" onClick={reload}>
          Try again
        </Button>
      </div>
    );
  }

  if (!estimates || !pricing) {
    return (
      <Loader className="flex flex-col gap-2 p-6">
        {[...Array(4)].map((_, i) => (
          <Loader.Item key={i} height="72px" />
        ))}
      </Loader>
    );
  }

  return (
    <div className="flex h-full flex-col gap-6 overflow-y-auto p-6">
      <header className="flex flex-col gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <h2 className="text-15 font-medium text-primary">{bid.name}</h2>
          <span className="rounded-full border border-subtle-1 px-2 py-0.5 text-11 text-secondary">
            {humanState(bid.state)}
          </span>
        </div>
        {nextStates.length > 0 && (
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-11 text-tertiary">Move to:</span>
            {nextStates.map((state) => (
              <Button
                key={state}
                variant="neutral-primary"
                size="sm"
                disabled={busy}
                onClick={() => run(() => transitionBid(bid.id, state).then(props.onChanged))}
              >
                {humanState(state)}
              </Button>
            ))}
          </div>
        )}
      </header>

      {actionError && (
        <p className="text-danger rounded-md border border-danger-subtle bg-danger-subtle px-3 py-2 text-12">
          {actionError}
        </p>
      )}

      <section className="flex flex-col gap-2">
        <div className="flex items-center justify-between gap-3">
          <h3 className="flex items-center gap-1.5 text-12 font-medium tracking-wide text-secondary uppercase">
            <History className="size-3.5" strokeWidth={1.75} /> Estimates
          </h3>
          <Button variant="neutral-primary" size="sm" onClick={() => setEstimating(true)}>
            {estimates.length === 0 ? "Add an estimate" : "Revise estimate"}
          </Button>
        </div>
        {estimates.length === 0 ? (
          <p className="rounded-md bg-layer-1 px-3 py-2 text-12 text-tertiary">
            No estimate yet. Estimates are append-only — every revision is kept, so a number that was approved can
            always be found again.
          </p>
        ) : (
          <ul className="flex flex-col gap-2">
            {estimates.map((estimate) => (
              <EstimateCard key={estimate.id} estimate={estimate} />
            ))}
          </ul>
        )}
      </section>

      <section className="flex flex-col gap-2">
        <h3 className="flex items-center gap-1.5 text-12 font-medium tracking-wide text-secondary uppercase">
          <Lock className="size-3.5" strokeWidth={1.75} /> Pricing
        </h3>

        {currentEstimate && (
          <div className="flex flex-wrap items-end gap-2 rounded-md border border-subtle p-3">
            <label className="flex flex-col gap-1">
              <span className="text-11 text-tertiary">Discount %</span>
              <input
                type="number"
                min={0}
                max={100}
                step={0.5}
                value={discount}
                onChange={(event) => setDiscount(event.target.value)}
                className="font-mono focus-visible:ring-accent-primary w-24 rounded-md border border-subtle bg-layer-1 px-2.5 py-1.5 text-13 text-primary tabular-nums focus-visible:ring-2 focus-visible:outline-none"
              />
            </label>
            <Button
              variant="primary"
              size="sm"
              disabled={busy}
              onClick={() => run(() => addPricing(bid.id, currentEstimate.id, Number(discount) / 100))}
            >
              Price from v{currentEstimate.versionNumber}
            </Button>
            <p className="text-11 text-tertiary">
              The price and margin are calculated from the estimate — they are never typed in.
            </p>
          </div>
        )}

        {pricing.length === 0 ? (
          <p className="rounded-md bg-layer-1 px-3 py-2 text-12 text-tertiary">No price yet.</p>
        ) : (
          <ul className="flex flex-col gap-2">
            {pricing.map((version) => {
              const superseded = version.status === "SUPERSEDED";
              return (
                <li
                  key={version.id}
                  className={`flex flex-wrap items-center gap-3 rounded-md border border-subtle p-3 ${superseded ? "opacity-60" : ""}`}
                >
                  <span className="text-13 font-medium text-primary">v{version.versionNumber}</span>
                  <StatusPill status={version.status} />
                  <span className="font-mono text-13 text-primary tabular-nums">{formatMoney(version.finalPrice)}</span>
                  <span className="text-12 text-tertiary">
                    {(version.discountPct * 100).toFixed(1)}% off · margin {formatMarginPct(version.marginPct)}
                  </span>
                  {version.approvedAt && (
                    <span className="flex items-center gap-1 text-11 text-tertiary">
                      <Check className="size-3" strokeWidth={2} />
                      approved <LocalTime iso={version.approvedAt} format="date" />
                    </span>
                  )}
                  {version.status === "DRAFT" && (
                    <Button
                      variant="neutral-primary"
                      size="sm"
                      disabled={busy}
                      onClick={() => run(() => approvePricing(bid.id, version.id))}
                      className="ml-auto"
                    >
                      Approve v{version.versionNumber}
                    </Button>
                  )}
                </li>
              );
            })}
          </ul>
        )}
        <p className="text-11 text-tertiary">
          An approval is pinned to the version it approved. Re-pricing supersedes the old version, and a superseded
          version can no longer be approved — as does revising the estimate underneath it.
        </p>
      </section>

      <NewEstimateModal bidId={bid.id} isOpen={estimating} onClose={() => setEstimating(false)} onCreated={reload} />
    </div>
  );
}
