/** Typed in admin UI to confirm full wipe of imported mains PYQ vault (all `mains_pyq_*` + links). */
export const MAINS_PYQ_PURGE_CONFIRMATION_PHRASE = 'DELETE_ALL_MAINS_PYQ' as const;

/** Typed in admin UI to delete every row in `mains_pyq_prepared_variants` only (resets tracker; stems stay). */
export const MAINS_PYQ_PREPARED_VARIANTS_PURGE_PHRASE = 'DELETE_ALL_PYQ_PREPARED_VARIANTS' as const;
