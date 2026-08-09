/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 *
 * Display-only formatting. `value.display` is already the BFF's rounded major-unit number
 * (@mantu/athena-domain's Money.toMajor) — this never re-derives an amount from `minorUnits`,
 * it only chooses how to print the number the BFF already computed.
 */
import type { PoloMoney } from "./types";

export function formatPoloMoney(money: PoloMoney): string {
  try {
    // No explicit fraction-digit override: Intl already applies each currency's own minor-unit
    // count (2 for CAD/USD, 0 for JPY, ...) — matching @mantu/athena-domain's minorUnitDecimals.
    return new Intl.NumberFormat(undefined, { style: "currency", currency: money.currency }).format(money.display);
  } catch {
    // An unrecognized currency code should never crash the table — fall back to a plain number.
    return `${money.display.toLocaleString()} ${money.currency}`;
  }
}
