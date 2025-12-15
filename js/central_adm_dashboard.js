document.addEventListener('DOMContentLoaded', function () {
    // Dashboard Tabs
    const tabButtons = document.querySelectorAll('.tabs-header .tab-button');
    const tabContents = document.querySelectorAll('.tabs-container .tab-content');
    const reportsStats = document.querySelector('.reports-stats');
    const advisoriesStats = document.querySelector('.advisories-stats');

    // Initialize default state - show advisories tab
function initializeDefaultTab() {
    // Remove active from all
    tabButtons.forEach(btn => btn.classList.remove('active'));
    tabContents.forEach(content => content.classList.remove('active'));
    
    // Set advisories as active by default (changed from reports)
    const advisoriesButton = document.querySelector('[data-tab="advisories"]');
    const advisoriesTab = document.getElementById('advisories-tab');
    
    if (advisoriesButton && advisoriesTab) {
        advisoriesButton.classList.add('active');
        advisoriesTab.classList.add('active');
    }
    
    // Show advisories stats, hide reports stats (swapped)
    if (reportsStats) reportsStats.style.display = 'none';
    if (advisoriesStats) advisoriesStats.style.display = 'flex';
    
    // Load advisories data on initial load
    loadAdvisories();
    loadAdvisoryStats();
}

    // Initialize on page load
    initializeDefaultTab();
    
    tabButtons.forEach(button => {
        button.addEventListener('click', () => {
            // Remove active class from all buttons and contents
            tabButtons.forEach(btn => btn.classList.remove('active'));
            tabContents.forEach(content => content.classList.remove('active'));

            // Add active class to clicked button and corresponding content
            button.classList.add('active');
            const tabId = button.getAttribute('data-tab') + '-tab';
            const targetTab = document.getElementById(tabId);
            
            if (targetTab) {
                targetTab.classList.add('active');
            }

            // Toggle stats visibility based on selected tab
            if (button.getAttribute('data-tab') === 'advisories') {
                if (reportsStats) reportsStats.style.display = 'none';
                if (advisoriesStats) advisoriesStats.style.display = 'flex';
                // Load advisories data when switching to advisories tab
                loadAdvisories();
                loadAdvisoryStats();
            } else {
                if (reportsStats) reportsStats.style.display = 'flex';
                if (advisoriesStats) advisoriesStats.style.display = 'none';
                // Load reports data when switching to reports tab
                loadReportsData();
                updateComplaintStats();
            }
        });
    });

    // Load reports data function
    function loadReportsData() {
        fetch('php/get_complaints.php')
            .then(res => res.json())
            .then(data => {
                if (data.success) {
                    const tbody = document.getElementById('reports-table-body');
                    updateComplaintStats(data.stats); 
                    if (tbody) {
                        tbody.innerHTML = ''; // Clear existing data
                         const filteredReports = data.data.filter(report =>
                        report.status === 'Verified' || report.status === 'Rejected'
                    );

                    filteredReports.forEach(report => {
                        const row = document.createElement('tr');
                        row.innerHTML = `
                            <td>${report.complaint_id}</td>
                            <td>${report.complaint_type}</td>
                            <td>${report.complaint_date}</td>
                            <td>${report.full_address}</td>
                            <td><span class="status-${report.status.toLowerCase()}">${report.status}</span></td>
                            <td><button class="complaints-view-btn" data-id="${report.complaint_id}">View</button></td>
                        `;
                        tbody.appendChild(row);
                    });

                    // Add event listeners to view buttons
                    document.querySelectorAll('.complaints-view-btn').forEach(btn => {
                        btn.addEventListener('click', e => {
                           // alert("view btn is clicked");
                            const report = filteredReports.find(r => r.complaint_id == btn.dataset.id);
                            if (report) {
                                showComplaintPopup(report);
                            } else {
                                alert('Complaint not found.');
                            }
                        });
                    });
                }
            }
        })
        .catch(error => {
            console.error('Error loading reports:', error);
        });

    }

    function showComplaintPopup(report) {
        console.log('showComplaintPopup called', report);
        const image = report.supporting_img
            ? `<img src="uploads/${report.supporting_img}" alt="Report Image">`
            : '<div class="image-placeholder"><img src="img/ic_imgPlaceholder.png" alt="Placeholder"></div>';

        let actionHTML = '';
        if (report.status === 'Verified') {
            actionHTML = `<button class="resolve-btn" onclick="confirmResolveComplaint('${report.complaint_id}')">Resolve</button>`;
        } else if (report.status === 'Rejected') {
            actionHTML = `<p class="rejection-reason">Reason for rejection: (Not available yet)</p>`;
        }

        const modalContent = `
            <div class="complaint-modal-overlay">
                <div class="complaint-modal">
                    <h3>Complaint #${report.complaint_id}</h3>
                    <p><strong>Type:</strong> ${report.complaint_type}</p>
                    <p><strong>Status:</strong> ${report.status}</p>
                    <p><strong>Submitted:</strong> ${report.complaint_date}</p>
                    <p><strong>Address:</strong> ${report.full_address}</p>
                    <p><strong>Submitted by:</strong> ${report.submitted_by}</p>
                    <p><strong>Contact:</strong> ${report.contact_no} || N/A</p>
                    <p><strong>Description:</strong> ${report.complaint_description ? report.complaint_description : 'No description provided.'}</p>
                    ${image}
                    ${actionHTML}
                    <button onclick="closeComplaintModal()">Close</button>
                </div>
            </div>
        `;
        document.body.insertAdjacentHTML('beforeend', modalContent);
    }

    function closeComplaintModal() {
        const modal = document.querySelector('.complaint-modal-overlay');
        if (modal) modal.remove();
    }

    // Make closeModal globally available
    window.closeComplaintModal = closeComplaintModal;

    window.confirmResolveComplaint = function(complaint_id) {
    if (confirm('Are you sure you want to mark this complaint as resolved?')) {
        fetch('php/update_complaintStatus.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ complaint_id: complaint_id, status: 'Resolved' })
        })
        .then(res => res.json())
        .then(data => {
            if (data.success) {
                alert('Complaint marked as resolved.');
                closeComplaintModal();
                // Optionally reload complaints table:
                if (typeof loadReportsData === 'function') loadReportsData();
            } else {
                alert('Failed to update status: ' + (data.message || 'Unknown error'));
            }
        })
        .catch(() => alert('Error updating complaint status.'));
    }
};

    // --- Table search/filter logic for advisories ---
    const tableBody = document.querySelector(".table-scroll-wrapper tbody");
    const searchBar = document.querySelector(".controls-container input[type='text'], .search-bar");
    const loadingIndicator = document.querySelector(".loading");

    

    function loadAdvisoriesDashboard() {
        const tableBody = document.getElementById('advisories-table-body');
        const loadingIndicator = document.querySelector('#advisories-tab .loading');
        if (loadingIndicator) loadingIndicator.style.display = "flex";
        fetch('php/get_advisories2.php')
            .then(response => response.text())
            .then(html => {
                if (loadingIndicator) loadingIndicator.style.display = "none";
                if (tableBody) tableBody.innerHTML = html;
                addStatusColorClasses();
            })
            .catch(error => {
                if (loadingIndicator) loadingIndicator.style.display = "none";
                console.error('Error loading advisories:', error);
            });
    }

    function addStatusColorClasses() {
        document.querySelectorAll('td').forEach(td => {
            const text = td.textContent.trim().toLowerCase();
            td.classList.remove(
                'status-ongoing',
                'status-upcoming',
                'status-resolved',
                'status-pending',
                'status-verified',
                'status-rejected'
            );
            if (text === 'ongoing') td.classList.add('status-ongoing');
            else if (text === 'upcoming') td.classList.add('status-upcoming');
            else if (text === 'resolved') td.classList.add('status-resolved');
            else if (text === 'pending') td.classList.add('status-pending');
            else if (text === 'verified') td.classList.add('status-verified');
            else if (text === 'rejected') td.classList.add('status-rejected');
        });
    }

    function filterAdvisories(searchTerm) {
        // Add your filter logic here
        console.log('Filtering advisories with term:', searchTerm);
    }

    if (searchBar) {
        searchBar.addEventListener("input", function () {
            const searchTerm = this.value.toLowerCase().trim();
            filterAdvisories(searchTerm);
        });
    }

    // --- Analytics Tab Switching ---
    // Fixed analytics tab switching function
    window.switchTab = function(event, tabName) {
    event.preventDefault();

    // Find the analytics section
    const analyticsSection = document.querySelector('.analytics-section');
    if (!analyticsSection) return;

    // Get all tab buttons and tab contents within analytics section
    const tabButtons = analyticsSection.querySelectorAll('.tab-button');
    const tabContents = analyticsSection.querySelectorAll('.tab-content');

    // If trends tab, show popup and return early (do not switch tab)
    if (tabName === 'trends') {
        const modal = document.getElementById('trendsComingSoon');
        if (modal) modal.style.display = 'flex';
        return;
    }

    // Remove 'active' from all buttons and contents
    tabButtons.forEach(btn => btn.classList.remove('active'));
    tabContents.forEach(content => content.classList.remove('active'));

    // Add 'active' to clicked button and corresponding content
    event.target.classList.add('active');

    // Handle different tab names
    let targetTabId;
    if (tabName === 'plan') {
        targetTabId = 'insights';
    } else {
        targetTabId = tabName;
    }

    const tabContent = analyticsSection.querySelector(`#${targetTabId}`);
    if (tabContent) {
        tabContent.classList.add('active');
    }

    // Load data based on selected tab
    if (targetTabId === 'insights') {
        setTimeout(() => {
            renderAdvisoryTypeChart();
            renderAffectedAreasChart();
            updatePlanInfoCards();
        }, 100);
    }

// Optionally, call this on page load if "plan" is the default active tab
handlePlanTabActivation();
    };

    // Initialize analytics section with default tab (insights)
    function initializeAnalyticsTab() {
        const analyticsSection = document.querySelector('.analytics-section');
        if (analyticsSection) {
            const tabButtons = analyticsSection.querySelectorAll('.tab-button');
            const tabContents = analyticsSection.querySelectorAll('.tab-content');
            
            // Remove active from all
            tabButtons.forEach(btn => btn.classList.remove('active'));
            tabContents.forEach(content => content.classList.remove('active'));
            
            // Set insights as active by default
            const insightsButton = analyticsSection.querySelector('.tab-button');
            const insightsTab = analyticsSection.querySelector('#insights');
            
            if (insightsButton) insightsButton.classList.add('active');
            if (insightsTab) insightsTab.classList.add('active');
            
            // Load initial data
            setTimeout(() => {
                renderAdvisoryTypeChart();
                renderAffectedAreasChart();
                updatePlanInfoCards();
            }, 100);
        }
    }

    // Initialize analytics section
    initializeAnalyticsTab();
        const closeBtn = document.getElementById('closeComingSoon');
        const modal = document.getElementById('trendsComingSoon');
        if (closeBtn && modal) {
        closeBtn.addEventListener('click', function () {
            modal.style.display = 'none';
        });
        modal.addEventListener('click', function (e) {
            if (e.target === modal) modal.style.display = 'none';
        });
        }
    // --- Logout Popup ---
    window.showLogoutPopup = function () {
        const popup = document.getElementById('logoutPopup');
        if (popup) popup.style.display = 'flex';
    };
    
    window.hideLogoutPopup = function () {
        const popup = document.getElementById('logoutPopup');
        if (popup) popup.style.display = 'none';
    };
    
    window.confirmLogout = function () {
        window.location.href = 'php/logout_user.php';
    };
    
    window.goToProfile = function () {
        window.location.href = 'central_adm_profile.html';
    };

    // --- Dropdown ---
    window.toggleDropdown = function () {
        const dropdown = document.getElementById('dropdownMenu');
        if (dropdown) dropdown.classList.toggle('show');
    };

    // --- Mobile Menu ---
    const mobileMenuToggle = document.getElementById('mobile-menu-toggle');
    const mobileMenu = document.querySelector('.mobile-menu');
    if (mobileMenuToggle && mobileMenu) {
        mobileMenuToggle.addEventListener('click', function (e) {
            e.stopPropagation();
            mobileMenu.classList.toggle('show');
        });
    }

    document.addEventListener('click', function (e) {
        // Dropdown
        if (!e.target.closest('.dropbtn')) {
            const menu = document.getElementById('dropdownMenu');
            if (menu) menu.classList.remove('show');
        }
        // Logout popup
        const logoutPopup = document.getElementById('logoutPopup');
        if (logoutPopup && logoutPopup.style.display === 'flex') {
            if (!e.target.closest('#logoutPopup') && !e.target.closest('.logout-button') && !e.target.closest('.logout')) {
                logoutPopup.style.display = 'none';
            }
        }
        // Mobile menu
        if (
            mobileMenu &&
            !e.target.closest('.mobile-menu') &&
            !e.target.closest('#mobile-menu-toggle')
        ) {
            mobileMenu.classList.remove('show');
        }
    });

    // --- Chart and Info Card Functions ---
    function renderAdvisoryTypeChart() {
        const ctx = document.getElementById('advisoryTypeChart');
        if (!ctx) return;

        fetch('php/advisory_frequency_duration.php')
            .then(res => res.json())
            .then(result => {
                if (!result.success) return;

                const data = result.data;
                const labels = data.map(d => d.advisory_type);
                const counts = data.map(d => d.total_advisories);
                const avgDurations = data.map(d => Number(d.avg_duration_hours));

                if (window.advisoryTypeChartInstance) {
                    window.advisoryTypeChartInstance.destroy();
                }

                window.advisoryTypeChartInstance = new Chart(ctx, {
                    type: 'bar',
                    data: {
                        labels: labels,
                        datasets: [
                            {
                                label: 'Number of Advisories',
                                data: counts,
                                backgroundColor: 'rgba(52, 152, 219, 0.85)',
                                borderRadius: 8,
                                barPercentage: 0.6,
                                categoryPercentage: 0.5,
                                maxBarThickness: 32
                            },
                            {
                                label: 'Avg. Duration (hrs)',
                                data: avgDurations,
                                backgroundColor: 'rgba(39, 174, 96, 0.7)',
                                borderRadius: 8,
                                barPercentage: 0.6,
                                categoryPercentage: 0.5,
                                maxBarThickness: 32,
                                xAxisID: 'x1'
                            }
                        ]
                    },
                    options: {
                        indexAxis: 'y',
                        responsive: true,
                        plugins: {
                            legend: {
                                display: true,
                                labels: {
                                    color: '#222',
                                    font: { size: 13, family: 'Poppins, Arial, sans-serif', weight: 'bold' }
                                }
                            },
                            title: {
                                display: true,
                                text: 'Water Advisory Types & Impact Duration',
                                color: '#222',
                                font: { size: 16, weight: 'bold', family: 'Poppins, Arial, sans-serif' }
                            },
                            tooltip: {
                                callbacks: {
                                    label: function(context) {
                                        if (context.datasetIndex === 0) {
                                            return `Count: ${context.parsed.x}`;
                                        } else {
                                            return `Avg. Duration: ${context.parsed.x.toFixed(1)} hrs`;
                                        }
                                    }
                                }
                            }
                        },
                        scales: {
                            x: {
                                beginAtZero: true,
                                title: { display: false },
                                grid: { color: '#f0f0f0' },
                                ticks: { color: '#222', font: { size: 12 } }
                            },
                            x1: {
                                position: 'top',
                                beginAtZero: true,
                                grid: { drawOnChartArea: false },
                                ticks: { color: '#27ae60', font: { size: 12 } },
                                title: { display: false },
                                suggestedMax: Math.max(...avgDurations) + 5
                            },
                            y: {
                                title: { display: false },
                                grid: { display: false },
                                ticks: { color: '#222', font: { size: 13 } }
                            }
                        }
                    }
                });
            })
            .catch(error => {
                console.error('Error loading advisory type chart:', error);
            });
    }

    function renderAffectedAreasChart() {
        const ctx = document.getElementById('affectedAreas');
        if (!ctx) return;

        fetch('php/affected_areas_summary.php')
            .then(res => res.json())
            .then(result => {
                if (!result.success) return;

                const data = result.data.slice(0, 10);
                const labels = data.map(d => ` ${d.brgy_number}`);
                const counts = data.map(d => d.total_affected);

                if (window.affectedAreasChartInstance) {
                    window.affectedAreasChartInstance.destroy();
                }

                window.affectedAreasChartInstance = new Chart(ctx, {
                    type: 'bar',
                    data: {
                        labels: labels,
                        datasets: [{
                            label: 'Advisory Count',
                            data: counts,
                            backgroundColor: 'rgba(52, 152, 219, 0.85)',
                            borderRadius: 8,
                            maxBarThickness: 32
                        }]
                    },
                    options: {
                        indexAxis: 'y',
                        responsive: true,
                        plugins: {
                            legend: { display: false },
                            title: {
                                display: true,
                                text: 'Most Affected Barangays by Water Interruptions',
                                color: '#222',
                                font: { size: 16, weight: 'bold', family: 'Poppins, Arial, sans-serif' }
                            },
                            tooltip: {
                                callbacks: {
                                    label: ctx => `Count: ${ctx.parsed.x}`
                                }
                            }
                        },
                        scales: {
                            x: {
                                beginAtZero: true,
                                grid: { color: '#f0f0f0' },
                                ticks: { color: '#222', font: { size: 12 } }
                            },
                            y: {
                                grid: { display: false },
                                ticks: { color: '#222', font: { size: 13 } }
                            }
                        }
                    }
                });
            })
            .catch(error => {
                console.error('Error loading affected areas chart:', error);
            });
    }

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

    function updateComplaintStats(stats) {
    if (!stats) return; // ← THIS is the key line

    document.getElementById('total').textContent = stats.total ?? 0;
    document.getElementById('pending').textContent = stats.pending ?? 0;
    document.getElementById('verified').textContent = stats.verified ?? 0;
    document.getElementById('resolved').textContent = stats.resolved ?? 0;
    document.getElementById('rejected').textContent = stats.rejected ?? 0;
}

    function updatePlanInfoCards() {
        fetch('php/advisory_frequency_duration.php')
            .then(res => res.json())
            .then(result => {
                if (!result.success) return;
                const data = result.data;

                // Most Frequent Advisory Type
                const mostFrequent = data.reduce((a, b) => a.total_advisories > b.total_advisories ? a : b, data[0]);
                const frequentElement = document.getElementById('frequentAdvisory');
                if (frequentElement) frequentElement.textContent = mostFrequent.advisory_type;

                // Longest Average Duration
                const longestDuration = data.reduce((a, b) => a.avg_duration_hours > b.avg_duration_hours ? a : b, data[0]);
                const durationElement = document.getElementById('longestAvgDuration');
                if (durationElement) {
                    durationElement.innerHTML =
                        `<span style="font-size:2em;font-weight:bold;line-height:1">${longestDuration.avg_duration_hours} hrs</span><br>
                         <span style="font-size:0.5em;color:#e6685a;line-height:1">${longestDuration.advisory_type}</span>`;
                }
            })
            .catch(error => {
                console.error('Error updating plan info cards:', error);
            });

        // Most Affected Barangay
        fetch('php/affected_areas_summary.php')
            .then(res => res.json())
            .then(result => {
                if (!result.success) return;
                const data = result.data;
                if (data.length > 0) {
                    const mostAffected = data[0];
                    const brgyElement = document.getElementById('mostAffectedBrgy');
                    if (brgyElement) {
                        brgyElement.innerHTML =
                            `<span style="font-size:1.4em;font-weight:bold;line-height:1;justify-content: center;">${mostAffected.brgy_number} </span>`;
                    }
                }
            })
            .catch(error => {
                console.error('Error updating barangay info:', error);
            });
    }

    function updateAdvisoryStats(data) {
        if (!data || !data.stats) return;

        // Update stats in the UI
        const statsContainer = document.querySelector('.advisories-stats');
        if (statsContainer) {
            const totalElement = statsContainer.querySelector('.total .stat-number');
            const upcomingElement = statsContainer.querySelector('.upcoming .stat-number');
            const ongoingElement = statsContainer.querySelector('.ongoing .stat-number');
            const resolvedElement = statsContainer.querySelector('.resolved .stat-number');
            
            if (totalElement) totalElement.textContent = data.stats.total;
            if (upcomingElement) upcomingElement.textContent = data.stats.upcoming;
            if (ongoingElement) ongoingElement.textContent = data.stats.ongoing;
            if (resolvedElement) resolvedElement.textContent = data.stats.resolved;
        }
    }

    async function loadAdvisoryStats() {
        try {
            const response = await fetch('php/get_advisories2.php');
            if (!response.ok) throw new Error('Failed to fetch advisories');

            const data = await response.json();
            if (data.success) {
                updateAdvisoryStats(data);
            }
        } catch (error) {
            console.error('Error loading advisory stats:', error);
        }
    }

    // Chart.js Matrix registration (if needed)
    if (window.Chart && window.ChartMatrix) {
        Chart.register(
            ChartMatrix.MatrixController,
            ChartMatrix.MatrixElement
        );
    }

});

  