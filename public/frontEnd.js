const confirm = document.getElementById("confirm");

confirm.addEventListener("click", async function () {
  const answer = document.getElementById("answer").value;
  const conversation = document.getElementById("convo");
  //maybe check answer here;
  if (answer.includes("got")) {
    conversation.innerHTML = conversation.innerHTML +
      `<h2>Thank you for playing</h2>`;
    return;
  }
  const question = document.getElementById("question").innerText;
  const response = await fetch(
    `/akinator/api?user_answer=${answer}&question=${question}`,
  );
  const result = await response.json();
  if (result.sucess) {
    console.log(JSON.stringify(result["message"]));
    const quesField = document.getElementById("question");
    quesField.innerText = result["message"][0];
    const conversation = document.getElementById("convo");
    conversation.innerHTML = conversation.innerHTML +
      `<p>${result["message"][1]}</P>`;

    // if (result.guess) {
    //   conversation.innerHTML = conversation.innerHTML +
    //     `<h2>Thank you for playing</h2>`;
    // }
  }
});
