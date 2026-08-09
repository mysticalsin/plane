/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { Loader } from "@plane/ui";

export function ChannelSidebarSkeleton() {
  return (
    <Loader className="flex flex-col gap-1 p-3">
      {[...Array(6)].map((_, i) => (
        <Loader.Item key={i} height="28px" width={i % 2 === 0 ? "80%" : "60%"} />
      ))}
    </Loader>
  );
}

export function MessagePaneSkeleton() {
  return (
    <Loader className="flex flex-col gap-4 p-4">
      {[...Array(5)].map((_, i) => (
        <div key={i} className="flex items-start gap-2.5">
          <Loader.Item height="28px" width="28px" className="rounded-full" />
          <div className="flex flex-1 flex-col gap-1.5">
            <Loader.Item height="12px" width="120px" />
            <Loader.Item height="14px" width={i % 2 === 0 ? "70%" : "45%"} />
          </div>
        </div>
      ))}
    </Loader>
  );
}
