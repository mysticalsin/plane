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
 *
 * Who may use these fields is a workspace policy, not a free-for-all: a key is a spending
 * instrument. When the viewer is not allowed, the controls are disabled with the reason stated
 * rather than failing on save — see ProviderAccess.
 */
import { useState } from "react";
import { CheckCircle2, Info, KeyRound, XCircle } from "lucide-react";
import { Button, Input, Loader } from "@plane/ui";
import { TOAST_TYPE, setToast } from "@plane/propel/toast";
import { ChatErrorState } from "../ChatErrorState";
import { FOCUS_RING } from "../../utils/focusRing";
import { useProviderPolicy } from "./hooks/useProviderPolicy";
import { useProviderSettings } from "./hooks/useProviderSettings";
import { CUSTOM_PROVIDER_HINT, PROVIDER_LABELS } from "./providerLabels";
import { ProviderAccess } from "./ProviderAccess";
import { formatSettingsTimestamp } from "./shared/formatDate";
import { SettingsSection } from "./shared/SettingsSection";
import type { ChatModelProvider, ProviderKeyStatus, TestProviderResult } from "./types";

function ProvidersSkeleton() {
  return (
    <Loader className="flex flex-col gap-3">
      {[...Array(4)].map((_, i) => (
        <Loader.Item key={i} height="96px" width="100%" />
      ))}
    </Loader>
  );
}

interface ProviderCardProps {
  readonly provider: ProviderKeyStatus;
  readonly pending: boolean;
  /** False when workspace policy reserves keys for admins and the viewer is not one. */
  readonly canManage: boolean;
  readonly isActive: boolean;
  readonly testResult: TestProviderResult | undefined;
  readonly onSave: (
    provider: ChatModelProvider,
    apiKey: string,
    custom?: { baseUrl: string; model: string }
  ) => Promise<{ ok: boolean; error?: string }>;
  readonly onRemove: (provider: ChatModelProvider) => Promise<{ ok: boolean; error?: string }>;
  readonly onTest: (provider: ChatModelProvider) => Promise<void>;
}

function ProviderCard(props: ProviderCardProps) {
  const { provider, pending, canManage, isActive, testResult, onSave, onRemove, onTest } = props;
  const [apiKey, setApiKey] = useState("");
  const [baseUrl, setBaseUrl] = useState("");
  const [model, setModel] = useState("");
  const label = PROVIDER_LABELS[provider.provider];
  const isCustom = provider.provider === "custom";

  async function handleSave() {
    const result = await onSave(
      provider.provider,
      apiKey.trim(),
      isCustom ? { baseUrl: baseUrl.trim(), model: model.trim() } : undefined
    );
    if (result.ok) {
      setApiKey("");
      setToast({ type: TOAST_TYPE.SUCCESS, title: `${label} key saved` });
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

  // A custom endpoint needs somewhere to send the request and a model id nobody could guess; the
  // named vendors' URLs are constants the server refuses to let a stored value re-point.
  const customIncomplete = isCustom && (!/^https?:\/\/.+/i.test(baseUrl.trim()) || model.trim().length === 0);
  const saveDisabled = apiKey.trim().length < 8 || customIncomplete;

  return (
    <div className="flex flex-col gap-3 rounded-md border border-subtle bg-surface-1 p-4">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <KeyRound className="size-4 flex-shrink-0 text-tertiary" strokeWidth={1.75} />
          <span className="text-14 font-medium text-primary">{label}</span>
          {isActive && (
            <span className="rounded-full border border-subtle px-2 py-0.5 text-11 text-secondary">In use</span>
          )}
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
            <Button variant="danger" size="sm" onClick={() => void handleRemove()} disabled={pending || !canManage}>
              Remove key
            </Button>
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {isCustom && (
            <>
              <p className="text-12 leading-relaxed text-secondary">{CUSTOM_PROVIDER_HINT}</p>
              <div className="flex flex-wrap items-center gap-2">
                <Input
                  type="url"
                  value={baseUrl}
                  onChange={(e) => setBaseUrl(e.target.value)}
                  placeholder="https://api.example.com/v1"
                  className={`max-w-sm flex-1 ${FOCUS_RING}`}
                  aria-label="Custom endpoint base URL"
                  disabled={!canManage}
                />
                <Input
                  type="text"
                  value={model}
                  onChange={(e) => setModel(e.target.value)}
                  placeholder="Model id, e.g. llama-3.3-70b"
                  className={`max-w-xs flex-1 ${FOCUS_RING}`}
                  aria-label="Custom endpoint model id"
                  disabled={!canManage}
                />
              </div>
            </>
          )}
          <div className="flex flex-wrap items-center gap-2">
            <Input
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="Paste an API key"
              className={`max-w-xs flex-1 ${FOCUS_RING}`}
              aria-label={`${label} API key`}
              disabled={!canManage}
            />
            <Button
              variant="primary"
              size="sm"
              onClick={() => void handleSave()}
              loading={pending}
              disabled={saveDisabled || !canManage}
            >
              Save key
            </Button>
          </div>
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
  const policy = useProviderPolicy();

  async function applyPolicyChange(work: Promise<{ ok: boolean; error?: string }>, successTitle: string) {
    const result = await work;
    setToast(
      result.ok
        ? { type: TOAST_TYPE.SUCCESS, title: successTitle }
        : { type: TOAST_TYPE.ERROR, title: "That did not stick", message: result.error }
    );
  }

  // A saved or removed key can change which provider is answering — the first key added becomes
  // the active one — so the permission strip is re-read rather than left showing the old answer.
  async function saveKeyAndRefresh(
    provider: ChatModelProvider,
    apiKey: string,
    custom?: { baseUrl: string; model: string }
  ) {
    const result = await saveKey(provider, apiKey, custom);
    if (result.ok) policy.retry();
    return result;
  }

  async function removeKeyAndRefresh(provider: ChatModelProvider) {
    const result = await removeKey(provider);
    if (result.ok) policy.retry();
    return result;
  }

  const connectedProviders = providers.filter((p) => p.connected).map((p) => p.provider);
  // Until the policy is known, keys stay read-only: showing an editable field that the server
  // will refuse is worse than showing a disabled one for a moment.
  const canManage = policy.policy?.canManageKeys ?? false;

  return (
    <SettingsSection
      title="Model providers"
      description="Bring your own API key. Keys are write-only — once saved, only the last four characters are ever shown again."
    >
      <div className="flex items-start gap-2.5 rounded-md border border-subtle bg-surface-2 p-3">
        <Info className="mt-0.5 size-4 flex-shrink-0 text-tertiary" strokeWidth={1.75} />
        <p className="text-12 leading-relaxed text-secondary">
          Athena&apos;s default route answers when no key is set here — the product works without any provider key
          configured.
        </p>
      </div>

      {policy.status === "error" && (
        <ChatErrorState message={policy.error ?? "Could not load key permissions."} onRetry={policy.retry} />
      )}
      {policy.status === "ready" && policy.policy && (
        <ProviderAccess
          policy={policy.policy}
          busy={policy.busy}
          connectedProviders={connectedProviders}
          onChangePolicy={(next) =>
            void applyPolicyChange(
              policy.changePolicy(next),
              next === "members" ? "Members can now add keys" : "Keys are now admin-only"
            )
          }
          onChangeActiveProvider={(provider) =>
            void applyPolicyChange(
              policy.changeActiveProvider(provider),
              provider ? `Now answering with ${PROVIDER_LABELS[provider]}` : "Back to Athena's default route"
            )
          }
        />
      )}

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
              canManage={canManage}
              isActive={policy.policy?.activeProvider === provider.provider}
              testResult={testResults.get(provider.provider)}
              onSave={saveKeyAndRefresh}
              onRemove={removeKeyAndRefresh}
              onTest={testConnection}
            />
          ))}
        </div>
      )}
    </SettingsSection>
  );
}
