import { z } from 'zod';

export const songIdsSchema = z.object({
  songIds: z
    .union([
      z.string().uuid(),
      z.array(z.string().uuid()),
    ])
    .transform((value) => (Array.isArray(value) ? value : [value])),
});