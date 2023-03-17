import fs from "fs";
import { $, execa } from "execa";

type Model = "tiny" | "base" | "small" | "medium" | "large";

const WHISPER_FOLDER = "../../packages/whisper";
const AUDIO_FOLDER = `${WHISPER_FOLDER}/audios`;
const BIN_FOLDER = `${WHISPER_FOLDER}/bin`;
const MODELS_FOLDER = `${WHISPER_FOLDER}/bin/models`;

export const saveBufferToWav = async (buffer: Buffer, filename: string) => {
  fs.writeFileSync(`${AUDIO_FOLDER}/${filename}`, buffer);
  await execa(
    `ffmpeg -y -i ./${filename} -acodec pcm_s16le -ar 16000 ./${filename}.wav `,
    [],
    {
      cwd: AUDIO_FOLDER,
    },
  );

  fs.unlinkSync(`${AUDIO_FOLDER}/${filename}`);
  return;
};

const downloadModel = async (model: Model) => {
  const modelName = `ggml-${model}.bin`;
  const modelPath = `${MODELS_FOLDER}/${modelName}`;
  if (!fs.existsSync(modelPath)) {
    const downloadCommand = `./download-ggml-model.cmd ${model
      .replaceAll('"', "")
      .trim()}`;
    const response = await execa(downloadCommand, [], {
      cwd: MODELS_FOLDER,
      stdio: "inherit",
    });
    if (response.stderr) {
      throw new Error(response.stderr);
    }
  }
};

const transcript = async (model: Model, filename: string) => {
  const filePath = `${AUDIO_FOLDER}/${filename}`;
  if (fs.existsSync(filePath)) {
    const response = await execa(
      `./main.exe -m ./models/ggml-${model}.bin -otxt -f ../audios/${filename} `,
      [],
      { cwd: BIN_FOLDER },
    );

    const txtOutput = `${AUDIO_FOLDER}/${filename}.txt`;
    const txt = fs.readFileSync(txtOutput, "utf8")?.trim();
    if (!txt) {
      console.log(response.stdout);
      throw new Error("No text found");
    }

    fs.unlinkSync(txtOutput);
    fs.unlinkSync(`${AUDIO_FOLDER}/${filename}`);
    return txt;
  }
  throw new Error("No file to Transcript");
};

type WhisperSettings = {
  model?: Model;
};

export const createWhisper = async (settings?: WhisperSettings) => {
  const { model = "tiny" } = settings || {};
  await downloadModel(model);

  return {
    saveBufferToWav,
    transcriptFromB64: async (b64: string) => {
      const buffer = Buffer.from(b64, "base64");
      await saveBufferToWav(buffer, "prompt");
      return await transcript(model, "prompt.wav");
    },
  };
};
