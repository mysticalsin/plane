/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */
import { Search } from "lucide-react";
import { Input } from "@plane/ui";
import { FOCUS_RING } from "../../utils/focusRing";

interface PoloFilterBarProps {
  readonly search: string;
  readonly onSearchChange: (value: string) => void;
  readonly resultCount: number;
}

export function PoloFilterBar(props: PoloFilterBarProps) {
  const { search, onSearchChange, resultCount } = props;
  return (
    <div className="flex items-center gap-3 border-b border-subtle px-4 py-3">
      <div className="relative w-72 max-w-full">
        <Search
          className="pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-tertiary"
          strokeWidth={1.75}
        />
        <Input
          mode="transparent"
          inputSize="sm"
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Search by customer, name or code…"
          aria-label="Search Polo opportunities"
          className={`w-full border border-subtle-1 pl-8 ${FOCUS_RING}`}
        />
      </div>
      <span className="text-13 text-tertiary">
        {resultCount} {resultCount === 1 ? "opportunity" : "opportunities"}
      </span>
    </div>
  );
}
