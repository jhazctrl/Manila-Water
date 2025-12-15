// scriptModal.js
document.addEventListener('DOMContentLoaded', function () {
    // Get the modal and button elements
    const modal = document.getElementById("advisoryModal");
    const addButton = document.querySelector(".add-button");
    const frame = document.getElementById("advisoryFrame");
    const closeBtn = document.querySelector(".close-btn");

    // When the user clicks the button, open the modal
    addButton.addEventListener("click", function () {
        // Set the iframe source with cache-busting parameter
        frame.src = `advisory_form.html?v=${new Date().getTime()}`;

        // Display the modal after setting the src
        modal.style.display = "block";
        document.body.style.overflow = "hidden"; // Prevent scrolling behind modal
    });

    // When the user clicks the close button
    closeBtn.addEventListener("click", function () {
        modal.style.display = "none";
        document.body.style.overflow = "auto"; // Restore scrolling
        frame.src = ''; // Clear the iframe source
    });

    // When the user clicks anywhere outside of the modal, close it
    window.addEventListener("click", function (event) {
        if (event.target == modal) {
            modal.style.display = "none";
            document.body.style.overflow = "auto"; // Restore scrolling
            frame.src = ''; // Clear the iframe source
        }
    });

    // Handle form submission or cancellation from iframe
    window.addEventListener("message", function (event) {
        console.log("Message received from iframe:", event.data);

        if (event.data === "formSubmitted") {
            // Close the modal if the form was submitted successfully
            modal.style.display = "none";
            document.body.style.overflow = "auto"; // Restore scrolling
            frame.src = ''; // Clear the iframe source

            // Reload the page to see updated data
            setTimeout(function () {
                window.location.reload();
            }, 500);

            // You could also display a success message here
            alert("Advisory published successfully!");
        }
        else if (event.data === "formCanceled") {
            console.log("Cancel message received, closing modal");
            // Close the modal if the user clicked cancel
            modal.style.display = "none";
            document.body.style.overflow = "auto"; // Restore scrolling
            frame.src = ''; // Clear the iframe source
        }
    });
});