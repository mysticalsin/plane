/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 *
 * Bring-your-own-key model providers. The key field is write-only by construction — the
 * moment a save succeeds, the plaintext is dropped from this component's own state (see
 * ProviderCard's handleSave) and never appears again; every render after that shows only
 * `connected` + `lastFour` from the server. See apps/bff/src/routes/chatSettings/
 * providers.ts's module comment for the server-side half of that guarantee.
 */
import { useState } from "react";
import { CheckCircle2, Info, KeyRound, XCircle } from "lucide-react";
import { Button, Input, Loader } from "@plane/ui";
import { TOAST_TYPE, setToast } from "@plane/propel/toast";
import { ChatErrorState } from "../ChatErrorState";
import { FOCUS_RING } from "../../utils/focusRing";
import { useProviderSettings } from "./hooks/useProviderSettings";
import { formatSettingsTimestamp } from "./shared/formatDate";
import { SettingsSection } from "./shared/SettingsSection";
import type { ChatModelProvider, ProviderKeyStatus, TestProviderResult } from "./types";

const PROVIDER_LABELS: Record<ChatModelProvider, string> = {
  deepseek: "DeepSeek",
  moonshot: "Moonshot",
  anthropic: "Anthropic",
};

function ProvidersSkeleton() {
  return (
    <Loader className="flex flex-col gap-3">
      {[...Array(3)].map((_, i) => (
        <Loader.Item key={i} height="96px" width="100%" />
      ))}
    </Loader>
  );
}

interface ProviderCardProps {
  readonly provider: ProviderKeyStatus;
  readonly pending: boolean;
  readonly testResult: TestProviderResult | undefined;
  readonly onSave: (provider: ChatModelProvider, apiKey: string) => Promise<{ ok: boolean; error?: string }>;
  readonly onRemove: (provider: ChatModelProvider) => Promise<{ ok: boolean; error?: string }>;
  readonly onTest: (provider: ChatModelProvider) => Promise<void>;
}

function ProviderCard(props: ProviderCardProps) {
  const { provider, pending, testResult, onSave, onRemove, onTest } = props;
  const [apiKey, setApiKey] = useState("");

  async function handleSave() {
    const result = await onSave(provider.provider, apiKey.trim());
    if (result.ok) {
      setApiKey("");
      setToast({ type: TOAST_TYPE.SUCCESS, title: `${PROVIDER_LABELS[provider.provider]} key saved` });
    } else {
      setToast({ type: TOAST_TYPE.ERROR, title: "Could not save this key", message: result.error });
    }
  }

  async function handleRemove() {
    const result = await onRemove(provider.provider);
    if (!result.ok) {
      setToast({ type: TOAST_TYPE.ERROR, title: "Could not remove this key", message: result.error });
    }
  }

  return (
    <div className="flex flex-col gap-3 rounded-md border border-subtle bg-surface-1 p-4">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <KeyRound className="size-4 flex-shrink-0 text-tertiary" strokeWidth={1.75} />
          <span className="text-14 font-medium text-primary">{PROVIDER_LABELS[provider.provider]}</span>
        </div>
        <div className="flex items-center gap-1.5">
          {provider.connected ? (
            <CheckCircle2 className="size-4 text-success-primary" strokeWidth={1.75} />
          ) : (
            <XCircle className="size-4 text-tertiary" strokeWidth={1.75} />
          )}
          <span className="text-13 text-secondary">{provider.connected ? "Connected" : "Not connected"}</span>
        </div>
      </div>

      {provider.connected ? (
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="text-13 text-secondary">
            Key ending <span className="font-mono text-primary">{provider.lastFour}</span> · saved{" "}
            {formatSettingsTimestamp(provider.updatedAt)}
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="neutral-primary"
              size="sm"
              onClick={() => void onTest(provider.provider)}
              loading={pending}
            >
              Test connection
            </Button>
            <Button variant="danger" size="sm" onClick={() => void handleRemove()} disabled={pending}>
              Remove key
            </Button>
          </div>
        </div>
      ) : (
        <div className="flex flex-wrap items-center gap-2">
          <Input
            type="password"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            placeholder="Paste an API key"
            className={`max-w-xs flex-1 ${FOCUS_RING}`}
            aria-label={`${PROVIDER_LABELS[provider.provider]} API key`}
          />
          <Button
            variant="primary"
            size="sm"
            onClick={() => void handleSave()}
            loading={pending}
            disabled={apiKey.trim().length < 8}
          >
            Save key
          </Button>
        </div>
      )}

      {testResult && (
        <p className={`text-12 ${testResult.ok ? "text-success-primary" : "text-danger-primary"}`}>
          {testResult.ok ? "Connection succeeded." : (testResult.error ?? "Connection failed.")}
        </p>
      )}
    </div>
  );
}

export function ProvidersPanel() {
  const { status, providers, error, retry, pending, testResults, saveKey, removeKey, testConnection } =
    useProviderSettings();

  return (
    <SettingsSection
      title="Model providers"
      description="Bring your own API key per provider. Keys are write-only — once saved, only the last four characters are ever shown again."
    >
      <div className="flex items-start gap-2.5 rounded-md border border-subtle bg-surface-2 p-3">
        <Info className="mt-0.5 size-4 flex-shrink-0 text-tertiary" strokeWidth={1.75} />
        <p className="text-12 leading-relaxed text-secondary">
          OmniRoute is the default route when no key is set here — the product works without any provider key
          configured.
        </p>
      </div>

      {status === "loading" && <ProvidersSkeleton />}
      {status === "error" && (
        <ChatErrorState message={error ?? "Could not load model provider settings."} onRetry={retry} />
      )}
      {status === "ready" && (
        <div className="flex flex-col gap-3">
          {providers.map((provider) => (
            <ProviderCard
              key={provider.provider}
              provider={provider}
              pending={pending.has(provider.provider)}
              testResult={testResults.get(provider.provider)}
              onSave={saveKey}
              onRemove={removeKey}
              onTest={testConnection}
            />
          ))}
        </div>
      )}
    </SettingsSection>
  );
}
