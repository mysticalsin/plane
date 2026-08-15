/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 *
 * Wire types for Athena's knowledge graph — the shapes served by the BFF's /graph/* routes,
 * which in turn hold a graph built by Graphify (https://github.com/Graphify-Labs/graphify).
 * These mirror packages/domain/src/api.ts in the Athena repo; that file is the contract.
 */

export type GraphRun = {
  id: string;
  sourceKey: string;
  builtAtCommit: string | null;
  nodeCount: number;
  edgeCount: number;
  createdAt: string;
};

export type GraphNode = {
  nodeId: string;
  label: string;
  fileType: string;
  sourceFile: string | null;
  sourceLocation: string | null;
  community: number | null;
};

export type GraphEdge = {
  source: string;
  target: string;
  relation: string;
  weight: number;
  sourceFile: string | null;
  sourceLocation: string | null;
};

/** Direction is relative to the node being inspected: OUT means it points at the neighbour. */
export type GraphNeighbor = {
  node: GraphNode;
  relation: string;
  direction: "OUT" | "IN";
  /** 0–1, or null. Shown when the parser was less than certain, so a guessed relation does not
   * read like one parsed straight out of an import statement. */
  confidence: number | null;
};

/** `found: false` means the two nodes are genuinely unconnected — not that one is missing. */
export type GraphPath = {
  found: boolean;
  nodes: GraphNode[];
  edges: GraphEdge[];
};

export type GraphRunListResponse = { runs: GraphRun[] };
export type GraphSearchResponse = { run: GraphRun; nodes: GraphNode[] };
export type GraphNeighborsResponse = { run: GraphRun; node: GraphNode; neighbors: GraphNeighbor[] };
export type GraphPathResponse = { run: GraphRun; path: GraphPath };
