// This version uses a static file server for unknown routes.

// Try this with
// http://localhost:8000/
// http://localhost:8000/api/test?myParam=abc

// Import the the Application and Router classes from the Oak module
import { Application, Router } from "https://deno.land/x/oak@v12.6.1/mod.ts";

// Import the createExitSignal function from the JS+OAI shared library
import { createExitSignal, staticServer } from "./shared/server.ts";
import { getEnvVariable } from "./shared/util.ts";

// Create an instance of the Application and Router classes
const app = new Application();
const router = new Router();

async function fetchPerson(p) {
  const key = getEnvVariable("TMDB_KEY");
  const search_Burl = "https://api.themoviedb.org/3/search/person?";
  const searchParam =
    `api_key=${key}&query=${p}&include_adult=false&language=en-US&page=1`;
  try {
    const response = await fetch(search_Burl + searchParam);
    if (!response.ok) {
      throw new Error("Network connection issue");
    }
    const person = await response.json();
    if (person["total_results"] == 0) {
      return { "sucess": false, "message": "No Match in the DataBase" };
    } else {
      return { "sucess": true, person };
    }
  } catch (error) {
    console.error("Fetch error", error);
  }
}

async function chooseMovie(c) {
  const key = getEnvVariable("TMDB_KEY");
  const discover_Burl = "http://api.themoviedb.org/3/discover/movie?";
  const discover_Param = `api_key=${key}&with_cast=${c}`;

  try {
    const response = await fetch(discover_Burl + discover_Param);
    if (!response.ok) {
      throw new Error("Network Connection Issue");
    } else {
      const data = await response.json();
      return data.results;
    }
  } catch (error) {
    console.error("Fetch error", error);
  }
}
// Configure a cutom route
// This function will run when "/api/test" is requested
router.post("/api/test", async (ctx) => {
  // output some info about the request
  const body = await ctx.request.body({ type: "json" });
  const data = await body.value;

  console.log(data.name);
  //input data.name for search
  const celeb = await fetchPerson(data.name);
  if (celeb.sucess) {
    const data = celeb.person;
    const cast = data["results"][0]["id"];

    console.log(cast);
    const movies = await chooseMovie(cast);
    let rollNumb = Math.floor(Math.random() * (movies.length - 1 + 0)) + 1;

    while (rollNumb > movies.length) {
      rollNumb = Math.floor(Math.random() * (movies.length - 1 + 0)) + 1;
    }
    // send a response back to the browser
    ctx.response.body = movies[rollNumb];
  } else {
    ctx.response.body = celeb.message;
  }

  //console.log("myParam:", ctx.request.url.searchParams.get(ctx.request.body));
  console.log("ctx.request.method:", ctx.request.method);
});

// Tell the app to use the router
app.use(router.routes());
app.use(router.allowedMethods());

// Try serving undefined routes with static files
app.use(staticServer);

// Everything is set up, let's start the server
console.log("\nListening on http://localhost:8000");
await app.listen({ port: 8000, signal: createExitSignal() });
