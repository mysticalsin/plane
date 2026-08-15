/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 *
 * MCP servers this workspace's agents may call.
 *
 * Test is the important control, not an afterthought: an MCP endpoint that is merely reachable
 * proves nothing, so the button performs a real `initialize` + `tools/list` handshake and reports
 * the tool names the server actually advertised. A failure shows the server's own words rather
 * than a generic "connection failed", because the reason is almost always the fix.
 *
 * Tokens are write-only, exactly like the provider keys panel: typed in, never read back, only the
 * last four characters ever shown again.
 */
import { useCallback, useEffect, useState } from "react";
import { Plug, Trash2, TriangleAlert } from "lucide-react";
import { Button, Loader } from "@plane/ui";
import { ChatApiError } from "../../api/http";
import {
  createMcpServer,
  deleteMcpServer,
  getMcpInventory,
  listMcpServers,
  testMcpServer,
  updateMcpServer,
} from "./api/chatSettingsClient";
import { SettingsSection } from "./shared/SettingsSection";
import type { McpInventory, McpProbeResult, McpServer, SettingsFetchStatus } from "./types";

const FOCUS = "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-primary";

function ProbeBadge(props: { result: McpProbeResult }) {
  const { result } = props;
  if (result.ok) {
    return (
      <p className="rounded-md bg-layer-1 px-3 py-2 text-12 text-secondary">
        Connected. {result.tools.length} tool{result.tools.length === 1 ? "" : "s"} available
        {result.tools.length > 0 ? `: ${result.tools.slice(0, 8).join(", ")}` : ""}
        {result.tools.length > 8 ? ", …" : ""}
      </p>
    );
  }
  return (
    <p className="text-danger flex items-start gap-2 rounded-md border border-danger-subtle bg-danger-subtle px-3 py-2 text-12">
      <TriangleAlert className="mt-0.5 size-3.5 flex-shrink-0" strokeWidth={1.75} />
      <span>{result.error ?? "The server did not respond as an MCP endpoint."}</span>
    </p>
  );
}

/**
 * What this server is contributing right now, from the agent's own view of it.
 *
 * Without this the panel looked identical whether a server was serving forty tools or answering
 * 401 on every call — the failure was only visible to someone who happened to press Test, and to
 * the agent, which quietly ran with fewer tools and told nobody.
 */
function LiveState(props: { server: McpServer; inventory: McpInventory | null }) {
  const { server, inventory } = props;
  if (!server.enabled) {
    return <span className="text-12 text-tertiary">Disabled</span>;
  }
  if (!inventory) {
    return <span className="text-12 text-tertiary">Checking…</span>;
  }

  const failure = inventory.unavailable.find((entry) => entry.serverName === server.name);
  if (failure) {
    return (
      <span className="text-danger flex items-center gap-1.5 text-12" title={failure.error}>
        <TriangleAlert className="size-3.5 flex-shrink-0" strokeWidth={1.75} />
        <span className="max-w-64 truncate">Not answering: {failure.error}</span>
      </span>
    );
  }

  const count = inventory.tools.filter((tool) => tool.serverName === server.name).length;
  return (
    <span className="text-12 text-secondary">
      {count} tool{count === 1 ? "" : "s"} available
    </span>
  );
}

function ServerRow(props: {
  server: McpServer;
  inventory: McpInventory | null;
  onChanged: () => void;
  onError: (message: string) => void;
}) {
  const { server, inventory } = props;
  const [probe, setProbe] = useState<McpProbeResult | null>(null);
  const [busy, setBusy] = useState<"test" | "toggle" | "delete" | null>(null);

  const run = (kind: "test" | "toggle" | "delete", work: () => Promise<unknown>) => {
    setBusy(kind);
    work()
      .catch((cause: unknown) => {
        props.onError(cause instanceof ChatApiError ? cause.message : "That did not work.");
      })
      .finally(() => setBusy(null));
  };

  return (
    <li className="flex flex-col gap-2 rounded-md border border-subtle p-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex min-w-0 flex-col">
          <span className="flex items-center gap-2">
            <span className="truncate text-13 text-primary">{server.name}</span>
            {!server.enabled && (
              <span className="flex-shrink-0 rounded bg-layer-2 px-1.5 py-0.5 text-11 text-tertiary">disabled</span>
            )}
            {server.authLastFour && (
              <span className="font-mono flex-shrink-0 rounded bg-layer-2 px-1.5 py-0.5 text-11 text-tertiary">
                token ••••{server.authLastFour}
              </span>
            )}
          </span>
          <span className="font-mono truncate text-11 text-tertiary">{server.url}</span>
        </div>
        <div className="flex flex-shrink-0 items-center gap-2">
          <Button
            variant="neutral-primary"
            size="sm"
            disabled={busy !== null}
            onClick={() => run("test", () => testMcpServer(server.id).then(setProbe))}
          >
            {busy === "test" ? "Testing…" : "Test"}
          </Button>
          <Button
            variant="neutral-primary"
            size="sm"
            disabled={busy !== null}
            onClick={() =>
              run("toggle", () => updateMcpServer(server.id, { enabled: !server.enabled }).then(props.onChanged))
            }
          >
            {server.enabled ? "Disable" : "Enable"}
          </Button>
          <button
            type="button"
            aria-label={`Remove ${server.name}`}
            disabled={busy !== null}
            onClick={() => run("delete", () => deleteMcpServer(server.id).then(props.onChanged))}
            className={`hover:text-danger rounded-md p-1.5 text-tertiary transition-colors hover:bg-layer-1 ${FOCUS}`}
          >
            <Trash2 className="size-4" strokeWidth={1.75} />
          </button>
        </div>
      </div>
      <LiveState server={server} inventory={inventory} />
      {probe && <ProbeBadge result={probe} />}
    </li>
  );
}

function AddServerForm(props: { onAdded: () => void; onError: (message: string) => void }) {
  const [name, setName] = useState("");
  const [url, setUrl] = useState("");
  const [token, setToken] = useState("");
  const [saving, setSaving] = useState(false);

  const submit = () => {
    if (!name.trim() || !url.trim()) return;
    setSaving(true);
    createMcpServer({ name: name.trim(), url: url.trim(), authToken: token.trim() || undefined })
      .then(() => {
        setName("");
        setUrl("");
        setToken("");
        props.onAdded();
      })
      .catch((cause: unknown) => {
        props.onError(cause instanceof ChatApiError ? cause.message : "Could not add that server.");
      })
      .finally(() => setSaving(false));
  };

  return (
    <div className="flex flex-col gap-2 rounded-md border border-subtle p-3">
      <div className="grid gap-2 sm:grid-cols-2">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Name (e.g. Linear)"
          aria-label="Server name"
          className={`rounded-md border border-subtle bg-layer-1 px-2.5 py-1.5 text-13 text-primary placeholder:text-tertiary ${FOCUS}`}
        />
        <input
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="https://host/mcp"
          aria-label="Server URL"
          className={`font-mono rounded-md border border-subtle bg-layer-1 px-2.5 py-1.5 text-12 text-primary placeholder:text-tertiary ${FOCUS}`}
        />
      </div>
      <input
        type="password"
        value={token}
        onChange={(e) => setToken(e.target.value)}
        placeholder="Bearer token (optional)"
        aria-label="Bearer token"
        className={`rounded-md border border-subtle bg-layer-1 px-2.5 py-1.5 text-13 text-primary placeholder:text-tertiary ${FOCUS}`}
      />
      <div className="flex items-center justify-between gap-3">
        <p className="text-11 text-tertiary">
          HTTP endpoints only. The token is stored encrypted and never shown again.
        </p>
        <Button variant="primary" size="sm" onClick={submit} disabled={saving || !name.trim() || !url.trim()}>
          {saving ? "Adding…" : "Add server"}
        </Button>
      </div>
    </div>
  );
}

export function McpPanel() {
  const [status, setStatus] = useState<SettingsFetchStatus>("loading");
  const [servers, setServers] = useState<readonly McpServer[]>([]);
  const [inventory, setInventory] = useState<McpInventory | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);

  const reload = useCallback(() => setAttempt((n) => n + 1), []);

  useEffect(() => {
    let cancelled = false;
    setStatus("loading");
    setError(null);

    // The inventory is a second, slower call — it actually reaches out to every server — so the
    // list renders first and each row fills in its live state when the answer lands.
    setInventory(null);
    getMcpInventory()
      .then((result) => {
        if (!cancelled) setInventory(result);
      })
      .catch(() => {
        if (!cancelled) setInventory({ tools: [], unavailable: [] });
      });

    listMcpServers()
      .then((response) => {
        if (cancelled) return;
        setServers(response.servers);
        setStatus("ready");
      })
      .catch((cause: unknown) => {
        if (cancelled) return;
        setStatus("error");
        setError(cause instanceof ChatApiError ? cause.message : "Could not load MCP servers.");
      });

    return () => {
      cancelled = true;
    };
  }, [attempt]);

  if (status === "loading") {
    return (
      <Loader className="flex flex-col gap-2">
        {[...Array(3)].map((_, i) => (
          <Loader.Item key={i} height="64px" />
        ))}
      </Loader>
    );
  }

  return (
    <SettingsSection
      title="MCP servers"
      description="Model Context Protocol endpoints your agents can call for tools beyond Plane and the knowledge graph."
    >
      {status === "error" && (
        <div className="flex flex-col items-start gap-2">
          <p className="text-danger text-13">{error}</p>
          <Button variant="neutral-primary" size="sm" onClick={reload}>
            Try again
          </Button>
        </div>
      )}

      {actionError && (
        <p className="text-danger rounded-md border border-danger-subtle bg-danger-subtle px-3 py-2 text-12">
          {actionError}
        </p>
      )}

      {status === "ready" && servers.length === 0 && (
        <div className="flex flex-col items-center gap-2 rounded-md border border-dashed border-subtle p-6 text-center">
          <Plug className="size-5 text-tertiary" strokeWidth={1.75} />
          <p className="text-13 text-secondary">No MCP servers connected</p>
          <p className="max-w-md text-12 text-tertiary">
            Add one to give agents extra tools. Test it after adding — a green result means the server completed an MCP
            handshake and listed its tools, not just that the URL responded.
          </p>
        </div>
      )}

      {servers.length > 0 && (
        <ul className="flex flex-col gap-2">
          {servers.map((server) => (
            <ServerRow
              key={server.id}
              server={server}
              inventory={inventory}
              onChanged={reload}
              onError={setActionError}
            />
          ))}
        </ul>
      )}

      <AddServerForm onAdded={reload} onError={setActionError} />
    </SettingsSection>
  );
}
