import { z } from "zod";

// bloomPlayer definition
//export type WithMessageType = any & { messageType: string };
export const WithMessageZ = z.object({
    messageType: z.string(),
});

export type WithMessageType = z.infer<typeof WithMessageZ>;
