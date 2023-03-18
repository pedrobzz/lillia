# lillIA

## About

LillIA is an AI that I created (the IA in the name stands for "Inteligência Artificial", which means "Artificial Intelligence" in Portuguese. The Lill means nothing :\)). I made it because I was bored. This isn't my best work, and it isn't my best code. I rushed through 90% of it, but it works, and that's what matters!

The only problem is: I don't know if it will work on your computer, but you can give it a try!

This is just a fun project, and I don't expect anyone to use it. But if you do, please tell me how it went!

## How it works

Basically, LillIA is made using GPT-3.5-turbo, a model from OpenAI that powers ChatGPT! So yes, LillIA is essentially ChatGPT with a different name and a different purpose. You can check the prompts that I'm using; they are not great and not optimized, but they work.

I tried to create my own implementation of an "Application controlled by an AI" (I don't know the technical name, but I know there's one!), where I basically pass a list of actions to LillIA, and she will choose one of them based on the prompt. I tried to make it as simple as possible because the longer the prompt, the longer OpenAI's billing will be.

You can use a prompt on the index page to interact with LillIA, but it's much more fun to use your microphone! I'm using OpenAI Whisper to transcribe audio to text, and then I'm using the text to generate a response. It's not perfect, but it's fun! As I don't have infinite money (yet), I chose to use whisper.cpp, which is a C++ implementation of OpenAI's Whisper that you can run on a server. And this is the only reason why LillIA can't be deployed because I don't want to set up a server just for this.

Please, **don't look at the Whisper code**. I had a hard time making the audio work; I needed to create a workaround with ffmpeg, and I'm not proud of it. It works on my machine, but I don't know if it will work on yours.

## How to run

### Requirements

- You need to have NodeJS, PNPM, and ffmpeg installed on your machine;
- Before running the project, you need to run `pnpm install` to install all the dependencies;
- You need to set up environment variables;
- You can run the project using `pnpm dev`.

When you try to use the microphone, you will be asked to give permission to the browser to use your microphone. If you don't give permission, the microphone won't work. Also, after making your first request, it will take longer than usual because the server is downloading Whisper's model in the background.

If you think LillIA takes too much time to understand you, you can change the model from `small` to `tiny` in the `handlePrompt` mutation. The `small` model is the default one, but the `tiny` model is much faster, although it's not as accurate as the `small` model. You can try other models too, like `base`, `medium`, or `large`, but I don't recommend them because they are way slower and use more memory (A LOT of memory). I found the `small` model to be the best one for this project.

## Contributing

You can contribute to this project as much as you want, and I'll be super happy to accept your PRs! There are no strict rules, just be nice and don't be a jerk, write good code, and refactor the bad code that I wrote :)

This is a great opportunity to add some commits to your GitHub profile and show that you are active in the _"Open Source community"_. So go ahead and make a PR!

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details (don't ask me too much, I'm not a lawyer, I don't know what I'm doing).

I also use [Whisper.cpp](https://github.com/ggerganov/whisper.cpp/blob/master/LICENSE), and it has its own license, so please, check it out. I don't even know if I'm allowed to use it, but I'm using it anyway, so please, don't sue me, I'm poor.

## Acknowledgments

- [OpenAI](https://openai.com/) for creating GPT-3 and GPT-3.5-turbo;
- [Whisper.cpp](https://github.com/ggerganov/whisper.cpp) for creating a C++ implementation of OpenAI's whisper;
- My future girlfriend for being patient with me and my projects, I love you so much <3;
- ChatGPT for helping me figure out how to record audio, because I had no idea how to do it :);
- Everyone who read this far, you are awesome, thank you for reading this, I love you too <3
