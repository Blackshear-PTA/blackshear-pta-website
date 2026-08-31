import StackedRules from './StackedRules.astro';
import Editorial from './Editorial.astro';
import type { StructureId } from '../../themes/registry';

/**
 * Every structure, keyed by its registry id. Add a structure here and to
 * `structureIds` in the registry at the same time - `satisfies` makes a
 * mismatch a build error rather than a blank page.
 */
export const structures = {
  'stacked-rules': StackedRules,
  editorial: Editorial,
} satisfies Record<StructureId, unknown>;
