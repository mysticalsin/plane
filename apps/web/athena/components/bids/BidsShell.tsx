/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 *
 * The bids surface: the workspace's bid packages on the left, the selected one on the right.
 *
 * Same shape as the chat and knowledge surfaces, so this reads as part of one product rather than a
 * separate module bolted on.
 */
import { useCallback, useEffect, useState } from "react";
import { FileSignature } from "lucide-react";
import { Button, Loader } from "@plane/ui";
import { ChatApiError } from "../../api/http";
import { listBids } from "../../api/bidsClient";
import { BidDetail } from "./BidDetail";
import { NewBidModal } from "./NewBidModal";
import type { BidPackage } from "../../types/bids";

function humanState(state: string): string {
  return state
    .toLowerCase()
    .replace(/_/g, " ")
    .replace(/^\w/, (c) => c.toUpperCase());
}

export function BidsShell() {
  const [bids, setBids] = useState<readonly BidPackage[] | null>(null);
  const [selected, setSelected] = useState<BidPackage | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);
  const [creating, setCreating] = useState(false);

  const reload = useCallback(() => setAttempt((n) => n + 1), []);

  useEffect(() => {
    let cancelled = false;
    setError(null);
    listBids()
      .then((response) => {
        if (cancelled) return;
        setBids(response.bids);
        // Keep the selection pointed at fresh data after a transition, rather than at a stale copy.
        setSelected((current) => (current ? (response.bids.find((b) => b.id === current.id) ?? null) : null));
      })
      .catch((cause: unknown) => {
        if (cancelled) return;
        setError(cause instanceof ChatApiError ? cause.message : "Could not load bids.");
      });
    return () => {
      cancelled = true;
    };
  }, [attempt]);

  if (error) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-3 p-8 text-center">
        <p className="text-danger text-13">{error}</p>
        <Button variant="neutral-primary" size="sm" onClick={reload}>
          Try again
        </Button>
      </div>
    );
  }

  if (!bids) {
    return (
      <Loader className="flex flex-col gap-2 p-4">
        {[...Array(5)].map((_, i) => (
          <Loader.Item key={i} height="52px" />
        ))}
      </Loader>
    );
  }

  if (bids.length === 0) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-3 p-8 text-center">
        <FileSignature className="size-5 text-tertiary" strokeWidth={1.75} />
        <h3 className="text-15 font-medium text-primary">No bid packages yet</h3>
        <p className="max-w-md text-13 text-secondary">
          A bid package carries the estimate and price for one engagement, and keeps every version of both. Once a price
          is approved, that exact version is what delivery is held to.
        </p>
        <Button variant="primary" size="sm" onClick={() => setCreating(true)}>
          New bid
        </Button>
        <NewBidModal isOpen={creating} onClose={() => setCreating(false)} onCreated={reload} />
      </div>
    );
  }

  return (
    <div className="flex h-full overflow-hidden">
      <div className="flex w-full max-w-xs flex-col border-r border-subtle">
        <div className="flex items-center justify-between gap-2 border-b border-subtle px-3 py-2.5">
          <h2 className="text-14 font-semibold text-primary">Bids</h2>
          <Button variant="neutral-primary" size="sm" onClick={() => setCreating(true)}>
            New bid
          </Button>
        </div>
        <ul className="flex flex-col divide-y divide-subtle overflow-y-auto">
          {bids.map((bid) => (
            <li key={bid.id}>
              <button
                type="button"
                onClick={() => setSelected(bid)}
                aria-current={selected?.id === bid.id ? "true" : undefined}
                className={`focus-visible:ring-accent-primary flex w-full flex-col gap-0.5 px-4 py-3 text-left transition-colors hover:bg-layer-1 focus-visible:ring-2 focus-visible:outline-none ${
                  selected?.id === bid.id ? "bg-layer-1" : ""
                }`}
              >
                <span className="truncate text-13 text-primary">{bid.name}</span>
                <span className="text-11 text-tertiary">{humanState(bid.state)}</span>
              </button>
            </li>
          ))}
        </ul>
      </div>

      <div className="flex-1 overflow-hidden">
        {selected ? (
          <BidDetail
            bid={selected}
            onChanged={(updated) => {
              setSelected(updated);
              reload();
            }}
          />
        ) : (
          <div className="flex h-full items-center justify-center p-8">
            <p className="max-w-sm text-center text-13 text-tertiary">
              Select a bid to see its estimate history, its pricing, and what has been approved.
            </p>
          </div>
        )}
      </div>

      <NewBidModal isOpen={creating} onClose={() => setCreating(false)} onCreated={reload} />
    </div>
  );
}
