/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 *
 * Search results. Each row is a real <button> rather than a div with a click handler, so the
 * list is keyboard-navigable without re-implementing focus and Enter/Space by hand.
 */
import { FileCode2, FileText } from "lucide-react";
import { Loader } from "@plane/ui";
import type { GraphNode } from "../../types/graph";

function NodeIcon(props: { fileType: string }) {
  // Graphify labels every node either "code" (parsed by tree-sitter) or "document" (prose,
  // PDFs, images). The icon carries that distinction so a doc hit is not mistaken for source.
  const Icon = props.fileType === "document" ? FileText : FileCode2;
  return <Icon className="size-4 flex-shrink-0 text-tertiary" strokeWidth={1.75} />;
}

export function GraphNodeListSkeleton() {
  return (
    <Loader className="flex flex-col gap-2 p-4">
      {[...Array(6)].map((_, i) => (
        <Loader.Item key={i} height="44px" width={i % 3 === 0 ? "100%" : "90%"} />
      ))}
    </Loader>
  );
}

interface GraphNodeListProps {
  readonly nodes: readonly GraphNode[];
  readonly selectedNodeId: string | null;
  readonly onSelect: (node: GraphNode) => void;
}

export function GraphNodeList(props: GraphNodeListProps) {
  return (
    <ul className="flex flex-col divide-y divide-subtle">
      {props.nodes.map((node) => {
        const isSelected = node.nodeId === props.selectedNodeId;
        return (
          <li key={node.nodeId}>
            <button
              type="button"
              onClick={() => props.onSelect(node)}
              aria-current={isSelected ? "true" : undefined}
              className={`focus-visible:ring-accent-primary flex w-full items-start gap-2.5 px-4 py-2.5 text-left transition-colors hover:bg-layer-1 focus-visible:ring-2 focus-visible:outline-none ${
                isSelected ? "bg-layer-1" : ""
              }`}
            >
              <span className="mt-0.5">
                <NodeIcon fileType={node.fileType} />
              </span>
              <span className="flex min-w-0 flex-col">
                <span className="truncate text-13 text-primary">{node.label}</span>
                {node.sourceFile && (
                  <span className="font-mono truncate text-11 text-tertiary">
                    {node.sourceFile}
                    {node.sourceLocation ? `:${node.sourceLocation}` : ""}
                  </span>
                )}
              </span>
            </button>
          </li>
        );
      })}
    </ul>
  );
}
