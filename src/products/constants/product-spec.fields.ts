export const PRODUCT_SPEC_FIELDS = [
  'viscosityClass',
  'densityAt15C',
  'kinematicViscosityAt40C',
  'kinematicViscosityAt100C',
  'viscosityIndex',
  'flashPoint',
  'pourPoint',
  'baseNumber',
  'specifications',
] as const;

export type ProductSpecField = (typeof PRODUCT_SPEC_FIELDS)[number];
