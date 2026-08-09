/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */
import { Loader } from "@plane/ui";

export function PoloTableSkeleton() {
  return (
    <Loader className="flex flex-col gap-2 p-4">
      {[...Array(8)].map((_, i) => (
        <Loader.Item key={i} height="32px" width={i % 3 === 0 ? "100%" : "90%"} />
      ))}
    </Loader>
  );
}

export function PoloDetailSkeleton() {
  return (
    <Loader className="flex flex-col gap-3 p-4">
      <Loader.Item height="20px" width="70%" />
      <Loader.Item height="14px" width="40%" />
      {[...Array(5)].map((_, i) => (
        <Loader.Item key={i} height="14px" width={i % 2 === 0 ? "85%" : "60%"} />
      ))}
    </Loader>
  );
}
