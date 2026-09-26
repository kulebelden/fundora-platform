/** Column options shared by every monetary column: exact NUMERIC, never float. */
export const MONEY_COLUMN = { type: 'numeric', precision: 20, scale: 4 } as const;
