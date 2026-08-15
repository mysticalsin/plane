/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 *
 * One modal for both creating a channel and editing name/topic/visibility — the two forms are
 * identical apart from which fields start populated, so a second component would just be this
 * one with the initial values inlined.
 */
import { useEffect, useState } from "react";
import { Button, EModalPosition, EModalWidth, Input, ModalCore, TextArea, ToggleSwitch } from "@plane/ui";
import { cn } from "@plane/utils";
import { FOCUS_RING } from "../../../utils/focusRing";
import type { ChannelSettings } from "../types";

export interface ChannelFormValues {
  readonly name: string;
  readonly topic: string;
  readonly isPrivate: boolean;
}

interface ChannelFormModalProps {
  readonly isOpen: boolean;
  readonly channel: ChannelSettings | null;
  readonly onClose: () => void;
  readonly onSubmit: (values: ChannelFormValues) => Promise<{ ok: boolean; error?: string }>;
}

const EMPTY_VALUES: ChannelFormValues = { name: "", topic: "", isPrivate: false };

function valuesFromChannel(channel: ChannelSettings | null): ChannelFormValues {
  if (!channel) return EMPTY_VALUES;
  return { name: channel.name, topic: channel.topic ?? "", isPrivate: channel.isPrivate };
}

export function ChannelFormModal(props: ChannelFormModalProps) {
  const { isOpen, channel, onClose, onSubmit } = props;
  const [values, setValues] = useState<ChannelFormValues>(EMPTY_VALUES);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setValues(valuesFromChannel(channel));
      setError(null);
    }
  }, [isOpen, channel]);

  async function handleSubmit() {
    if (values.name.trim().length === 0) {
      setError("Channel name is required.");
      return;
    }
    setSubmitting(true);
    setError(null);
    const result = await onSubmit({ ...values, name: values.name.trim(), topic: values.topic.trim() });
    setSubmitting(false);
    if (result.ok) onClose();
    else setError(result.error ?? "Something went wrong.");
  }

  return (
    <ModalCore isOpen={isOpen} handleClose={onClose} position={EModalPosition.CENTER} width={EModalWidth.LG}>
      <div className="flex flex-col gap-4 p-5">
        <h3 className="text-16 font-semibold text-primary">{channel ? "Edit channel" : "New channel"}</h3>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="channel-name" className="text-13 font-medium text-primary">
            Name
          </label>
          <Input
            id="channel-name"
            value={values.name}
            onChange={(e) => setValues((v) => ({ ...v, name: e.target.value }))}
            placeholder="e.g. roadmap"
            maxLength={80}
            className={FOCUS_RING}
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="channel-topic" className="text-13 font-medium text-primary">
            Topic <span className="text-tertiary">(optional)</span>
          </label>
          <TextArea
            id="channel-topic"
            value={values.topic}
            onChange={(e) => setValues((v) => ({ ...v, topic: e.target.value }))}
            placeholder="What is this channel for?"
            maxLength={280}
            className={cn("min-h-16", FOCUS_RING)}
          />
        </div>

        <div className="flex flex-col gap-1.5 rounded-md border border-subtle p-3">
          <div className="flex items-center justify-between gap-4">
            <span className="text-13 font-medium text-primary">Private</span>
            <ToggleSwitch
              value={values.isPrivate}
              onChange={(next) => setValues((v) => ({ ...v, isPrivate: next }))}
              label="Toggle private channel"
            />
          </div>
          <p className="text-12 text-tertiary">
            Only people added to this channel can find it or read it. You are added automatically; manage the rest from
            the members button on the channel&apos;s row.
          </p>
        </div>

        {error && <p className="text-12 text-danger-primary">{error}</p>}

        <div className="mt-1 flex justify-end gap-2">
          <Button variant="neutral-primary" size="sm" onClick={onClose} disabled={submitting}>
            Cancel
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={() => void handleSubmit()}
            loading={submitting}
            disabled={submitting}
          >
            {channel ? "Save changes" : "Create channel"}
          </Button>
        </div>
      </div>
    </ModalCore>
  );
}
