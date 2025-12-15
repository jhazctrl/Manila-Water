document.addEventListener("DOMContentLoaded", function () {
  console.log("JavaScript loaded successfully!");

  // --- Modal variables ---
  const modal = document.getElementById("updateModal");
  const passwordModal = document.getElementById("passwordModal");
  const passwordConfirmModal = document.getElementById("passwordConfirmModal");
  const successModal = document.getElementById("successModal");
  const passwordConfirmButton = document.querySelector("#passwordConfirmModal .password-button");

  // --- Modal Functions ---
  function openModal() {
    fetch('php/get_userInfo2.php')
      .then(res => res.json())
      .then(data => {
        if (data.error) {
          alert(data.error);
          return;
        }
        // Set placeholders or values
        const firstName = document.getElementById('firstName');
        if (firstName) {
          firstName.value = '';
          firstName.placeholder = data.first_name || '';
        }
        const lastName = document.getElementById('lastName');
        if (lastName) {
          lastName.value = '';
          lastName.placeholder = data.last_name || '';
        }
        const contactNum = document.getElementById('contactNum');
        if (contactNum) {
          contactNum.value = '';
          contactNum.placeholder = data.contact_no ? '+63 | ' + data.contact_no : '+63 | 9XX XXX XXXX';
        }
        const addressDetails = document.getElementById('address_details');
        if (addressDetails) {
          addressDetails.value = '';
          addressDetails.placeholder = data.address_detail || '';
        }
        const emailModal = document.getElementById('email_modal');
        if (emailModal) {
          emailModal.value = '';
          emailModal.placeholder = data.email || '';
        }
        const passwordModal = document.getElementById('password_modal');
        if (passwordModal) {
          passwordModal.value = '';
          passwordModal.placeholder = value = data.masked_password
        }
        const profileImage = document.getElementById('profileImage');
        if (profileImage && data.user_photo) profileImage.src = data.user_photo;
        // Set barangay and street if needed
        const barangayDropdown = document.getElementById('barangayDropdown');
        const streetDropdown = document.getElementById('streetDropdown');
        if (barangayDropdown) barangayDropdown.value = data.brgy_id || '';
        if (barangayDropdown && streetDropdown && data.brgy_id) {
          fetch('php/get_streets.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: 'barangay_id=' + encodeURIComponent(data.brgy_id)
          })
            .then(response => response.json())
            .then(streets => {
              streetDropdown.length = 1;
              streets.forEach(street => {
                const option = document.createElement('option');
                option.value = street.id;
                option.textContent = street.name;
                streetDropdown.appendChild(option);
              });
              streetDropdown.value = data.street_id || '';
            });
        }
        modal.classList.add("active");
      })
      .catch(() => {
        modal.classList.add("active");
      });
  }
  function closeModal() { modal.classList.remove("active"); }
  function openPasswordModal() { passwordModal.classList.add("active"); }
  function closePasswordModal() { passwordModal.classList.remove("active"); }
  function openPasswordConfirmModal() { passwordConfirmModal.classList.add("active"); }
  function closePasswordConfirmModal() { passwordConfirmModal.classList.remove("active"); }

  // --- Popup functions ---
  function openUpdatedPopup() { document.getElementById("updatedPopup").classList.add("active"); }
  function closeUpdatedPopup() { document.getElementById("updatedPopup").classList.remove("active"); }
  function showPasswordChangedPopup() { document.getElementById("passwordChangedPopup").classList.add("active"); }
  function closePasswordChangedPopup() { document.getElementById("passwordChangedPopup").classList.remove("active"); }
  function openSuccessModal() {
    successModal.classList.add("active");
    setTimeout(() => { successModal.classList.remove("active"); }, 2000);
  }

  // Expose to global scope
  window.openModal = openModal;
  window.closeModal = closeModal;
  window.openPasswordModal = openPasswordModal;
  window.closePasswordModal = closePasswordModal;
  window.openPasswordConfirmModal = openPasswordConfirmModal;
  window.closePasswordConfirmModal = closePasswordConfirmModal;
  window.openUpdatedPopup = openUpdatedPopup;
  window.closeUpdatedPopup = closeUpdatedPopup;
  window.showPasswordChangedPopup = showPasswordChangedPopup;
  window.closePasswordChangedPopup = closePasswordChangedPopup;

  // --- Button Handlers ---
  const modalUpdateButton = document.querySelector("#updateModal .modal-card button[type='submit']");
  if (modalUpdateButton) {
    modalUpdateButton.addEventListener("click", (e) => {
      e.preventDefault();
      openPasswordConfirmModal();
    });
  }

  // Confirm password logic for final update
  if (passwordConfirmButton) {
    passwordConfirmButton.addEventListener("click", () => {
      const confirmInput = document.querySelector("#passwordConfirmModal .password-input");
      if (!confirmInput) return;
      const password = confirmInput.value;
      if (!password) {
        confirmInput.setCustomValidity("Please enter your password.");
        confirmInput.reportValidity();
        return;
      }
      // Check password via AJAX
      checkPassword(password, function(result) {
        if (result.success) {
          const formData = new FormData();
          const firstName = document.getElementById('firstName');
          const lastName = document.getElementById('lastName');
          const contactNum = document.getElementById('contactNum');
          const addressDetails = document.getElementById('address_details');
          const emailModal = document.getElementById('email_modal');
          const barangayDropdown = document.getElementById('barangayDropdown');
          const streetDropdown = document.getElementById('streetDropdown');
          const photoInput = document.getElementById('uploadInput'); // <-- use uploadInput

          if (firstName && firstName.value) formData.append('first_name', firstName.value);
          if (lastName && lastName.value) formData.append('last_name', lastName.value);
          if (contactNum && contactNum.value) formData.append('contact_no', contactNum.value.replace(/\D/g, '').substring(0, 10));
          if (addressDetails && addressDetails.value) formData.append('address_detail', addressDetails.value);
          if (emailModal && emailModal.value) formData.append('user_email', emailModal.value);
          if (barangayDropdown && barangayDropdown.value) formData.append('brgy_id', barangayDropdown.value);
          if (streetDropdown && streetDropdown.value) formData.append('street_id', streetDropdown.value);
          if (window._pendingNewPassword) formData.append('new_password', window._pendingNewPassword);

          // Handle photo upload
          if (photoInput && photoInput.files && photoInput.files[0]) {
            formData.append('user_photo', photoInput.files[0]);
          }

          fetch('php/update_profile.php', {
            method: 'POST',
            body: formData
          })
            .then(res => res.json())
            .then(data => {
              if (data.success) {
                closePasswordConfirmModal();
                closeModal();
                openUpdatedPopup();
                window._pendingNewPassword = null;
              } else {
                alert(data.error || "Update failed.");
              }
            })
            .catch(() => {
              alert("Update failed. Please try again.");
            });
        } else {
          confirmInput.setCustomValidity("Incorrect password.");
          confirmInput.reportValidity();
        }
      });
    });
  }

  // --- Edit badge handler ---
  const badge = document.querySelector(".edit-badge");
  if (badge) {
    badge.addEventListener("click", () => {
      openPasswordModal();
    });
  }

  // Close modals when clicking outside
  window.addEventListener("click", (e) => {
    if (e.target === modal) closeModal();
    if (e.target === passwordModal) closePasswordModal();
    if (e.target === passwordConfirmModal) closePasswordConfirmModal();
  });

  // Escape key to close modals
  window.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      closeModal();
      closePasswordModal();
      closePasswordConfirmModal();
    }
  });

  // --- Image preview for upload modal ---
  const photoInput = document.getElementById('uploadInput');
  const profileImage = document.getElementById('profileImage');
  if (photoInput && profileImage) {
    photoInput.addEventListener('change', function () {
      if (photoInput.files && photoInput.files[0]) {
        const reader = new FileReader();
        reader.onload = function (e) {
          profileImage.src = e.target.result;
        };
        reader.readAsDataURL(photoInput.files[0]);
      }
    });
  }

  // --- Barangay/Street Dropdowns (NO Choices.js) ---
  const barangayDropdown = document.getElementById("barangayDropdown");
  const streetDropdown = document.getElementById("streetDropdown");

  fetch('php/get_barangays.php')
    .then(response => response.json())
    .then(data => {
      barangayDropdown.length = 1;
      data.forEach(brgy => {
        const option = document.createElement('option');
        option.value = brgy.id;
        option.textContent = brgy.name;
        barangayDropdown.appendChild(option);
      });
    });

  barangayDropdown.addEventListener('change', function () {
    const barangayId = this.value;
    streetDropdown.length = 1;
    if (!barangayId) return;
    fetch('php/get_streets.php', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: 'barangay_id=' + encodeURIComponent(barangayId)
    })
      .then(response => response.json())
      .then(data => {
        data.forEach(street => {
          const option = document.createElement('option');
          option.value = street.id;
          option.textContent = street.name;
          streetDropdown.appendChild(option);
        });
      })
      .catch(error => {
        console.error('Fetch error:', error);
      });
  });

  // --- Profile info for main view ---
  fetch('php/get_userInfo.php')
    .then(response => response.json())
    .then(data => {
      if (data.error) {
        console.error("Error fetching user:", data.error);
        return;
      }
      const userImg = document.getElementById("user_profile");
      if (userImg) {
        userImg.src = data.photo;
        userImg.style.width = "80px";
        userImg.style.height = "80px";
        userImg.style.borderRadius = "50%";
        userImg.style.objectFit = "cover";
      }
      const nameHeader = document.querySelector(".profile-name h2");
      if (nameHeader) nameHeader.textContent = data.fullname;
      document.getElementById("contact").value = data.contact;
      document.getElementById("address").value = data.address;
      document.getElementById("email").value = data.email;
      document.getElementById("password").value = data.masked_password;
    })
    .catch(err => console.error("Fetch profile error:", err));

  // --- Contact number formatting for update modal ---
  const contactInput = document.getElementById('contactNum');
  if (contactInput) {
    contactInput.placeholder = '+63 | 9XX XXX XXXX';
    contactInput.value = '';
    contactInput.style.textAlign = 'left';

    contactInput.addEventListener('input', function(e) {
      let value = e.target.value;
      if (value && !value.startsWith('+63 | ')) {
        let digits = value.replace(/[^\d]/g, '');
        value = '+63 | ' + digits;
      }
      let digits = value.substring(6).replace(/\D/g, '');
      if (digits.length > 10) {
        digits = digits.substring(0, 10);
      }
      let formattedNumber = '+63 | ';
      if (digits.length >= 7) {
        formattedNumber += digits.substring(0, 3) + ' ' + digits.substring(3, 6) + ' ' + digits.substring(6);
      } else if (digits.length >= 4) {
        formattedNumber += digits.substring(0, 3) + ' ' + digits.substring(3);
      } else if (digits.length > 0) {
        formattedNumber += digits;
      } else {
        formattedNumber = '';
      }
      e.target.value = formattedNumber;
    });

    contactInput.addEventListener('focus', function(e) {
      if (!e.target.value) {
        e.target.value = '+63 | ';
        setTimeout(() => {
          e.target.setSelectionRange(6, 6);
        }, 0);
      }
    });

    contactInput.addEventListener('blur', function(e) {
      const digits = e.target.value.substring(6).replace(/\D/g, '');
      if (digits.length === 0) {
        e.target.value = '';
      } else if (digits.length === 10 && digits.startsWith('9')) {
        e.target.setCustomValidity('');
      } else {
        e.target.setCustomValidity('Please enter a valid Philippine mobile number (9XX XXX XXXX)');
      }
    });

    contactInput.addEventListener('keydown', function(e) {
      const cursorPosition = e.target.selectionStart;
      const value = e.target.value;
      if (!value) return;
      if ((e.key === 'Backspace' || e.key === 'Delete') && cursorPosition <= 6) {
        e.preventDefault();
        return;
      }
      if (e.key === 'Backspace' && value.length === 7 && cursorPosition === 7) {
        e.preventDefault();
        e.target.value = '';
        return;
      }
      if (cursorPosition < 6 && value.startsWith('+63 | ')) {
        setTimeout(() => {
          e.target.setSelectionRange(6, 6);
        }, 0);
      }
    });

    contactInput.addEventListener('keypress', function(e) {
      const cursorPosition = e.target.selectionStart;
      if (!e.target.value) return;
      if (cursorPosition < 6) {
        e.preventDefault();
        setTimeout(() => {
          e.target.setSelectionRange(6, 6);
        }, 0);
        return;
      }
      if ([8, 9, 27, 13, 46].indexOf(e.keyCode) !== -1 ||
          (e.keyCode === 65 && (e.ctrlKey === true || e.metaKey === true)) ||
          (e.keyCode === 67 && (e.ctrlKey === true || e.metaKey === true)) ||
          (e.keyCode === 86 && (e.ctrlKey === true || e.metaKey === true)) ||
          (e.keyCode === 88 && (e.ctrlKey === true || e.metaKey === true))) {
        return;
      }
      if ((e.shiftKey || (e.keyCode < 48 || e.keyCode > 57)) && (e.keyCode < 96 || e.keyCode > 105)) {
        e.preventDefault();
      }
    });
  }

  // Password check AJAX
  function checkPassword(password, callback) {
    fetch('php/check_password.php', {
      method: 'POST',
      headers: {'Content-Type': 'application/x-www-form-urlencoded'},
      body: 'password=' + encodeURIComponent(password)
    })
      .then(res => res.json())
      .then(callback);
  }

  // Password change handler for password modal
  window.handlePasswordChange = function(e) {
    e.preventDefault();
    const oldPass = document.getElementById('old-password').value;
    const newPass = document.getElementById('new-password').value;
    const confirmPass = document.getElementById('confirm-password').value;
    checkPassword(oldPass, function(result) {
      if (!result.success) {
        alert("Old password is incorrect.");
        return;
      }
      if (newPass !== confirmPass) {
        alert("New password and confirm password do not match.");
        return;
      }
      window._pendingNewPassword = newPass;
      alert("Password updated and ready to save.");
      closePasswordModal();
    });
  };
});