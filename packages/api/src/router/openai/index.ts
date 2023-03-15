import { z } from "zod";

import { createTRPCRouter, publicProcedure } from "../../trpc";

import { Configuration, OpenAIApi } from "openai";
import axios from "axios";

const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY || '',
});

const openai = new OpenAIApi(configuration);


export const openAiRouter = createTRPCRouter({
  tellJoke: publicProcedure.input(z.object({
    prompt: z.string().min(1).max(255),
  })).mutation(async ({ input }) => {
    try {
      
      const completion = await openai.createChatCompletion({
        model: "gpt-3.5-turbo",
        messages: [
          {role: "system", content: "You are an assistant that says jokes, and only jokes. The user will give you a context, and you need to create a joke based on that context"},
          {role: "user", content: input.prompt},
        ]
      });

      
      return {
        result: completion.data.choices
      }
    } catch(err) {
      // check if is axios error
      if (axios.isAxiosError(err)) {
        console.log(err.message)
        console.log(err.response?.data)
      }
      return {
        error: 500
      }
    }
  }),
});
