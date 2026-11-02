import React from "react";

// The imported design export stores presentation values and callbacks in one open
// binding bag. Keep that compatibility boundary here; runtime models use real types.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type GeneratedValue = any;
export type GeneratedView = Record<string, GeneratedValue>;
export type GeneratedProps = { v: GeneratedView };

// Generated attributes include serialized DOM values such as tabIndex. React
// remains their existing runtime owner; do not spread this adapter into new code.
export const h = React.createElement as (
  type: React.ElementType,
  props: Record<string, unknown> | null | undefined,
  ...children: React.ReactNode[]
) => React.ReactElement;
