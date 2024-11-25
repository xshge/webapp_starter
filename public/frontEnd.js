const confirm = document.getElementById("confirm");
const newInstruct = "img/Provide_an_Answer.svg";

confirm.addEventListener("click", async function () {
  const answer = document.getElementById("answer").value;
  const conversation = document.getElementById("convo");
  const question = document.getElementById("question").innerText;
  let loader = document.getElementById("load");

  //check if need to change instructions;
  if (
    conversation.querySelector(".prevQues") != null &&
    document.getElementById("title").src != newInstruct
  ) {
    document.getElementById("title").src = newInstruct;
  }

  createQues("ans", answer);
  loader.classList.add("display");
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
      loader = document.getElementById("load");
      loader.classList.remove("display");
      conversation.innerHTML = conversation.innerHTML +
        `<h2>Thank you for playing</h2>`;
    } else {
      createQues("question", result["message"][0]);
      const nextQ = document.getElementById("question");

      nextQ.scrollIntoView();
    }
  } else {
    const _conversation = document.getElementById("convo");
    _conversation.innerHTML = `<h1>${result["message"][0]}</h1>`;
  }
  loader.classList.remove("display");
  document.getElementById("answer").value = " ";
});

function createQues(classN, input) {
  //grabbing ConvoDiv and the Loadingelement
  const parentNode = document.getElementById("load").parentNode;
  let loading = document.getElementById("load");

  //create the p Element
  let ans = document.createElement("p");
  ans.innerText = input;
  if (classN == "question") {
    ans.id = classN;
  } else {
    ans.className = classN;
  }

  parentNode.insertBefore(ans, loading);
}
