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


  function renderHeatmap() {
    const canvas = document.getElementById('heatmap');
    if (!canvas) return;

    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    // Enhanced color function: Green → Yellow → Orange → Red
    function getColor(v) {
        const max = 10;
        const min = 0;
        const percent = Math.min(1, Math.max(0, (v - min) / (max - min)));
        if (percent < 0.33) {
            // Green to Yellow
            const localPercent = percent / 0.33;
            const r = Math.round(39 + localPercent * (243 - 39));
            const g = Math.round(174 + localPercent * (156 - 174));
            const b = Math.round(96 + localPercent * (18 - 96));
            return `rgba(${r}, ${g}, ${b}, 0.9)`;
        } else if (percent < 0.66) {
            // Yellow to Orange
            const localPercent = (percent - 0.33) / 0.33;
            const r = Math.round(243 + localPercent * (255 - 243));
            const g = Math.round(156 + localPercent * (126 - 156));
            const b = Math.round(18 + localPercent * (0 - 18));
            return `rgba(${r}, ${g}, ${b}, 0.9)`;
        } else {
            // Orange to Red
            const localPercent = (percent - 0.66) / 0.34;
            const r = 255;
            const g = Math.round(126 + localPercent * (63 - 126));
            const b = Math.round(0 + localPercent * (63 - 0));
            return `rgba(${r}, ${g}, ${b}, 0.9)`;
        }
    }

    fetch('php/get_hourlyRisk.php')
        .then(res => res.json())
        .then(data => {

          const hourTotals = Array(24).fill(0);
        data.forEach(d => {
            hourTotals[d.x] += d.v;
        });
        // Find the hour with the highest total
        let maxHour = 0;
        let maxValue = hourTotals[0];
        for (let i = 1; i < 24; i++) {
            if (hourTotals[i] > maxValue) {
                maxHour = i;
                maxValue = hourTotals[i];
            }
        }
        // Format as AM/PM
        const hour12 = maxHour % 12 === 0 ? 12 : maxHour % 12;
        const ampm = maxHour < 12 ? 'AM' : 'PM';
        const formattedHour = `${hour12}:00 ${ampm}`;

        // Set the value in the info card
        const avgDurationElem = document.getElementById('avgDuration');
        if (avgDurationElem) {
            avgDurationElem.textContent = formattedHour;
        }
        
            const ctx = canvas.getContext('2d');
            if (window.heatmapChart) window.heatmapChart.destroy();
            window.heatmapChart = new Chart(ctx, {
                type: 'matrix',
                data: {
                    datasets: [{
                        label: 'Interruptions',
                        data: data,
                        backgroundColor: ctx => getColor(ctx.raw.v),
                        width: ({chart}) => ((chart.chartArea || {}).width / 24) - 6,
                        height: ({chart}) => ((chart.chartArea || {}).height / 7) - 6,
                        borderRadius: 2,
                        borderWidth: 1,
                        borderColor: '#fff'
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: { display: false },
                        tooltip: {
                            backgroundColor: 'rgba(45, 55, 72, 0.95)',
                            titleColor: '#fff',
                            bodyColor: '#fff',
                            borderColor: 'rgba(255,255,255,0.2)',
                            borderWidth: 1,
                            cornerRadius: 8,
                            padding: 12,
                            callbacks: {
                                title: ctx => {
                                    const d = ctx[0].raw;
                                    const hour = d.x.toString().padStart(2, '0');
                                    return `${days[d.y]}, ${hour}:00`;
                                },
                                label: ctx => `Interruptions: ${ctx.raw.v}`,
                                afterLabel: ctx => {
                                    const v = ctx.raw.v;
                                    if (v >= 8) return 'High activity period';
                                    if (v >= 4) return 'Moderate activity';
                                    return 'Low activity period';
                                }
                            }
                        }
                    },
                    scales: {
                        x: {
                            type: 'linear',
                            min: 0,
                            max: 23,
                            ticks: {
                                stepSize: 1,
                                callback: v => {
                                    if (v >= 0 && v <= 23) {
                                        let hour = v % 12 === 0 ? 12 : v % 12;
                                        let ampm = v < 12 ? 'AM' : 'PM';
                                        return `${hour} ${ampm}`;
                                    }
                                    return '';
                                },
                                color: '#6B7280',
                                font: { size: 10, weight: '500', family: 'Inter, system-ui, sans-serif' },
                                maxRotation: 45, // Diagonal
                                minRotation: 30  // Slightly diagonal
                            },
                            grid: { display: false },
                            border: { display: false },
                            title: {
                                display: true,
                                text: 'Hour of Day',
                                color: '#374151',
                                font: { size: 11, weight: '600', family: 'Inter, system-ui, sans-serif' },
                                padding: { top: 10 }
                            }
                        },
                        y: {
                            type: 'linear',
                            min: 0,
                            max: 6,
                            reverse: true,
                            ticks: {
                                stepSize: 1,
                                callback: v => (v >= 0 && v <= 6) ? days[v] : '',
                                color: '#6B7280',
                                font: { size: 11, weight: '500', family: 'Inter, system-ui, sans-serif' }
                            },
                            grid: { display: false },
                            border: { display: false },
                            title: {
                                display: true,
                                text: 'Day of Week',
                                color: '#374151',
                                font: { size: 11, weight: '600', family: 'Inter, system-ui, sans-serif' },
                                padding: { bottom: 10 }
                            }
                        }
                    },
                    interaction: {
                        intersect: false,
                        mode: 'point'
                    },
                    onHover: function(event, elements) {
                        event.native.target.style.cursor = elements.length > 0 ? 'pointer' : 'default';
                    }
                }
            });
        });
}

  // --- Reports logic ---
  let allReports = [];

  function createReportCard(report) {
    const statusClass = report.status.toLowerCase().replace(' ', '-');
    const imageContent = report.supporting_img
      ? `<img src="uploads/${report.supporting_img}" alt="Report photo">`
      : '<div class="image-placeholder"><img src="img/ic_imgPlaceholder.png" alt="Placeholder Image"></div>';

    return `
      <div class="report-card" data-report-id="${report.complaint_id}">
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
          <div class="no-reports-icon"></div>
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

  function filterReports(searchTerm) {
    const filtered = allReports.filter(report => {
      const searchText = searchTerm.toLowerCase()
        .replace(/barangay[\s-]*/gi, "brgy-")
        .replace(/brgy[\s-]*/gi, "brgy-");
      const reportText = (
        report.complaint_id + ' ' +
        report.complaint_type + ' ' +
        report.complaint_description + ' ' +
        report.full_address + ' ' +
        report.barangay_name + ' ' +
        report.street_name + ' ' +
        report.submitted_by
      ).toLowerCase()
        .replace(/barangay[\s-]*/gi, "brgy-")
        .replace(/brgy[\s-]*/gi, "brgy-");
      return reportText.includes(searchText);
    });
    renderReports(filtered);
  }

  async function loadReports() {
    try {
      const response = await fetch('php/load_complaints.php');
      const data = await response.json();
      if (data.success) {
        allReports = data.data;
        renderReports(allReports);
      } else {
        console.error('Error loading reports:', data.error);
        const container = document.querySelector('.report-box');
        if (container) {
          container.innerHTML = `
            <div class="no-reports">
              <div class="no-reports-icon">⚠️</div>
              <p>Error loading reports</p>
            </div>
          `;
        }
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

  const reportSearchInput = document.querySelector('.report-search input');
  if (reportSearchInput) {
    reportSearchInput.addEventListener('input', function (e) {
      const searchTerm = e.target.value.trim();
      if (searchTerm === '') {
        renderReports(allReports);
      } else {
        filterReports(searchTerm);
      }
    });
  }

  // --- Dropdown menu logic for profile, billing, and logout ---
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

  window.showBillingPopup = function () {
    document.getElementById('billingPopup').style.display = 'flex';
  };
  window.hideBillingPopup = function () {
    document.getElementById('billingPopup').style.display = 'none';
  };
  window.goToProfile = function () {
    window.location.href = 'profile.html';
  };

  // --- Report popup logic ---
  const submitReportBtn = document.getElementById("openReportForm_btn");
  const reportPopup = document.getElementById("reportPopup");

  function loadDurationDropdown() {
    const durationDropdown = document.getElementById("durationDropdown");
    if (!durationDropdown) {
      console.error("Duration dropdown not found");
      return;
    }
    fetch('php/get_ComplaintDuration.php')
      .then(response => {
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.json();
      })
      .then(data => {
        while (durationDropdown.options.length > 1) {
          durationDropdown.remove(1);
        }
        if (Array.isArray(data) && data.length > 0) {
          data.forEach(item => {
            if (item.id && item.name) {
              const option = document.createElement("option");
              option.value = item.id;
              option.textContent = item.name;
              durationDropdown.appendChild(option);
            }
          });
        } else {
          const noDataOption = document.createElement("option");
          noDataOption.value = "";
          noDataOption.textContent = "No duration options available";
          noDataOption.disabled = true;
          durationDropdown.appendChild(noDataOption);
        }
      })
      .catch(error => {
        const errorOption = document.createElement("option");
        errorOption.value = "";
        errorOption.textContent = "Error loading duration options";
        errorOption.disabled = true;
        durationDropdown.appendChild(errorOption);
      });
  }

  function showReportPopup() {
    if (reportPopup) {
      reportPopup.style.display = "flex";
      loadDurationDropdown();
      loadComplaintTypes();
    }
  }

  if (submitReportBtn) {
    submitReportBtn.addEventListener("click", showReportPopup);
  }

  window.hideReportPopup = function () {
    if (reportPopup) {
      reportPopup.style.display = "none";
    }
  };

  // --- Confirm/cancel report submission  ---
  const reportForm = document.getElementById("reportForm");
  const confirmSubmitPopup = document.getElementById("confirmSubmitPopup");

  if (reportForm && confirmSubmitPopup) {
    reportForm.addEventListener("submit", function (e) {
      e.preventDefault();
      confirmSubmitPopup.style.display = "flex";
    });
  }

  window.hideConfirmPopup = function () {
    if (confirmSubmitPopup) confirmSubmitPopup.style.display = "none";
  };

  window.submitReport = function () {
    if (confirmSubmitPopup) confirmSubmitPopup.style.display = "none";
    if (reportPopup) reportPopup.style.display = "none";

    const contactNum = document.getElementById('contactNum_inp').value.replace(/\D/g, '');
    const address = document.getElementById('address_inp').value;
    const brgyId = document.getElementById('barangayDropdown').value;
    const streetId = document.getElementById('streetDropdown').value;
    const complaint_duration = document.getElementById('durationDropdown').value;
    const otherInput = document.getElementById('otherInput').value;
    const uploadPhotoInp = document.getElementById('uploadPhoto_inp');
    const userId = window.currentUserId || '';

    let complaint_type = '';
    const radios = document.getElementsByName('problemType');
    for (let i = 0; i < radios.length; i++) {
      if (radios[i].checked) {
        complaint_type = radios[i].value;
        break;
      }
    }

    if (!contactNum || !address || !brgyId || !streetId || !complaint_type || !complaint_duration) {
      alert("Please fill in all required fields.");
      return;
    }

    const formData = new FormData();
    formData.append('contact_no', contactNum);
    formData.append('address_detail', address);
    formData.append('brgy_id', brgyId);
    formData.append('street_id', streetId);
    formData.append('complaint_type', complaint_type);
    formData.append('complaint_duration', complaint_duration);
    formData.append('complaint_description', otherInput ? otherInput : '');
    formData.append('submitted_by', userId);

    if (uploadPhotoInp && uploadPhotoInp.files.length > 0) {
      formData.append('supporting_img', uploadPhotoInp.files[0]);
    }

    fetch('php/submit_complaint.php', {
      method: 'POST',
      body: formData
    })
      .then(response => response.text())
      .then(text => {
        try {
          const result = JSON.parse(text);
          if (result.success) {
            alert("Report submitted successfully!");
            if (reportForm) reportForm.reset();
          } else {
            alert("Failed to submit report: " + (result.message || "Unknown error"));
          }
        } catch (jsonError) {
          if (text.includes('<html>') || text.includes('<?php')) {
            alert("Server returned an error page. Check the PHP script for syntax errors.");
          } else {
            alert("Server returned invalid response: " + text.substring(0, 200));
          }
        }
      })
      .catch(error => {
        alert("Network error submitting report: " + error.message);
      });
  };

  // --- RADIO GROUP FOR COMPLAINT TYPE ---
  function loadComplaintTypes() {
    const radioGroup = document.querySelector('.radio-group');
    const otherInput = document.getElementById('otherInput');
    if (!radioGroup || !otherInput) {
      console.error("Radio group or other input not found");
      return;
    }
    fetch('php/get_ComplaintType.php')
      .then(response => response.json())
      .then(data => {
        radioGroup.innerHTML = '';
        const col1 = document.createElement('div');
        col1.className = 'radio-column';
        const col2 = document.createElement('div');
        col2.className = 'radio-column';
        data.forEach((type, idx) => {
          const radio = document.createElement('input');
          radio.type = 'radio';
          radio.name = 'problemType';
          radio.value = type.complaint_type_id;
          radio.id = 'problemType_' + type.complaint_type_id;
          const label = document.createElement('label');
          label.htmlFor = radio.id;
          label.textContent = type.complaint_type;
          const wrapper = document.createElement('div');
          wrapper.className = 'radio-option';
          wrapper.appendChild(radio);
          wrapper.appendChild(label);
          radio.addEventListener('change', function () {
            if (String(type.complaint_type_id) === '5' && this.checked) {
              otherInput.style.display = 'block';
            } else if (this.checked) {
              otherInput.style.display = 'none';
            }
          });
          if (idx < 3) {
            col1.appendChild(wrapper);
          } else {
            col2.appendChild(wrapper);
          }
        });
        const columns = document.createElement('div');
        columns.className = 'radio-columns';
        columns.appendChild(col1);
        columns.appendChild(col2);
        radioGroup.appendChild(columns);
        otherInput.style.display = 'none';
      })
      .catch(error => {
        console.error('Error fetching complaint types:', error);
      });
  }

  // --- Barangay and Street dropdowns ---
  const barangayDropdown = document.getElementById("barangayDropdown");
  const streetDropdown = document.getElementById("streetDropdown");
  if (barangayDropdown && streetDropdown) {
    const barangayChoices = new Choices(barangayDropdown, { searchEnabled: false, itemSelectText: '' });
    const streetChoices = new Choices(streetDropdown, { searchEnabled: false, itemSelectText: '' });
    fetch('php/get_barangays.php')
      .then(response => response.json())
      .then(data => {
        const options = data.map(brgy => ({ value: brgy.id, label: brgy.name }));
        barangayChoices.setChoices(options, 'value', 'label', true);
      });
    barangayDropdown.addEventListener('change', function () {
      const barangayId = this.value;
      streetChoices.clearChoices();
      fetch('php/get_streets.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: 'barangay_id=' + encodeURIComponent(barangayId)
      })
        .then(response => response.json())
        .then(data => {
          const options = data.map(street => ({ value: street.id, label: street.name }));
          streetChoices.setChoices(options, 'value', 'label', true);
        });
    });
  }

  // --- Contact number input formatting ---
  const contactInput = document.getElementById('contactNum_inp');
  if (contactInput) {
    contactInput.placeholder = '+63 | 9XX XXX XXXX';
    contactInput.value = '';
    contactInput.style.textAlign = 'left';
    contactInput.addEventListener('input', function (e) {
      let value = e.target.value;
      if (value && !value.startsWith('+63 | ')) {
        let digits = value.replace(/[^\d]/g, '');
        value = '+63 | ' + digits;
      }
      let digits = value.substring(6).replace(/\D/g, '');
      if (digits.length > 10) {
        digits = digits.substring(0, 10);
      }
      let formattedNumber = '+63 | ';
      if (digits.length >= 7) {
        formattedNumber += digits.substring(0, 3) + ' ' + digits.substring(3, 6) + ' ' + digits.substring(6);
      } else if (digits.length >= 4) {
        formattedNumber += digits.substring(0, 3) + ' ' + digits.substring(3);
      } else if (digits.length > 0) {
        formattedNumber += digits;
      } else {
        formattedNumber = '';
      }
      e.target.value = formattedNumber;
    });
    contactInput.addEventListener('focus', function (e) {
      if (!e.target.value) {
        e.target.value = '+63 | ';
        setTimeout(() => {
          e.target.setSelectionRange(6, 6);
        }, 0);
      }
    });
    contactInput.addEventListener('blur', function (e) {
      const digits = e.target.value.substring(6).replace(/\D/g, '');
      if (digits.length === 0) {
        e.target.value = '';
      } else if (digits.length === 10 && digits.startsWith('9')) {
        e.target.setCustomValidity('');
      } else {
        e.target.setCustomValidity('Please enter a valid Philippine mobile number (9XX XXX XXXX)');
      }
    });
    contactInput.addEventListener('keydown', function (e) {
      const cursorPosition = e.target.selectionStart;
      const value = e.target.value;
      if (!value) return;
      if ((e.key === 'Backspace' || e.key === 'Delete') && cursorPosition <= 6) {
        e.preventDefault();
        return;
      }
      if (e.key === 'Backspace' && value.length === 7 && cursorPosition === 7) {
        e.preventDefault();
        e.target.value = '';
        return;
      }
      if (cursorPosition < 6 && value.startsWith('+63 | ')) {
        setTimeout(() => {
          e.target.setSelectionRange(6, 6);
        }, 0);
      }
    });
    contactInput.addEventListener('keypress', function (e) {
      const cursorPosition = e.target.selectionStart;
      if (!e.target.value) return;
      if (cursorPosition < 6) {
        e.preventDefault();
        setTimeout(() => {
          e.target.setSelectionRange(6, 6);
        }, 0);
        return;
      }
      if ([8, 9, 27, 13, 46].indexOf(e.keyCode) !== -1 ||
        (e.keyCode === 65 && (e.ctrlKey === true || e.metaKey === true)) ||
        (e.keyCode === 67 && (e.ctrlKey === true || e.metaKey === true)) ||
        (e.keyCode === 86 && (e.ctrlKey === true || e.metaKey === true)) ||
        (e.keyCode === 88 && (e.ctrlKey === true || e.metaKey === true))) {
        return;
      }
      if ((e.shiftKey || (e.keyCode < 48 || e.keyCode > 57)) && (e.keyCode < 96 || e.keyCode > 105)) {
        e.preventDefault();
      }
    });
  }

  // --- Mobile menu toggle logic ---
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

  // --- Chart and Info Cards ---
  let peakDaysChartInstance = null;

  function renderPeakDaysChart() {
    const canvas = document.getElementById('peakDays');
    if (!canvas) {
      console.warn('peakDays canvas not found.');
      return;
    }
    fetch('php/get_peakDays.php')
      .then(res => res.json())
      .then(data => {
        const labels = data.map(d => d.day_name);
        const counts = data.map(d => Number(d.interruption_count));
        const averages = data.map(d => Number(d.average_per_day));

        // Calculate the overall average of averages
        const overallAvg = averages.reduce((a, b) => a + parseFloat(b), 0) / averages.length;

        // Find most and least interrupted day
        let maxIdx = counts.indexOf(Math.max(...counts));
        let minIdx = counts.indexOf(Math.min(...counts));
        const mostDay = labels[maxIdx] || 'N/A';
        const leastDay = labels[minIdx] || 'N/A';

        // Set info card colors
        const mostElem = document.getElementById('mostInterrupted');
        const leastElem = document.getElementById('leastInterrupted');
        if (mostElem) {
          mostElem.textContent = mostDay;
          mostElem.parentElement.classList.add('most-interrupted');
          mostElem.parentElement.classList.remove('least-interrupted');
        }
        if (leastElem) {
          leastElem.textContent = leastDay;
          leastElem.parentElement.classList.add('least-interrupted');
          leastElem.parentElement.classList.remove('most-interrupted');
        }

        // Interruption bar: green if below/equal avg, red if above avg
        const interruptionBarColors = counts.map((count, idx) => {
          if (parseFloat(count) > overallAvg) return 'rgba(231, 76, 60, 0.85)'; // Red
          return 'rgba(39, 174, 96, 0.85)'; // Green
        });

        // Average bar: always blue
        const avgBarColors = averages.map(() => 'rgba(52, 152, 219, 0.85)');

        const ctx = canvas.getContext('2d');
        if (window.peakDaysChartInstance) {
          window.peakDaysChartInstance.destroy();
        }
        window.peakDaysChartInstance = new Chart(ctx, {
          type: 'bar',
          data: {
            labels: labels,
            datasets: [
              {
                label: 'Interruptions',
                data: counts,
                backgroundColor: interruptionBarColors,
                borderRadius: 6,
                barPercentage: 0.35,
                categoryPercentage: 0.45,
                maxBarThickness: 28
              },
              {
                label: 'Avg. Interruptions/Day',
                data: averages,
                backgroundColor: avgBarColors,
                borderRadius: 6,
                barPercentage: 0.35,
                categoryPercentage: 0.45,
                maxBarThickness: 28
              }
            ]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            layout: {
              padding: { top: 5, bottom: 0, left: 0, right: 0 }
            },
            plugins: {
              title: {
                display: true,
                text: 'Typical Days for Water Interruptions',
                color: '#222',
                font: {
                  size: 15,
                  family: 'Inter, Arial, sans-serif',
                  weight: 'bold'
                },
                padding: { top: 5, bottom: 10 }
              },
              legend: {
                display: true,
                labels: {
                  color: '#222',
                  font: { size: 12, family: 'Inter, Poppins, sans-serif', weight: 'bold' }
                }
              },
              tooltip: {
                backgroundColor: '#fff',
                titleColor: '#222',
                bodyColor: '#222',
                borderColor: '#e0e0e0',
                borderWidth: 1,
                padding: 10,
                cornerRadius: 6
              }
            },
            scales: {
              x: {
                grid: { display: false },
                ticks: { color: '#222', font: { size: 11, family: 'Inter, Arial, sans-serif' } }
              },
              y: {
                beginAtZero: true,
                grid: { color: '#f0f0f0' },
                ticks: { color: '#222', font: { size: 10, family: 'Inter, Arial, sans-serif' } },
                title: { display: false }
              }
            },
            backgroundColor: '#fff'
          },
          plugins: [{
            beforeDraw: function (chart) {
              const ctx = chart.ctx;
              ctx.save();
              ctx.globalCompositeOperation = 'destination-over';
              ctx.fillStyle = '#fff';
              ctx.fillRect(0, 0, chart.width, chart.height);
              ctx.restore();
            }
          }]
        });
      });
  }

  if (
    document.getElementById('plan') &&
    document.getElementById('plan').classList.contains('active')
  ) {
    renderHeatmap();
    renderPeakDaysChart();
  }

  // Trends "COMING SOON""
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

    // REMOCE ACTVIE CLASS
    const tabButtons = document.querySelectorAll('.tab-button');
    tabButtons.forEach(button => button.classList.remove('active'));

    // ADD ACTIVE CLASS
    event.target.classList.add('active');

    // HIDE TAB CONTENTS
    const tabContents = document.querySelectorAll('.tab-content');
    tabContents.forEach(content => content.classList.remove('active'));

    // DISPLAY SLECTED TAAAB
    const tabContent = document.getElementById(tabName);
    if (tabContent) {
      tabContent.classList.add('active');
      
    }
  };
});