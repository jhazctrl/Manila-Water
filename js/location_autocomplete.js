document.addEventListener('DOMContentLoaded', function () {
    const streetSelect = document.getElementById('streetSelect');
    const barangaySelect = document.getElementById('barangaySelect');

    let locations = { streets: [], barangays: [] };

    // Load locations from database
    async function loadLocations() {
        try {
            console.log('Loading locations from API...');
            const response = await fetch('get_locations.php');

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            console.log('Raw API response:', data);

            // Check if we got valid data
            if (!data.streets || !data.barangays) {
                throw new Error('Invalid data structure received');
            }

            // Store the data
            locations.streets = data.streets || [];
            locations.barangays = data.barangays || [];

            // Populate the dropdowns
            populateStreetDropdown();
            populateBarangayDropdown();

            console.log('Loaded locations:', {
                streets: locations.streets.length,
                barangays: locations.barangays.length
            });

            // Enable the select fields
            if (streetSelect) {
                streetSelect.disabled = false;
            }
            if (barangaySelect) {
                barangaySelect.disabled = false;
            }

        } catch (error) {
            console.error('Error loading locations:', error);

            // Show user-friendly error
            if (streetSelect) {
                streetSelect.innerHTML = '<option value="">Error loading streets</option>';
                streetSelect.disabled = true;
            }
            if (barangaySelect) {
                barangaySelect.innerHTML = '<option value="">Error loading barangays</option>';
                barangaySelect.disabled = true;
            }
        }
    }

    // Populate street dropdown
    function populateStreetDropdown() {
        if (!streetSelect) {
            console.error('streetSelect not found');
            return;
        }

        // Clear existing options except the first one
        streetSelect.innerHTML = '<option value="">Select Street</option>';

        // Add street options
        locations.streets.forEach(street => {
            const option = document.createElement('option');
            option.value = street.street_id;
            option.textContent = street.street_name;
            option.dataset.streetName = street.street_name;
            streetSelect.appendChild(option);
        });

        console.log(`Populated street dropdown with ${locations.streets.length} options`);
    }

    // Populate barangay dropdown
    function populateBarangayDropdown() {
        if (!barangaySelect) {
            console.error('barangaySelect not found');
            return;
        }

        // Clear existing options except the first one
        barangaySelect.innerHTML = '<option value="">Select Barangay</option>';

        // Add barangay options
        locations.barangays.forEach(barangay => {
            const option = document.createElement('option');
            option.value = barangay.brgy_id;
            option.textContent = barangay.brgy_number;
            option.dataset.brgyNumber = barangay.brgy_number;
            barangaySelect.appendChild(option);
        });

        console.log(`Populated barangay dropdown with ${locations.barangays.length} options`);
    }

    // Get selected location data
    function getSelectedLocationData() {
        const streetValue = parseInt(streetSelect?.value) || 0;
        const barangayValue = parseInt(barangaySelect?.value) || 0;

        if (!streetValue || !barangayValue) {
            return null;
        }

        // Find the selected street and barangay data
        const selectedStreet = locations.streets.find(s => parseInt(s.street_id) === streetValue);
        const selectedBarangay = locations.barangays.find(b => parseInt(b.brgy_id) === barangayValue);

        if (!selectedStreet || !selectedBarangay) {
            return null;
        }

        return {
            street_id: streetValue,
            brgy_id: barangayValue,
            street_name: selectedStreet.street_name,
            brgy_number: selectedBarangay.brgy_number
        };
    }

    // Validate location selection
    function validateLocationSelection() {
        const streetValue = streetSelect?.value;
        const barangayValue = barangaySelect?.value;

        const errors = [];

        if (!streetValue) {
            errors.push('Please select a street');
        }

        if (!barangayValue) {
            errors.push('Please select a barangay');
        }

        return {
            valid: errors.length === 0,
            errors: errors,
            data: errors.length === 0 ? getSelectedLocationData() : null
        };
    }

    // Visual feedback for validation
    function showValidationFeedback(element, isValid, message = '') {
        if (!element) return;

        // Remove existing validation classes
        element.classList.remove('valid', 'invalid');

        // Remove existing error message
        const existingError = element.parentNode.querySelector('.validation-error');
        if (existingError) {
            existingError.remove();
        }

        if (isValid === true) {
            element.classList.add('valid');
        } else if (isValid === false && message) {
            element.classList.add('invalid');

            // Add error message
            const errorDiv = document.createElement('div');
            errorDiv.className = 'validation-error';
            errorDiv.textContent = message;
            errorDiv.style.color = '#ff4444';
            errorDiv.style.fontSize = '0.9em';
            errorDiv.style.marginTop = '5px';
            element.parentNode.appendChild(errorDiv);
        }
    }

    // Initialize dropdowns
    if (streetSelect && barangaySelect) {
        // Disable initially until locations are loaded
        streetSelect.disabled = true;
        barangaySelect.disabled = true;
        streetSelect.innerHTML = '<option value="">Loading streets...</option>';
        barangaySelect.innerHTML = '<option value="">Loading barangays...</option>';

        // Add change event listeners for validation
        streetSelect.addEventListener('change', function () {
            const validation = validateLocationSelection();
            if (this.value) {
                showValidationFeedback(this, !!this.value);
            } else {
                showValidationFeedback(this, null);
            }
        });

        barangaySelect.addEventListener('change', function () {
            const validation = validateLocationSelection();
            if (this.value) {
                showValidationFeedback(this, !!this.value);
            } else {
                showValidationFeedback(this, null);
            }
        });
    }

    // Load locations when page loads
    loadLocations();

    // Make functions available globally
    window.locationAutocomplete = {
        loadLocations,
        validateLocationSelection,
        getSelectedLocationData,
        locations: () => locations,
        showValidationFeedback
    };

    console.log('Location autocomplete initialized with separate dropdowns');
});