/**
 * normalizes weight to hightest 2.5 kgs
 */
export const normalizeWeight = (weight: number): number => Math.ceil(weight / 2.5) * 2.5;
