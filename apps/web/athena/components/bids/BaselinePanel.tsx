/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 *
 * What this bid committed to, and how delivery is tracking against it.
 *
 * Only appears once a bid is won — there is no baseline before that, and the server answers 404
 * rather than inventing an empty one, so a screen can never render a commitment nobody made.
 *
 * The variance is deliberately about committed scope, not effort spent: this product has no time
 * entries, so the honest question it can answer is "is the work we sold still on the board and
 * moving", not "are we over budget". The panel says so, rather than showing a burn-down built from
 * a column nobody fills in.
 */
import { useCallback, useEffect, useState } from "react";
import { Lock } from "lucide-react";
import { Loader } from "@plane/ui";
import { ChatApiError } from "../../api/http";
import { getBaseline } from "../../api/bidsClient";
import { LocalTime } from "../LocalTime";
import { formatMarginPct, formatMoney } from "./money";
import type { BaselineResponse } from "../../types/bids";

const STATUS_LABEL: Record<string, string> = {
  OPEN: "Open",
  IN_PROGRESS: "In progress",
  BLOCKED: "Blocked",
  IN_REVIEW: "In review",
  DONE: "Done",
  CANCELLED: "Cancelled",
};

export function BaselinePanel(props: { bidId: string }) {
  const { bidId } = props;
  const [data, setData] = useState<BaselineResponse | null>(null);
  const [status, setStatus] = useState<"loading" | "absent" | "error" | "ready">("loading");
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(() => {
    setStatus("loading");
    getBaseline(bidId)
      .then((result) => {
        setData(result);
        setStatus("ready");
      })
      .catch((cause: unknown) => {
        // 404 is the ordinary answer for a bid that has not been won, not a failure.
        if (cause instanceof ChatApiError && cause.status === 404) {
          setStatus("absent");
          return;
        }
        setError(cause instanceof ChatApiError ? cause.message : "Could not load the baseline.");
        setStatus("error");
      });
  }, [bidId]);

  useEffect(load, [load]);

  if (status === "absent") return null;
  if (status === "loading") {
    return (
      <Loader>
        <Loader.Item height="120px" />
      </Loader>
    );
  }
  if (status === "error" || !data) {
    return <p className="text-12 text-danger-primary">{error ?? "Could not load the baseline."}</p>;
  }

  const { baseline, delivery, variance } = data;

  return (
    <section className="border-accent-primary/30 flex flex-col gap-3 rounded-md border bg-accent-primary/5 p-4">
      <div className="flex flex-wrap items-center gap-2">
        <Lock className="size-3.5 flex-shrink-0 text-accent-primary" strokeWidth={1.75} />
        <h3 className="text-13 font-medium text-primary">Promise Baseline v{baseline.versionNumber}</h3>
        <span className="text-11 text-tertiary">
          frozen <LocalTime iso={baseline.frozenAt} format="date" /> · from estimate and price as approved
        </span>
      </div>

      <dl className="grid grid-cols-2 gap-x-6 gap-y-1.5 sm:grid-cols-4">
        {[
          ["Committed price", formatMoney(baseline.price)],
          ["Forecast cost", formatMoney(baseline.forecastCost)],
          ["Forecast margin", formatMarginPct(baseline.forecastMarginPct)],
          ["Committed hours", `${variance.committedHours}`],
        ].map(([label, value]) => (
          <div key={label} className="flex flex-col">
            <dt className="text-11 text-tertiary">{label}</dt>
            <dd className="text-13 text-primary tabular-nums">{value}</dd>
          </div>
        ))}
      </dl>

      <div className="flex flex-col gap-1.5">
        <h4 className="text-11 font-medium tracking-wide text-secondary uppercase">Delivery</h4>
        <ul className="flex flex-col divide-y divide-subtle rounded-md border border-subtle bg-surface-1">
          {delivery.map((row) => (
            <li key={row.id} className="flex items-center gap-3 px-3 py-2 text-13">
              <span className="min-w-0 flex-1 truncate text-primary">{row.role}</span>
              <span className="flex-shrink-0 text-12 text-tertiary tabular-nums">{row.committedHours} h committed</span>
              <span className="flex-shrink-0 rounded-full border border-subtle px-2 py-0.5 text-11 text-secondary">
                {STATUS_LABEL[row.status] ?? row.status}
              </span>
            </li>
          ))}
          {delivery.length === 0 && (
            <li className="px-3 py-2 text-12 text-tertiary">
              Every generated deliverable has been deleted — {variance.droppedHours} committed hours are unaccounted
              for.
            </li>
          )}
        </ul>
      </div>

      <p className="text-11 text-tertiary">
        {variance.deliveredHours} of {variance.committedHours} committed hours delivered
        {variance.cancelledHours > 0 && `, ${variance.cancelledHours} cancelled`}
        {variance.droppedHours > 0 && `, ${variance.droppedHours} dropped`}. Committed scope, not effort spent — Athena
        holds no time entries, and a burn-down built from a column nobody fills in would be the more impressive-looking
        lie.
      </p>
    </section>
  );
}
