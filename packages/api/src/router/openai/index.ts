/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import axios from "axios";
import {
  Configuration,
  OpenAIApi,
  type ChatCompletionRequestMessage,
} from "openai";
import { z } from "zod";

import { createTRPCRouter, publicProcedure } from "../../trpc";
import { createPostSchema, type CreatePostSchema } from "../post/schema";
import { createPost } from "../post/service";

const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY || "",
});

const openai = new OpenAIApi(configuration);

interface Action {
  handle: (input: unknown) => Promise<unknown>;
  input: unknown;
  schema?: z.ZodSchema<unknown>;
}

const actionsToChatGPT = {
  "post.create": {
    input: {
      content: "",
      title: "",
    },
  },
} as const;

const actions = {
  "post.create": {
    schema: createPostSchema,
    input: {
      content: "content",
      title: "title",
    } as CreatePostSchema,
    handle: (input: unknown) => {
      const parsed = createPostSchema.safeParse(input);
      if (parsed.success) {
        return createPost(parsed.data);
      }
      throw new Error("Invalid input");
    },
  },
} satisfies Record<keyof typeof actionsToChatGPT, Action>;

const convertInputIntoAction = (input: string): Action | null => {
  const inputAsJson = JSON.parse(input);

  const aiSchema = z.object({
    action: z.string(),
    input: z.any(),
  });

  const parsed = aiSchema.safeParse(inputAsJson);

  if (parsed.success) {
    const { action } = parsed.data;
    const actionObj = actions[action as keyof typeof actions];

    if (actionObj && "handle" in actionObj) {
      return {
        handle: actionObj.handle,
        input: parsed.data.input,
      };
    }
  }

  return null;
};

export const openAiRouter = createTRPCRouter({
  tellJoke: publicProcedure
    .input(
      z.object({
        prompt: z.string().min(1).max(255),
      }),
    )
    .mutation(async ({ input }) => {
      try {
        const completion = await openai.createChatCompletion({
          model: "gpt-3.5-turbo",
          messages: [
            {
              role: "system",
              content:
                "You are an assistant that says jokes, and only jokes. The user will give you a context, and you need to create a joke based on that context",
            },
            { role: "user", content: input.prompt },
          ],
        });

        return {
          result: completion.data.choices,
        };
      } catch (err) {
        // check if is axios error
        if (axios.isAxiosError(err)) {
          console.log(err.message);
          console.log(err.response?.data);
        }
        return {
          error: 500,
        };
      }
    }),

  handlePrompt: publicProcedure
    .input(
      z.object({
        prompt: z.string().min(1).max(255),
      }),
    )
    .mutation(async ({ input }) => {
      try {
        const actionsString = JSON.stringify(actionsToChatGPT);

        const rawMessages = [
          "As 'LillIA', I receive a prompt and select the correct action from a JSON containing many actions. I only return the JSON.",
          "The actions and schemaInput in JSON format are:",
          actionsString,
          "-------",
          `Given the user prompt: "${input.prompt}", return only the JSON output according to the schema:`,
          `{ "action": /* e.g. post.createPost */, "input": /* schemaInput for the action */ }`,
          "If the user doesn't provide all input values, generate appropriate values based on context and action.",
          "For example, if the action is post.createPost and only the title is provided, create suitable content based on the title and context. You can be really creative here!",
          "Return just the JSON output, without extra context or explanation.",
        ].join("\n ");
        const messages: ChatCompletionRequestMessage[] = [
          { role: "system", content: rawMessages },
        ];
        const completion = await openai.createChatCompletion({
          model: "gpt-3.5-turbo",
          messages,
        });

        console.log("===============");
        console.log(completion.data.usage);
        console.log("===============");

        let jsonResult: any = null;

        const response = convertInputIntoAction(
          completion.data.choices[0]?.message?.content ?? "{}",
        );
        console.log(
          `${input.prompt}:${completion.data.choices[0]?.message?.content}\n\n`,
        );

        if (response) {
          const { handle, input } = response;
          console.log(response);
          const result = await handle(input);
          jsonResult = result;
        }
        return {
          result: completion.data.choices.map((c) => c.message?.content),
          messages: messages.map((m) => m.content),
          jsonResult,
        };
      } catch (err) {
        // check if is axios error
        if (axios.isAxiosError(err)) {
          console.log(err.message);
          console.log(err.response?.data);
        } else {
          console.log(err);
        }
        return {
          error: 500,
        };
      }
    }),
});
