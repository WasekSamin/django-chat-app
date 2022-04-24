$(document).ready(() => {
  // Button ripple effect
  const buttonRippleEffect = (event) => {
    const btn = event.currentTarget;

    const circle = document.createElement("span");
    const diameter = Math.max(btn.clientWidth, btn.clientHeight);
    const radius = diameter / 2;

    circle.style.width = circle.style.height = `${diameter}px`;
    circle.style.left = `${event.clientX - (btn.offsetLeft + radius)}px`;
    circle.style.top = `${event.clientY - (btn.offsetTop + radius)}px`;
    circle.classList.add("register-ripple-button");

    const ripple = btn.getElementsByClassName("register-ripple-button")[0];

    if (ripple) {
      ripple.remove();
    }

    btn.appendChild(circle);
  };

  const btn = document.getElementById("register-submit-button");
  btn.addEventListener("click", buttonRippleEffect);

  // Register form submit
  const registerForm = $("#register__form");
  const registerLoader = $(".register__loader");
  const registerButton = $("#register-submit-button");
  const errorMessage = $("#register__errorMessage");

  registerForm.submit((event) => {
    event.preventDefault();

    registerLoader.removeClass("hidden");
    registerButton.prop("disabled", true);
    errorMessage.addClass("hidden");

    const action = registerForm.attr("action");
    const method = registerForm.attr("method");
    const data = registerForm.serialize();

    const makeSocketConnection = (data) => {
      const newSocket = io("http://localhost:9000", {
        query: {
          SID: data.email,
        },
      });

      newSocket.on("connect", () => {
        newSocket.on("on-connect", (socketId) => {
          newSocket.id = socketId;
          localStorage.setItem("PSID", socketId);

          newSocket.emit("add-user", data);
          newSocket.on("register-success", (accountObj) => {
            if (accountObj.id === data.id) {
              window.location.href = "/";
            }
          });
        });
      });
    };

    $.ajax({
      url: action,
      method: method,
      data: data,
      success: (data) => {
        if (data.password_did_not_match) {
          errorMessage.text("Two password fields didn't match!");
        } else if (data.password_too_short) {
          errorMessage.text("Password is too short!");
        } else if (data.user_exist) {
          errorMessage.text("Email is already in use!");
        } else if (data.blank_fields) {
          errorMessage.text("Please fill up all the fields correctly!");
        } else if (data.register_success) {
          const accountObj = JSON.parse(data.account_obj);
          localStorage.setItem("email", accountObj.email);
          makeSocketConnection(accountObj);
        }
        errorMessage.removeClass("hidden");
        registerLoader.addClass("hidden");
        registerButton.prop("disabled", false);
      },
      error: (err) => {
        registerLoader.addClass("hidden");
        registerButton.prop("disabled", false);
        errorMessage.addClass("hidden");
        console.error(err);
      },
    });
  });
});
