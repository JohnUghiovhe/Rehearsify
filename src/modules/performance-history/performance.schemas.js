import { z } from 'zod';

export const songIdsSchema = z.object({
  songIds: z.array(z.string().uuid()).min(1),
});
