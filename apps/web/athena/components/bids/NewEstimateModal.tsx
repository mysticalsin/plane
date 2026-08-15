/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 *
 * Building an estimate: the rate card that prices roles, and the planned hours per role.
 *
 * POST /bids/:id/estimates has always existed and nothing called it, so the bids surface could
 * list estimates it had no way to create — and without an estimate there is nothing to price and
 * nothing to approve, which made the whole commitment spine unreachable from the product.
 *
 * Rates are typed in whole currency units and converted to minor units here, as integers, by
 * splitting the decimal string rather than multiplying a float: 1234.15 * 100 is 123414.99999 in
 * IEEE754, and a cent lost at the edge is a cent the approved price disagrees about.
 */
import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { Button, EModalPosition, EModalWidth, Input, ModalCore } from "@plane/ui";
import { cn } from "@plane/utils";
import { ChatApiError } from "../../api/http";
import { addEstimate } from "../../api/bidsClient";
import { FOCUS_RING } from "../../utils/focusRing";

interface RateRow {
  readonly role: string;
  readonly resourceType: "INTERNAL" | "SUBCONTRACTOR";
  readonly billRate: string;
  readonly costRate: string;
}

interface LineRow {
  readonly role: string;
  readonly hours: string;
  readonly expense: string;
}

const ZERO_DECIMAL_CURRENCIES = new Set(["JPY", "KRW", "VND", "CLP", "ISK", "XAF", "XOF"]);

/** "1234.15" -> "123415" for a 2-decimal currency. Integer arithmetic on the digits, never a float. */
function toMinorUnits(amount: string, currency: string): string | null {
  const decimals = ZERO_DECIMAL_CURRENCIES.has(currency) ? 0 : 2;
  const trimmed = amount.trim();
  if (!/^\d+(\.\d+)?$/.test(trimmed)) return null;

  const [major, minor = ""] = trimmed.split(".");
  if (minor.length > decimals) return null;
  return `${major}${minor.padEnd(decimals, "0")}`.replace(/^0+(?=\d)/, "");
}

const EMPTY_RATE: RateRow = { role: "", resourceType: "INTERNAL", billRate: "", costRate: "" };
const EMPTY_LINE: LineRow = { role: "", hours: "", expense: "" };

interface NewEstimateModalProps {
  readonly bidId: string;
  readonly isOpen: boolean;
  readonly onClose: () => void;
  readonly onCreated: () => void;
}

export function NewEstimateModal(props: NewEstimateModalProps) {
  const { bidId, isOpen, onClose, onCreated } = props;
  const [currency, setCurrency] = useState("EUR");
  const [contingency, setContingency] = useState("5");
  const [rates, setRates] = useState<readonly RateRow[]>([EMPTY_RATE]);
  const [lines, setLines] = useState<readonly LineRow[]>([EMPTY_LINE]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function reset() {
    setCurrency("EUR");
    setContingency("5");
    setRates([EMPTY_RATE]);
    setLines([EMPTY_LINE]);
    setError(null);
  }

  function close() {
    reset();
    onClose();
  }

  async function submit() {
    const code = currency.trim().toUpperCase();
    if (code.length !== 3) {
      setError("Currency is a three-letter code, like EUR.");
      return;
    }

    const contingencyPct = Number(contingency);
    if (!Number.isFinite(contingencyPct) || contingencyPct < 0 || contingencyPct > 100) {
      setError("Contingency is a percentage between 0 and 100.");
      return;
    }

    const entries = [];
    for (const rate of rates) {
      if (rate.role.trim().length === 0) continue;
      const bill = toMinorUnits(rate.billRate, code);
      const cost = toMinorUnits(rate.costRate, code);
      if (bill === null || cost === null) {
        setError(`Check the rates for ${rate.role.trim()} — they should be plain amounts, like 950 or 950.50.`);
        return;
      }
      entries.push({
        role: rate.role.trim(),
        resourceType: rate.resourceType,
        billRatePerHour: { currency: code, minorUnits: bill },
        costRatePerHour: { currency: code, minorUnits: cost },
      });
    }
    if (entries.length === 0) {
      setError("Add at least one role to the rate card.");
      return;
    }

    const priced = new Set(entries.map((entry) => entry.role));
    const payloadLines = [];
    for (const line of lines) {
      if (line.role.trim().length === 0) continue;
      const hours = Number(line.hours);
      if (!Number.isFinite(hours) || hours < 0) {
        setError(`Planned hours for ${line.role.trim()} should be a number.`);
        return;
      }
      // The server rejects a line whose role the card does not price; catching it here says which
      // role, next to the field, instead of returning a validation error over the whole form.
      if (!priced.has(line.role.trim())) {
        setError(`"${line.role.trim()}" is not on the rate card — add it above, or fix the spelling.`);
        return;
      }
      const expense = line.expense.trim() ? toMinorUnits(line.expense, code) : null;
      if (line.expense.trim() && expense === null) {
        setError(`Check the expense for ${line.role.trim()}.`);
        return;
      }
      payloadLines.push({
        role: line.role.trim(),
        plannedHours: hours,
        ...(expense ? { expense: { currency: code, minorUnits: expense } } : {}),
      });
    }
    if (payloadLines.length === 0) {
      setError("Add at least one line of planned work.");
      return;
    }

    setSaving(true);
    setError(null);
    try {
      await addEstimate(bidId, {
        rateCard: { currency: code, contingencyPct: contingencyPct / 100, entries },
        lines: payloadLines,
      });
      reset();
      onCreated();
      onClose();
    } catch (cause) {
      setError(cause instanceof ChatApiError ? cause.message : "Could not save that estimate.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <ModalCore isOpen={isOpen} handleClose={close} position={EModalPosition.CENTER} width={EModalWidth.XXL}>
      <div className="flex max-h-[80vh] flex-col gap-4 overflow-y-auto p-5">
        <div>
          <h3 className="text-16 font-semibold text-primary">New estimate version</h3>
          <p className="text-13 text-secondary">
            Every figure — revenue, cost, contingency, margin — is calculated server-side from what you enter here.
            Saving this supersedes the previous estimate, and any price approved against it.
          </p>
        </div>

        <div className="flex flex-wrap items-end gap-3">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="estimate-currency" className="text-13 font-medium text-primary">
              Currency
            </label>
            <Input
              id="estimate-currency"
              value={currency}
              onChange={(e) => setCurrency(e.target.value)}
              maxLength={3}
              className={cn("w-24 uppercase", FOCUS_RING)}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label htmlFor="estimate-contingency" className="text-13 font-medium text-primary">
              Contingency %
            </label>
            <Input
              id="estimate-contingency"
              value={contingency}
              onChange={(e) => setContingency(e.target.value)}
              className={cn("w-24", FOCUS_RING)}
            />
          </div>
        </div>

        <section className="flex flex-col gap-2">
          <h4 className="text-13 font-medium text-primary">Rate card</h4>
          {rates.map((rate, index) => (
            <div key={index} className="flex flex-wrap items-center gap-2">
              <Input
                value={rate.role}
                onChange={(e) =>
                  setRates((prev) => prev.map((r, i) => (i === index ? { ...r, role: e.target.value } : r)))
                }
                placeholder="Role, e.g. Solution architect"
                aria-label={`Rate card role ${index + 1}`}
                className={cn("min-w-56 flex-1", FOCUS_RING)}
              />
              <select
                value={rate.resourceType}
                onChange={(e) =>
                  setRates((prev) =>
                    prev.map((r, i) =>
                      i === index ? { ...r, resourceType: e.target.value as RateRow["resourceType"] } : r
                    )
                  )
                }
                aria-label={`Resource type for row ${index + 1}`}
                className={cn("h-9 rounded-md border border-subtle-1 bg-layer-2 px-2 text-13 text-primary", FOCUS_RING)}
              >
                <option value="INTERNAL">Internal</option>
                <option value="SUBCONTRACTOR">Subcontractor</option>
              </select>
              <Input
                value={rate.billRate}
                onChange={(e) =>
                  setRates((prev) => prev.map((r, i) => (i === index ? { ...r, billRate: e.target.value } : r)))
                }
                placeholder="Bill / hour"
                aria-label={`Bill rate for row ${index + 1}`}
                className={cn("w-32", FOCUS_RING)}
              />
              <Input
                value={rate.costRate}
                onChange={(e) =>
                  setRates((prev) => prev.map((r, i) => (i === index ? { ...r, costRate: e.target.value } : r)))
                }
                placeholder="Cost / hour"
                aria-label={`Cost rate for row ${index + 1}`}
                className={cn("w-32", FOCUS_RING)}
              />
              <button
                type="button"
                onClick={() => setRates((prev) => (prev.length === 1 ? prev : prev.filter((_, i) => i !== index)))}
                aria-label={`Remove rate card row ${index + 1}`}
                className={cn(
                  "flex size-9 items-center justify-center rounded-md text-tertiary hover:text-danger-primary",
                  FOCUS_RING
                )}
              >
                <Trash2 className="size-3.5" strokeWidth={1.75} />
              </button>
            </div>
          ))}
          <Button
            variant="neutral-primary"
            size="sm"
            onClick={() => setRates((prev) => [...prev, EMPTY_RATE])}
            prependIcon={<Plus className="size-3.5" strokeWidth={1.75} />}
          >
            Add role
          </Button>
        </section>

        <section className="flex flex-col gap-2">
          <h4 className="text-13 font-medium text-primary">Planned work</h4>
          {lines.map((line, index) => (
            <div key={index} className="flex flex-wrap items-center gap-2">
              <Input
                value={line.role}
                onChange={(e) =>
                  setLines((prev) => prev.map((l, i) => (i === index ? { ...l, role: e.target.value } : l)))
                }
                placeholder="Role, exactly as on the rate card"
                aria-label={`Line role ${index + 1}`}
                className={cn("min-w-56 flex-1", FOCUS_RING)}
              />
              <Input
                value={line.hours}
                onChange={(e) =>
                  setLines((prev) => prev.map((l, i) => (i === index ? { ...l, hours: e.target.value } : l)))
                }
                placeholder="Hours"
                aria-label={`Planned hours for line ${index + 1}`}
                className={cn("w-28", FOCUS_RING)}
              />
              <Input
                value={line.expense}
                onChange={(e) =>
                  setLines((prev) => prev.map((l, i) => (i === index ? { ...l, expense: e.target.value } : l)))
                }
                placeholder="Expenses (optional)"
                aria-label={`Expenses for line ${index + 1}`}
                className={cn("w-40", FOCUS_RING)}
              />
              <button
                type="button"
                onClick={() => setLines((prev) => (prev.length === 1 ? prev : prev.filter((_, i) => i !== index)))}
                aria-label={`Remove line ${index + 1}`}
                className={cn(
                  "flex size-9 items-center justify-center rounded-md text-tertiary hover:text-danger-primary",
                  FOCUS_RING
                )}
              >
                <Trash2 className="size-3.5" strokeWidth={1.75} />
              </button>
            </div>
          ))}
          <Button
            variant="neutral-primary"
            size="sm"
            onClick={() => setLines((prev) => [...prev, EMPTY_LINE])}
            prependIcon={<Plus className="size-3.5" strokeWidth={1.75} />}
          >
            Add line
          </Button>
        </section>

        {error && <p className="text-12 text-danger-primary">{error}</p>}

        <div className="flex justify-end gap-2">
          <Button variant="neutral-primary" size="sm" onClick={close} disabled={saving}>
            Cancel
          </Button>
          <Button variant="primary" size="sm" onClick={() => void submit()} loading={saving} disabled={saving}>
            Save estimate
          </Button>
        </div>
      </div>
    </ModalCore>
  );
}
