const checkSession = async () => {
  const response = await fetch("/check");
  const { success, id } = await response.json();
  $("#loginForm").removeClass("codeRequested");
  $("#2FABox").removeClass("ready");
  if (success) {
    $("body").addClass("logged");
    $("#userId").text(id);
  } else {
    $("body").removeClass("logged");
    $("#userId").text("");
  }
};

jQuery(document).ready(($) => {
  checkSession();

  $("#logoutButton").click(async (e) => {
    await fetch(`/logout`);
    await checkSession();
  });

  $("#loginForm").submit(async (e) => {
    e.preventDefault();
    const id = e.target.id.value; //form
    const password = e.target.password.value;
    const code = e.target.code.value;
    let url = `/login?id=${id}&password=${password}`;
    if (code) url += `&code=${code}`;
    const response = await fetch(url);
    const { success, error, codeRequested } = await response.json();

    if (codeRequested) return $("#loginForm").addClass("codeRequested");

    if (success) {
      $("#loginForm").trigger("reset");
      await checkSession();
    } else {
      alert(error);
    }
  });

  $("#enable2FAButton").click(async (e) => {
    const response = await fetch("/qrImage");
    const { image, success } = await response.json();
    if (success) {
      $("#qrImage").attr("src", image);
      $("#2FABox").addClass("ready");
    } else {
      alert("unable to fetch the qr image");
    }
  });

  $("#twoFAUpdateForm").submit(async (e) => {
    e.preventDefault();
    const code = e.target.code.value;
    const response = await fetch("/set2FA?code=" + code);
    const { success } = await response.json();
    if (success) {
      alert("SUCCESS: 2FA enabled/updated");
    } else {
      alert("enable 2FA");
    }
    $("twoFAUpdateForm").trigger("reset");
  });
});

$("#registerForm").submit(async (e) => {
  e.preventDefault(); 
  const id = e.target.id.value;
  const password = e.target.password.value;

  console.log("Form ID:", id);
  console.log("Form Password:", password); 

  const response = await fetch("/register", {
    method: "POST", 
    headers: {
      "Content-Type": "application/json", 
    },
    body: JSON.stringify({ id, password }),
  });

  const { success, error } = await response.json(); 

  if (success) {
    alert("Registration successful!"); 
    window.location.href = "/index.html"; 
  } else {
    alert(error); 
  }
});

document.getElementById('registerForm').addEventListener('submit', function (event) {
  event.preventDefault();
  window.location.href = 'index.html';
});
document.getElementById('loginFrom').addEventListener('submit', function (event) {
  event.preventDefault();
  window.location.href = 'register.html';
});

