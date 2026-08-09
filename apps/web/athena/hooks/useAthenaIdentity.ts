/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useEffect, useState } from "react";
import { getAthenaMe, type AthenaMe } from "../api/chatClient";

/** "Who am I" for the optimistic send bubble in useChatMessages. GET /api/v1/me never
 * returns a pubkey (the BFF never exposes signing material to the browser — see
 * services/nostrKeys.ts's envelope encryption), so the optimistic bubble is colored from
 * the user's id instead; it is replaced by the real authored message (real pubkey, real
 * displayName) the moment the POST resolves. */
export function useAthenaIdentity(): AthenaMe | null {
  const [me, setMe] = useState<AthenaMe | null>(null);

  useEffect(() => {
    let cancelled = false;
    getAthenaMe()
      .then((res) => {
        if (!cancelled) setMe(res.user);
      })
      .catch(() => {
        // Not signed in to Athena yet, or the BFF is down — composer disables itself.
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return me;
}
