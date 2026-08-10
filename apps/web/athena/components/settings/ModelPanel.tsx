/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 *
 * Choosing which model answers in chat.
 *
 * The design goal is that the common case takes no decision at all: "Automatic" is first,
 * pre-selected, and explained, so someone who does not know one model from another can leave the
 * page having chosen correctly. Everything else is a search box over the live catalogue — 286
 * models on this install — because a dropdown of 286 entries is not a choice, it is a wall.
 *
 * Models that cannot call tools are listed but not selectable, with the reason attached. Hiding
 * them would leave someone hunting for a model they can see in another product and cannot find
 * here.
 */
import { useCallback, useEffect, useMemo, useState } from "react";
import { Check, Search, Sparkles, TriangleAlert, Wrench } from "lucide-react";
import { Button, Loader } from "@plane/ui";
import { ChatApiError } from "../../api/http";
import { getModelCatalog, setSelectedModel } from "./api/chatSettingsClient";
import { SettingsSection } from "./shared/SettingsSection";
import type { CatalogModel, SettingsFetchStatus } from "./types";

const AUTOMATIC_ID = "__automatic__";

function formatContext(tokens: number | null): string | null {
  if (tokens === null) return null;
  if (tokens >= 1_000_000) return `${Math.round(tokens / 100_000) / 10}M context`;
  if (tokens >= 1_000) return `${Math.round(tokens / 1_000)}K context`;
  return `${tokens} context`;
}

function ModelRow(props: {
  id: string;
  title: string;
  subtitle: string;
  detail?: string | null;
  selected: boolean;
  disabled?: boolean;
  disabledReason?: string;
  saving: boolean;
  onSelect: () => void;
}) {
  const { selected, disabled } = props;
  return (
    <li>
      <button
        type="button"
        disabled={disabled || props.saving}
        onClick={props.onSelect}
        aria-current={selected ? "true" : undefined}
        title={disabled ? props.disabledReason : undefined}
        className={`focus-visible:ring-accent-primary flex w-full items-start gap-3 rounded-md border px-3 py-2.5 text-left transition-colors focus-visible:ring-2 focus-visible:outline-none ${
          selected ? "border-accent-primary bg-layer-1" : "border-subtle hover:bg-layer-1"
        } ${disabled ? "cursor-not-allowed opacity-55" : ""}`}
      >
        <span className="mt-0.5 flex size-4 flex-shrink-0 items-center justify-center">
          {selected ? <Check className="size-4 text-accent-primary" strokeWidth={2.25} /> : null}
        </span>
        <span className="flex min-w-0 flex-1 flex-col gap-0.5">
          <span className="flex items-center gap-2">
            <span className="truncate text-13 text-primary">{props.title}</span>
            {props.detail && <span className="flex-shrink-0 text-11 text-tertiary">{props.detail}</span>}
          </span>
          <span className="font-mono truncate text-11 text-tertiary">{props.subtitle}</span>
          {disabled && props.disabledReason && <span className="text-11 text-tertiary">{props.disabledReason}</span>}
        </span>
      </button>
    </li>
  );
}

export function ModelPanel() {
  const [status, setStatus] = useState<SettingsFetchStatus>("loading");
  const [models, setModels] = useState<readonly CatalogModel[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [unavailable, setUnavailable] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [query, setQuery] = useState("");
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setStatus("loading");
    setError(null);

    getModelCatalog()
      .then((response) => {
        if (cancelled) return;
        setModels(response.models);
        setSelected(response.selectedModelId);
        setUnavailable(response.catalogUnavailable);
        setStatus("ready");
      })
      .catch((cause: unknown) => {
        if (cancelled) return;
        setStatus("error");
        setError(cause instanceof ChatApiError ? cause.message : "Could not load the model list.");
      });

    return () => {
      cancelled = true;
    };
  }, [attempt]);

  const choose = useCallback((modelId: string | null) => {
    setSaving(true);
    setSaveError(null);
    setSelectedModel(modelId)
      .then((response) => setSelected(response.selectedModelId))
      .catch((cause: unknown) => {
        setSaveError(cause instanceof ChatApiError ? cause.message : "Could not save that choice.");
      })
      .finally(() => setSaving(false));
  }, []);

  const { autos, others } = useMemo(() => {
    const needle = query.trim().toLowerCase();
    const matches = needle
      ? models.filter((m) => m.id.toLowerCase().includes(needle) || m.label.toLowerCase().includes(needle))
      : models;
    return {
      autos: matches.filter((m) => m.isAuto),
      others: matches.filter((m) => !m.isAuto),
    };
  }, [models, query]);

  if (status === "loading") {
    return (
      <Loader className="flex flex-col gap-2">
        {[...Array(6)].map((_, i) => (
          <Loader.Item key={i} height="44px" />
        ))}
      </Loader>
    );
  }

  if (status === "error") {
    return (
      <SettingsSection title="Model" description="Which model answers in chat.">
        <p className="text-danger text-13">{error}</p>
        <Button variant="neutral-primary" size="sm" onClick={() => setAttempt((n) => n + 1)}>
          Try again
        </Button>
      </SettingsSection>
    );
  }

  const toolCapable = models.filter((m) => m.supportsTools).length;

  return (
    <SettingsSection
      title="Model"
      description="Which model answers when someone mentions an agent in chat. Automatic is the right answer for most workspaces."
    >
      {unavailable ? (
        <div className="flex items-start gap-2 rounded-md border border-subtle bg-layer-1 px-3 py-2.5">
          <TriangleAlert className="mt-0.5 size-4 flex-shrink-0 text-tertiary" strokeWidth={1.75} />
          <p className="text-12 text-secondary">
            The model gateway is not reachable, so the list cannot be shown. Chat still works — agents fall back to
            automatic routing. Your current choice is unchanged.
          </p>
        </div>
      ) : (
        <p className="text-11 text-tertiary">
          {toolCapable} of {models.length} available models can call tools. Only those can use Plane and the knowledge
          graph, so the rest are shown but not selectable.
        </p>
      )}

      {saveError && (
        <p className="text-danger rounded-md border border-danger-subtle bg-danger-subtle px-3 py-2 text-12">
          {saveError}
        </p>
      )}

      <ul className="flex flex-col gap-1.5">
        <ModelRow
          id={AUTOMATIC_ID}
          title="Automatic"
          subtitle="the gateway picks a capable model per request"
          detail="recommended"
          selected={selected === null}
          saving={saving}
          onSelect={() => choose(null)}
        />
      </ul>

      {!unavailable && (
        <>
          <div className="relative">
            <Search
              className="pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-tertiary"
              strokeWidth={1.75}
            />
            <input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search models…"
              aria-label="Search models"
              className="focus-visible:ring-accent-primary w-full rounded-md border border-subtle bg-layer-1 py-1.5 pr-2.5 pl-8 text-13 text-primary placeholder:text-tertiary focus-visible:ring-2 focus-visible:outline-none"
            />
          </div>

          {autos.length > 0 && (
            <section className="flex flex-col gap-1.5">
              <h4 className="flex items-center gap-1.5 px-1 text-12 font-medium tracking-wide text-secondary uppercase">
                <Sparkles className="size-3.5" strokeWidth={1.75} /> Smart routing
              </h4>
              <ul className="flex flex-col gap-1.5">
                {autos.map((model) => (
                  <ModelRow
                    key={model.id}
                    id={model.id}
                    title={model.label}
                    subtitle={model.id}
                    detail={formatContext(model.contextLength)}
                    selected={selected === model.id}
                    disabled={!model.supportsTools}
                    disabledReason={model.supportsTools ? undefined : "cannot call tools"}
                    saving={saving}
                    onSelect={() => choose(model.id)}
                  />
                ))}
              </ul>
            </section>
          )}

          {others.length > 0 && (
            <section className="flex flex-col gap-1.5">
              <h4 className="flex items-center gap-1.5 px-1 text-12 font-medium tracking-wide text-secondary uppercase">
                <Wrench className="size-3.5" strokeWidth={1.75} /> Specific models
              </h4>
              <ul className="flex max-h-96 flex-col gap-1.5 overflow-y-auto">
                {others.map((model) => (
                  <ModelRow
                    key={model.id}
                    id={model.id}
                    title={model.label}
                    subtitle={model.id}
                    detail={formatContext(model.contextLength)}
                    selected={selected === model.id}
                    disabled={!model.supportsTools}
                    disabledReason={model.supportsTools ? undefined : "cannot call tools"}
                    saving={saving}
                    onSelect={() => choose(model.id)}
                  />
                ))}
              </ul>
            </section>
          )}

          {autos.length === 0 && others.length === 0 && (
            <p className="text-12 text-tertiary">No model matches “{query.trim()}”.</p>
          )}
        </>
      )}
    </SettingsSection>
  );
}
