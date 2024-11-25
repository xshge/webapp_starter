import { Application, Router } from "https://deno.land/x/oak@v12.6.1/mod.ts";

// ?
import { createExitSignal, staticServer } from "./shared/server.ts";

// ?
import { gpt } from "./shared/openai.ts";

const app = new Application();
const router = new Router();
const askedQuestions = {};
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

let run = true;

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
  const keys = Object.keys(askedQuestions);
  const ques = keys.indexOf(lastquestion);
  if (
    ques % 5 == 0 &&
    ques != 0
  ) {
    const intepretation = await gpt({
      messages: [{
        role: "system",
        content:
          "You are interpreting the meaning of an answer to a question. Always respond with a JSON object in this exact format: { interpret: true } or { interpret: false }. Only return true if the answer is clearly affirmative, and false otherwise.",
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
    if ("interpret" in rep) {
      console.log(JSON.stringify(rep));
      console.log("interpreted a guess" + rep["interpret"]);
      console.log(askedQuestions.length);
      return rep["interpret"];
    } else {
      run = false;
      return false;
    }
  } else {
    return false;
  }
}

async function askGpt() {
  const q = await gpt({
    messages: [
      {
        role: "system",
        content:
          `You are playing a game with the user, and you are trying to fiure out what character that the use is thinking.
          The question should not be about making a guess, but about getting the information that will be neede to make the guess.
          Reponse should be concise and brief.
        `,
      },
      {
        role: "user",
        content:
          `Here are all the asked questions and their corresponding answer as key-value pairs in this Javascript Object: ${
            JSON.stringify(askedQuestions)
          }. 
          Ask me another valuable question that will get you closer to the character that you are guessing. `,
      },
    ],
  });
  //console.log(JSON.stringify(askedQuestions));
  return q["content"];
}

router.get("/akinator/api", async (ctx) => {
  const context = ctx.request.url.searchParams.get("question");
  const response = ctx.request.url.searchParams.get("user_answer");
  askedQuestions[context] = response;

  // console.log(askedQuestions);

  let newQues = " ";

  //interpreting that last guess and user confirmation;
  const guess = await interperting(context, response);
  const keyLength = Object.keys(askedQuestions).length;

  if (!guess && keyLength <= 24) {
    let guessed;
    if (keyLength % 5 == 0) {
      const r = await gpt({
        messages: [
          {
            role: "system",
            content:
              `You are playing a game with the user, and you are trying to fiure out what character that the use is thinking.
              The data that you will need to look at a javascript object with key-value pairs.
              Only make the guess if you have enough information to make an actual guess that has an actual character name.If not just return false to attempt.
              Reponse should be concise and brief.
                `,
          },
          {
            role: "user",
            content:
              `Here are questions that have been asked and my answers to those questions are key-value pairs in this Javascript object: ${
                JSON.stringify(askedQuestions)
              }
              Basing off of the combined information from this object, make A guess with the name of the character. `,
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
      } else {
        newQues = await askGpt();
        console.log(newQues);
      }
    } else if (keyLength % 5 != 0) {
      newQues = await askGpt();
    }
  } else if (guess) {
    //askedQuestions.length = 0;
    newQues = "Yay!! Thank you for playing";
    run = false;
  }

  if (keyLength > 25 && guess == false) {
    newQues = "Sorry I can't guess it.";
    //askedQuestions.length = 0;
    pastResponse.length = 0;
    run = false;
  }

  //finish conditions;

  ctx.response.body = {
    "sucess": run,
    "guess": guess,
    "message": [newQues, response],
  };

  if (!run) {
    const keys = Object.keys(askedQuestions);
    for (const key in keys) {
      delete askedQuestions[key];
    }
    run = true;
  }
});

app.use(router.routes());
app.use(router.allowedMethods());

// Try serving undefined routes with static files
app.use(staticServer);

// Everything is set up, let's start the server
console.log("\nListening on http://localhost:8000");
await app.listen({ port: 8000, signal: createExitSignal() });
