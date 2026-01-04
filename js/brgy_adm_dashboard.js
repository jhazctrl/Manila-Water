if (window.Chart && window.ChartMatrix) {
  Chart.register(
    ChartMatrix.MatrixController,
    ChartMatrix.MatrixElement
  );
}
document.addEventListener("DOMContentLoaded", function () {
  console.log("JavaScript loaded successfully!");

  // --- Table search/filter logic for advisories ---
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
    fetch('php/get_advisories.php')
      .then(response => response.text())
      .then(html => {
        if (loadingIndicator) loadingIndicator.style.display = "none";
        tableBody.innerHTML = html;
        // Add status color classes after loading
        addStatusColorClasses();
        allRows = Array.from(tableBody.querySelectorAll('tr')).map(row => row.cloneNode(true));
      })
      .catch(error => {
        if (loadingIndicator) loadingIndicator.style.display = "none";
        console.error('Error loading advisories:', error);
      });
  }

  // Add status color classes to the status column
  function addStatusColorClasses() {
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


  const infoIcon = document.getElementById('heatmapInfoIcon');
  const tooltip = document.getElementById('heatmapTooltip');
  if (infoIcon && tooltip) {
    infoIcon.addEventListener('click', function (e) {
      e.stopPropagation();
      tooltip.style.display = tooltip.style.display === 'none' || tooltip.style.display === '' ? 'block' : 'none';
    });
    document.addEventListener('click', function (e) {
      if (!tooltip.contains(e.target) && e.target !== infoIcon) {
        tooltip.style.display = 'none';
      }
    });
  }


  function renderVerificationResolutionChart() {
  const canvas = document.getElementById('verificationResolutionLineChart');
  if (!canvas) return;

  fetch('php/get_complaintsResolution.php')
    .then(res => res.json())
    .then(data => {
      if (!data.success) return;

      const labels = ["Average Verification Time", "Average Resolution Time"];
      const values = [
        data.average_verify_time_hrs,
        data.average_resolve_time_hrs
      ];

      // Destroy previous instance if exists
      if (window.verResChart) window.verResChart.destroy();

      const ctx = canvas.getContext('2d');
      window.verResChart = new Chart(ctx, {
        type: 'bar',
        data: {
          labels: labels,
          datasets: [{
            label: 'Hours',
            data: values,
            backgroundColor: ['#f3a712', '#76b041'],
            borderColor: ['#f3a712', '#76b041'],
            borderWidth: 2,
            borderRadius: 8,
            borderSkipped: false,
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { 
              display: false 
            },
            title: {
              display: false
            },
            tooltip: {
              callbacks: {
                label: function(context) {
                  return `${context.label}: ${context.parsed.y} hours`;
                }
              },
              backgroundColor: 'rgba(0, 0, 0, 0.8)',
              titleColor: '#fff',
              bodyColor: '#fff',
              cornerRadius: 6
            }
          },
          scales: {
            x: {
              title: {
                display: false
              },
              ticks: {
                color: '#444',
                font: { 
                  size: 12, 
                  weight: '600', 
                  family: 'Inter, system-ui, sans-serif' 
                },
                maxRotation: 0
              },
              grid: { 
                display: false 
              }
            },
            y: {
              beginAtZero: true,
              title: {
                display: true,
                text: 'Number of Hours',
                color: '#222',
                font: { 
                  size: 13, 
                  weight: '600', 
                  family: 'Inter, system-ui, sans-serif' 
                }
              },
              ticks: { 
                color: '#444', 
                font: { size: 12 }
              },
              grid: { 
                color: '#f0f0f0',
                drawBorder: false
              }
            }
          },
          layout: {
            padding: {
              top: 10,
              bottom: 10,
              left: 10,
              right: 10
            }
          }
        }
      });
    })
    .catch(error => {
      console.error('Error fetching verification/resolution data:', error);
    });
}

  // --- Reports logic ---
  let allReports = [];

function createReportCard(report) {
  const statusClass = report.status.toLowerCase().replace(' ', '-');
  const isPending = report.status.toLowerCase() === 'pending';
  const imageContent = report.supporting_img
    ? `<img src="uploads/${report.supporting_img}" alt="Report photo">`
    : '<div class="image-placeholder"><img src="img/ic_imgPlaceholder.png" alt="Placeholder Image"></div>';

  return `
    <div class="report-card ${isPending ? 'pending-card' : ''}" data-report-id="${report.complaint_id}">
      <div class="status-badge ${statusClass}">${report.status}</div>
      <div class="report-image">
        ${imageContent}
      </div>
      <div class="report-content">
        <div class="report-header">
          <div class="report-id">${report.complaint_id}</div>
          <div class="report-date">${report.complaint_date}</div>
        </div>
        <div class="report-location">
          <div class="location-icon"><i class="fas fa-map-marker-alt"></i></div>
          <div class="location-text">${report.full_address}</div>
        </div>
        <div class="report-submitted-by">
          <div class="user-icon"><i class="fas fa-user"></i></div>
          <div class="submitted-by-text">${report.submitted_by}</div>
        </div>
        <div class="report-type">${report.complaint_type}</div>
        <div class="report-description">
          ${report.complaint_description || 'No description provided.'}
        </div>
        ${isPending ? `
          <div class="report-actions">
            <button class="verify-btn"><i class="fas fa-check"></i> Verify</button>
            <button class="reject-btn"><i class="fas fa-times"></i> Reject</button>
          </div>` : ''}
      </div>
    </div>
  `;
}





function renderReports(reports) {
  const container = document.querySelector('.report-box');
  if (!container) {
    console.error('Report box container not found');
    return;
  }

  if (reports.length === 0) {
    container.innerHTML = `
      <div class="no-reports">
        <div class="no-reports-icon"><i class="fas fa-exclamation-triangle"></i></div>
        <p>No reports found</p>
      </div>
    `;
    return;
  }

  container.innerHTML = `
    <div class="report-cards-container">
      ${reports.map(report => createReportCard(report)).join('')}
    </div>
  `;
}

function renderReportsWrapper(data) {
  if (!data.success) {
    console.error("Failed to load reports. Full response:", data);
    return;
  }


  let reports = [];

  // Role 2: data grouped by status
  if (typeof data.data === 'object' && !Array.isArray(data.data)) {
    for (const status in data.data) {
      if (Array.isArray(data.data[status])) {
        reports = reports.concat(data.data[status]);
      }
    }
  } else if (Array.isArray(data.data)) {
    // Role 1: flat list
    reports = data.data;
  }

  allReports = reports; // ← SET this globally
  renderReports(allReports);
}

// Confirmation modal HTML (append to body if not present)
function ensureConfirmationModal() {
  if (!document.getElementById('confirmActionModal')) {
    const modal = document.createElement('div');
    modal.id = 'confirmActionModal';
    modal.className = 'modal';
    modal.innerHTML = `
      <div class="modal-content">
        <p id="confirmActionText"></p>
        <div class="modal-actions">
          <button id="confirmYesBtn" class="confirm-btn">Yes</button>
          <button id="confirmNoBtn" class="cancel-btn">No</button>
        </div>
      </div>
    `;
    document.body.appendChild(modal);

    // Close modal on "No"
    document.getElementById('confirmNoBtn').onclick = () => {
      modal.style.display = 'none';
    };
  }
}

// Show confirmation modal
function showConfirmation(action, reportId, callback) {
  ensureConfirmationModal();
  const modal = document.getElementById('confirmActionModal');
  const text = document.getElementById('confirmActionText');
  text.textContent = `Are you sure you want to ${action} this report?`;
  modal.style.display = 'flex';

  // Remove previous listeners
  const yesBtn = document.getElementById('confirmYesBtn');
  yesBtn.replaceWith(yesBtn.cloneNode(true));
  const newYesBtn = document.getElementById('confirmYesBtn');
  newYesBtn.onclick = () => {
    modal.style.display = 'none';
    callback(reportId);
  };
}

// Delegate click events for verify/reject buttons
document.addEventListener('click', function (e) {
  if (e.target.classList.contains('verify-btn')) {
    const card = e.target.closest('.report-card');
    const reportId = card ? card.getAttribute('data-report-id') : null;
    showConfirmation('verify', reportId, function(id) {
      
      updateComplaintStatus(id, 'verified');
    });
  }
  if (e.target.classList.contains('reject-btn')) {
    const card = e.target.closest('.report-card');
    const reportId = card ? card.getAttribute('data-report-id') : null;
    showConfirmation('reject', reportId, function(id) {
      
      updateComplaintStatus(id, 'rejected');
    });
  }
});

function updateComplaintStatus(reportId, newStatus) {
  fetch('php/update_complaintStatus.php', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ complaint_id: reportId, status: newStatus })
  })
  .then(res => res.text())
  .then(text => {
    console.log('Raw response:', text); 
    return JSON.parse(text);
  })
  .then(data => {
    if (data.success) {
      alert(`Complaint ${reportId} marked as ${newStatus}`);
      loadReports();
      refreshComplaintsOverview(); 
    } else {
      alert('Failed to update status: ' + data.message);
    }
  })
  .catch(err => {
    console.error('Request failed:', err);
    alert('Network error while updating status.');
  });
}

async function loadReports() {
  try {
    const response = await fetch('php/load_complaints.php');
    const data = await response.json();
    renderReportsWrapper(data);

    // --- Make "Pending" active and show pending complaints by default ---
    const pendingBtn = document.getElementById('pendings');
    if (pendingBtn) {
      // Remove 'active' from all filter buttons
      document.querySelectorAll('.filter-btn').forEach(btn => btn.classList.remove('active'));
      // Add 'active' to pending button
      pendingBtn.classList.add('active');
      // Filter and render only pending complaints
      const pendingOnly = allReports.filter(report => report.status.toLowerCase() === 'pending');
      renderReports(pendingOnly);
    }
  } catch (error) {
    console.error('Network error:', error);
    const container = document.querySelector('.report-box');
    if (container) {
      container.innerHTML = `
        <div class="no-reports">
          <div class="no-reports-icon">⚠️</div>
          <p>Network error loading reports</p>
        </div>
      `;
    }
  }
}
loadReports();

const allSortWrapper = document.querySelector('.all-sort-wrapper');
const allBtn = document.getElementById('allComplaints');
const pendingBtn = document.getElementById('pendings');

// Hide the sort icon by default on page load
if (allSortWrapper) {
  allSortWrapper.style.display = 'none';
}

// "Pending" tab click: hide sort icon
if (pendingBtn) {
  pendingBtn.addEventListener('click', () => {
    document.querySelectorAll('.filter-btn').forEach(btn => btn.classList.remove('active'));
    pendingBtn.classList.add('active');
    if (allSortWrapper) allSortWrapper.style.display = 'none';

    const pendingOnly = allReports.filter(report => report.status.toLowerCase() === 'pending');
    renderReports(pendingOnly);
  });
}

// "All Complaints" tab click: show sort icon
if (allBtn) {
  allBtn.addEventListener('click', () => {
    document.querySelectorAll('.filter-btn').forEach(btn => btn.classList.remove('active'));
    allBtn.classList.add('active');
    if (allSortWrapper) allSortWrapper.style.display = '';

    const resolvedTypes = ['verified', 'rejected', 'resolved'];
    const filteredReports = allReports.filter(report =>
  resolvedTypes.includes(report.status.toLowerCase())
);
    renderReports(filteredReports);
  });
}

// Hide the sort wrapper when any other filter tab is clicked
document.querySelectorAll('.filter-btn:not(#allComplaints):not(#pendings)').forEach(btn => {
  btn.addEventListener('click', () => {
    if (allSortWrapper) allSortWrapper.style.display = 'none';
  });
});

const reportSearchInput = document.querySelector('.report-search input');
if (reportSearchInput) {
  reportSearchInput.addEventListener('input', function (e) {
    const searchTerm = e.target.value.trim();
    const pendingBtn = document.getElementById('pendings');
    const allBtn = document.getElementById('allComplaints');
    const resolvedTypes = ['verified', 'rejected', 'resolved'];

    if (pendingBtn && pendingBtn.classList.contains('active')) {
      if (searchTerm === '') {
        // Show all pending if search is empty
        const pendingOnly = allReports.filter(report => report.status.toLowerCase() === 'pending');
        renderReports(pendingOnly);
      } else {
        // Search only among pending
        const filtered = allReports.filter(report => {
          if (report.status.toLowerCase() !== 'pending') return false;
          const searchText = searchTerm.toLowerCase()
            .replace(/barangay[\s-]*/gi, "brgy-")
            .replace(/brgy[\s-]*/gi, "brgy-");
          const reportText = (
            report.complaint_id + ' ' +
            report.complaint_type + ' ' +
            report.complaint_description + ' ' +
            report.full_address + ' ' +
            report.brgy_number + ' ' +
            report.street_name + ' ' +
            report.submitted_by
          ).toLowerCase()
            .replace(/barangay[\s-]*/gi, "brgy-")
            .replace(/brgy[\s-]*/gi, "brgy-");
          return reportText.includes(searchText);
        });
        renderReports(filtered);
      }
    } else if (allBtn && allBtn.classList.contains('active')) {
      if (searchTerm === '') {
        // Show all resolved/verified/rejected if search is empty
        const filteredReports = allReports.filter(report =>
          resolvedTypes.includes(report.status.toLowerCase())
        );
        renderReports(filteredReports);
      } else {
        // Search only among resolved/verified/rejected
        const filtered = allReports.filter(report => {
          if (!resolvedTypes.includes(report.status.toLowerCase())) return false;
          const searchText = searchTerm.toLowerCase()
            .replace(/barangay[\s-]*/gi, "brgy-")
            .replace(/brgy[\s-]*/gi, "brgy-");
          const reportText = (
            report.complaint_id + ' ' +
            report.complaint_type + ' ' +
            report.complaint_description + ' ' +
            report.full_address + ' ' +
            report.brgy_number + ' ' +
            report.street_name + ' ' +
            report.submitted_by
          ).toLowerCase()
            .replace(/barangay[\s-]*/gi, "brgy-")
            .replace(/brgy[\s-]*/gi, "brgy-");
          return reportText.includes(searchText);
        });
        renderReports(filtered);
      }
    }
  });
}

    const toggle = document.getElementById('sortToggleAnalytics');
    const dropdown = document.getElementById('sortDropdownAnalytics');

    toggle.addEventListener('click', function () {
      dropdown.style.display = dropdown.style.display === 'block' ? 'none' : 'block';
    });

    // Hide dropdown when clicking outside
    document.addEventListener('click', function (e) {
      if (!e.target.closest('.sort-wrapper')) {
        dropdown.style.display = 'none';
      }
    });

    // Optional: Handle sort option clicks
    document.querySelectorAll('.sort-option').forEach(button => {
      button.addEventListener('click', function () {
        const value = this.dataset.range;
        console.log('Selected range:', value); // Replace with your logic
        dropdown.style.display = 'none';
      });
    });

  const mobileMenuToggle = document.getElementById('mobile-menu-toggle');
  const mobileMenu = document.querySelector('.mobile-menu');
  if (mobileMenuToggle && mobileMenu) {
    mobileMenuToggle.addEventListener('click', function (e) {
      e.stopPropagation();
      mobileMenu.classList.toggle('show');
    });
  }
  document.addEventListener('click', function (e) {
    if (
      mobileMenu &&
      !e.target.closest('.mobile-menu') &&
      !e.target.closest('#mobile-menu-toggle')
    ) {
      mobileMenu.classList.remove('show');
    }
  });


 window.toggleDropdown = function () {
    document.getElementById('dropdownMenu').classList.toggle('show');
  };

  window.onclick = function (e) {
    if (!e.target.closest('.dropbtn')) {
      const menu = document.getElementById('dropdownMenu');
      if (menu) menu.classList.remove('show');
    }
  };

  window.openMWSS = function () {
    window.open("https://my.manilawater.app/", "_blank");
  };

  window.showLogoutPopup = function () {
    document.getElementById('logoutPopup').style.display = 'flex';
  };
  window.hideLogoutPopup = function () {
    document.getElementById('logoutPopup').style.display = 'none';
  };
  window.confirmLogout = function () {
    window.location.href = 'php/logout_user.php';
  };
  window.goToProfile = function () {
    window.location.href = 'brgy_adm_profile.html';
  };
  
  // --- Chart and Info Cards ---
let recurringProblemsChartInstance = null;

function renderRecurringProblemsChart() {
  const canvas = document.getElementById('recurringProblemsChart');
  if (!canvas) {
    console.warn('recurringProblemsChart canvas not found.');
    return;
  }

  fetch('php/get_recurringProblems.php')
    .then(res => res.json())
    .then(data => {
      if (!data.success) {
        console.error('Error loading data:', data.message);
        return;
      }

      const dataset = data.data;

      // Get unique complaint types and assign colors
      const typeColors = [
        '#007acc', '#e4572e', '#76b041', '#f3a712', '#a259f7', '#17bebb', '#ff6f61', '#4e79a7'
      ];
      const complaintTypes = [...new Set(dataset.map(item => item.complaint_type))];
      const typeColorMap = {};
      complaintTypes.forEach((type, idx) => {
        typeColorMap[type] = typeColors[idx % typeColors.length];
      });

      // Get unique streets
      const streets = [...new Set(dataset.map(item => item.street_name))];

      // Build datasets: one per complaint type (for stacked bar)
      const chartDatasets = complaintTypes.map(type => ({
        label: type,
        data: streets.map(street => {
          const found = dataset.find(item => item.street_name === street && item.complaint_type === type);
          return found ? found.total : 0;
        }),
        backgroundColor: typeColorMap[type],
        borderRadius: 0,
        barPercentage: 0.7,
        categoryPercentage: 0.7,
        borderSkipped: false,
      }));

      const ctx = canvas.getContext('2d');
      if (window.recurringProblemsChartInstance) {
        window.recurringProblemsChartInstance.destroy();
      }
      window.recurringProblemsChartInstance = new Chart(ctx, {
        type: 'bar',
        data: {
          labels: streets,
          datasets: chartDatasets
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              display: true,
              position: 'bottom'
            },
            tooltip: {
              callbacks: {
                label: function(context) {
                  return `${context.dataset.label}: ${context.parsed.y ?? context.parsed.x}`;
                }
              }
            },
        
          },
          scales: {
            x: {
              stacked: true,
              title: {
                display: true,
                text: 'Street',
                color: '#222',
                font: { size: 13, weight: '600', family: 'Inter, system-ui, sans-serif' }
              },
              grid: { color: '#f0f0f0' },
              ticks: { color: '#444', font: { size: 12 } }
            },
            y: {
              stacked: true,
              beginAtZero: true,
              title: {
                display: true,
                text: 'No. of Complaints',
                color: '#222',
                font: { size: 13, weight: '600', family: 'Inter, system-ui, sans-serif' }
              },
              grid: { color: '#f0f0f0' },
              ticks: { color: '#444', font: { size: 12 } }
            }
          }
        }
      });

      /*
      const legendContainerId = 'recurringProblemsLegend';
      let legendContainer = document.getElementById(legendContainerId);
      if (!legendContainer) {
        legendContainer = document.createElement('div');
        legendContainer.id = legendContainerId;
        legendContainer.style.display = 'flex';
        legendContainer.style.flexWrap = 'wrap';
        legendContainer.style.gap = '18px';
        legendContainer.style.marginTop = '18px';
        legendContainer.style.justifyContent = 'center';
        canvas.parentNode.appendChild(legendContainer);
      }
      legendContainer.innerHTML = complaintTypes.map(type => `
        <span style="
          display: flex; align-items: center; gap: 7px; font-size: 13px; color: #444; font-family: 'Inter', system-ui, sans-serif;">
          <span style="display:inline-block;width:16px;height:16px;border-radius:4px;background:${typeColorMap[type]};border:1px solid #e0e0e0;"></span>
          ${type}
        </span>
      `).join('');
      */
    })
    .catch(err => {
      console.error('Fetch error:', err);
    });
}

// Only render charts when the "plan" tab is active
function handlePlanTabActivation() {
  if (
    document.getElementById('plan') &&
    document.getElementById('plan').classList.contains('active')
  ) {
   // renderVerificationResolutionChart();
    renderRecurringProblemsChart();
  }
}

// Trends "COMING SOON"
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

window.switchTab = function (event, tabName) {
  if (tabName === 'trends') {
    // DISPLAY MODAL
    const modal = document.getElementById('trendsComingSoon');
    if (modal) modal.style.display = 'flex';
    return;
  }

  // REMOVE ACTIVE CLASS
  const tabButtons = document.querySelectorAll('.tab-button');
  tabButtons.forEach(button => button.classList.remove('active'));

  // ADD ACTIVE CLASS
  event.target.classList.add('active');

  // HIDE TAB CONTENTS
  const tabContents = document.querySelectorAll('.tab-content');
  tabContents.forEach(content => content.classList.remove('active'));

  // DISPLAY SELECTED TAB
  const tabContent = document.getElementById(tabName);
  if (tabContent) {
    tabContent.classList.add('active');
  }

  // If switching to "plan", render charts
  if (tabName === 'plan') {
    handlePlanTabActivation();
  }
};

// Optionally, call this on page load if "plan" is the default active tab
handlePlanTabActivation();


    // --- Initialize the first tab as active ---
const sortToggleAnalytics = document.getElementById('sortToggleAnalytics');
const sortDropdownAnalytics = document.getElementById('sortDropdownAnalytics');

if (sortToggleAnalytics && sortDropdownAnalytics) {
  // Toggle dropdown visibility
  sortToggleAnalytics.addEventListener('click', (e) => {
    e.stopPropagation(); // Prevent document click from immediately hiding
    sortDropdownAnalytics.classList.toggle('show');
  });

  // Hide dropdown when clicking outside
  document.addEventListener('click', function (e) {
    if (!e.target.closest('.sort-wrapper')) {
      sortDropdownAnalytics.classList.remove('show');
    }
  });

  // Handle sort option clicks
  document.querySelectorAll('.sort-option').forEach(button => {
    button.addEventListener('click', function () {
      const range = this.dataset.range;
      fetch(`php/get_complaintsOverview.php?range=${range}`)
        .then(res => res.json())
        .then(data => {
          document.getElementById('verifiedCount').textContent = data.verified;
          document.getElementById('resolvedCount').textContent = data.resolved;
          document.getElementById('rejectedCount').textContent = data.rejected;
          document.getElementById('pendingNew').textContent = data.pending_new;
          document.getElementById('pendingTotal').textContent = data.pending;
        });
      sortDropdownAnalytics.classList.remove('show');
    });
  });

  // --- Display "this week" by default on load ---
  fetch('php/get_complaintsOverview.php?range=week')
    .then(res => res.json())
    .then(data => {
      document.getElementById('verifiedCount').textContent = data.verified;
      document.getElementById('resolvedCount').textContent = data.resolved;
      document.getElementById('rejectedCount').textContent = data.rejected;
      document.getElementById('pendingNew').textContent = data.pending_new;
      document.getElementById('pendingTotal').textContent = data.pending;
    });

} else {
  if (!sortToggleAnalytics) console.warn('#sortToggle not found');
  if (!sortDropdownAnalytics) console.warn('#sortDropdown not found');
}

function refreshComplaintsOverview() {
  fetch('php/get_complaintsOverview.php?range=week')
    .then(res => res.json())
    .then(data => {
      document.getElementById('verifiedCount').textContent = data.verified;
      document.getElementById('resolvedCount').textContent = data.resolved;
      document.getElementById('rejectedCount').textContent = data.rejected;
      document.getElementById('pendingNew').textContent = data.pending_new;
      document.getElementById('pendingTotal').textContent = data.pending;
    })
    .catch(err => {
      console.error('Error refreshing overview:', err);
    });
}

function showSortIconForAllComplaints(active) {
  const sortWrapper = document.getElementById('allSortWrapper');
  if (sortWrapper) {
    sortWrapper.style.display = active ? 'block' : 'none';
  }
}

// Example: When "Completed complaints" tab is clicked
document.getElementById('allComplaints').addEventListener('click', function() {
  showSortIconForAllComplaints(true);
});

// Example: When "Pending complaints" tab is clicked
document.getElementById('pendings').addEventListener('click', function() {
  showSortIconForAllComplaints(false);
});

// Optionally, show by default if "Completed complaints" is default
showSortIconForAllComplaints(true);

const sortToggleReports = document.getElementById('sortToggleReports');
const sortDropdownReports = document.getElementById('sortDropdownReports');

if (sortToggleReports && sortDropdownReports && allBtn) {
  
  sortToggleReports.addEventListener('click', (e) => {
    e.stopPropagation(); 
    sortDropdownReports.classList.toggle('show');
  });

  // Hide dropdown when clicking outside
  document.addEventListener('click', function (e) {
    if (!e.target.closest('.report-sort-icon')) {
      sortDropdownReports.classList.remove('show');
    }
  });

  
  sortDropdownReports.querySelectorAll('.sort-option').forEach(button => {
    button.addEventListener('click', function () {
      const range = this.dataset.range;
      
      if (allBtn.classList.contains('active')) {
        fetch(`php/load_complaints.php?range=${range}`)
          .then(res => res.json())
          .then(data => {
            renderReportsWrapper(data);
            const resolvedTypes = ['verified', 'rejected', 'resolved'];
            const filteredReports = allReports.filter(report =>
              resolvedTypes.includes(report.status)
            );
            renderReports(filteredReports);
          });
      }
      sortDropdownReports.classList.remove('show');
    });
  });
}

});
