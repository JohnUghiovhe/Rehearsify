import { z } from 'zod';

// Object.freeze prevents accidental runtime modifications
export const SEASONS = Object.freeze([
  'ADVENT',
  'CHRISTMAS',
  'LENT',
  'EASTER',
  'PENTECOST',
  'ORDINARY',
]);

export const seasonSchema = z.enum(SEASONS);