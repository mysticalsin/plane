/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

interface ChatEmptyStateProps {
  readonly title: string;
  readonly description?: string;
}

/** A real empty state written for this product, per the build brief — never "No items". */
export function ChatEmptyState(props: ChatEmptyStateProps) {
  const { title, description } = props;
  return (
    <div className="flex h-full flex-col items-center justify-center gap-1.5 px-6 text-center">
      <p className="text-14 font-medium text-primary">{title}</p>
      {description && <p className="max-w-sm text-13 text-secondary">{description}</p>}
    </div>
  );
}
