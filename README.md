# lillIA

## About

LillIA is an AI that I made (the IA in the name stands for "Inteligência Artificial", which means "Artificial Intelligence" in Portuguese. The Lill means nothing :\)) because I was bored. This isn't my best work, this isn't my best code, I rushed 90% of it, but it works, and that's what matters!

The only problem is: I don't know if it will work on your computer, but you can give it a try!

This is literally a fun project, I don't expect anyone to use it, but if you do, please, tell me how it went!

## How it works

Basically, LillIA is made using GPT-3.5-turbo, a model from OpenAI that powers the ChatGPT! So yes, LillIA is just ChatGPT with a different name and a different meaning of existence. Basically, you can check the prompt's that I'm using and they are really bad and not optimized, but they work.

I tried to do my own implementation of an "Application controlled by an AI" (I don't know the technical name, but I know there's a name!), where I basically pass a list of actions to LillIA and she will choose one of them based on the prompt. I tried to make it as simple as possible, because the longer the prompt, the longer OpenAI's billing will be.

You can use a prompt on the index page to talk with LillIA, but it's way funnier to use your microphone! I'm using OpenAI whisper to transcribe audio to text, and then I'm using the text to generate a response. It's not perfect, but it's fun! As I don't have infinite money (yet) I choose to use whisper.cpp, which is a C++ implementation of OpenAI's whisper that you can run on a server. And this is the only reason why LillIA can't be deployed, because I don't want to setup a server just for this.

Please, **don't look at whisper's the code**, I had a bad time making the audio work, I needed to make a workaround with ffmpeg and I'm not proud of it. It works on my machine, but I don't know if it will work on yours.

## How to run

### Requirements

- You need to have NodeJS, PNPM and ffmpeg installed on your machine.
- Before running the project, you need to run `pnpm install` to install all the dependencies.
- You need to setup environment variables
- You can run the project using `pnpm dev`.

When you try to use the microphone, you will be asked to give permission to the browser to use your microphone. If you don't give permission, the microphone won't work. Also, after making your first request, it will take way longer than usual, because in the background, the server is downloading Whisper's model.

If you think LillIA takes too much time to understand you, you can change the model from `small` to `tiny` at the `handlePrompt` mutation. The `small` model is the default one, but the `tiny` model is way faster, but it's not as accurate as the `small` model. You can try other models too, like `base`, `medium` or `large`, but I don't recommend it, because they are way slower and use too much memory. I found the `small` model to be the best one for this project.

## Contributing

You can contribute on this project as much as you want, I'll be super happy to accept your PRs! There's no rules, just be nice and don't be a jerk, write good code, and refactor the bad code that I wrote :)

This is a great opportunity to farm some commits on your GitHub profile and say that you are active in the "Open Source community", so go ahead and make a PR!

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details (don't ask me too much, I'm not a lawyer, I don't know what I'm doing).

I also use [Whisper.cpp](https://github.com/ggerganov/whisper.cpp/blob/master/LICENSE), and it has it's own license, so please, check it out. I don't even know if I'm allowed to use it, but I'm using it anyway, so please, don't sue me, I'm poor.

## Acknowledgments

- [OpenAI](https://openai.com/) for making GPT-3 and GPT-3.5-turbo;
- [Whisper.cpp](https://github.com/ggerganov/whisper.cpp) for making a C++ implementation of OpenAI's whisper;
- My future girlfriend for being patient with me and my projects, I love you so much <3;
- ChatGPT for helping me figure out how to record audio, because I had no idea how to do it :);
- Everyone who read this far, you are awesome, thank you for reading this, I love you too <3
