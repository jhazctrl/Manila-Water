document.addEventListener('DOMContentLoaded', function () {
    // Initialize EmailJS only after DOM is loaded and emailjs is available
    if (typeof emailjs !== "undefined") {
        emailjs.init("ez7NTyVnN-a49elqr");
    } else {
        console.error("EmailJS library not loaded.");
    }

    const form = document.getElementById('emailForm');
    const input = document.getElementById('emailInput');
    const button = document.getElementById('subscribeButton');
    const message = document.getElementById('statusMessage');
    const barangayDropdown = document.getElementById('barangayDropdown');
    const streetDropdown = document.getElementById('streetDropdown');

    if (!form) return;

    form.addEventListener('submit', async function (e) {
        e.preventDefault();

        const email = input.value.trim();
        if (!isValidEmail(email)) {
            showMessage('error', 'Please enter a valid email address.');
            return;
        }

        // Get values directly from dropdowns
        const barangayId = barangayDropdown.value;
        const streetId = streetDropdown.value;

        if (!barangayId || !streetId) {
            showMessage('error', 'Please select both street and barangay.');
            return;
        }

        setLoading(true);

        try {
            // Debug: Log the data being sent
            console.log('Sending data to server:', {
                email,
                street_id: streetId,
                barangay_id: barangayId
            });

            const response = await fetch('php/email_subscription.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    email,
                    street_id: streetId,
                    barangay_id: barangayId
                })
            });

            const data = await response.json();

            if (data.success) {
                if (typeof emailjs !== "undefined") {
                    await sendConfirmationEmail(email);
                }
                showMessage('success', `Successfully subscribed ${email}!`);
                input.value = '';
                // Reset location selects to default
                streetDropdown.value = '';
                barangayDropdown.value = '';
            } else if (response.status === 409) {
                showMessage('warning', `${email} is already subscribed!`);
            } else {
                showMessage('error', data.message || 'Subscription failed.');
            }
        } catch (error) {
            console.error('Subscription error:', error);
            showMessage('error', 'Connection failed. Please try again.');
        } finally {
            setLoading(false);
        }
    });

    function isValidEmail(email) {
        // More comprehensive email validation
        const emailRegex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,6}$/;
        const maxLength = 255; // Standard email length limit

        if (!email || typeof email !== 'string') {
            return false;
        }

        email = email.trim().toLowerCase();

        if (email.length > maxLength) {
            return false;
        }

        if (!emailRegex.test(email)) {
            return false;
        }

        // Check for common disposable email domains
        const disposableDomains = ['tempmail.com', 'throwaway.com'];
        const domain = email.split('@')[1];
        if (disposableDomains.includes(domain)) {
            return false;
        }

        return true;
    }

    async function sendConfirmationEmail(email) {
        try {
            await emailjs.send('service_db0tu54', 'template_zoziadz', {
                user_email: email,
                to_name: email.split('@')[0],
                message: 'Thank you for subscribing to our water interruption advisory service.'
            });
        } catch (error) {
            console.warn('Confirmation email failed:', error);
        }
    }

    function showMessage(type, text) {
        if (message) {
            message.className = `status-message ${type}`;
            message.textContent = text;
            message.style.display = 'block';

            if (type !== 'error') {
                setTimeout(() => message.style.display = 'none', 5000);
            }
        }
    }

    function setLoading(loading) {
        if (button) {
            button.disabled = loading;
            button.textContent = loading ? 'Subscribing...' : 'Subscribe for Updates';
        }
    }
});