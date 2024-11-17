import { Application, Router } from "https://deno.land/x/oak@v12.6.1/mod.ts";

// ?
import { createExitSignal, staticServer } from "./shared/server.ts";

// ?
import { gpt } from "./shared/openai.ts";

const app = new Application();
const router = new Router();
const askedQuestions = [];
let pastResponse = [];
const interpret_schema = {
  name: "interpretation",
  schema: {
    type: "object",
    properties: {
      interpret: {
        type: "boolean",
      },
    },
  },
};

const guessing_schema = {
  name: "guess",
  schema: {
    type: "object",
    properties: {
      attempt: {
        type: "boolean",
      },
      guess: {
        type: "string",
      },
    },
  },
};
//interpreting the natural response from the user;
async function interperting(lastquestion, answer) {
  if (
    askedQuestions.indexOf(lastquestion) % 5 == 0 &&
    askedQuestions.indexOf(lastquestion) != 0
  ) {
    const intepretation = await gpt({
      messages: [{
        role: "system",
        content:
          "You are interpreting the meaning of an answer to a question. Only return true when the answer is affirmative.",
      }, {
        role: "user",
        content:
          `Did this response: ${answer} confirm or deny this guess: ${lastquestion}?  `,
      }],
      response_format: {
        type: "json_schema",
        "json_schema": interpret_schema,
      },
      temperature: 0.1,
    });

    const rep = JSON.parse(intepretation.content);
    console.log("interpreted a guess" + rep["interpret"]);
    return rep["interpret"];
  } else {
    return false;
  }
}
router.get("/akinator/api", async (ctx) => {
  const context = ctx.request.url.searchParams.get("question");
  askedQuestions.push(context);

  const response = ctx.request.url.searchParams.get("user_answer");
  pastResponse.push(response);

  // console.log(askedQuestions);

  let newQues = " ";
  let run = true;
  //interpreting that last guess and user confirmation;
  const guess = await interperting(context, response);

  if (!guess) {
    let guessed;
    if (askedQuestions.length % 5 == 0) {
      const r = await gpt({
        messages: [
          {
            role: "system",
            content:
              `You are playing a game with the user, and you are trying to fiure out what character that the use is thinking.
              Only make the guess if you have enough information to make an actual guess that has an actual character name.If not just return false to attempt.
              Reponse should be concise and brief.
                `,
          },
          {
            role: "user",
            content:
              `Here are questions that have been asked: ${askedQuestions}, and here is my answer to those questions: ${pastResponse}. 
                  Make A guess with the name of the character. `,
          },
        ],
        response_format: {
          type: "json_schema",
          "json_schema": guessing_schema,
        },
        temperature: 0.1,
      });

      guessed = JSON.parse(r.content);
      console.log(guessed);
      if (guessed.attempt == true) {
        newQues = guessed.guess;
      }
    } else if (askedQuestions.length % 5 != 0 || guessed.attempt == false) {
      const q = await gpt({
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

      newQues = q["content"];
    }
  } else if (!guess && askedQuestions.length > 20) {
    newQues = "Sorry I can't guess it.";
    run = false;
  }

  //fail conditions;

  ctx.response.body = {
    "sucess": run,
    "guess": guess,
    "message": [newQues, response],
  };
});

app.use(router.routes());
app.use(router.allowedMethods());

// Try serving undefined routes with static files
app.use(staticServer);

// Everything is set up, let's start the server
console.log("\nListening on http://localhost:8000");
await app.listen({ port: 8000, signal: createExitSignal() });
