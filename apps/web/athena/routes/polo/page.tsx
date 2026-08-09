/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 *
 * Route: /:workspaceSlug/polo — the Polo (CRM) section, read-only in this step. See
 * D:/Athena/docs/integrations/POLO_API.md for the verified upstream contract this reads.
 */
import { PageHead } from "@/components/core/page-title";
import { PoloShell } from "../../components/polo/PoloShell";

export default function PoloPage() {
  return (
    <>
      <PageHead title="Polo" />
      <PoloShell />
    </>
  );
}
