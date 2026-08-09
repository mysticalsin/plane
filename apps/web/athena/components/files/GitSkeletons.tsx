/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */
import { Loader } from "@plane/ui";

export function RepoListSkeleton() {
  return (
    <Loader className="flex flex-col gap-3 p-4">
      {[...Array(3)].map((_, i) => (
        <Loader.Item key={i} height="96px" width="100%" />
      ))}
    </Loader>
  );
}
