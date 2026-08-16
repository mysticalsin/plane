/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 *
 * Bid package API calls. Goes through athenaFetch like every other athena/** network call.
 */

import type {
  BaselineResponse,
  BidListResponse,
  ChangeRequest,
  BidPackage,
  EstimateListResponse,
  EstimateVersion,
  PricingListResponse,
  PricingVersion,
  WireMoney,
} from "../types/bids";
import { athenaFetch } from "./http";

export function listBids(): Promise<BidListResponse> {
  return athenaFetch<BidListResponse>("/bids");
}

export function getBid(id: string): Promise<BidPackage> {
  return athenaFetch<BidPackage>(`/bids/${id}`);
}

export function listEstimates(bidId: string): Promise<EstimateListResponse> {
  return athenaFetch<EstimateListResponse>(`/bids/${bidId}/estimates`);
}

export function listPricing(bidId: string): Promise<PricingListResponse> {
  return athenaFetch<PricingListResponse>(`/bids/${bidId}/pricing`);
}

/** Price is derived server-side from the discount; the caller never supplies a final number. */
export function addPricing(bidId: string, estimateVersionId: string, discountPct: number): Promise<PricingVersion> {
  return athenaFetch<PricingVersion>(`/bids/${bidId}/pricing`, {
    method: "POST",
    body: JSON.stringify({ estimateVersionId, discountPct }),
  });
}

export function approvePricing(bidId: string, pricingVersionId: string): Promise<PricingVersion> {
  return athenaFetch<PricingVersion>(`/bids/${bidId}/approve-pricing`, {
    method: "POST",
    body: JSON.stringify({ pricingVersionId }),
  });
}

export function transitionBid(bidId: string, to: string): Promise<BidPackage> {
  return athenaFetch<BidPackage>(`/bids/${bidId}/transition`, {
    method: "POST",
    body: JSON.stringify({ to }),
  });
}

export interface CreateBidInput {
  readonly engagementId: string;
  readonly name: string;
  readonly submissionDeadline?: string | null;
  readonly notes?: string | null;
}

export function createBid(input: CreateBidInput): Promise<BidPackage> {
  return athenaFetch<BidPackage>("/bids", { method: "POST", body: JSON.stringify(input) });
}

/** Money crosses as minor units in a string — see types/bids.ts. Rates and expenses are entered in
 * whole currency units and converted at the edge, so nothing here does float arithmetic on money. */
export interface CreateEstimateInput {
  readonly rateCard: {
    readonly currency: string;
    readonly contingencyPct: number;
    readonly entries: readonly {
      readonly role: string;
      readonly resourceType: "INTERNAL" | "SUBCONTRACTOR";
      readonly billRatePerHour: WireMoney;
      readonly costRatePerHour: WireMoney;
    }[];
  };
  readonly lines: readonly {
    readonly role: string;
    readonly plannedHours: number;
    readonly expense?: WireMoney;
  }[];
}

export function addEstimate(bidId: string, input: CreateEstimateInput): Promise<EstimateVersion> {
  return athenaFetch<EstimateVersion>(`/bids/${bidId}/estimates`, { method: "POST", body: JSON.stringify(input) });
}

/** 404 before the bid is won — there is no baseline until then, and the caller renders nothing. */
export function getBaseline(bidId: string): Promise<BaselineResponse> {
  return athenaFetch<BaselineResponse>(`/bids/${bidId}/baseline`);
}

export function listChangeRequests(bidId: string): Promise<{ changeRequests: readonly ChangeRequest[] }> {
  return athenaFetch(`/bids/${bidId}/change-requests`);
}

export interface CreateChangeInput {
  readonly title: string;
  readonly description: string;
  readonly scopeAssessment: "IN_SCOPE" | "OUT_OF_SCOPE";
  readonly priceDelta: WireMoney;
  readonly lines: readonly { readonly role: string; readonly hoursDelta: number }[];
}

/** The server assesses it against the current baseline and stores what it assessed. */
export function createChangeRequest(bidId: string, input: CreateChangeInput): Promise<ChangeRequest> {
  return athenaFetch<ChangeRequest>(`/bids/${bidId}/change-requests`, {
    method: "POST",
    body: JSON.stringify(input),
  });
}

/** Approving freezes the next baseline version; 409 when the commitment moved since it was assessed. */
export function decideChangeRequest(
  bidId: string,
  changeRequestId: string,
  decision: "APPROVED" | "REJECTED",
  note: string | null
): Promise<ChangeRequest> {
  return athenaFetch<ChangeRequest>(`/bids/${bidId}/change-requests/${changeRequestId}/decide`, {
    method: "POST",
    body: JSON.stringify({ decision, note }),
  });
}
