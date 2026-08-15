/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 *
 * What one node connects to, and how it reaches another.
 *
 * Incoming and outgoing edges are shown as two separate groups rather than one list with a
 * direction badge. "What does this depend on" and "what would break if I change this" are
 * different questions, and mixing both into one list makes a reader parse every row to answer
 * either one.
 */
import { useEffect, useState } from "react";
import { ArrowRight, ArrowLeft, Route as RouteIcon } from "lucide-react";
import { Button, Loader } from "@plane/ui";
import { ChatApiError } from "../../api/http";
import { findGraphPath, getGraphNeighbors } from "../../api/graphClient";
import type { GraphNeighbor, GraphNode, GraphPath } from "../../types/graph";

function NodeLine(props: { node: GraphNode; relation: string }) {
  return (
    <span className="flex min-w-0 flex-col">
      <span className="truncate text-13 text-primary">{props.node.label}</span>
      <span className="font-mono truncate text-11 text-tertiary">{props.node.sourceFile ?? props.node.nodeId}</span>
    </span>
  );
}

function EdgeGroup(props: {
  title: string;
  hint: string;
  icon: typeof ArrowRight;
  neighbors: readonly GraphNeighbor[];
  onSelect: (node: GraphNode) => void;
}) {
  const Icon = props.icon;
  if (props.neighbors.length === 0) return null;

  return (
    <section className="flex flex-col gap-1.5">
      <header className="flex items-baseline gap-2 px-1">
        <h4 className="text-12 font-medium tracking-wide text-secondary uppercase">{props.title}</h4>
        <span className="text-11 text-tertiary">{props.hint}</span>
      </header>
      <ul className="flex flex-col divide-y divide-subtle rounded-md border border-subtle">
        {props.neighbors.map((neighbor) => (
          <li key={`${neighbor.direction}-${neighbor.relation}-${neighbor.node.nodeId}`}>
            <button
              type="button"
              onClick={() => props.onSelect(neighbor.node)}
              className="focus-visible:ring-accent-primary flex w-full items-center gap-2.5 px-3 py-2 text-left transition-colors hover:bg-layer-1 focus-visible:ring-2 focus-visible:outline-none"
            >
              <Icon className="size-3.5 flex-shrink-0 text-tertiary" strokeWidth={1.75} />
              <span className="font-mono flex-shrink-0 rounded bg-layer-2 px-1.5 py-0.5 text-11 text-secondary">
                {neighbor.relation}
              </span>
              {/* Only when the parser was unsure. A confidence of 1 on every certain edge would be
                  noise on every row and would stop the uncertain ones standing out. */}
              {neighbor.confidence !== null && neighbor.confidence < 1 && (
                <span
                  className="flex-shrink-0 rounded bg-layer-2 px-1.5 py-0.5 text-11 text-tertiary"
                  title="How sure the parser was about this relation"
                >
                  {Math.round(neighbor.confidence * 100)}% sure
                </span>
              )}
              <NodeLine node={neighbor.node} relation={neighbor.relation} />
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}

function PathResult(props: { path: GraphPath; from: string; to: string }) {
  if (!props.path.found) {
    return (
      <p className="rounded-md bg-layer-1 px-3 py-2 text-12 text-tertiary">
        No connection found within six hops. These two look genuinely unrelated.
      </p>
    );
  }

  return (
    <ol className="flex flex-col gap-1 rounded-md border border-subtle p-3">
      {props.path.nodes.map((node, index) => (
        <li key={node.nodeId} className="flex flex-col gap-1">
          {index > 0 && (
            <span className="ml-2 flex items-center gap-1.5 text-11 text-tertiary">
              <span className="bg-subtle-1 h-3 w-px" />
              <span className="font-mono">{props.path.edges[index - 1]?.relation ?? "?"}</span>
            </span>
          )}
          <span className="flex min-w-0 items-center gap-2">
            <span className="flex size-5 flex-shrink-0 items-center justify-center rounded-full bg-layer-2 text-11 text-secondary">
              {index + 1}
            </span>
            <span className="truncate text-13 text-primary">{node.label}</span>
            <span className="font-mono truncate text-11 text-tertiary">{node.sourceFile ?? ""}</span>
          </span>
        </li>
      ))}
    </ol>
  );
}

interface GraphNodeDetailProps {
  readonly node: GraphNode;
  readonly sourceKey: string | undefined;
  readonly onSelect: (node: GraphNode) => void;
}

export function GraphNodeDetail(props: GraphNodeDetailProps) {
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const [neighbors, setNeighbors] = useState<readonly GraphNeighbor[]>([]);
  const [error, setError] = useState<string | null>(null);

  const [pathTarget, setPathTarget] = useState("");
  const [path, setPath] = useState<GraphPath | null>(null);
  const [pathError, setPathError] = useState<string | null>(null);
  const [pathPending, setPathPending] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setStatus("loading");
    setError(null);
    // A new node means the previous node's path result is meaningless — clear it rather than
    // leaving a stale answer sitting under a different heading.
    setPath(null);
    setPathError(null);

    getGraphNeighbors(props.node.nodeId, props.sourceKey)
      .then((response) => {
        if (cancelled) return;
        setNeighbors(response.neighbors);
        setStatus("ready");
      })
      .catch((cause: unknown) => {
        if (cancelled) return;
        setStatus("error");
        setError(cause instanceof ChatApiError ? cause.message : "Could not load connections.");
      });

    return () => {
      cancelled = true;
    };
  }, [props.node.nodeId, props.sourceKey]);

  const runPath = () => {
    const target = pathTarget.trim();
    if (target.length === 0) return;
    setPathPending(true);
    setPathError(null);
    setPath(null);

    findGraphPath(props.node.nodeId, target, props.sourceKey)
      .then((response) => setPath(response.path))
      .catch((cause: unknown) => {
        setPathError(cause instanceof ChatApiError ? cause.message : "Could not trace a path between those two nodes.");
      })
      .finally(() => setPathPending(false));
  };

  const outgoing = neighbors.filter((n) => n.direction === "OUT");
  const incoming = neighbors.filter((n) => n.direction === "IN");

  return (
    <div className="flex h-full flex-col gap-5 overflow-y-auto p-5">
      <header className="flex flex-col gap-1">
        <h3 className="text-15 font-medium text-primary">{props.node.label}</h3>
        <p className="font-mono text-11 text-tertiary">
          {props.node.sourceFile ?? props.node.nodeId}
          {props.node.sourceLocation ? `:${props.node.sourceLocation}` : ""}
        </p>
      </header>

      {status === "loading" && (
        <Loader className="flex flex-col gap-2">
          {[...Array(5)].map((_, i) => (
            <Loader.Item key={i} height="32px" />
          ))}
        </Loader>
      )}

      {status === "error" && (
        <p className="text-danger rounded-md border border-danger-subtle bg-danger-subtle px-3 py-2 text-12">{error}</p>
      )}

      {status === "ready" && (
        <>
          {neighbors.length === 0 && (
            <p className="rounded-md bg-layer-1 px-3 py-2 text-12 text-tertiary">
              This node has no recorded connections.
            </p>
          )}
          <EdgeGroup
            title="Depends on"
            hint="what this points at"
            icon={ArrowRight}
            neighbors={outgoing}
            onSelect={props.onSelect}
          />
          <EdgeGroup
            title="Used by"
            hint="what would be affected by a change here"
            icon={ArrowLeft}
            neighbors={incoming}
            onSelect={props.onSelect}
          />
        </>
      )}

      <section className="flex flex-col gap-2 border-t border-subtle pt-4">
        <header className="flex items-center gap-2">
          <RouteIcon className="size-3.5 text-tertiary" strokeWidth={1.75} />
          <h4 className="text-12 font-medium tracking-wide text-secondary uppercase">Trace a connection</h4>
        </header>
        <p className="text-11 text-tertiary">
          Paste another node id to see the shortest chain of relationships from here to there.
        </p>
        <div className="flex gap-2">
          <input
            type="text"
            value={pathTarget}
            onChange={(event) => setPathTarget(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") runPath();
            }}
            placeholder="target node id"
            aria-label="Target node id"
            className="font-mono focus-visible:ring-accent-primary flex-1 rounded-md border border-subtle bg-layer-1 px-2.5 py-1.5 text-12 text-primary placeholder:text-tertiary focus-visible:ring-2 focus-visible:outline-none"
          />
          <Button
            variant="neutral-primary"
            size="sm"
            onClick={runPath}
            disabled={pathPending || pathTarget.trim().length === 0}
          >
            {pathPending ? "Tracing…" : "Trace"}
          </Button>
        </div>
        {pathError && (
          <p className="text-danger rounded-md border border-danger-subtle bg-danger-subtle px-3 py-2 text-12">
            {pathError}
          </p>
        )}
        {path && <PathResult path={path} from={props.node.nodeId} to={pathTarget.trim()} />}
      </section>
    </div>
  );
}
