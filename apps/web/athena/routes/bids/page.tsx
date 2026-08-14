/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 *
 * Route: /:workspaceSlug/bids — bid packages with their append-only estimate and pricing history.
 * Workspace scoping is resolved server-side from the session, exactly like chat, Polo and Files.
 */
import { PageHead } from "@/components/core/page-title";
import { BidsShell } from "../../components/bids/BidsShell";

export default function BidsPage() {
  return (
    <>
      <PageHead title="Bids" />
      <BidsShell />
    </>
  );
}
