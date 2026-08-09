/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 *
 * One title + description + body wrapper, shared by all six settings panels so the page
 * reads as one surface rather than six independently laid-out screens.
 */
import type { ReactNode } from "react";

interface SettingsSectionProps {
  readonly title: string;
  readonly description: string;
  readonly action?: ReactNode;
  readonly children: ReactNode;
}

export function SettingsSection(props: SettingsSectionProps) {
  const { title, description, action, children } = props;
  return (
    <section className="flex flex-col gap-4">
      <div className="flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center">
        <div>
          <h3 className="text-14 font-semibold text-primary">{title}</h3>
          <p className="text-13 text-secondary">{description}</p>
        </div>
        {action && <div className="shrink-0">{action}</div>}
      </div>
      {children}
    </section>
  );
}
