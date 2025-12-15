// Get form elements
const form = document.getElementById('advisoryForm');
const typeSelect = document.getElementById('type');
const barangaySelect = document.getElementById('barangaySelect');
const streetSelect = document.getElementById('streetSelect');
const cancelBtn = document.getElementById('cancelBtn');

// Store all streets data for filtering
let allStreetsData = [];

function formatTimeForDatabase(timeString) {
    if (!timeString) {
        console.error('Empty time string provided');
        return null;
    }

    console.log('Original time string:', timeString);

    // Handle different time formats
    if (timeString.includes(':')) {
        const parts = timeString.split(':');

        // If already HH:MM:SS format
        if (parts.length === 3) {
            // Validate each part
            const hours = parseInt(parts[0]);
            const minutes = parseInt(parts[1]);
            const seconds = parseInt(parts[2]);

            if (hours >= 0 && hours <= 23 && minutes >= 0 && minutes <= 59 && seconds >= 0 && seconds <= 59) {
                return timeString;
            }
        }

        // If HH:MM format, add seconds
        if (parts.length === 2) {
            const hours = parseInt(parts[0]);
            const minutes = parseInt(parts[1]);

            if (hours >= 0 && hours <= 23 && minutes >= 0 && minutes <= 59) {
                return timeString + ':00';
            }
        }
    }

    console.error('Invalid time format:', timeString);
    return null;
}

// Enhanced date formatting function
function formatDateForDatabase(dateString) {
    if (!dateString) {
        console.error('Empty date string provided');
        return null;
    }

    console.log('Original date string:', dateString);

    // Validate YYYY-MM-DD format
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
        const date = new Date(dateString);
        if (!isNaN(date.getTime())) {
            return dateString;
        }
    }

    console.error('Invalid date format:', dateString);
    return null;
}

// Alternative: Handle datetime-local inputs
function handleDateTimeLocal(datetimeString) {
    if (!datetimeString) return { date: null, time: null };

    console.log('DateTime-local string:', datetimeString);

    // datetime-local format: YYYY-MM-DDTHH:MM or YYYY-MM-DDTHH:MM:SS
    const parts = datetimeString.split('T');
    if (parts.length !== 2) {
        console.error('Invalid datetime-local format:', datetimeString);
        return { date: null, time: null };
    }

    const date = formatDateForDatabase(parts[0]);
    let time = parts[1];

    // Add seconds if not present
    if (time.split(':').length === 2) {
        time += ':00';
    }

    const formattedTime = formatTimeForDatabase(time);

    return {
        date: date,
        time: formattedTime
    };
}

// Enhanced validation for advisory type
function validateForm() {
    console.log('Starting form validation...');

    // First check advisory type specifically
    if (!typeSelect.value) {
        console.error('No advisory type selected');
        alert('Please select an advisory type');
        typeSelect.focus();
        return false;
    }

    // Updated field list to match actual HTML form field IDs
    const requiredFields = [
        { id: 'advisory_description', name: 'Description' },
        { id: 'startDateTime', name: 'Start Date & Time' },
        { id: 'endDateTime', name: 'End Date & Time' },
        { id: 'barangaySelect', name: 'Barangay' },
        { id: 'streetSelect', name: 'Street' },
        { id: 'status', name: 'Status' }
    ];

    // Check each required field
    for (const field of requiredFields) {
        const element = document.getElementById(field.id);
        if (!element) {
            console.error(`Field element not found: ${field.id}`);
            alert(`Form error: ${field.name} field not found`);
            return false;
        }

        const value = element.value ? element.value.trim() : '';
        console.log(`Field ${field.id} value:`, value);

        if (!value) {
            console.error(`Field ${field.id} is empty`);
            alert(`Please fill in the ${field.name} field`);
            element.focus();
            return false;
        }
    }

    // Validate datetime fields
    const startDateTime = document.getElementById('startDateTime');
    const endDateTime = document.getElementById('endDateTime');

    if (startDateTime && endDateTime && startDateTime.value && endDateTime.value) {
        const startDate = new Date(startDateTime.value);
        const endDate = new Date(endDateTime.value);

        if (endDate <= startDate) {
            alert('End date/time must be after start date/time');
            endDateTime.focus();
            return false;
        }
    }

    console.log('Form validation passed');
    return true;
}

// Load locations and advisory types from single endpoint
async function loadFormData() {
    try {
        console.log('Loading form data...');
        const response = await fetch('php/get_locations.php');

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const text = await response.text(); // Get the raw text first
        console.log('Raw response:', text);

        if (!text) {
            throw new Error('Empty response from server');
        }

        let data;
        try {
            data = JSON.parse(text);
        } catch (e) {
            console.error('Raw response:', text);
            throw new Error('Invalid JSON response from server');
        }

        if (!data.success) {
            throw new Error(data.message || 'Failed to load data');
        }

        console.log('Received data:', data);

        // Populate advisory types
        if (typeSelect && Array.isArray(data.advisoryTypes)) {
            typeSelect.innerHTML = '<option value="" disabled selected>Select Type</option>';
            data.advisoryTypes.forEach(type => {
                const option = document.createElement('option');
                option.value = type.advisory_type_id;
                option.textContent = type.advisory_type_name;
                typeSelect.appendChild(option);
            });
            typeSelect.disabled = false;
        }

        // Populate barangay dropdown
        if (barangaySelect && Array.isArray(data.barangays)) {
            barangaySelect.innerHTML = '<option value="">Select Barangay</option>';
            data.barangays.forEach(barangay => {
                const option = document.createElement('option');
                option.value = barangay.brgy_id;
                option.textContent = barangay.brgy_number;
                barangaySelect.appendChild(option);
            });
            barangaySelect.disabled = false;
        }

        // Store streets data for filtering
        if (Array.isArray(data.streets)) {
            allStreetsData = data.streets;
        }

        console.log('Form data loaded successfully');

    } catch (error) {
        console.error('Error loading form data:', error);
        const errorMessage = error.message || 'Failed to load data';

        if (typeSelect) {
            typeSelect.innerHTML = `<option value="">Error: ${errorMessage}</option>`;
            typeSelect.disabled = true;
        }
        if (barangaySelect) {
            barangaySelect.innerHTML = `<option value="">Error: ${errorMessage}</option>`;
            barangaySelect.disabled = true;
        }
        if (streetSelect) {
            streetSelect.innerHTML = `<option value="">Error: ${errorMessage}</option>`;
            streetSelect.disabled = true;
        }

        alert('Error loading form data: ' + errorMessage);
    }
}

// Filter streets based on selected barangay
function updateStreetOptions() {
    const selectedBarangayId = barangaySelect.value;

    if (!selectedBarangayId) {
        streetSelect.innerHTML = '<option value="">Select Street</option>';
        streetSelect.disabled = true;
        return;
    }

    // Filter streets for the selected barangay
    const filteredStreets = allStreetsData.filter(street =>
        street.brgy_id == selectedBarangayId
    );

    streetSelect.innerHTML = '<option value="">Select Street</option>';

    filteredStreets.forEach(street => {
        const option = document.createElement('option');
        option.value = street.street_id;
        option.textContent = street.street_name;
        streetSelect.appendChild(option);
    });

    streetSelect.disabled = false;
}

// ADDED: handleSubmit function for verification script
function handleSubmit(e) {
    console.log('handleSubmit called');
    if (form && form.dispatchEvent) {
        const submitEvent = new Event('submit', { cancelable: true });
        form.dispatchEvent(submitEvent);
    }
}

// Event Listeners
document.addEventListener('DOMContentLoaded', function () {
    console.log('DOM loaded, initializing form...');
    loadFormData().catch(error => {
        console.error('Failed to initialize form:', error);
    });
});

// Barangay change event
if (barangaySelect) {
    barangaySelect.addEventListener('change', updateStreetOptions);
}

// Cancel button event
if (cancelBtn) {
    cancelBtn.addEventListener('click', function () {
        console.log('Cancel button clicked');
        window.parent.postMessage('formCanceled', '*');
    });
}

// Handle form submission
if (form) {
    form.addEventListener('submit', async function (e) {
        e.preventDefault();
        console.log('Form submission started');

        if (!validateForm()) {
            return;
        }

        // Show loading state
        const submitBtn = form.querySelector('button[type="submit"]');
        const originalText = submitBtn.textContent;
        submitBtn.textContent = 'Publishing...';
        submitBtn.disabled = true;

        try {
            // Handle datetime-local inputs
            const startDateTime = document.getElementById('startDateTime');
            const endDateTime = document.getElementById('endDateTime');

            if (!startDateTime || !endDateTime || !startDateTime.value || !endDateTime.value) {
                throw new Error('Please fill in both start and end date/time fields');
            }

            const startDT = handleDateTimeLocal(startDateTime.value);
            const endDT = handleDateTimeLocal(endDateTime.value);

            if (!startDT.date || !startDT.time || !endDT.date || !endDT.time) {
                throw new Error('Invalid date/time format');
            }

            const formData = {
                advisory_type_id: typeSelect.value,
                advisory_description: document.getElementById('advisory_description').value,
                start_date: startDT.date,
                start_time: startDT.time,
                end_date: endDT.date,
                end_time: endDT.time,
                brgy_id: barangaySelect.value,
                street_id: streetSelect.value,
                status: document.getElementById('status').value
            };

            console.log('Collected form data:', formData);
            console.log('Formatted start_time:', formData.start_time);
            console.log('Formatted end_time:', formData.end_time);

            const response = await fetch('php/save_advisory.php', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(formData)
            });

            const text = await response.text();
            console.log('Raw server response:', text);

            let result;
            try {
                result = JSON.parse(text);
            } catch (e) {
                console.error('Failed to parse JSON response:', text);
                throw new Error('Invalid response from server');
            }

            console.log('Parsed server response:', result);

            if (!result.success) {
                throw new Error(result.message || 'Failed to save advisory');
            }

            alert('Advisory saved successfully!');

            // Reset form
            form.reset();
            streetSelect.innerHTML = '<option value="">Select Street</option>';
            streetSelect.disabled = true;

            // Send notification if available
            if (typeof sendAdvisoryNotifications === 'function') {
                try {
                    console.log('Starting email notifications process...');
                    // Get affected users based on location using existing endpoint
                    const affectedUsersResponse = await fetch('php/email_subscription.php?action=emails', {
                        method: 'GET',
                        headers: {
                            'Content-Type': 'application/json'
                        }
                    });

                    if (!affectedUsersResponse.ok) {
                        throw new Error(`HTTP error! status: ${affectedUsersResponse.status}`);
                    }

                    const affectedUsersResult = await affectedUsersResponse.json();
                    console.log('Got users from database:', affectedUsersResult);

                    if (affectedUsersResult.success && affectedUsersResult.data && affectedUsersResult.data.emails && affectedUsersResult.data.emails.length > 0) {
                        console.log('Found subscribed users, filtering by location...');
                        // Filter users by the affected location
                        const affectedUsers = affectedUsersResult.data.emails.filter(user => {
                            const matches = user.street_id == formData.street_id && user.brgy_id == formData.brgy_id;
                            console.log('Checking user:', {
                                email: user.email,
                                type: user.user_type,
                                street_id: user.street_id,
                                formStreetId: formData.street_id,
                                brgy_id: user.brgy_id,
                                formBrgyId: formData.brgy_id,
                                matches: matches
                            });
                            return matches;
                        });

                        if (affectedUsers.length > 0) {
                            console.log('Found affected users:', affectedUsers);

                            // Get advisory type text
                            const selectedOption = typeSelect.options[typeSelect.selectedIndex];
                            if (!selectedOption || !selectedOption.text) {
                                throw new Error('Invalid advisory type selected');
                            }

                            const notificationData = {
                                advisory_type: selectedOption.text,
                                description: formData.advisory_description,
                                location: `${affectedUsers[0].street_name}, ${affectedUsers[0].brgy_number}`,
                                start_date: formData.start_date + ' ' + formData.start_time,
                                end_date: formData.end_date + ' ' + formData.end_time
                            };

                            console.log('Prepared notification data:', notificationData);

                            const notificationResult = await sendAdvisoryNotifications(notificationData, affectedUsers);
                            console.log('Notification result:', notificationResult);

                            if (!notificationResult.success) {
                                throw new Error(notificationResult.message || 'Failed to send notifications');
                            }
                        } else {
                            console.log('No users found in the affected location:', {
                                street_id: formData.street_id,
                                brgy_id: formData.brgy_id
                            });
                        }
                    } else {
                        console.log('No subscribed users found or error getting users:', affectedUsersResult);
                    }
                } catch (notifError) {
                    console.error('Notification failed:', {
                        error: notifError,
                        message: notifError?.message || 'Unknown error',
                        stack: notifError?.stack,
                        details: notifError?.details || {}
                    });
                    // Show user-friendly error message
                    alert('Failed to send notifications: ' + (notifError?.message || 'Unknown error occurred'));
                }
            } else {
                console.warn('sendAdvisoryNotifications function not available');
            }

            // Notify parent window
            window.parent.postMessage('formSubmitted', '*');

        } catch (error) {
            console.error('Error:', error);
            alert('Error saving advisory: ' + error.message);
        } finally {
            // Restore button state
            submitBtn.textContent = originalText;
            submitBtn.disabled = false;
        }
    });
}

// Export functions for global access
window.handleSubmit = handleSubmit;
window.validateForm = validateForm;