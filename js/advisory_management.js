// Function to load advisories
async function loadAdvisories() {
    const tableBody = document.getElementById('advisories-table-body');

    if (!tableBody) {
        console.error('Advisory table body not found');
        return;
    }

    try {
        const response = await fetch('php/get_advisories2.php');
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        if (!data.success) {
            throw new Error(data.message || 'Failed to load advisories');
        }

        // Clear existing rows
        tableBody.innerHTML = '';

        // Add rows for each advisory
        data.advisories.forEach(advisory => {
            const row = document.createElement('tr');

            // Format location
            const location = advisory.location;

            // Format schedule
            const startDate = new Date(advisory.start_date);
            const endDate = new Date(advisory.end_date);
            const schedule = `${formatDate(startDate)} - ${formatDate(endDate)}`;

            // Determine which buttons to show based on status
            let actionButtons = '';
            if (advisory.status.toLowerCase() === 'upcoming') {
                actionButtons = `
                    <button class="action-btn ongoing-btn" data-id="${advisory.advisory_id}">Ongoing</button>
                    <button class="action-btn resolve-btn" data-id="${advisory.advisory_id}">Resolve</button>
                `;
            } else if (advisory.status.toLowerCase() === 'ongoing') {
                actionButtons = `
                    <button class="action-btn resolve-btn" data-id="${advisory.advisory_id}">Resolve</button>
                `;
            } else {
                actionButtons = `
                    <button class="action-btn resolve-btn resolved" disabled>Resolved</button>
                `;
            }

            row.innerHTML = `
                <td>${advisory.advisory_id}</td>
                <td>${advisory.advisory_type}</td>
                <td>${location}</td>
                <td><span class="status-badge status-${advisory.status.toLowerCase()}">${advisory.status}</span></td>
                <td>${schedule}</td>
                <td class="action-buttons">
                    ${actionButtons}
                </td>
            `;

            tableBody.appendChild(row);
        });

        // Add event listeners to buttons
        document.querySelectorAll('.ongoing-btn').forEach(button => {
            button.addEventListener('click', () => handleStatusUpdate(button, 'ongoing'));
        });

        document.querySelectorAll('.resolve-btn:not(.resolved)').forEach(button => {
            button.addEventListener('click', () => handleStatusUpdate(button, 'resolved'));
        });

    } catch (error) {
        console.error('Error loading advisories:', error);
        tableBody.innerHTML = `
            <tr>
                <td colspan="6" class="error-message">
                    Failed to load advisories. Please try again later.
                </td>
            </tr>
        `;
    }
}

// Function to handle status updates (both ongoing and resolve)
async function handleStatusUpdate(button, newStatus) {
    const advisoryId = button.dataset.id;
    const statusText = newStatus === 'ongoing' ? 'mark as ongoing' : 'resolve';
    const endpoint = newStatus === 'ongoing' ? 'php/ongoing_advisory.php' : 'php/resolve_advisory.php';

    // Show confirmation dialog
    if (!confirm(`Are you sure you want to ${statusText} this advisory?`)) {
        return;
    }

    try {
        const response = await fetch(endpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                advisory_id: advisoryId
            })
        });

        const result = await response.json();

        if (result.success) {
            // Update UI based on new status
            const row = button.closest('tr');
            const statusBadge = row.querySelector('.status-badge');

            // Update status badge
            statusBadge.className = `status-badge status-${newStatus}`;
            statusBadge.textContent = newStatus.charAt(0).toUpperCase() + newStatus.slice(1);

            // Update buttons
            const actionButtonsCell = row.querySelector('.action-buttons');
            if (newStatus === 'ongoing') {
                actionButtonsCell.innerHTML = `
                    <button class="action-btn resolve-btn" data-id="${advisoryId}">Resolve</button>
                `;
                // Add event listener to new resolve button
                actionButtonsCell.querySelector('.resolve-btn').addEventListener('click', () =>
                    handleStatusUpdate(actionButtonsCell.querySelector('.resolve-btn'), 'resolved')
                );
            } else if (newStatus === 'resolved') {
                actionButtonsCell.innerHTML = `
                    <button class="action-btn resolve-btn resolved" disabled>Resolved</button>
                `;
            }

            // Reload advisories after a short delay
            setTimeout(loadAdvisories, 1000);
        } else {
            throw new Error(result.message || `Failed to ${statusText} advisory`);
        }
    } catch (error) {
        console.error(`Error ${statusText} advisory:`, error);
        alert(`Failed to ${statusText} advisory. Please try again later.`);
    }
}

// Helper function to format date
function formatDate(date) {
    return date.toLocaleString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
    });
}

// Load advisories when the document is ready
document.addEventListener('DOMContentLoaded', loadAdvisories);

// Refresh advisories every 5 minutes
setInterval(loadAdvisories, 5 * 60 * 1000); 