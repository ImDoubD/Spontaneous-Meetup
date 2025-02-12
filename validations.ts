import { z } from 'zod';

export const createBroadcastSchema = z.object({
  title: z.string().min(3).max(100),
  description: z.string().max(500).optional(),
  activityType: z.string().min(3),
  startTime: z.coerce.date(),
  endTime: z.coerce.date(),
  location: z.object({
    type: z.literal('Point'),
    coordinates: z.tuple([z.number(), z.number()])
  })
});

export type CreateBroadcastInput = z.infer<typeof createBroadcastSchema>;
export const validateCreateBroadcast = (data: unknown) => 
  createBroadcastSchema.safeParse(data);