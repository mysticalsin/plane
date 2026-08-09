/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 *
 * Hand-rolled rather than a new dependency (Build Law: simplest thing that meets the need) —
 * navigator.clipboard is the whole implementation. Flips to a checkmark for 1.5s so the click
 * has visible feedback, then reverts.
 */
import { useState } from "react";
import { Check, Copy } from "lucide-react";
import { cn } from "@plane/utils";
import { FOCUS_RING } from "../../../utils/focusRing";

interface CopyButtonProps {
  readonly value: string;
  readonly label: string;
}

const RESET_DELAY_MS = 1500;

export function CopyButton(props: CopyButtonProps) {
  const { value, label } = props;
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), RESET_DELAY_MS);
    } catch {
      // Clipboard permission denied or unavailable — no destructive fallback needed here.
    }
  }

  return (
    <button
      type="button"
      onClick={() => void handleCopy()}
      aria-label={label}
      className={cn(
        "flex size-8 flex-shrink-0 items-center justify-center rounded-md text-secondary transition-colors hover:bg-layer-transparent-hover hover:text-primary motion-reduce:transition-none",
        FOCUS_RING
      )}
    >
      {copied ? (
        <Check className="size-3.5 text-success-primary" strokeWidth={1.75} />
      ) : (
        <Copy className="size-3.5" strokeWidth={1.75} />
      )}
    </button>
  );
}
