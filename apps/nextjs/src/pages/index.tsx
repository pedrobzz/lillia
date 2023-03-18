/* eslint-disable @typescript-eslint/no-misused-promises */
import { useEffect, useMemo, useState } from "react";
import type { NextPage } from "next";
import Head from "next/head";

import { api, type RouterOutputs } from "~/utils/api";

const objectEntries = <T extends Record<string, unknown>>(obj: T) =>
  Object.entries(obj) as [keyof T, T[keyof T]][];

const Recorder: React.FC = () => {
  const [recorder, setRecorder] = useState<MediaRecorder | null>(null);
  const [isRecording, setIsRecording] = useState(false);

  const utils = api.useContext();
  const { mutate: handleAudioPrompt, isLoading } =
    api.openAi.handleAudioPrompt.useMutation({
      onSettled: () => utils.todo.all.invalidate(),
    });

  useEffect(() => {
    // Request access to user's microphone when the component mounts
    navigator.mediaDevices
      .getUserMedia({ audio: true })
      .then((stream) => {
        const recorder = new MediaRecorder(stream);
        setRecorder(recorder);

        recorder.addEventListener("dataavailable", handleDataAvailable);
      })
      .catch((err) => console.error(err));

    return () => {
      // Remove event listener and stop recording when the component unmounts
      if (recorder) {
        recorder.removeEventListener("dataavailable", handleDataAvailable);
        if (isRecording) recorder.stop();
      }
      if (isRecording) {
        setIsRecording(false);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleStartRecording = () => {
    if (!recorder) return;
    recorder.start();
    setIsRecording(true);
  };

  const handleStopRecording = () => {
    if (!recorder) return;
    recorder.stop();
    setIsRecording(false);
  };

  const handleDataAvailable = async (e: BlobEvent) => {
    const binaryData = await e.data.arrayBuffer();
    const base64Data = Buffer.from(binaryData).toString("base64");
    handleAudioPrompt({ prompt: base64Data });
  };

  return (
    <div className="flex items-center justify-center gap-2 ">
      {!isRecording ? (
        <button
          onClick={handleStartRecording}
          disabled={isLoading}
          className="flex items-center gap-2 rounded bg-blue-500 py-2 px-4 font-bold text-white hover:bg-blue-700 disabled:opacity-50"
        >
          Record
          {isLoading && (
            <div className="h-4 w-4 animate-spin rounded-full border-b-2 border-white"></div>
          )}
        </button>
      ) : (
        <button
          onClick={handleStopRecording}
          disabled={!isRecording}
          className="rounded bg-red-500 py-2 px-4 font-bold text-white hover:bg-red-700 disabled:opacity-50"
        >
          Stop
        </button>
      )}
    </div>
  );
};

const TodoCard: React.FC<{
  todo: RouterOutputs["todo"]["all"][number];
  onTodoDelete?: () => void;
}> = ({ todo, onTodoDelete }) => {
  return (
    <div className="flex flex-row gap-4 rounded-lg bg-white/10 py-4 px-6 transition-all hover:scale-[101%]">
      <div className="flex-grow">
        <h2 className="text-3xl font-bold text-white">{todo.title}</h2>
        <p className="mt-2 text-lg text-neutral-200">{todo.content}</p>
      </div>
      <div>
        <button
          className="cursor-pointer text-sm font-bold uppercase text-neutral-400 transition-all hover:text-neutral-200"
          onClick={onTodoDelete}
        >
          X
        </button>
      </div>
    </div>
  );
};

const TodoList = ({ todos }: { todos: RouterOutputs["todo"]["all"] }) => {
  const todosByStatus = useMemo(
    () =>
      todos.reduce(
        (acc, todo) => {
          if (todo.status === "todo") {
            acc["To-Do"].push(todo);
          } else if (todo.status === "doing") {
            acc.Doing.push(todo);
          } else if (todo.status === "done") {
            acc.Done.push(todo);
          }
          return acc;
        },
        { "To-Do": [], Doing: [], Done: [] } as {
          "To-Do": RouterOutputs["todo"]["all"];
          Doing: RouterOutputs["todo"]["all"];
          Done: RouterOutputs["todo"]["all"];
        },
      ),
    [todos],
  );
  const utils = api.useContext();
  const deleteTodoMutation = api.todo.delete.useMutation({
    onSettled: () => utils.todo.all.invalidate(),
  });

  return (
    <div className="w-full px-10">
      <div className="grid grid-cols-3 gap-8">
        {objectEntries(todosByStatus).map(([key, value]) => {
          return (
            <div key={key} className="flex flex-col items-center ">
              <h2 className="text-5xl font-bold text-white">{key}</h2>
              <div className="mt-4 ">
                {value.map((todo) => (
                  <TodoCard
                    key={todo.id}
                    todo={todo}
                    onTodoDelete={() => deleteTodoMutation.mutate(todo.id)}
                  />
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

const Home: NextPage = () => {
  const [prompt, setPrompt] = useState("");
  const postQuery = api.todo.all.useQuery();

  const { mutateAsync: handlePrompt, isLoading: openAiLoading } =
    api.openAi.handlePrompt.useMutation();

  return (
    <>
      <Head>
        <title>Create T3 App</title>
        <meta name="description" content="Generated by create-t3-app" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <main className="flex h-screen w-screen flex-col items-center overflow-y-hidden bg-gradient-to-b from-[#2e026d] to-[#15162c] text-white">
        <h1 className="text-5xl font-extrabold tracking-tight sm:text-[5rem]">
          Lill<span className="text-pink-400">IA</span>
        </h1>
        <div className=" flex w-full flex-col items-center gap-4 overflow-y-auto py-8">
          <div className="my-4 flex gap-2">
            <input
              type="text"
              name="prompt"
              id=""
              onChange={(e) => setPrompt(e.target.value)}
              value={prompt}
              className="rounded p-1 text-black"
            />
            <button
              className="flex items-center gap-2 rounded bg-pink-400 p-2 font-bold disabled:opacity-50"
              disabled={openAiLoading}
              onClick={async () => {
                if (!prompt) return;
                const response = await handlePrompt({ prompt });
                console.log({ response, prompt });
                setPrompt("");
                await postQuery.refetch();
              }}
            >
              Send Prompt
              {openAiLoading && (
                <div className="h-4 w-4 animate-spin rounded-full border-b-2 border-white"></div>
              )}
            </button>
          </div>
          <div>
            <Recorder />
          </div>
          {postQuery.data ? (
            <TodoList todos={postQuery.data} />
          ) : (
            <p>Loading...</p>
          )}
        </div>
      </main>
    </>
  );
};

export default Home;
