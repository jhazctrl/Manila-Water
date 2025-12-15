document.addEventListener('DOMContentLoaded', function () {

  const passwordInput = document.getElementById('password');
  const confirmPasswordInput = document.getElementById('confirmPassword');
  const toggleIcons = document.querySelectorAll('.toggle-password');
  const tooltip = document.getElementById("passwordTooltip");
  const strengthBar = document.getElementById("strengthLevel");
  const requirementIcons = tooltip.querySelectorAll("i");

  const validatePassword = (val) => [
    val.length >= 8,
    /[A-Z]/.test(val),
    /\d/.test(val),
    /[\W_]/.test(val)
  ];

  const updateStrength = (score) => {
    const percent = (score / 4) * 100;
    const colors = ["#f44336", "#ff9800", "#4CAF50"];
    strengthBar.style.width = percent + "%";
    strengthBar.style.backgroundColor = colors[Math.max(0, score - 1)];
  };

  passwordInput.addEventListener("focus", () => {
    tooltip.style.display = "block";
  });

  passwordInput.addEventListener("blur", () => {
    tooltip.style.display = "none";

    const val = passwordInput.value;
    const checks = validatePassword(val);

    if (val === "" || checks.every(Boolean)) {
      passwordInput.style.border = "";
    }
  });

  passwordInput.addEventListener("input", () => {
    const val = passwordInput.value;
    const checks = validatePassword(val);
    checks.forEach((passed, i) => {
      requirementIcons[i].className = passed ? "fa fa-check" : "fa fa-times";
    });

    passwordInput.style.border = checks.every(Boolean)
      ? ""
      : "2px solid #f44336";

    updateStrength(checks.filter(Boolean).length);

    confirmPasswordInput.dispatchEvent(new Event('input'));
  });

  confirmPasswordInput.addEventListener("blur", () => {
    const val = confirmPasswordInput.value;
    const match = val === passwordInput.value;

    if (val === "" || match) {
      confirmPasswordInput.style.border = "";
    }
  });

  confirmPasswordInput.addEventListener("input", () => {
  const val = confirmPasswordInput.value;
  const match = val === passwordInput.value;

  if (val.length > 0 && !match) {
    confirmPasswordInput.style.border = "2px solid #f44336";
  } else {
    confirmPasswordInput.style.border = "";
  }
});

  toggleIcons.forEach(icon => icon.style.display = 'none');

  function setupToggleIcon(input, icon) {
    input.addEventListener('input', () => {
      if (input.value.length > 0) {
        icon.style.display = 'inline';
      } else {
        icon.style.display = 'none';
    
        icon.classList.add('fa-eye');
        icon.classList.remove('fa-eye-slash');
        input.type = 'password';
      }
    });
  }

  setupToggleIcon(passwordInput, toggleIcons[0]);
  setupToggleIcon(confirmPasswordInput, toggleIcons[1]);

  window.togglePassword = function(fieldId, icon) {
    const input = document.getElementById(fieldId);
    const isHidden = input.type === 'password';
    input.type = isHidden ? 'text' : 'password';
    icon.classList.toggle('fa-eye');
    icon.classList.toggle('fa-eye-slash');
  };


  const barangayDropdown = document.getElementById("barangayDropdown");
  const streetDropdown = document.getElementById("streetDropdown");

 
  const barangayChoices = new Choices(barangayDropdown, { searchEnabled: false, itemSelectText: '' });
  const streetChoices = new Choices(streetDropdown, { searchEnabled: false, itemSelectText: '' });

  
  fetch('php/get_barangays.php')
    .then(response => response.json())
    .then(data => {
      const options = data.map(brgy => ({ value: brgy.id, label: brgy.name }));
      barangayChoices.setChoices(options, 'value', 'label', true);
    });

  
  barangayDropdown.addEventListener('change', function () {
    const barangayId = this.value;

    streetChoices.clearChoices();

    fetch('php/get_streets.php', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: 'barangay_id=' + encodeURIComponent(barangayId)
    })
      .then(response => response.json())
      .then(data => {
        const options = data.map(street => ({ value: street.id, label: street.name }));
        streetChoices.setChoices(options, 'value', 'label', true);
      });
  });

  document.getElementById("signUpForm").addEventListener("submit", function(event) {
  event.preventDefault();

    const firstName = document.getElementById("firstName").value.trim();
    const lastName = document.getElementById("lastName").value.trim();
    const address = document.querySelector('input[placeholder^="Unit"]').value.trim();
    const barangayId = document.getElementById("barangayDropdown").value;
    const streetId = document.getElementById("streetDropdown").value || null;
    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value;
    const confirmPassword = document.getElementById("confirmPassword").value;

    const passwordPattern = /^(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{8,}$/;
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailPattern.test(email)) {
      alert("Invalid email format.");
      return;
    }

    if (!passwordPattern.test(password)) {
      alert("Password must be at least 8 characters, include a capital letter, a digit, and a special character.");
      return;
    }

    if (password !== confirmPassword) {
      alert("Passwords do not match.");
      return;
    }

    fetch('php/register_user.php', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        firstName,
        lastName,
        address,
        barangayId,
        streetId,
        email,
        password
      })
    })
    .then(res => res.json())
    .then(data => {
      if (data.success) {
        alert("Registration successful! You can now log in.");
        window.location.href = "login.html";
      } else {
        alert("Error: " + data.message);
      }
    })
    .catch(err => {
      console.error("Error:", err);
      alert("Something went wrong.");
    });
  });
});

