/**
 * Display metadata for the four debate agents. The backend emits agent
 * identifiers as free-form strings (e.g. "Researcher", "WorstCase",
 * "Worst-Case"), so {@link resolveAgent} normalises them to a known key.
 */
export type AgentKey = 'researcher' | 'opposer' | 'worstCase' | 'synthesizer';

export interface AgentMeta {
  key: AgentKey;
  /** Display name shown in headers and status text. */
  name: string;
  /** Material icon name. */
  icon: string;
  /** Role badge label. */
  role: string;
  /** Tailwind text colour class for the icon. */
  iconColor: string;
  /** Tailwind border colour class for the agent card's left border. */
  borderColor: string;
}

export const AGENTS: Record<AgentKey, AgentMeta> = {
  researcher: {
    key: 'researcher',
    name: 'Researcher',
    icon: 'science',
    role: 'Advocate',
    iconColor: 'text-blue-400',
    borderColor: 'border-blue-400',
  },
  opposer: {
    key: 'opposer',
    name: 'Opposer',
    icon: 'gavel',
    role: 'Challenger',
    iconColor: 'text-red-400',
    borderColor: 'border-red-400',
  },
  worstCase: {
    key: 'worstCase',
    name: 'Worst-Case',
    icon: 'warning',
    role: 'Pessimist',
    iconColor: 'text-amber-400',
    borderColor: 'border-amber-400',
  },
  synthesizer: {
    key: 'synthesizer',
    name: 'Synthesizer',
    icon: 'balance',
    role: 'Mediator',
    iconColor: 'text-green-400',
    borderColor: 'border-green-400',
  },
};

/** Ordered list used by the loading animation and round layout. */
export const ROUND_AGENT_ORDER: AgentKey[] = ['researcher', 'opposer', 'worstCase'];
export const LOADING_AGENT_ORDER: AgentKey[] = ['researcher', 'opposer', 'worstCase', 'synthesizer'];

/** Map an arbitrary backend agent string to its display metadata. */
export function resolveAgent(raw: string | null | undefined): AgentMeta {
  const normalized = (raw ?? '').toLowerCase().replace(/[^a-z]/g, '');
  if (normalized.includes('research')) return AGENTS.researcher;
  if (normalized.includes('oppos')) return AGENTS.opposer;
  if (normalized.includes('worst')) return AGENTS.worstCase;
  if (normalized.includes('synth')) return AGENTS.synthesizer;
  // Fallback: treat unknown agents as the researcher so the UI stays stable.
  return AGENTS.researcher;
}
