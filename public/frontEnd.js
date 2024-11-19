const confirm = document.getElementById("confirm");

confirm.addEventListener("click", async function () {
  const answer = document.getElementById("answer").value;
  const conversation = document.getElementById("convo");
  const question = document.getElementById("question").innerText;
  const response = await fetch(
    `/akinator/api?user_answer=${answer}&question=${question}`,
  );
  const result = await response.json();
  if (result.sucess) {
    console.log(JSON.stringify(result["message"]));
    const quesField = document.getElementById("question");
    //change the exiting questions to different
    quesField.id = " ";
    quesField.className = "prevQues";
    const conversation = document.getElementById("convo");

    if (result.guess) {
      conversation.innerHTML = conversation.innerHTML +
        `<h2>Thank you for playing</h2>`;
    } else {
      conversation.innerHTML = conversation.innerHTML +
        `<p class= ans>${result["message"][1]}</P>
      <p id="question">${result["message"][0]}</p>
      `;
      const nextQ = document.getElementById("question");
      nextQ.scrollIntoView();
    }
  } else {
    const _conversation = document.getElementById("convo");
    _conversation.innerHTML = `<h1>${result["message"][0]}</h1>`;
  }
});
