/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 *
 * Bid package API calls. Goes through athenaFetch like every other athena/** network call.
 */

import type {
  BidListResponse,
  BidPackage,
  EstimateListResponse,
  PricingListResponse,
  PricingVersion,
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
