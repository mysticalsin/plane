/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 *
 * Display formatting for money and margin.
 *
 * Formatting only — there is deliberately no add, subtract or percentage-of here. Every figure
 * shown comes from the server, where the domain engine does exact integer arithmetic with one
 * documented rounding rule. A helper that did "just a little" client-side maths is how the number
 * on screen starts disagreeing with the number that was approved.
 */
import type { WireMoney } from "../../types/bids";

/**
 * Minor units per major unit, for the currencies this build actually formats. Mirrors
 * minorUnitDecimals() in packages/domain/src/commercial.ts — JPY and friends have no minor unit, so
 * assuming 100 everywhere would show ¥1,500,000 as ¥15,000.00.
 */
const ZERO_DECIMAL_CURRENCIES = new Set(["JPY", "KRW", "VND", "CLP", "ISK", "XAF", "XOF"]);

export function formatMoney(money: WireMoney): string {
  const decimals = ZERO_DECIMAL_CURRENCIES.has(money.currency) ? 0 : 2;
  const negative = money.minorUnits.startsWith("-");
  const digits = negative ? money.minorUnits.slice(1) : money.minorUnits;

  // String arithmetic rather than Number(): a contract large enough to exceed 2^53 minor units
  // would round, and rounding the displayed price of a bid is exactly the bug this product exists
  // to make impossible.
  const padded = digits.padStart(decimals + 1, "0");
  const major = padded.slice(0, padded.length - decimals) || "0";
  const minor = decimals > 0 ? padded.slice(padded.length - decimals) : "";

  const grouped = major.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  const amount = decimals > 0 ? `${grouped}.${minor}` : grouped;

  try {
    const symbol = (0)
      .toLocaleString("en", { style: "currency", currency: money.currency, minimumFractionDigits: 0 })
      .replace(/[\d.,\s]/g, "");
    return `${negative ? "-" : ""}${symbol}${amount}`;
  } catch {
    // An unrecognised currency code should still render a number, with the code beside it.
    return `${negative ? "-" : ""}${amount} ${money.currency}`;
  }
}

/** `0.34` -> `34.0%`. Null means the engine could not compute one (zero revenue). */
export function formatMarginPct(marginPct: number | null): string {
  return marginPct === null ? "—" : `${(marginPct * 100).toFixed(1)}%`;
}
