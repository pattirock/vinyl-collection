import { z } from "zod";

export const PAGINATION_DEFAULT_LIMIT = 20;
export const PAGINATION_MAX_LIMIT = 100;

/**
 * Opaque cursor returned by list endpoints (base64url, bounded length) so it can be
 * echoed back safely without ever reaching a database filter unparsed.
 */
export const cursorSchema = z
  .string()
  .min(1)
  .max(256)
  .regex(/^[A-Za-z0-9_-]+$/, "Invalid cursor");

/** Query string for cursor-paginated lists: `?limit=20&cursor=...`. */
export const paginationQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(PAGINATION_MAX_LIMIT).default(PAGINATION_DEFAULT_LIMIT),
  cursor: cursorSchema.optional(),
});

export type PaginationQuery = z.infer<typeof paginationQuerySchema>;

/** Response envelope for cursor-paginated lists. */
export function paginatedResponseSchema<TItem extends z.ZodType>(item: TItem) {
  return z.object({
    items: z.array(item),
    nextCursor: cursorSchema.nullable(),
  });
}

export interface PaginatedResponse<TItem> {
  items: TItem[];
  nextCursor: string | null;
}
