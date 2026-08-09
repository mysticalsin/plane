/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 *
 * "Your identity" panel. The disclosure paragraph below is fixed product copy per the build
 * brief and the route's own module comment — it does not round-trip through the API.
 */
import { useEffect, useState } from "react";
import { AlertTriangle } from "lucide-react";
import { Button, Input, Loader } from "@plane/ui";
import { TOAST_TYPE, setToast } from "@plane/propel/toast";
import { ChatErrorState } from "../ChatErrorState";
import { FOCUS_RING } from "../../utils/focusRing";
import { useIdentitySettings } from "./hooks/useIdentitySettings";
import { CopyButton } from "./shared/CopyButton";
import { SettingsSection } from "./shared/SettingsSection";

function IdentitySkeleton() {
  return (
    <Loader className="flex flex-col gap-3">
      <Loader.Item height="38px" width="320px" />
      <Loader.Item height="38px" width="100%" />
    </Loader>
  );
}

export function IdentityPanel() {
  const { status, identity, error, retry, saving, saveDisplayName } = useIdentitySettings();
  const [displayName, setDisplayName] = useState("");

  useEffect(() => {
    if (identity) setDisplayName(identity.displayName);
  }, [identity]);

  const dirty = identity !== null && displayName.trim() !== identity.displayName && displayName.trim().length > 0;

  async function handleSave() {
    const result = await saveDisplayName(displayName.trim());
    if (result.ok) {
      setToast({ type: TOAST_TYPE.SUCCESS, title: "Display name updated" });
    } else {
      setToast({ type: TOAST_TYPE.ERROR, title: "Could not update display name", message: result.error });
    }
  }

  return (
    <SettingsSection
      title="Your identity"
      description="How you appear in chat, and the Nostr key Athena signs your messages with."
    >
      {status === "loading" && <IdentitySkeleton />}
      {status === "error" && <ChatErrorState message={error ?? "Could not load your identity."} onRetry={retry} />}
      {status === "ready" && identity && (
        <div className="flex flex-col gap-5">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="chat-display-name" className="text-13 font-medium text-primary">
              Display name
            </label>
            <div className="flex max-w-md items-center gap-2">
              <Input
                id="chat-display-name"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                maxLength={80}
                className={`flex-1 ${FOCUS_RING}`}
              />
              <Button
                variant="primary"
                size="sm"
                disabled={!dirty || saving}
                loading={saving}
                onClick={() => void handleSave()}
              >
                Save
              </Button>
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <span className="text-13 font-medium text-primary">Nostr public key</span>
            <div className="flex max-w-xl items-center gap-1 rounded-md border border-subtle-1 bg-layer-2 pl-3">
              <code className="font-mono flex-1 overflow-x-auto py-2 text-12 whitespace-nowrap text-secondary">
                {identity.pubkey}
              </code>
              <CopyButton value={identity.pubkey} label="Copy public key" />
            </div>
          </div>

          <div className="flex max-w-xl gap-2.5 rounded-md border border-subtle bg-surface-2 p-3">
            <AlertTriangle className="mt-0.5 size-4 flex-shrink-0 text-tertiary" strokeWidth={1.75} />
            <p className="text-12 leading-relaxed text-secondary">
              Athena holds your Nostr signing key on your behalf and signs every chat message server-side — your private
              key never reaches your browser. Every signature Athena produces for you is audit-logged. Self-custody
              (holding your own key in a client you control) is planned but not built yet.
            </p>
          </div>
        </div>
      )}
    </SettingsSection>
  );
}
