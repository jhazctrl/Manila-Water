// Global variables
let advisories = [];
const loadingIndicator = document.querySelector('.loading');
const tableBody = document.querySelector('#advisoryTable tbody');
const advisoryTable = document.getElementById('advisoryTable');
const searchBar = document.querySelector('.search-bar');

// Load advisories from server
async function loadAdvisories() {
    if (loadingIndicator) {
        loadingIndicator.style.display = 'flex';
    }

    if (advisoryTable) {
        advisoryTable.style.display = 'none';
    }

    try {
        console.log('Loading advisories...');
        const response = await fetch('php/get_advisories2.php');

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const text = await response.text();
        console.log('Raw response:', text);

        let data;
        try {
            data = JSON.parse(text);
        } catch (e) {
            console.error('Failed to parse JSON:', text);
            throw new Error('Invalid JSON response from server');
        }

        console.log('Parsed data:', data);

        if (!data.success) {
            throw new Error(data.message || 'Failed to load advisories');
        }

        advisories = data.advisories || [];
        displayAdvisories(advisories);

        console.log(`Loaded ${advisories.length} advisories`);

    } catch (error) {
        console.error('Error loading advisories:', error);
        if (tableBody) {
            tableBody.innerHTML = `<tr><td colspan="6" class="error-message">Error loading advisories: ${error.message}</td></tr>`;
        }
    } finally {
        if (loadingIndicator) {
            loadingIndicator.style.display = 'none';
        }
        if (advisoryTable) {
            advisoryTable.style.display = 'table';
        }
    }
}

// Display advisories in table
function displayAdvisories(advisoriesToShow) {
    if (!tableBody) {
        console.error('Table body not found');
        return;
    }

    if (!advisoriesToShow || advisoriesToShow.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="6" class="no-data">No advisories found</td></tr>';
        return;
    }

    const rows = advisoriesToShow.map(advisory => {
        // Format dates for display
        const startDate = new Date(advisory.start_date);
        const endDate = new Date(advisory.end_date);

        const formatDate = (date) => {
            if (isNaN(date.getTime())) {
                return 'Invalid Date';
            }
            return date.toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });
        };

        // Determine status class for styling
        const statusClass = getStatusClass(advisory.status);

        return `
            <tr data-advisory-id="${advisory.advisory_id}">
                <td class="type-cell">${escapeHtml(advisory.advisory_type)}</td>
                <td class="description-cell" title="${escapeHtml(advisory.advisory_description)}">
                    ${truncateText(escapeHtml(advisory.advisory_description), 60)}
                </td>
                <td class="location-cell">${escapeHtml(advisory.location)}</td>
                <td class="date-cell">${formatDate(startDate)}</td>
                <td class="date-cell">${formatDate(endDate)}</td>
                <td class="status-cell">
                    <span class="status-badge ${statusClass}">${escapeHtml(advisory.status)}</span>
                </td>
            </tr>
        `;
    }).join('');

    tableBody.innerHTML = rows;
}

// Get CSS class for status
function getStatusClass(status) {
    switch (status.toLowerCase()) {
        case 'upcoming':
            return 'status-upcoming';
        case 'ongoing':
            return 'status-ongoing';
        case 'resolved':
            return 'status-resolved';
        default:
            return 'status-default';
    }
}

// Escape HTML to prevent XSS
function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Truncate text for display
function truncateText(text, maxLength) {
    if (!text) return '';
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
}

// Search functionality
function filterAdvisories(searchTerm) {
    if (!searchTerm.trim()) {
        displayAdvisories(advisories);
        return;
    }

    const filtered = advisories.filter(advisory => {
        const searchString = `
            ${advisory.advisory_type} 
            ${advisory.advisory_description} 
            ${advisory.location} 
            ${advisory.status}
        `.toLowerCase();

        return searchString.includes(searchTerm.toLowerCase());
    });

    displayAdvisories(filtered);
    console.log(`Filtered ${filtered.length} advisories for search: "${searchTerm}"`);
}

// Initialize search functionality
function initializeSearch() {
    if (searchBar) {
        searchBar.addEventListener('input', function (e) {
            filterAdvisories(e.target.value);
        });

        // Clear search on ESC key
        searchBar.addEventListener('keydown', function (e) {
            if (e.key === 'Escape') {
                e.target.value = '';
                filterAdvisories('');
            }
        });
    }
}

// Utility functions for other parts of the application
function goToProfile() {
    console.log('Navigate to profile');
    // Implement profile navigation
}

function showLogoutPopup() {
    if (confirm('Are you sure you want to logout?')) {
        // Implement logout functionality
        window.location.href = 'login.html';
    }
}

// Message listener for iframe communication
window.addEventListener('message', function (event) {
    console.log('Received message:', event.data);

    if (event.data === 'formSubmitted' || event.data === 'advisoryAdded') {
        console.log('Advisory added, reloading data...');
        setTimeout(() => {
            loadAdvisories();
        }, 500); // Small delay to ensure database is updated
    }
});

// Initialize everything when DOM is loaded
document.addEventListener('DOMContentLoaded', function () {
    console.log('Dashboard initializing...');

    // Load initial data
    loadAdvisories();

    // Initialize search
    initializeSearch();

    // Set up refresh button if it exists
    const refreshBtn = document.querySelector('.refresh-btn');
    if (refreshBtn) {
        refreshBtn.addEventListener('click', loadAdvisories);
    }

    console.log('Dashboard initialized');
});

// Refresh advisories every 5 minutes
setInterval(loadAdvisories, 5 * 60 * 1000);