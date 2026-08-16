/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 *
 * Raising a change against the commitment.
 *
 * Roles come from the frozen rate card as a fixed list rather than a free-text field: a change
 * cannot invent a rate the client never agreed, the server refuses one that tries, and a dropdown
 * is a better way to say that than an error after the fact.
 */
import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { Button, CustomSelect, EModalPosition, EModalWidth, Input, ModalCore, TextArea } from "@plane/ui";
import { cn } from "@plane/utils";
import { ChatApiError } from "../../api/http";
import { createChangeRequest } from "../../api/bidsClient";
import { FOCUS_RING } from "../../utils/focusRing";

interface LineRow {
  readonly role: string;
  readonly hours: string;
}

interface NewChangeModalProps {
  readonly bidId: string;
  readonly isOpen: boolean;
  readonly rateCardRoles: readonly string[];
  readonly onClose: () => void;
  readonly onCreated: () => void;
}

/** "-1234.15" → "-123415" for a 2-decimal currency; a change can reduce the price. */
function toMinorUnits(amount: string): string | null {
  const trimmed = amount.trim() || "0";
  if (!/^-?\d+(\.\d{1,2})?$/.test(trimmed)) return null;
  const negative = trimmed.startsWith("-");
  const [major, minor = ""] = (negative ? trimmed.slice(1) : trimmed).split(".");
  return `${negative ? "-" : ""}${major}${minor.padEnd(2, "0")}`.replace(/^(-?)0+(?=\d)/, "$1");
}

export function NewChangeModal(props: NewChangeModalProps) {
  const { bidId, isOpen, rateCardRoles, onClose, onCreated } = props;
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [inScope, setInScope] = useState(false);
  const [priceDelta, setPriceDelta] = useState("0");
  const [currency, setCurrency] = useState("EUR");
  const [lines, setLines] = useState<readonly LineRow[]>([{ role: rateCardRoles[0] ?? "", hours: "" }]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function close() {
    setTitle("");
    setDescription("");
    setPriceDelta("0");
    setLines([{ role: rateCardRoles[0] ?? "", hours: "" }]);
    setError(null);
    onClose();
  }

  async function submit() {
    if (title.trim().length === 0) {
      setError("Give the change a title — it is what the register will show.");
      return;
    }
    const minorUnits = toMinorUnits(priceDelta);
    if (minorUnits === null) {
      setError("The price change should be a plain amount, like 3000 or -1500.");
      return;
    }

    const payloadLines = [];
    for (const line of lines) {
      if (!line.role) continue;
      const hours = Number(line.hours);
      if (!Number.isFinite(hours) || hours === 0) {
        setError(`Give ${line.role} a non-zero number of hours — positive to add work, negative to remove it.`);
        return;
      }
      payloadLines.push({ role: line.role, hoursDelta: hours });
    }
    if (payloadLines.length === 0) {
      setError("A change has to move at least one role's hours.");
      return;
    }

    setSaving(true);
    setError(null);
    try {
      await createChangeRequest(bidId, {
        title: title.trim(),
        description: description.trim(),
        scopeAssessment: inScope ? "IN_SCOPE" : "OUT_OF_SCOPE",
        priceDelta: { currency: currency.trim().toUpperCase(), minorUnits },
        lines: payloadLines,
      });
      close();
      onCreated();
    } catch (cause) {
      setError(cause instanceof ChatApiError ? cause.message : "Could not raise that change.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <ModalCore isOpen={isOpen} handleClose={close} position={EModalPosition.CENTER} width={EModalWidth.XXL}>
      <div className="flex max-h-[80vh] flex-col gap-4 overflow-y-auto p-5">
        <div>
          <h3 className="text-16 font-semibold text-primary">Raise a change</h3>
          <p className="text-13 text-secondary">
            Assessed against the commitment as it stands, and priced at the rate card that was frozen. Approving it
            later freezes the next baseline version; the original stays readable beside it.
          </p>
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="change-title" className="text-13 font-medium text-primary">
            Title
          </label>
          <Input
            id="change-title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Additional integration testing for the SCADA feed"
            maxLength={200}
            className={FOCUS_RING}
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="change-description" className="text-13 font-medium text-primary">
            What changed, and why <span className="text-tertiary">(optional)</span>
          </label>
          <TextArea
            id="change-description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            maxLength={4000}
            className={cn("min-h-16", FOCUS_RING)}
          />
        </div>

        <div className="flex flex-wrap items-end gap-3">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="change-price" className="text-13 font-medium text-primary">
              Price change
            </label>
            <Input
              id="change-price"
              value={priceDelta}
              onChange={(e) => setPriceDelta(e.target.value)}
              placeholder="3000, or -1500"
              className={cn("w-36", FOCUS_RING)}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label htmlFor="change-currency" className="text-13 font-medium text-primary">
              Currency
            </label>
            <Input
              id="change-currency"
              value={currency}
              onChange={(e) => setCurrency(e.target.value)}
              maxLength={3}
              className={cn("w-24 uppercase", FOCUS_RING)}
            />
          </div>
          <label className="flex items-center gap-2 pb-2 text-13 text-secondary">
            <input
              type="checkbox"
              checked={inScope}
              onChange={(e) => setInScope(e.target.checked)}
              className={FOCUS_RING}
            />
            Already in scope
          </label>
        </div>

        <section className="flex flex-col gap-2">
          <h4 className="text-13 font-medium text-primary">Hours moved</h4>
          {lines.map((line, index) => (
            <div key={index} className="flex flex-wrap items-center gap-2">
              <CustomSelect
                value={line.role}
                onChange={(next: string) =>
                  setLines((prev) => prev.map((l, i) => (i === index ? { ...l, role: next } : l)))
                }
                label={line.role || "Select a role"}
                buttonClassName={`border border-subtle-1 bg-layer-2 !rounded-md min-w-56 ${FOCUS_RING}`}
                input
              >
                {rateCardRoles.map((role) => (
                  <CustomSelect.Option key={role} value={role}>
                    {role}
                  </CustomSelect.Option>
                ))}
              </CustomSelect>
              <Input
                value={line.hours}
                onChange={(e) =>
                  setLines((prev) => prev.map((l, i) => (i === index ? { ...l, hours: e.target.value } : l)))
                }
                placeholder="+20 or -10"
                aria-label={`Hours moved for line ${index + 1}`}
                className={cn("w-32", FOCUS_RING)}
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
            onClick={() => setLines((prev) => [...prev, { role: rateCardRoles[0] ?? "", hours: "" }])}
            prependIcon={<Plus className="size-3.5" strokeWidth={1.75} />}
          >
            Add a role
          </Button>
        </section>

        {error && <p className="text-12 text-danger-primary">{error}</p>}

        <div className="flex justify-end gap-2">
          <Button variant="neutral-primary" size="sm" onClick={close} disabled={saving}>
            Cancel
          </Button>
          <Button variant="primary" size="sm" onClick={() => void submit()} loading={saving} disabled={saving}>
            Raise change
          </Button>
        </div>
      </div>
    </ModalCore>
  );
}
