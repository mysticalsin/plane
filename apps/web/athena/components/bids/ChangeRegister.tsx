/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 *
 * The change register: every change raised against this commitment, decided or not.
 *
 * Rejections stay on it, dimmed rather than hidden — the same rule the estimate list already
 * follows for superseded versions. A register that only remembers the yeses is a sales document.
 *
 * The impact shown is the one that was assessed when the change was raised, not a recomputation:
 * what a person approved must still read as what they approved.
 */
import { useCallback, useEffect, useState } from "react";
import { Check, GitPullRequestArrow, X } from "lucide-react";
import { Button, Loader } from "@plane/ui";
import { cn } from "@plane/utils";
import { ChatApiError } from "../../api/http";
import { decideChangeRequest, listChangeRequests } from "../../api/bidsClient";
import { LocalTime } from "../LocalTime";
import { NewChangeModal } from "./NewChangeModal";
import { formatMarginPct, formatMoney } from "./money";
import type { ChangeRequest } from "../../types/bids";

function marginMovement(request: ChangeRequest): string {
  const { marginPctBefore, marginPctAfter } = request.impact;
  if (marginPctBefore === null || marginPctAfter === null) return "margin —";
  const points = (marginPctAfter - marginPctBefore) * 100;
  const direction = points >= 0 ? "+" : "";
  return `margin ${formatMarginPct(marginPctBefore)} → ${formatMarginPct(marginPctAfter)} (${direction}${points.toFixed(1)}pp)`;
}

interface ChangeRegisterProps {
  readonly bidId: string;
  /** The roles the frozen rate card prices — a change cannot invent one. */
  readonly rateCardRoles: readonly string[];
  /** Called after a decision, because approving one freezes a new baseline version. */
  readonly onChanged: () => void;
}

export function ChangeRegister(props: ChangeRegisterProps) {
  const { bidId, rateCardRoles, onChanged } = props;
  const [requests, setRequests] = useState<readonly ChangeRequest[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [raising, setRaising] = useState(false);
  const [attempt, setAttempt] = useState(0);

  const reload = useCallback(() => setAttempt((n) => n + 1), []);

  useEffect(() => {
    let cancelled = false;
    listChangeRequests(bidId)
      .then((result) => {
        if (!cancelled) setRequests(result.changeRequests);
      })
      .catch((cause: unknown) => {
        if (!cancelled) setError(cause instanceof ChatApiError ? cause.message : "Could not load the change register.");
      });
    return () => {
      cancelled = true;
    };
  }, [bidId, attempt]);

  function decide(request: ChangeRequest, decision: "APPROVED" | "REJECTED") {
    setBusy(request.id);
    setError(null);
    decideChangeRequest(bidId, request.id, decision, null)
      .then(() => {
        reload();
        onChanged();
      })
      .catch((cause: unknown) =>
        setError(cause instanceof ChatApiError ? cause.message : "That decision did not stick.")
      )
      .finally(() => setBusy(null));
  }

  if (!requests) {
    return (
      <Loader>
        <Loader.Item height="64px" />
      </Loader>
    );
  }

  return (
    <section className="flex flex-col gap-2">
      <div className="flex items-center justify-between gap-3">
        <h3 className="flex items-center gap-1.5 text-12 font-medium tracking-wide text-secondary uppercase">
          <GitPullRequestArrow className="size-3.5" strokeWidth={1.75} /> Changes
        </h3>
        <Button variant="neutral-primary" size="sm" onClick={() => setRaising(true)}>
          Raise a change
        </Button>
      </div>

      {error && <p className="text-12 text-danger-primary">{error}</p>}

      {requests.length === 0 ? (
        <p className="rounded-md bg-layer-1 px-3 py-2 text-12 text-tertiary">
          No changes raised. A change is assessed against the commitment as it stands, and approving one freezes the
          next baseline version — the original stays readable beside it.
        </p>
      ) : (
        <ul className="flex flex-col gap-2">
          {requests.map((request) => (
            <li
              key={request.id}
              className={cn(
                "flex flex-col gap-2 rounded-md border border-subtle p-3",
                request.status === "REJECTED" && "opacity-60"
              )}
            >
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-mono flex-shrink-0 rounded bg-layer-2 px-1.5 py-0.5 text-11 text-secondary">
                  CR-{request.number}
                </span>
                <span className="min-w-0 flex-1 truncate text-13 font-medium text-primary">{request.title}</span>
                <span className="flex-shrink-0 rounded-full border border-subtle px-2 py-0.5 text-11 text-secondary">
                  {request.scopeAssessment === "IN_SCOPE" ? "In scope" : "Out of scope"}
                </span>
                {request.status !== "DRAFT" && (
                  <span
                    className={cn(
                      "flex-shrink-0 rounded-full border px-2 py-0.5 text-11",
                      request.status === "APPROVED"
                        ? "border-accent-primary text-accent-primary"
                        : "border-subtle text-tertiary"
                    )}
                  >
                    {request.status.toLowerCase()}
                  </span>
                )}
              </div>

              <p className="text-12 text-secondary tabular-nums">
                {request.impact.hoursDelta >= 0 ? "+" : ""}
                {request.impact.hoursDelta} h · price {request.impact.priceDelta.minorUnits.startsWith("-") ? "" : "+"}
                {formatMoney(request.impact.priceDelta)} · cost{" "}
                {request.impact.costDelta.minorUnits.startsWith("-") ? "" : "+"}
                {formatMoney(request.impact.costDelta)} · {marginMovement(request)}
              </p>

              {request.status === "DRAFT" ? (
                <div className="flex items-center gap-2">
                  <Button
                    variant="primary"
                    size="sm"
                    disabled={busy !== null}
                    onClick={() => decide(request, "APPROVED")}
                    prependIcon={<Check className="size-3.5" strokeWidth={2} />}
                  >
                    Approve
                  </Button>
                  <Button
                    variant="neutral-primary"
                    size="sm"
                    disabled={busy !== null}
                    onClick={() => decide(request, "REJECTED")}
                    prependIcon={<X className="size-3.5" strokeWidth={2} />}
                  >
                    Reject
                  </Button>
                </div>
              ) : (
                <span className="text-11 text-tertiary">
                  {request.status === "APPROVED" ? "approved" : "rejected"}{" "}
                  {request.decidedAt && <LocalTime iso={request.decidedAt} format="date" />}
                  {request.decisionNote && ` · ${request.decisionNote}`}
                </span>
              )}
            </li>
          ))}
        </ul>
      )}

      <NewChangeModal
        bidId={bidId}
        isOpen={raising}
        rateCardRoles={rateCardRoles}
        onClose={() => setRaising(false)}
        onCreated={reload}
      />
    </section>
  );
}
