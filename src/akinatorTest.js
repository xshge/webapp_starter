import { Application, Router } from "https://deno.land/x/oak@v12.6.1/mod.ts";

// ?
import { createExitSignal, staticServer } from "./shared/server.ts";

// ?
import { gpt } from "./shared/openai.ts";

const app = new Application();
const router = new Router();
const askedQuestions = [];
let pastResponse = [];

router.get("/akinator/api", async (ctx) => {
  const context = ctx.request.url.searchParams.get("question");
  askedQuestions.push(context);
  let guess;
  const response = ctx.request.url.searchParams.get("user_answer");
  pastResponse.push(response);

  console.log(askedQuestions);

  let newQues = " ";

  gptCheck: if (askedQuestions.length % 5 == 0) {
    if (response.includes("got")) {
      guess = true;
      break gptCheck;
    } else {
      guess = false;
    }

    newQues = await gpt({
      messages: [
        {
          role: "system",
          content:
            `You are playing a game with the user, and you are trying to fiure out what character that the use is thinking. 
                Reponse should be concise and brief.
               `,
        },
        {
          role: "user",
          content:
            `Here are questions that have been asked: ${askedQuestions}, and here is my answer to those questions: ${pastResponse}. 
                 Make A guess. `,
        },
      ],
    });
  } else {
    newQues = await gpt({
      messages: [
        {
          role: "system",
          content:
            `You are playing a game with the user, and you are trying to fiure out what character that the use is thinking. 
            Reponse should be concise and brief.
           `,
        },
        {
          role: "user",
          content:
            `Here are questions that have been asked: ${askedQuestions}, and here is my answer to those questions: ${pastResponse}. 
             Ask me another question. `,
        },
      ],
    });
    guess = false;
  }

  console.log(newQues);

  //   if (response.includes("got")) {
  //     guess = true;
  //   } else {
  //     guess = false;
  //   }

  ctx.response.body = {
    "sucess": true,
    "guess": guess,
    "message": [newQues["content"], response],
  };
});

app.use(router.routes());
app.use(router.allowedMethods());

// Try serving undefined routes with static files
app.use(staticServer);

// Everything is set up, let's start the server
console.log("\nListening on http://localhost:8000");
await app.listen({ port: 8000, signal: createExitSignal() });
