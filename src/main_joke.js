// ?
import { Application, Router } from "https://deno.land/x/oak@v12.6.1/mod.ts";

// ?
import { createExitSignal, staticServer } from "./shared/server.ts";

// ?
import { promptGPT } from "./shared/openai.ts";

// ?
const app = new Application();
const router = new Router();

// ?
router.get("/api/joke", async (ctx) => {
  // ?
  const topic = ctx.request.url.searchParams.get("topic");
  const _location = ctx.request.url.searchParams.get("location");
  // ?
  console.log("someone made a request to /api/joke", topic, _location);

  // ?
  const joke = await promptGPT(
    `Tell me a brief limerick about ${topic} at ${_location}`,
  );

  // ?
  ctx.response.body = joke;
});

// ?
app.use(router.routes());
app.use(router.allowedMethods());

// ?
app.use(staticServer);

// ?
console.log("\nListening on http://localhost:8000");
await app.listen({ port: 8000, signal: createExitSignal() });
