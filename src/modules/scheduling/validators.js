import { z } from 'zod';

const seasons = ['ADVENT', 'CHRISTMAS', 'LENT', 'EASTER', 'PENTECOST', 'ORDINARY'];

export const createServiceSchema = z.object({
  eventTypeId: z.string().min(1),
  date: z.coerce.date(),
  season: z.enum(seasons),
  minSongCount: z.number().int().positive().optional(),
  maxSongCount: z.number().int().positive().optional(),
});

export const updateServiceSchema = z.object({
  date: z.coerce.date().optional(),
  season: z.enum(seasons).optional(),
  minSongCount: z.number().int().positive().nullable().optional(),
  maxSongCount: z.number().int().positive().nullable().optional(),
});
