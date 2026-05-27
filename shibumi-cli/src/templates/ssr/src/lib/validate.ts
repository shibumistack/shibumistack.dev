import { z } from "zod";

export const ItemSchema = z.object({
  name: z.string().min(1, "Name is required").max(200),
});

export type ItemInput = z.infer<typeof ItemSchema>;
