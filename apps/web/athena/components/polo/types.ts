/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 *
 * Mirrors the response shapes of D:/Athena/apps/bff/src/routes/polo.ts exactly (see that
 * file's zod schemas). Athena does not write to Polo yet — every shape here is read-only.
 */

export interface PoloMoney {
  readonly currency: string;
  /** Exact integer minor units as a decimal string — never parsed as a number for arithmetic. */
  readonly minorUnits: string;
  /** Display-only major-unit amount (e.g. dollars), already rounded by the BFF. */
  readonly display: number;
}

export interface PoloOpportunity {
  readonly id: string;
  readonly code: string;
  readonly customer: string;
  readonly name: string;
  readonly stage: string | null;
  readonly value: PoloMoney;
  readonly probability: number;
  readonly dueDate: string | null;
  readonly owner: string | null;
  readonly industry: string | null;
  readonly country: string | null;
  readonly updatedAt: string;
}

export interface PoloOpportunityPage {
  readonly items: readonly PoloOpportunity[];
  readonly nextCursor: string | null;
}

export type PoloFetchStatus = "loading" | "error" | "ready";
