import { openAiRouter } from "./router/openai";
import { postRouter } from "./router/post";
import { createTRPCRouter } from "./trpc";

export const appRouter = createTRPCRouter({
  post: postRouter,
  openAi: openAiRouter,
});

// export type definition of API
export type AppRouter = typeof appRouter;
