/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 *
 * Registration is create-only — POST /chat/settings/agents has no matching identity-changing
 * PATCH (only `enabled` and `model` can be patched afterward, handled inline in AgentsPanel's
 * own toggle), so this modal never takes an existing agent to edit.
 */
import { useState } from "react";
import { Button, CustomSelect, Input, EModalPosition, EModalWidth, ModalCore } from "@plane/ui";
import { FOCUS_RING } from "../../../utils/focusRing";
import type { ChatModelProvider, CreateAgentInput } from "../types";

const PROVIDER_OPTIONS: readonly { value: ChatModelProvider; label: string }[] = [
  { value: "deepseek", label: "DeepSeek" },
  { value: "moonshot", label: "Moonshot" },
  { value: "anthropic", label: "Anthropic" },
];

interface AgentFormModalProps {
  readonly isOpen: boolean;
  readonly onClose: () => void;
  readonly onSubmit: (values: CreateAgentInput) => Promise<{ ok: boolean; error?: string }>;
}

const EMPTY_VALUES: CreateAgentInput = { name: "", model: "", provider: "deepseek" };

export function AgentFormModal(props: AgentFormModalProps) {
  const { isOpen, onClose, onSubmit } = props;
  const [values, setValues] = useState<CreateAgentInput>(EMPTY_VALUES);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function resetAndClose() {
    setValues(EMPTY_VALUES);
    setError(null);
    onClose();
  }

  async function handleSubmit() {
    if (values.name.trim().length === 0 || values.model.trim().length === 0) {
      setError("Name and model are both required.");
      return;
    }
    setSubmitting(true);
    setError(null);
    const result = await onSubmit({ ...values, name: values.name.trim(), model: values.model.trim() });
    setSubmitting(false);
    if (result.ok) resetAndClose();
    else setError(result.error ?? "Something went wrong.");
  }

  const providerLabel = PROVIDER_OPTIONS.find((option) => option.value === values.provider)?.label ?? "Select provider";

  return (
    <ModalCore isOpen={isOpen} handleClose={resetAndClose} position={EModalPosition.CENTER} width={EModalWidth.LG}>
      <div className="flex flex-col gap-4 p-5">
        <h3 className="text-16 font-semibold text-primary">Register an agent</h3>
        <p className="text-13 text-secondary">Registering an agent here is what makes it @mentionable in chat.</p>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="agent-name" className="text-13 font-medium text-primary">
            Name
          </label>
          <Input
            id="agent-name"
            value={values.name}
            onChange={(e) => setValues((v) => ({ ...v, name: e.target.value }))}
            placeholder="e.g. Athena Assistant"
            maxLength={80}
            className={FOCUS_RING}
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="agent-provider" className="text-13 font-medium text-primary">
            Provider
          </label>
          <CustomSelect
            value={values.provider}
            onChange={(next: ChatModelProvider) => setValues((v) => ({ ...v, provider: next }))}
            label={providerLabel}
            buttonClassName={`border border-subtle-1 bg-layer-2 !rounded-md ${FOCUS_RING}`}
            input
          >
            {PROVIDER_OPTIONS.map((option) => (
              <CustomSelect.Option key={option.value} value={option.value}>
                {option.label}
              </CustomSelect.Option>
            ))}
          </CustomSelect>
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="agent-model" className="text-13 font-medium text-primary">
            Model
          </label>
          <Input
            id="agent-model"
            value={values.model}
            onChange={(e) => setValues((v) => ({ ...v, model: e.target.value }))}
            placeholder="e.g. deepseek-v4-flash"
            maxLength={120}
            className={FOCUS_RING}
          />
        </div>

        {error && <p className="text-12 text-danger-primary">{error}</p>}

        <div className="mt-1 flex justify-end gap-2">
          <Button variant="neutral-primary" size="sm" onClick={resetAndClose} disabled={submitting}>
            Cancel
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={() => void handleSubmit()}
            loading={submitting}
            disabled={submitting}
          >
            Register agent
          </Button>
        </div>
      </div>
    </ModalCore>
  );
}
