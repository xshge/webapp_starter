import { Application } from "https://deno.land/x/oak@v12.6.1/mod.ts";
import { createExitSignal } from "./shared/server.ts";

const app = new Application();

let counter = 0;
// Deafult route
app.use((ctx) => {
  console.log("someone made a request");
  //ctx.response.body = "Hello!";
  counter++;
  ctx.response.body = counter;
});

console.log("\nListening on http://localhost:8000");

await app.listen({ port: 8000, signal: createExitSignal() });

// Try this with
// http://localhost:8000/
