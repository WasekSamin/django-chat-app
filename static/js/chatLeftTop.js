// Search people
const searchForUser = (inputVal) => {
  const chatPeople = document.querySelectorAll(".chat__people");

  for (let i = 0; i < chatPeople.length; i++) {
    let username = chatPeople[i].querySelector(".chat__username");
    let usernameVal = username.innertext || username.textContent;

    if (usernameVal.toLowerCase().indexOf(inputVal.value.toLowerCase()) > -1) {
      chatPeople[i].style.display = "";
    } else {
      chatPeople[i].style.display = "none";
    }
  }
};
