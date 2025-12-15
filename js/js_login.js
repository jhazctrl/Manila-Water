document.addEventListener("DOMContentLoaded", () => {
  const emailInput = document.getElementById("email");
  const passwordInput = document.getElementById("password");
  const toggleIcon = document.querySelector(".toggle-password");
  const errorMessage = document.getElementById("error-message");

  
  toggleIcon.className = "fa-solid fa-eye toggle-password";
  toggleIcon.style.display = "none";

  function setupToggleIcon(input, icon) {
    input.addEventListener("input", () => {
      if (input.value.length > 0) {
        icon.style.display = "inline";
      } else {
        icon.style.display = "none";
        input.type = "password";
        
        icon.classList.remove("fa-eye-slash");
        icon.classList.add("fa-solid", "fa-eye", "toggle-password");
      }
    });
  }

  setupToggleIcon(passwordInput, toggleIcon);

  window.togglePassword = function (fieldId, icon) {
    const input = document.getElementById(fieldId);
    
    
    if (input.type === "password") {
      
      input.type = "text";
      
      icon.classList.remove("fa-eye");
      icon.classList.add("fa-eye-slash");
    } else {
      
      input.type = "password";
      
      icon.classList.remove("fa-eye-slash");
      icon.classList.add("fa-eye");
    }
  };

  [emailInput, passwordInput].forEach((input) => {
    input.addEventListener("input", () => {
      input.classList.remove("invalid");
      errorMessage.textContent = "";
    });
  });

  const params = new URLSearchParams(window.location.search);
  if (params.get("error") === "invalid") {
    errorMessage.textContent = "Invalid email or password.";
    emailInput.classList.add("invalid");
    passwordInput.classList.add("invalid");
  }
});