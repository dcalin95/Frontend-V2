/**
 * Pure helpers for refetch generation — prevents stale async RPC responses from overwriting newer UI state.
 * Hook uses a ref counter; only the latest completed refetch may commit.
 */

/** @returns {{ bump: () => number, get: () => number, isLatest: (id: number) => boolean }} */
export function createRefetchGeneration() {
  let gen = 0;
  return {
    bump: () => {
      gen += 1;
      return gen;
    },
    get: () => gen,
    isLatest: (id) => id === gen,
  };
}
