/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 *
 * Starting a bid package.
 *
 * POST /bids has existed since the bids surface shipped and no screen called it — the empty state
 * printed a curl command as the workaround, which is a product telling its user to open a terminal.
 */
import { useEffect, useState } from "react";
import { Button, CustomSelect, EModalPosition, EModalWidth, Input, ModalCore, TextArea } from "@plane/ui";
import { cn } from "@plane/utils";
import { ChatApiError } from "../../api/http";
import { createBid } from "../../api/bidsClient";
import { createEngagement, listEngagementOptions, type EngagementOption } from "../files/engagementsApi";
import { FOCUS_RING } from "../../utils/focusRing";

interface NewBidModalProps {
  readonly isOpen: boolean;
  readonly onClose: () => void;
  readonly onCreated: () => void;
}

export function NewBidModal(props: NewBidModalProps) {
  const { isOpen, onClose, onCreated } = props;
  const [engagements, setEngagements] = useState<readonly EngagementOption[] | null>(null);
  const [engagementId, setEngagementId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [deadline, setDeadline] = useState("");
  const [notes, setNotes] = useState("");
  const [newEngagementName, setNewEngagementName] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    listEngagementOptions()
      .then(setEngagements)
      .catch(() => setError("Could not load engagements — a bid has to hang off one."));
  }, [isOpen]);

  function reset() {
    setName("");
    setDeadline("");
    setNotes("");
    setEngagementId(null);
    setNewEngagementName("");
    setError(null);
  }

  async function submit() {
    // A bid hangs off an engagement, and a workspace that has none has nowhere to hang it. Rather
    // than sending people to a surface that does not exist, the first engagement can be created
    // here, in the flow that needs it.
    let targetEngagement = engagementId;
    if (!targetEngagement && newEngagementName.trim().length > 0) {
      try {
        targetEngagement = (await createEngagement(newEngagementName.trim())).id;
      } catch (cause) {
        setError(cause instanceof ChatApiError ? cause.message : "Could not create that engagement.");
        return;
      }
    }
    if (!targetEngagement) {
      setError("Pick the engagement this bid is for, or name a new one.");
      return;
    }
    if (name.trim().length === 0) {
      setError("Give the bid a name.");
      return;
    }

    setSaving(true);
    setError(null);
    try {
      await createBid({
        engagementId: targetEngagement,
        name: name.trim(),
        // A date input gives a calendar day; the API takes an instant. End of that day, UTC, so a
        // deadline of the 30th does not become the 29th for anyone west of Greenwich.
        submissionDeadline: deadline ? new Date(`${deadline}T23:59:59Z`).toISOString() : null,
        notes: notes.trim() || null,
      });
      reset();
      onCreated();
      onClose();
    } catch (cause) {
      setError(cause instanceof ChatApiError ? cause.message : "Could not create that bid.");
    } finally {
      setSaving(false);
    }
  }

  const engagementLabel = engagements?.find((e) => e.id === engagementId)?.name ?? "Select an engagement";

  return (
    <ModalCore
      isOpen={isOpen}
      handleClose={() => {
        reset();
        onClose();
      }}
      position={EModalPosition.CENTER}
      width={EModalWidth.LG}
    >
      <div className="flex flex-col gap-4 p-5">
        <h3 className="text-16 font-semibold text-primary">New bid package</h3>
        <p className="text-13 text-secondary">
          A bid package carries the estimate and price for one engagement, and keeps every version of both.
        </p>

        <div className="flex flex-col gap-1.5">
          <span className="text-13 font-medium text-primary">Engagement</span>
          <CustomSelect
            value={engagementId}
            onChange={(next: string) => setEngagementId(next)}
            label={engagementLabel}
            buttonClassName={`border border-subtle-1 bg-layer-2 !rounded-md ${FOCUS_RING}`}
            input
          >
            {(engagements ?? []).map((engagement) => (
              <CustomSelect.Option key={engagement.id} value={engagement.id}>
                {engagement.name}
              </CustomSelect.Option>
            ))}
          </CustomSelect>
          {engagements?.length === 0 && (
            <div className="flex flex-col gap-1.5">
              <span className="text-11 text-tertiary">
                No engagements yet. Name the one this bid is for and it will be created with it.
              </span>
              <Input
                value={newEngagementName}
                onChange={(e) => setNewEngagementName(e.target.value)}
                placeholder="e.g. Rail operator digital twin"
                maxLength={200}
                aria-label="New engagement name"
                className={FOCUS_RING}
              />
            </div>
          )}
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="bid-name" className="text-13 font-medium text-primary">
            Name
          </label>
          <Input
            id="bid-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Rail operator digital twin — RFP response"
            maxLength={200}
            className={FOCUS_RING}
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="bid-deadline" className="text-13 font-medium text-primary">
            Submission deadline <span className="text-tertiary">(optional)</span>
          </label>
          <Input
            id="bid-deadline"
            type="date"
            value={deadline}
            onChange={(e) => setDeadline(e.target.value)}
            className={cn("max-w-48", FOCUS_RING)}
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="bid-notes" className="text-13 font-medium text-primary">
            Notes <span className="text-tertiary">(optional)</span>
          </label>
          <TextArea
            id="bid-notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Anything the team needs to know before pricing this."
            maxLength={4000}
            className={cn("min-h-16", FOCUS_RING)}
          />
        </div>

        {error && <p className="text-12 text-danger-primary">{error}</p>}

        <div className="mt-1 flex justify-end gap-2">
          <Button
            variant="neutral-primary"
            size="sm"
            onClick={() => {
              reset();
              onClose();
            }}
            disabled={saving}
          >
            Cancel
          </Button>
          <Button variant="primary" size="sm" onClick={() => void submit()} loading={saving} disabled={saving}>
            Create bid
          </Button>
        </div>
      </div>
    </ModalCore>
  );
}
