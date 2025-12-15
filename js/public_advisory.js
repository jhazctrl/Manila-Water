// public_advisory.js
document.addEventListener('DOMContentLoaded', function () {
    const searchBar = document.querySelector(".search-bar");
    const tableBody = document.querySelector("tbody");
    const loadingIndicator = document.querySelector(".loading");

    // Load all advisories when page loads
    loadAdvisories();

    // Search functionality
    if (searchBar) {
        searchBar.addEventListener("input", function () {
            const searchTerm = this.value.toLowerCase().trim();
            filterAdvisories(searchTerm);
        });
    }

    // Function to load advisories from the server
    async function loadAdvisories() {
        try {
            // Show loading indicator
            loadingIndicator.style.display = "flex";

            const response = await fetch('php/get_advisories2.php');

            // Hide loading indicator
            loadingIndicator.style.display = "none";

            if (!response.ok) {
                throw new Error('Failed to fetch advisories');
            }

            const responseText = await response.text();

            try {
                const data = JSON.parse(responseText);
                if (data.success && Array.isArray(data.advisories)) {
                    displayAdvisories(data.advisories);
                } else {
                    tableBody.innerHTML = '<tr><td colspan="7" style="text-align:center;">No advisories found</td></tr>';
                }
            } catch (parseError) {
                console.error("Error parsing JSON:", parseError);
                console.log("Response was:", responseText);
                tableBody.innerHTML = '<tr><td colspan="7" style="text-align:center;">Failed to load advisories</td></tr>';
            }
        } catch (error) {
            // Hide loading indicator
            loadingIndicator.style.display = "none";

            console.error('Error loading advisories:', error);
        }
    }

    // Function to truncate text to a specified length
    function truncateText(text, maxLength) {
        if (text.length <= maxLength) return text;
        return text.substring(0, maxLength) + '...';
    }

    // Function to create action buttons
    function createActionButtons(advisory) {
        const actionsCell = document.createElement('td');

        // View button
        const viewBtn = document.createElement('button');
        viewBtn.textContent = 'View';
        viewBtn.className = 'action-btn view-btn';
        viewBtn.onclick = () => {
            // View functionality will be implemented later
            console.log('View advisory:', advisory.advisory_id);
        };

        // Resolve button
        const resolveBtn = document.createElement('button');
        resolveBtn.textContent = 'Resolve';
        resolveBtn.className = 'action-btn resolve-btn';

        if (advisory.status.toLowerCase() === 'resolved') {
            resolveBtn.classList.add('resolved');
            resolveBtn.disabled = true;
        } else {
            resolveBtn.onclick = () => handleResolve(advisory.advisory_id);
        }

        actionsCell.appendChild(viewBtn);
        actionsCell.appendChild(resolveBtn);

        return actionsCell;
    }

    // Function to handle resolving an advisory
    async function handleResolve(advisoryId) {
        // Show confirmation dialog
        if (!confirm('Are you sure you want to resolve this advisory?')) {
            return;
        }

        try {
            const response = await fetch('php/resolve_advisory.php', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ advisory_id: advisoryId })
            });

            const result = await response.json();

            if (result.success) {
                // Refresh the advisories table
                loadAdvisories();
            } else {
                console.error('Failed to resolve advisory:', result.message);
            }
        } catch (error) {
            console.error('Error resolving advisory:', error);
        }
    }

    // Function to display advisories in the table
    function displayAdvisories(advisories) {
        // Clear existing rows
        tableBody.innerHTML = '';

        if (!Array.isArray(advisories) || advisories.length === 0) {
            const emptyRow = document.createElement('tr');
            emptyRow.innerHTML = '<td colspan="7" style="text-align: center;">No advisories found</td>';
            tableBody.appendChild(emptyRow);
            return;
        }

        // Add rows for each advisory
        advisories.forEach(advisory => {
            const row = document.createElement('tr');

            // Apply status-specific styling
            let statusClass = getStatusClass(advisory.status);

            // Truncate description for table view
            const shortDescription = truncateText(advisory.description, 100);

            // Create row content
            row.innerHTML = `
                <td>${advisory.advisory_type}</td>
                <td>${shortDescription}</td>
                <td>${advisory.start_date}</td>
                <td>${advisory.end_date}</td>
                <td>${advisory.location}</td>
                <td><span class="${statusClass}">${advisory.status}</span></td>
            `;

            // Add action buttons
            const actionsCell = createActionButtons(advisory);
            row.appendChild(actionsCell);

            // Set searchable text attributes for filtering
            row.setAttribute('data-search', `${advisory.advisory_type} ${advisory.description} ${advisory.location} ${advisory.status}`.toLowerCase());

            // Add row to table
            tableBody.appendChild(row);
        });
    }

    // Function to filter advisories based on search term
    function filterAdvisories(searchTerm) {
        const rows = tableBody.querySelectorAll('tr');
        let hasVisibleRows = false;

        rows.forEach(row => {
            // Skip the "no advisories found" row
            if (row.cells.length === 1 && row.cells[0].colSpan === 7) {
                return;
            }

            // Get all searchable content
            const searchableContent = row.getAttribute('data-search') || '';

            // Show/hide row based on search term
            if (!searchTerm || searchableContent.includes(searchTerm)) {
                row.style.display = '';
                hasVisibleRows = true;
            } else {
                row.style.display = 'none';
            }
        });

        // Remove any existing "no results" row
        const existingNoResults = tableBody.querySelector('.no-results-row');
        if (existingNoResults) {
            tableBody.removeChild(existingNoResults);
        }

        // If no visible rows, show "no results" message
        if (!hasVisibleRows && searchTerm) {
            const noResultsRow = document.createElement('tr');
            noResultsRow.className = 'no-results-row';
            noResultsRow.innerHTML = `<td colspan="7" style="text-align: center;">No matching advisories found</td>`;
            tableBody.appendChild(noResultsRow);
        }
    }

    // Initialize EmailJS
    (function () {
        emailjs.init("user_your_user_id");
    })();

    // Function to format date and time
    function formatDateTime(dateTimeStr) {
        const date = new Date(dateTimeStr);
        return date.toLocaleString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            hour12: true
        });
    }

    // Function to determine status class
    function getStatusClass(status) {
        switch (status.toLowerCase()) {
            case 'upcoming':
                return 'status-upcoming';
            case 'ongoing':
                return 'status-ongoing';
            case 'resolved':
                return 'status-resolved';
            default:
                return '';
        }
    }

    // Function to load and display advisories
    async function loadAdvisories() {
        const tableBody = document.querySelector('table tbody');
        const loadingElement = document.querySelector('.loading');
        const searchInput = document.querySelector('.search-bar');

        try {
            loadingElement.style.display = 'flex';

            const response = await fetch('php/get_advisories2.php');
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const text = await response.text();
            console.log('Raw response:', text);

            const data = JSON.parse(text);
            console.log('Parsed data:', data);

            if (!data.success) {
                throw new Error(data.message || 'Failed to load advisories');
            }

            const advisories = data.advisories;
            console.log(`Loaded ${advisories.length} advisories`);

            // Function to filter and display advisories
            function filterAndDisplayAdvisories(searchTerm = '') {
                const filteredAdvisories = advisories.filter(advisory => {
                    const searchLower = searchTerm.toLowerCase();
                    return (
                        advisory.advisory_type.toLowerCase().includes(searchLower) ||
                        advisory.advisory_description.toLowerCase().includes(searchLower) ||
                        advisory.location.toLowerCase().includes(searchLower) ||
                        advisory.status.toLowerCase().includes(searchLower)
                    );
                });

                tableBody.innerHTML = '';

                filteredAdvisories.forEach(advisory => {
                    const row = document.createElement('tr');
                    row.innerHTML = `
                        <td>${advisory.advisory_type}</td>
                        <td>${advisory.advisory_description}</td>
                        <td>${formatDateTime(advisory.start_date)}</td>
                        <td>${formatDateTime(advisory.end_date)}</td>
                        <td>${advisory.location}</td>
                        <td><span class="${getStatusClass(advisory.status)}">${advisory.status}</span></td>
                    `;
                    tableBody.appendChild(row);
                });
            }

            // Initial display
            filterAndDisplayAdvisories();

            // Add search functionality
            if (searchInput) {
                searchInput.addEventListener('input', (e) => {
                    filterAndDisplayAdvisories(e.target.value);
                });
            }

        } catch (error) {
            console.error('Error loading advisories:', error);
            tableBody.innerHTML = `
                <tr>
                    <td colspan="7" style="text-align: center; color: red;">
                        Failed to load advisories. Please try again later.
                    </td>
                </tr>
            `;
        } finally {
            loadingElement.style.display = 'none';
        }
    }

    // Load advisories when the document is ready
    document.addEventListener('DOMContentLoaded', loadAdvisories);
});