/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 *
 * Wire types for bid packages — see apps/bff/src/routes/bids.ts in the Athena repo.
 *
 * Money crosses the wire as a decimal string of minor units, never a number: JSON has no bigint,
 * and a float would silently lose precision on a large contract. Format it for display, never do
 * arithmetic on it here — every figure shown is computed server-side by the domain engine.
 */

export type WireMoney = {
  readonly currency: string;
  readonly minorUnits: string;
};

export type BidWorkflowState =
  | "DRAFT"
  | "QUALIFICATION"
  | "BID_NO_BID_REVIEW"
  | "IN_PREPARATION"
  | "INTERNAL_REVIEW"
  | "CHANGES_REQUIRED"
  | "APPROVED_FOR_SUBMISSION"
  | "SUBMITTED"
  | "CLARIFICATION_NEGOTIATION"
  | "WON"
  | "LOST"
  | "CANCELLED";

export type FinancialVersionStatus = "DRAFT" | "SUBMITTED_FOR_REVIEW" | "APPROVED" | "SUPERSEDED";

export type BidPackage = {
  readonly id: string;
  readonly engagementId: string;
  readonly name: string;
  readonly state: BidWorkflowState;
  readonly bidOwner: string;
  readonly currentEstimateVersionId: string | null;
  readonly currentPricingVersionId: string | null;
  readonly submissionDeadline: string | null;
  readonly notes: string | null;
  readonly createdAt: string;
};

export type EstimateLine = {
  readonly role: string;
  readonly plannedHours: number;
  readonly expense: WireMoney | null;
};

/** Every figure here is the engine's output, not a client-side sum. */
export type EstimateTotals = {
  readonly currency: string;
  readonly revenue: WireMoney;
  readonly loadedEmployeeCost: WireMoney;
  readonly subcontractorCost: WireMoney;
  readonly expense: WireMoney;
  readonly contingency: WireMoney;
  readonly grossProfit: WireMoney;
  readonly grossMarginPct: number | null;
};

export type EstimateVersion = {
  readonly id: string;
  readonly versionNumber: number;
  readonly status: FinancialVersionStatus;
  readonly preparedBy: string;
  readonly createdAt: string;
  readonly lines: readonly EstimateLine[];
  readonly totals: EstimateTotals;
};

export type PricingVersion = {
  readonly id: string;
  readonly versionNumber: number;
  readonly estimateVersionId: string;
  readonly discountPct: number;
  readonly finalPrice: WireMoney;
  readonly marginPct: number | null;
  readonly status: FinancialVersionStatus;
  readonly approvedBy: string | null;
  readonly approvedAt: string | null;
  readonly createdAt: string;
};

export type BidListResponse = { readonly bids: readonly BidPackage[] };
export type EstimateListResponse = { readonly estimates: readonly EstimateVersion[] };
export type PricingListResponse = { readonly pricing: readonly PricingVersion[] };
