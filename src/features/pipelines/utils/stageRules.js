/**
 * Centralized mandatory stage rules.
 *
 * Prospect → always index 0, locked first
 * Closure  → always last index, locked last
 *
 * All logic that needs to know "is this stage protected?" should use these helpers
 * instead of scattered hardcoded checks.
 */

/** Names of system-mandatory stages (case-insensitive match) */
const MANDATORY_NAMES = ['prospect', 'closure'];

/** Returns true if a stage is a mandatory system stage (cannot be removed or reordered) */
export const isMandatoryStage = (stage) =>
  !!(stage?.isDefault || MANDATORY_NAMES.includes(stage?.name?.toLowerCase()));

/** Returns true if a stage is the Prospect anchor (must be first) */
export const isProspectStage = (stage) =>
  stage?.name?.toLowerCase() === 'prospect' || (stage?.isDefault && stage?.name?.toLowerCase() !== 'closure');

/** Returns true if a stage is the Closure anchor (must be last) */
export const isClosureStage = (stage) =>
  stage?.name?.toLowerCase() === 'closure';

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
