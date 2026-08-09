/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */
import { Loader } from "@plane/ui";

export function FilesTableSkeleton() {
  return (
    <Loader className="flex flex-col gap-2 p-4">
      {[...Array(8)].map((_, i) => (
        <Loader.Item key={i} height="36px" width={i % 3 === 0 ? "100%" : "92%"} />
      ))}
    </Loader>
  );
}
