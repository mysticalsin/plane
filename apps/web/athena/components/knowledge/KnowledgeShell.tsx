/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 *
 * The knowledge-graph surface: search on the left, the selected node's connections on the
 * right.
 *
 * The graph is built by Graphify (https://github.com/Graphify-Labs/graphify) from the actual
 * source — tree-sitter parses the code, so an edge shown here was read out of a file rather
 * than inferred. The empty state says how to populate it instead of just reporting emptiness,
 * because "no graph yet" is a setup step, not an error.
 */
import { useState } from "react";
import { Search, Trash2 } from "lucide-react";
import { Button } from "@plane/ui";
import { ChatApiError } from "../../api/http";
import { FOCUS_RING } from "../../utils/focusRing";
import { deleteGraphSource } from "../../api/graphClient";
import { GraphNodeDetail } from "./GraphNodeDetail";
import { GraphNodeList, GraphNodeListSkeleton } from "./GraphNodeList";
import { useGraphRuns } from "./useGraphRuns";
import { useGraphSearch } from "./useGraphSearch";
import type { GraphNode } from "../../types/graph";

function SourcePicker(props: {
  runs: readonly { sourceKey: string; nodeCount: number }[];
  value: string;
  onChange: (value: string) => void;
}) {
  // With a single indexed source there is nothing to choose between, and a one-option select
  // is just noise — the BFF already defaults to the most recent run.
  if (props.runs.length < 2) return null;

  return (
    <select
      value={props.value}
      onChange={(event) => props.onChange(event.target.value)}
      aria-label="Indexed source"
      className="focus-visible:ring-accent-primary rounded-md border border-subtle bg-layer-1 px-2 py-1.5 text-12 text-primary focus-visible:ring-2 focus-visible:outline-none"
    >
      {props.runs.map((run) => (
        <option key={run.sourceKey} value={run.sourceKey}>
          {run.sourceKey} ({run.nodeCount.toLocaleString()} nodes)
        </option>
      ))}
    </select>
  );
}

function EmptyGraphState() {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-3 p-8 text-center">
      <h3 className="text-15 font-medium text-primary">No knowledge graph yet</h3>
      <p className="max-w-md text-13 text-secondary">
        Athena can answer questions about a codebase from its actual structure — what imports what, what calls what, and
        how any two parts connect. Build one by running the sync script against a repository:
      </p>
      <code className="font-mono rounded-md bg-layer-2 px-3 py-2 text-12 text-secondary">
        node scripts/graphify-sync.mjs --path /path/to/repo --source-key myrepo
      </code>
      <p className="max-w-md text-11 text-tertiary">
        Code is parsed locally with tree-sitter. Nothing is sent to a model to build the graph.
      </p>
    </div>
  );
}

export function KnowledgeShell() {
  const runs = useGraphRuns();
  const [sourceKey, setSourceKey] = useState<string>("");
  const [selected, setSelected] = useState<GraphNode | null>(null);
  const search = useGraphSearch(sourceKey || undefined);
  const [removing, setRemoving] = useState<string | null>(null);
  const [removeError, setRemoveError] = useState<string | null>(null);

  // Sources are removed rather than hidden: a source nobody indexes any more should stop being
  // offered as something to search, not sit in the picker returning stale answers forever.
  const removeSource = (key: string) => {
    setRemoving(key);
    setRemoveError(null);
    deleteGraphSource(key)
      .then(() => {
        setSelected(null);
        setSourceKey("");
        runs.retry();
      })
      .catch((cause: unknown) => {
        setRemoveError(cause instanceof ChatApiError ? cause.message : "Could not remove that source.");
      })
      .finally(() => setRemoving(null));
  };

  if (runs.status === "loading") {
    return <GraphNodeListSkeleton />;
  }

  if (runs.status === "error") {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-3 p-8 text-center">
        <p className="text-danger text-13">{runs.error}</p>
        <Button variant="neutral-primary" size="sm" onClick={runs.retry}>
          Try again
        </Button>
      </div>
    );
  }

  if (runs.status === "empty") {
    return <EmptyGraphState />;
  }

  const activeRun = search.run ?? runs.runs[0];

  return (
    <div className="flex h-full overflow-hidden">
      <div className="flex w-full max-w-sm flex-col border-r border-subtle">
        <div className="flex flex-col gap-2 border-b border-subtle p-4">
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Search
                className="pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-tertiary"
                strokeWidth={1.75}
              />
              <input
                type="search"
                value={search.search}
                onChange={(event) => search.setSearch(event.target.value)}
                placeholder="Search files, symbols, docs…"
                aria-label="Search the knowledge graph"
                className="focus-visible:ring-accent-primary w-full rounded-md border border-subtle bg-layer-1 py-1.5 pr-2.5 pl-8 text-13 text-primary placeholder:text-tertiary focus-visible:ring-2 focus-visible:outline-none"
              />
            </div>
            <SourcePicker runs={runs.runs} value={sourceKey} onChange={setSourceKey} />
          </div>
          {activeRun && (
            <p className="flex items-center gap-1.5 text-11 text-tertiary">
              {activeRun.sourceKey} · {activeRun.nodeCount.toLocaleString()} nodes ·{" "}
              {activeRun.edgeCount.toLocaleString()} relationships
              {activeRun.builtAtCommit ? ` · ${activeRun.builtAtCommit.slice(0, 8)}` : ""}
              <button
                type="button"
                onClick={() => removeSource(activeRun.sourceKey)}
                disabled={removing === activeRun.sourceKey}
                aria-label={`Stop indexing ${activeRun.sourceKey}`}
                title={`Stop indexing ${activeRun.sourceKey}`}
                className={`hover:text-danger ml-auto rounded p-1 text-tertiary transition-colors hover:bg-layer-1 ${FOCUS_RING}`}
              >
                <Trash2 className="size-3" strokeWidth={1.75} />
              </button>
            </p>
          )}
        </div>

        <div className="flex-1 overflow-y-auto">
          {search.status === "idle" && (
            <p className="p-4 text-12 text-tertiary">
              Search for a file, function, or concept to explore how it connects to the rest of the codebase.
            </p>
          )}
          {search.status === "loading" && <GraphNodeListSkeleton />}
          {search.status === "empty" && (
            <p className="p-4 text-12 text-tertiary">Nothing matches “{search.search.trim()}”.</p>
          )}
          {removeError && <p className="text-danger px-4 pt-3 text-12">{removeError}</p>}
          {search.status === "error" && (
            <div className="flex flex-col items-start gap-2 p-4">
              <p className="text-danger text-12">{search.error}</p>
              <Button variant="neutral-primary" size="sm" onClick={search.retry}>
                Try again
              </Button>
            </div>
          )}
          {search.status === "ready" && (
            <GraphNodeList nodes={search.nodes} selectedNodeId={selected?.nodeId ?? null} onSelect={setSelected} />
          )}
        </div>
      </div>

      <div className="flex-1 overflow-hidden">
        {selected ? (
          <GraphNodeDetail node={selected} sourceKey={sourceKey || undefined} onSelect={setSelected} />
        ) : (
          <div className="flex h-full items-center justify-center p-8">
            <p className="max-w-sm text-center text-13 text-tertiary">
              Select a result to see what it depends on, what depends on it, and how it connects to anything else in the
              graph.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
