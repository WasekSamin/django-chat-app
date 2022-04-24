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
    circle.classList.add("login-ripple-button");

    const ripple = btn.getElementsByClassName("login-ripple-button")[0];

    if (ripple) {
      ripple.remove();
    }

    btn.appendChild(circle);
  };

  const btn = document.getElementById("login-submit-button");
  btn.addEventListener("click", buttonRippleEffect);

  // Login submit form
  const loginForm = $("#login__form");
  const loginButton = $("#login-submit-button");
  const loginLoader = $(".login__loader");
  const errorMessage = $("#login__errorMessage");

  // Making socket connection
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

        newSocket.emit("user-login", data);
        // Navigate to home page on login success
        newSocket.on("login-success", (accountObj) => {
          if (accountObj.id === data.id) {
            window.location.href = "/";
          }
        });
      });
    });

    return () => newSocket.close();
  };

  loginForm.submit((event) => {
    event.preventDefault();

    loginLoader.removeClass("hidden");
    loginButton.prop("disabled", true);
    errorMessage.addClass("hidden");

    const action = loginForm.attr("action");
    const method = loginForm.attr("method");
    const data = loginForm.serialize();

    $.ajax({
      url: action,
      method: method,
      data: data,
      success: (data) => {
        if (data.blank_fields) {
          errorMessage.text("Please fill up all the fields correctly!");
        } else if (data.invalid_credential) {
          errorMessage.text("Invalid user credential!");
        } else if (data.user_login_success) {
          const accountObj = JSON.parse(data.account_obj);
          localStorage.setItem("email", accountObj.email);
          makeSocketConnection(accountObj);
        }

        errorMessage.removeClass("hidden");
        loginLoader.addClass("hidden");
        loginButton.prop("disabled", false);
      },
      error: (err) => {
        loginLoader.addClass("hidden");
        loginButton.prop("disabled", false);
        errorMessage.addClass("hidden");
        console.error(err);
      },
    });
  });
});
