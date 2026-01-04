document.addEventListener("DOMContentLoaded", function () {
    // --- Advisory Table Search (for HTML response) ---
    const tableBody = document.querySelector(".table-scroll-wrapper tbody");
    const searchBar = document.querySelector(".controls-container input[type='text'], .search-bar");
    const loadingIndicator = document.querySelector(".loading");
    let allRows = [];

    // Load all advisories when page loads
    loadAdvisories();

    // Search functionality
    if (searchBar) {
        searchBar.addEventListener("input", function () {
            const searchTerm = this.value.toLowerCase().trim();
            filterAdvisories(searchTerm);
        });
    }

    // Function to load advisories from the server (HTML)
    function loadAdvisories() {
        if (loadingIndicator) loadingIndicator.style.display = "flex";
        fetch("php/get_advisories.php")
            .then(response => response.text())
            .then(html => {
                if (loadingIndicator) loadingIndicator.style.display = "none";
                if (tableBody) {
                    tableBody.innerHTML = html;
                    // Add status color classes after loading
                    addStatusColorClasses();
                    allRows = Array.from(tableBody.querySelectorAll('tr')).map(row => row.cloneNode(true));
                }
            })
            .catch(error => {
                if (loadingIndicator) loadingIndicator.style.display = "none";
                console.error('Error loading advisories:', error);
            });
    }

    // Add status color classes to the status column
    function addStatusColorClasses() {
        if (!tableBody) return;
        tableBody.querySelectorAll('tr').forEach(row => {
            const statusCell = row.cells && row.cells[5];
            if (statusCell) {
                const status = statusCell.textContent.trim().toLowerCase();
                statusCell.classList.remove('status-ongoing', 'status-upcoming');
                if (status === 'ongoing') {
                    statusCell.classList.add('status-ongoing');
                } else if (status === 'upcoming') {
                    statusCell.classList.add('status-upcoming');
                }
            }
        });
    }

    // Function to filter advisories based on search term
    function filterAdvisories(searchTerm) {
        if (!tableBody) return;
        if (!allRows.length) {
            allRows = Array.from(tableBody.querySelectorAll('tr')).map(row => row.cloneNode(true));
        }
        tableBody.innerHTML = '';
        let hasVisibleRows = false;
        allRows.forEach(row => {
            const rowText = row.textContent.toLowerCase();
            if (!searchTerm || rowText.includes(searchTerm)) {
                tableBody.appendChild(row.cloneNode(true));
                hasVisibleRows = true;
            }
        });
        // Add status color classes after filtering
        addStatusColorClasses();
        // If no visible rows, show "no results" message
        if (!hasVisibleRows) {
            const noResultsRow = document.createElement('tr');
            noResultsRow.className = 'no-results-row';
            noResultsRow.innerHTML = `<td colspan="6" style="text-align: center;">No matching advisories found</td>`;
            tableBody.appendChild(noResultsRow);
        }
    }

    // --- Dropdown Menu ---
    window.toggleDropdown = function () {
        const dropdownMenu = document.getElementById('dropdownMenu');
        if (dropdownMenu) {
            dropdownMenu.classList.toggle('show');
        }
    };

    window.onclick = function (e) {
        const dropdownMenu = document.getElementById('dropdownMenu');
        if (dropdownMenu && !e.target.closest('.dropbtn')) {
            dropdownMenu.classList.remove('show');
        }
    };

    // --- Barangay and Street Dropdowns (only if they exist) ---
    const barangayDropdown = document.getElementById("barangayDropdown");
    const streetDropdown = document.getElementById("streetDropdown");

    // Only run if both dropdowns exist
    if (barangayDropdown && streetDropdown) {
        // Load barangays into barangayDropdown
        fetch('php/get_barangays.php')
            .then(response => response.json())
            .then(data => {
                barangayDropdown.innerHTML = '<option value="">Select Barangay</option>';
                data.forEach(brgy => {
                    const option = document.createElement('option');
                    option.value = brgy.id;
                    option.textContent = brgy.name;
                    barangayDropdown.appendChild(option);
                });
            })
            .catch(error => console.error('Error loading barangays:', error));

        // When barangay is selected, load streets for that barangay
        barangayDropdown.addEventListener('change', function () {
            const barangayId = this.value;
            streetDropdown.innerHTML = '<option value="">Select Street</option>';
            if (!barangayId) return;

            fetch('php/get_streets.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
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
                .catch(error => console.error('Error loading streets:', error));
        });
    }
});
