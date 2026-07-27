/**
 * Centralized stage rules — Sprint 4 update.
 *
 * All logic uses stageType as the primary check (rename-safe),
 * with name-based fallback for backward compatibility.
 *
 * Prospect → always index 0, locked first
 * Closure  → always last index, locked last
 * WON      → terminal (locked, no exit)
 * LOST     → requires reason when entering
 */

// ─── Constants ────────────────────────────────────────────────────────────────

/** Stage types that cannot be dragged OUT of once a lead is there */
export const LOCKED_STAGE_TYPES = ['WON', 'CLOSURE'];

/** Stage types that show as terminal (lock icon) in Kanban column header */
export const TERMINAL_STAGE_TYPES = ['WON', 'CLOSURE', 'LOST'];

/** Names of system-mandatory stages (case-insensitive — backward compat) */
const MANDATORY_NAMES = ['prospect', 'closure'];

/** StageTypes that are system-anchored (cannot remove/reorder) */
const MANDATORY_TYPES = ['PROSPECT', 'CLOSURE'];

// ─── Core Predicates ─────────────────────────────────────────────────────────

/**
 * Returns true if a stage is a mandatory system stage.
 * Checks stageType first (rename-safe), falls back to name for legacy data.
 */
export const isMandatoryStage = (stage) => {
  if (MANDATORY_TYPES.includes(stage?.stageType)) return true;
  return !!(stage?.isDefault || MANDATORY_NAMES.includes(stage?.name?.toLowerCase()));
};

/** Returns true if a stage is the Prospect anchor (must be first) */
export const isProspectStage = (stage) => {
  if (stage?.stageType === 'PROSPECT') return true;
  return stage?.name?.toLowerCase() === 'prospect' ||
    (stage?.isDefault && stage?.name?.toLowerCase() !== 'closure');
};

/** Returns true if a stage is the Closure anchor (must be last) */
export const isClosureStage = (stage) => {
  if (stage?.stageType === 'CLOSURE') return true;
  return stage?.name?.toLowerCase() === 'closure';
};

/** Returns true if a stage is WON */
export const isWonStage = (stage) =>
  stage?.stageType === 'WON' || stage?.name?.toLowerCase() === 'won';

/** Returns true if a stage is LOST */
export const isLostStage = (stage) =>
  stage?.stageType === 'LOST' || stage?.name?.toLowerCase() === 'lost';

/**
 * Returns true if a lead in this stage cannot be dragged OUT.
 * WON and CLOSURE are terminal — once a lead reaches them it's locked.
 */
export const isTerminalStage = (stage) => {
  if (LOCKED_STAGE_TYPES.includes(stage?.stageType)) return true;
  // name-based fallback for legacy data
  const name = stage?.name?.toLowerCase();
  return name === 'closure' || name === 'won';
};

/**
 * Returns true if moving TO this stage requires a reason.
 * Currently: only LOST requires a reason.
 */
export const requiresReason = (stage) =>
  stage?.stageType === 'LOST' || stage?.name?.toLowerCase() === 'lost';

// ─── Ordering Utilities ───────────────────────────────────────────────────────

/**
 * Enforce mandatory stage positions in a selectedStages array.
 * - Prospect is always at index 0
 * - Closure is always at the last index
 * - Middle stages stay in their relative order
 *
 * @param {Array} stages
 * @returns {Array} reordered stages with anchors in correct positions
 */
export const enforceAnchorPositions = (stages) => {
  if (!stages.length) return stages;

  const prospect = stages.find(isProspectStage);
  const closure = stages.find(isClosureStage);
  const middle = stages.filter(s => !isProspectStage(s) && !isClosureStage(s));

  const result = [];
  if (prospect) result.push(prospect);
  result.push(...middle);
  if (closure) result.push(closure);
  return result;
};

/**
 * Validate a drag-end move and return the new array, or the original if the move is invalid.
 *
 * Rules:
 *  - Prospect cannot move from index 0
 *  - Closure cannot move from last index
 *  - No stage can move to index 0 (Prospect's slot)
 *  - No stage can move to last index (Closure's slot) — unless it IS Closure
 *
 * @param {Array} stages
 * @param {number} oldIndex
 * @param {number} newIndex
 * @returns {Array}
 */
export const applyConstrainedDragMove = (stages, oldIndex, newIndex) => {
  if (oldIndex === newIndex) return stages;

  const moving = stages[oldIndex];
  const lastIdx = stages.length - 1;

  // Mandatory anchors cannot be dragged at all
  if (isMandatoryStage(moving)) return stages;

  // Cannot drag into Prospect's slot (index 0)
  if (newIndex === 0) return stages;

  // Cannot drag into Closure's last slot
  if (newIndex === lastIdx && isClosureStage(stages[lastIdx])) return stages;

  const moved = arrayMovePure(stages, oldIndex, newIndex);

  // Final safety: re-enforce anchors in case something slipped
  return enforceAnchorPositions(moved);
};

/** Pure arrayMove (no dnd-kit dependency) */
const arrayMovePure = (arr, from, to) => {
  const result = [...arr];
  const [item] = result.splice(from, 1);
  result.splice(to, 0, item);
  return result;
};

/**
 * Ensure mandatory stages are always present in selectedStages.
 * If Prospect or Closure is missing from selected but exists in masterStages,
 * inject them at the correct position.
 *
 * @param {Array} selected - current selectedStages
 * @param {Array} master   - all masterStages
 * @returns {Array}
 */
export const ensureMandatoryStages = (selected, master) => {
  let result = [...selected];

  const hasProspect = result.some(isProspectStage);
  const hasClosure = result.some(isClosureStage);

  if (!hasProspect) {
    const prospect = master.find(isProspectStage);
    if (prospect) result = [prospect, ...result];
  }

  if (!hasClosure) {
    const closure = master.find(isClosureStage);
    if (closure) result = [...result, closure];
  }

  return enforceAnchorPositions(result);
};
