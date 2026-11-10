document.addEventListener("DOMContentLoaded", () => {
  "use strict";

  /* =========================================
     1. ELEMENTS & PRESENTATION STATE
  ========================================= */

  const slides = [...document.querySelectorAll(".slide")];
  const prevBtn = document.getElementById("prevBtn");
  const nextBtn = document.getElementById("nextBtn");
  const progress = document.getElementById("progress");
  const current = document.getElementById("current");
  const total = document.getElementById("total");
  const slideName = document.getElementById("slideName");

  const overview = document.getElementById("overview");
  const overviewGrid = document.getElementById("overviewGrid");

  const chartInstances = {};
  let currentSlide = 0;
  let overviewOpen = false;

  const chartSlideMap = {
    3: ["roleChart", "laneChart"],
    6: ["accuracyChart"],
    7: ["cvChart"],
    9: ["importanceChart"]
  };

  if (!slides.length) {
    console.error("Tidak ditemukan elemen .slide");
    return;
  }

  total.textContent = String(slides.length).padStart(2, "0");

  /* =========================================
     2. MATRIX DIGITAL RAIN
  ========================================= */

  const canvas = document.getElementById("matrixCanvas");
  const ctx = canvas.getContext("2d");

  const characters = "01アイウエオカキクケコサシスセソタチツテト";
  const fontSize = 14;
  let columns = [];
  let matrixWidth = 0;
  let matrixHeight = 0;

  function resizeMatrix() {
    const ratio = Math.min(window.devicePixelRatio || 1, 2);

    matrixWidth = window.innerWidth;
    matrixHeight = window.innerHeight;

    canvas.width = matrixWidth * ratio;
    canvas.height = matrixHeight * ratio;
    canvas.style.width = matrixWidth + "px";
    canvas.style.height = matrixHeight + "px";

    ctx.setTransform(ratio, 0, 0, ratio, 0, 0);

    const count = Math.ceil(matrixWidth / fontSize);
    columns = Array.from(
      { length: count },
      () => Math.random() * -50
    );
  }

  function drawMatrix() {
    ctx.fillStyle = "rgba(5, 9, 6, 0.075)";
    ctx.fillRect(0, 0, matrixWidth, matrixHeight);

    ctx.font = `${fontSize}px monospace`;
    ctx.fillStyle = "#39ff75";

    columns.forEach((y, index) => {
      const character =
        characters[Math.floor(Math.random() * characters.length)];

      ctx.fillText(
        character,
        index * fontSize,
        y * fontSize
      );

      if (y * fontSize > matrixHeight && Math.random() > 0.975) {
        columns[index] = 0;
      } else {
        columns[index] += 0.65;
      }
    });
  }

  resizeMatrix();
  window.addEventListener("resize", resizeMatrix);

  // Kurangi beban animasi di layar kecil
  const matrixInterval = window.setInterval(() => {
    if (!document.hidden) drawMatrix();
  }, 65);

  /* =========================================
     3. COUNTER ANIMATION
  ========================================= */

  function animateCounters(container) {
    if (!container) return;

    const counters = container.querySelectorAll(".counter");

    counters.forEach((counter) => {
      const target = Number(counter.dataset.target);

      if (!Number.isFinite(target)) return;

      const duration = 1400;
      const start = performance.now();

      counter.textContent = "0";

      function update(now) {
        const elapsed = now - start;
        const progressValue = Math.min(elapsed / duration, 1);

        // Ease-out cubic
        const eased = 1 - Math.pow(1 - progressValue, 3);
        const value = Math.floor(target * eased);

        counter.textContent = value.toLocaleString("id-ID");

        if (progressValue < 1) {
          requestAnimationFrame(update);
        } else {
          counter.textContent = target.toLocaleString("id-ID");
        }
      }

      requestAnimationFrame(update);
    });
  }

  /* =========================================
     4. RESTART TABLE & BAR ANIMATIONS
  ========================================= */

  function animateTable(container) {
    const rows = container.querySelectorAll("tbody tr");

    rows.forEach((row, index) => {
      row.style.animation = "none";
      row.offsetHeight;
      row.style.animation = `rowIn .45s ${0.2 + index * 0.1}s forwards`;
    });

    const bars = container.querySelectorAll(".score-bar span");

    bars.forEach((bar) => {
      const width = bar.dataset.width || "0%";

      bar.style.setProperty("--bar-width", width);
      bar.style.width = "0%";

      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          bar.style.width = width;
        });
      });
    });
  }

  /* =========================================
     5. CHART.JS CONFIGURATION
  ========================================= */

  const hasChartJS = typeof Chart !== "undefined";

  const colors = {
    green: "#39ff75",
    greenLight: "#8bffad",
    greenDark: "#16c957",
    muted: "#819589",
    orange: "#ffc45e",
    blue: "#45d6c5",
    purple: "#a1ff63"
  };

  if (hasChartJS) {
    Chart.defaults.color = colors.muted;
    Chart.defaults.font.family = "Share Tech Mono, monospace";
    Chart.defaults.font.size = 11;

    Chart.defaults.plugins.legend.labels.usePointStyle = true;
    Chart.defaults.plugins.legend.labels.padding = 18;

    Chart.defaults.animation.duration = 1500;
    Chart.defaults.animation.easing = "easeOutQuart";

    Chart.defaults.elements.bar.borderRadius = 5;
  }

  const baseOptions = {
    responsive: true,
    maintainAspectRatio: false,
    animation: {
      duration: 1500,
      easing: "easeOutQuart"
    },
    plugins: {
      legend: {
        labels: {
          color: colors.muted
        }
      },
      tooltip: {
        backgroundColor: "#07100a",
        borderColor: colors.green,
        borderWidth: 1,
        titleColor: colors.green,
        bodyColor: "#e5f3e8",
        padding: 12
      }
    }
  };

  const axisOptions = {
    x: {
      ticks: { color: colors.muted },
      grid: { color: "rgba(57,255,117,.07)" }
    },
    y: {
      beginAtZero: true,
      ticks: { color: colors.muted },
      grid: { color: "rgba(57,255,117,.07)" }
    }
  };

  function createChart(id, config) {
    const element = document.getElementById(id);

    if (!element || !hasChartJS) return;

    if (Chart.getChart(element)) {
      Chart.getChart(element).destroy();
    }

    chartInstances[id] = new Chart(element, config);
  }

  /* =========================================
     6. PRIMARY ROLE CHART
  ========================================= */

  createChart("roleChart", {
    type: "doughnut",
    data: {
      labels: [
        "Fighter",
        "Mage",
        "Marksman",
        "Tank",
        "Assassin",
        "Support"
      ],
      datasets: [{
        data: [33, 25, 18, 16, 13, 9],
        backgroundColor: [
          "#39ff75",
          "#16c957",
          "#8bffad",
          "#45d6c5",
          "#a1ff63",
          "#ffc45e"
        ],
        borderColor: "#07100a",
        borderWidth: 4,
        hoverOffset: 14,
        offset: 0
      }]
    },
    options: {
      ...baseOptions,
      cutout: "65%",
      animation: {
        animateRotate: true,
        animateScale: true,
        duration: 1700
      }
    }
  });

  /* =========================================
     7. LANE DISTRIBUTION CHART
  ========================================= */

  createChart("laneChart", {
    type: "bar",
    data: {
      labels: [
        "EXP Lane",
        "Mid Lane",
        "Gold Lane",
        "Roamer",
        "Jungler"
      ],
      datasets: [{
        label: "Jumlah Hero",
        data: [34, 23, 21, 20, 16],
        backgroundColor: [
          "#39ff75",
          "#16c957",
          "#8bffad",
          "#45d6c5",
          "#a1ff63"
        ],
        borderWidth: 0,
        borderRadius: 5
      }]
    },
    options: {
      ...baseOptions,
      indexAxis: "y",
      scales: {
        x: {
          ...axisOptions.x,
          max: 40
        },
        y: axisOptions.y
      }
    }
  });

  /* =========================================
     8. MODEL COMPARISON CHART
  ========================================= */

  createChart("accuracyChart", {
    type: "bar",
    data: {
      labels: [
        ["Gradient Boosting", "(Clean)"],
        ["Random Forest", "(Clean)"],
        ["Random Forest", "(+Esport)"]
      ],
      datasets: [
        {
          label: "Accuracy (%)",
          data: [73.9, 65.2, 69.6],
          backgroundColor: "#39ff75",
          borderRadius: 5
        },
        {
          label: "F1 Macro (%)",
          data: [65.2, 55.1, 60.9],
          backgroundColor: "rgba(57,255,117,.3)",
          borderColor: "#39ff75",
          borderWidth: 1,
          borderRadius: 5
        }
      ]
    },
    options: {
      ...baseOptions,
      scales: {
        x: axisOptions.x,
        y: {
          ...axisOptions.y,
          max: 100,
          ticks: {
            color: colors.muted,
            callback: (value) => value + "%"
          }
        }
      }
    }
  });

  /* =========================================
     9. CROSS VALIDATION CHART
  ========================================= */

  createChart("cvChart", {
    type: "line",
    data: {
      labels: [
        "GB Clean",
        "RF Clean",
        "RF + Esport",
        "GB + Esport"
      ],
      datasets: [{
        label: "Mean F1 Macro (%)",
        data: [59.0, 58.9, 58.5, 54.9],
        borderColor: colors.green,
        backgroundColor: "rgba(57,255,117,.12)",
        pointBackgroundColor: colors.green,
        pointBorderColor: "#07100a",
        pointBorderWidth: 3,
        pointRadius: 6,
        pointHoverRadius: 9,
        borderWidth: 3,
        tension: 0.35,
        fill: true
      }]
    },
    options: {
      ...baseOptions,
      scales: {
        x: axisOptions.x,
        y: {
          ...axisOptions.y,
          min: 0,
          max: 100,
          ticks: {
            color: colors.muted,
            callback: (value) => value + "%"
          }
        }
      }
    }
  });

  /* =========================================
     10. FEATURE IMPORTANCE CHART
  ========================================= */

  createChart("importanceChart", {
    type: "bar",
    data: {
      labels: [
        "HP",
        "Mana",
        "HP Regen",
        "Total Defence",
        "Total Regen"
      ],
      datasets: [{
        label: "Feature Importance",
        data: [0.144, 0.134, 0.128, 0.096, 0.092],
        backgroundColor: [
          "#39ff75",
          "#16c957",
          "#8bffad",
          "#45d6c5",
          "#a1ff63"
        ],
        borderRadius: 5
      }]
    },
    options: {
      ...baseOptions,
      indexAxis: "y",
      scales: {
        x: {
          ...axisOptions.x,
          max: 0.16,
          ticks: {
            color: colors.muted,
            callback: (value) => Number(value).toFixed(2)
          }
        },
        y: axisOptions.y
      }
    }
  });

  /* =========================================
     11. REPLAY CHART ANIMATIONS
  ========================================= */

  function replayCharts(slideIndex) {
    const chartIds = chartSlideMap[slideIndex] || [];

    chartIds.forEach((id) => {
      const chart = chartInstances[id];

      if (!chart) return;

      requestAnimationFrame(() => {
        chart.resize();

        // Reset data untuk memulai animasi dari awal
        chart.data.datasets.forEach((dataset) => {
          if (Array.isArray(dataset.data)) {
            dataset.data = dataset.data.map(() => 0);
          }
        });

        chart.update("none");

        // Kembalikan data asli setelah chart di-reset
        const originalData = {
          roleChart: [[33, 25, 18, 16, 13, 9]],
          laneChart: [[34, 23, 21, 20, 16]],
          accuracyChart: [
            [73.9, 65.2, 69.6],
            [65.2, 55.1, 60.9]
          ],
          cvChart: [[59.0, 58.9, 58.5, 54.9]],
          importanceChart: [[0.144, 0.134, 0.128, 0.096, 0.092]]
        };

        const values = originalData[id];

        if (!values) return;

        chart.data.datasets.forEach((dataset, index) => {
          dataset.data = [...values[index]];
        });

        chart.update();
      });
    });
  }

  /* =========================================
     12. SLIDE TRANSITION
  ========================================= */

  function updateSlide() {
    slides.forEach((slide, index) => {
      slide.classList.toggle("active", index === currentSlide);
      slide.setAttribute(
        "aria-hidden",
        index === currentSlide ? "false" : "true"
      );
    });

    current.textContent = String(currentSlide + 1).padStart(2, "0");

    progress.style.width =
      `${((currentSlide + 1) / slides.length) * 100}%`;

    slideName.textContent =
      slides[currentSlide].dataset.title ||
      `Slide ${currentSlide + 1}`;

    prevBtn.disabled = currentSlide === 0;
    nextBtn.disabled = currentSlide === slides.length - 1;

    // Jalankan animasi ulang pada setiap slide yang aktif
    animateCounters(slides[currentSlide]);
    animateTable(slides[currentSlide]);
    replayCharts(currentSlide);

    // URL hash
    history.replaceState(
      null,
      "",
      `#slide-${currentSlide + 1}`
    );
  }

  function goToSlide(index) {
    if (index < 0 || index >= slides.length) return;

    currentSlide = index;
    closeOverview();
    updateSlide();
  }

  function nextSlide() {
    goToSlide(currentSlide + 1);
  }

  function previousSlide() {
    goToSlide(currentSlide - 1);
  }

  prevBtn.addEventListener("click", previousSlide);
  nextBtn.addEventListener("click", nextSlide);

  /* =========================================
     13. KEYBOARD CONTROL
  ========================================= */

  document.addEventListener("keydown", (event) => {
    if (overviewOpen) {
      if (event.key === "Escape") closeOverview();
      return;
    }

    const tag = event.target.tagName;

    if (["INPUT", "TEXTAREA", "SELECT"].includes(tag)) return;

    if (["ArrowRight", "PageDown", " "].includes(event.key)) {
      event.preventDefault();
      nextSlide();
    }

    if (["ArrowLeft", "PageUp"].includes(event.key)) {
      event.preventDefault();
      previousSlide();
    }

    if (event.key === "Home") goToSlide(0);
    if (event.key === "End") goToSlide(slides.length - 1);
  });

  /* =========================================
     14. MOBILE SWIPE
  ========================================= */

  let touchStartX = 0;
  let touchStartY = 0;

  document.addEventListener("touchstart", (event) => {
    touchStartX = event.changedTouches[0].screenX;
    touchStartY = event.changedTouches[0].screenY;
  }, { passive: true });

  document.addEventListener("touchend", (event) => {
    if (overviewOpen) return;

    const endX = event.changedTouches[0].screenX;
    const endY = event.changedTouches[0].screenY;

    const dx = touchStartX - endX;
    const dy = touchStartY - endY;

    if (Math.abs(dx) < 65 || Math.abs(dx) < Math.abs(dy)) return;

    dx > 0 ? nextSlide() : previousSlide();
  }, { passive: true });

  /* =========================================
     15. OVERVIEW NAVIGATION
  ========================================= */

  function buildOverview() {
    overviewGrid.innerHTML = "";

    slides.forEach((slide, index) => {
      const button = document.createElement("button");

      button.className = "overview-card";
      button.type = "button";

      if (index === currentSlide) {
        button.classList.add("active");
      }

      const number = String(index + 1).padStart(2, "0");
      const title = slide.dataset.title || `Slide ${number}`;

      const numberSpan = document.createElement("span");
      numberSpan.className = "overview-number";
      numberSpan.textContent = number;

      const titleSpan = document.createElement("span");
      titleSpan.className = "overview-title";
      titleSpan.textContent = title;

      button.append(numberSpan, titleSpan);

      button.addEventListener("click", () => {
        goToSlide(index);
      });

      overviewGrid.appendChild(button);
    });
  }

  function openOverview() {
    overviewOpen = true;
    buildOverview();
    overview.classList.add("active");
    overview.setAttribute("aria-hidden", "false");
  }

  function closeOverview() {
    overviewOpen = false;
    overview.classList.remove("active");
    overview.setAttribute("aria-hidden", "true");
  }

  document.getElementById("overviewBtn")
    .addEventListener("click", openOverview);

  document.getElementById("closeOverviewBtn")
    .addEventListener("click", closeOverview);

  overview.addEventListener("click", (event) => {
    if (event.target === overview) closeOverview();
  });

  /* =========================================
     16. FULLSCREEN
  ========================================= */

  const fullscreenBtn = document.getElementById("fullscreenBtn");

  fullscreenBtn.addEventListener("click", async () => {
    try {
      if (!document.fullscreenElement) {
        await document.documentElement.requestFullscreen();
      } else {
        await document.exitFullscreen();
      }
    } catch (error) {
      console.warn("Fullscreen tidak tersedia:", error);
    }
  });

  /* =========================================
     17. URL HASH NAVIGATION
  ========================================= */

  function readHash() {
    const match = location.hash.match(/^#slide-(\d+)$/);

    if (!match) return;

    const index = Number(match[1]) - 1;

    if (index >= 0 && index < slides.length) {
      currentSlide = index;
    }
  }

  window.addEventListener("hashchange", () => {
    const match = location.hash.match(/^#slide-(\d+)$/);

    if (!match) return;

    const index = Number(match[1]) - 1;

    if (index >= 0 && index < slides.length) {
      goToSlide(index);
    }
  });

  /* =========================================
     18. INITIALIZE PRESENTATION
  ========================================= */

  readHash();
  updateSlide();

  console.log(
    "%c MLBB CYBER RESEARCH PRESENTATION ",
    "background:#39ff75;color:#031006;font-weight:bold;padding:8px;"
  );

  console.log("Presentation initialized successfully.");
});