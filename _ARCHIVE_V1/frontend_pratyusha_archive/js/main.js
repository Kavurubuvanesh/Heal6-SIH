/**
 * HealFoot AI — Interactive Client Logic
 * Provides UI interactions, modal controls, tab switcher, FAQ accordion, toast alerts, & LIVE API FETCH.
 */

document.addEventListener('DOMContentLoaded', () => {
  // Initialize Lucide Icons if loaded
  if (window.lucide) {
    window.lucide.createIcons();
  }

  /* --------------------------------------------------------------------------
     1. TOAST NOTIFICATION SYSTEM
     -------------------------------------------------------------------------- */
  const toastContainer = document.getElementById('toast-container');
  let toastTimeout = null;

  function showToast(message = 'Action recorded in AI Session') {
    if (!toastContainer) return;

    toastContainer.innerHTML = '';

    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.innerHTML = `
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#20C997" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
        <polyline points="22 4 12 14.01 9 11.01"></polyline>
      </svg>
      <span>${message}</span>
    `;

    toastContainer.appendChild(toast);

    requestAnimationFrame(() => {
      toast.classList.add('show');
    });

    clearTimeout(toastTimeout);
    toastTimeout = setTimeout(() => {
      toast.classList.remove('show');
      setTimeout(() => toast.remove(), 300);
    }, 2800);
  }

  document.querySelectorAll('[data-toast]').forEach(button => {
    button.addEventListener('click', (e) => {
      e.preventDefault();
      const msg = button.getAttribute('data-toast') || 'Feature available in full clinical edition';
      showToast(msg);
    });
  });

  /* --------------------------------------------------------------------------
     2. FAQ ACCORDION HANDLER
     -------------------------------------------------------------------------- */
  const faqItems = document.querySelectorAll('.faq-item');

  faqItems.forEach(item => {
    const trigger = item.querySelector('.faq-trigger');
    if (!trigger) return;

    trigger.addEventListener('click', () => {
      const isOpen = item.classList.contains('is-open');

      faqItems.forEach(otherItem => {
        if (otherItem !== item) {
          otherItem.classList.remove('is-open');
        }
      });

      if (isOpen) {
        item.classList.remove('is-open');
      } else {
        item.classList.add('is-open');
      }
    });
  });

  /* --------------------------------------------------------------------------
     3. FEATURE DARK SECTION INTERACTIVE TAB SWITCHER
     -------------------------------------------------------------------------- */
  const featureTabs = document.querySelectorAll('.feature-tab-item');
  const screenMetricTitle = document.getElementById('screen-metric-title');
  const screenMetricVal = document.getElementById('screen-metric-val');
  const screenMetricStatus = document.getElementById('screen-metric-status');
  const screenHudTag = document.getElementById('screen-hud-tag');
  const screenHotspot = document.querySelector('.screen-thermal-hotspot');

  const tabData = {
    'thermal': {
      title: 'Plantar Surface Temp',
      val: '34.2 °C (Δ 0.4°C)',
      status: 'Normal Balance',
      isOk: true,
      tag: 'THERMAL_MAP: LIVE',
      showHotspot: true
    },
    'ulcer': {
      title: 'Wagner Ulcer Staging',
      val: 'Grade 0 (Intact Skin)',
      status: 'High Intactness',
      isOk: true,
      tag: 'LESION_SCAN: 99.4%',
      showHotspot: false
    },
    'gait': {
      title: 'Forefoot Pressure Peak',
      val: '180 kPa (Balanced)',
      status: 'Good Pronation',
      isOk: true,
      tag: 'GAIT_PRESSURE: ACTIVE',
      showHotspot: true
    },
    'explanations': {
      title: 'Clinical Differential',
      val: 'Zero Ischemia Detected',
      status: 'Verified Bio-Signals',
      isOk: true,
      tag: 'EXPLANATION: READY',
      showHotspot: false
    },
    'citations': {
      title: 'PubMed Guideline Sync',
      val: 'ADA 2026 Foot Care Std',
      status: 'Evidence Indexed',
      isOk: true,
      tag: 'CITATIONS: 4 PAPERS',
      showHotspot: false
    },
    'cases': {
      title: 'USMLE Case Matrix',
      val: 'Diabetic Neuropathy Test',
      status: 'Score: 98% Accuracy',
      isOk: true,
      tag: 'SIMULATION: 100% OK',
      showHotspot: true
    }
  };

  featureTabs.forEach(tab => {
    tab.addEventListener('click', () => {
      featureTabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');

      const featureKey = tab.getAttribute('data-feature') || 'thermal';
      const data = tabData[featureKey];

      if (data && screenMetricTitle && screenMetricVal && screenMetricStatus) {
        screenMetricTitle.textContent = data.title;
        screenMetricVal.textContent = data.val;
        screenMetricStatus.textContent = data.status;
        screenMetricStatus.className = 'metric-status ' + (data.isOk ? 'status-ok' : 'status-warn');
        if (screenHudTag) screenHudTag.textContent = data.tag;
        if (screenHotspot) {
          screenHotspot.style.display = data.showHotspot ? 'block' : 'none';
        }
      }
    });
  });

  /* --------------------------------------------------------------------------
     4. AI SCAN MODAL & FASTAPI INTEGRATION
     -------------------------------------------------------------------------- */
  const scanModalBackdrop = document.getElementById('scan-modal-backdrop');
  const openScanBtns = document.querySelectorAll('.js-open-scan-modal');
  const closeScanBtns = document.querySelectorAll('.js-close-scan-modal');

  // DOM Elements for Live Scan
  const fileInput = document.getElementById('wound-file-input');
  const imagePreview = document.getElementById('image-preview');
  const placeholder = document.getElementById('viewfinder-placeholder');
  const hudStatus = document.getElementById('hud-status');
  const btnRunScan = document.getElementById('btn-run-ai-scan');
  const btnReset = document.getElementById('btn-reset-scan');

  function openScanModal() {
    if (!scanModalBackdrop) return;
    scanModalBackdrop.classList.add('is-active');
    document.body.style.overflow = 'hidden';
    showToast('AI Clinical Scanner Ready');
  }

  function closeScanModal() {
    if (!scanModalBackdrop) return;
    scanModalBackdrop.classList.remove('is-active');
    document.body.style.overflow = '';
  }

  openScanBtns.forEach(btn => btn.addEventListener('click', (e) => {
    e.preventDefault();
    openScanModal();
  }));

  closeScanBtns.forEach(btn => btn.addEventListener('click', (e) => {
    e.preventDefault();
    closeScanModal();
  }));

  if (scanModalBackdrop) {
    scanModalBackdrop.addEventListener('click', (e) => {
      if (e.target === scanModalBackdrop) closeScanModal();
    });
  }

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && scanModalBackdrop && scanModalBackdrop.classList.contains('is-active')) {
      closeScanModal();
    }
  });

  // --- LIVE FASTAPI INTEGRATION LOGIC ---

  // Handle Image Upload & Preview
  if (fileInput) {
    fileInput.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (event) => {
          imagePreview.src = event.target.result;
          imagePreview.style.display = 'block';
          if (placeholder) placeholder.style.display = 'none';
          hudStatus.textContent = `LOADED: ${file.name.toUpperCase()}`;
        };
        reader.readAsDataURL(file);
      }
    });
  }

  // Trigger FastAPI Backend
  if (btnRunScan) {
    btnRunScan.addEventListener('click', async () => {
      if (!fileInput.files[0]) {
        alert('Please click the camera viewfinder on the left to upload a foot image.');
        return;
      }

      btnRunScan.disabled = true;
      btnRunScan.innerHTML = 'Processing Neural Inference...';
      showToast('Running ConvNeXt & SINBAD Engine...');

      const formData = new FormData();
      formData.append('file', fileInput.files[0]);
      formData.append('is_deep', document.getElementById('chk-is-deep').checked);
      formData.append('has_ischemia', document.getElementById('chk-has-ischemia').checked);
      formData.append('has_neuropathy', document.getElementById('chk-has-neuropathy').checked);
      formData.append('is_hindfoot', document.getElementById('chk-is-hindfoot').checked);

      try {
        const response = await fetch('http://127.0.0.1:8000/api/v1/sinbad/analyze-wound', {
          method: 'POST',
          body: formData,
        });

        if (!response.ok) throw new Error(`Inference error: ${response.status}`);
        const data = await response.json();

        // Render API Output
        document.getElementById('scan-input-controls').style.display = 'none';
        document.getElementById('scan-results-panel').style.display = 'block';

        const scoreEl = document.getElementById('res-sinbad-score');
        scoreEl.textContent = `${data.sinbad_score} / 6 (${data.severity_tier})`;
        scoreEl.className = data.sinbad_score >= 3 ? 'diag-val-warn' : 'diag-val-success';

        document.getElementById('res-wound-area').textContent = `${data.ai_diagnostics.calculated_area_cm2} cm²`;
        document.getElementById('res-infection-status').textContent = data.ai_diagnostics.task1_classification;
        document.getElementById('res-clinical-rec').textContent = data.clinical_recommendation;

        showToast('AI Diagnosis Complete');

      } catch (err) {
        console.error(err);
        alert('Failed to connect to FastAPI backend. Ensure uvicorn is running on port 8000.');
      } finally {
        btnRunScan.disabled = false;
        btnRunScan.innerHTML = '<i data-lucide="activity" style="width: 14px; height: 14px;"></i> Analyze with AI Engine';
        if (window.lucide) window.lucide.createIcons();
      }
    });
  }

  // Reset Scan Button
  if (btnReset) {
    btnReset.addEventListener('click', () => {
      document.getElementById('scan-results-panel').style.display = 'none';
      document.getElementById('scan-input-controls').style.display = 'block';
      fileInput.value = '';
      imagePreview.style.display = 'none';
      if (placeholder) placeholder.style.display = 'block';
      hudStatus.textContent = 'CAMERA: READY // CLICK TO UPLOAD';
    });
  }

  /* --------------------------------------------------------------------------
     5. MOBILE MENU DRAWER
     -------------------------------------------------------------------------- */
  const mobileToggleBtn = document.querySelector('.nav-mobile-toggle');
  const mobileDrawer = document.getElementById('mobile-drawer');
  const closeMobileMenuBtn = document.querySelector('.js-close-mobile-menu');

  if (mobileToggleBtn && mobileDrawer) {
    mobileToggleBtn.addEventListener('click', () => {
      mobileDrawer.classList.add('is-open');
      document.body.style.overflow = 'hidden';
    });
  }

  if (closeMobileMenuBtn && mobileDrawer) {
    closeMobileMenuBtn.addEventListener('click', () => {
      mobileDrawer.classList.remove('is-open');
      document.body.style.overflow = '';
    });
  }

  document.querySelectorAll('.mobile-menu-links a').forEach(link => {
    link.addEventListener('click', () => {
      if (mobileDrawer) {
        mobileDrawer.classList.remove('is-open');
        document.body.style.overflow = '';
      }
    });
  });

  /* --------------------------------------------------------------------------
     6. SCROLL REVEAL OBSERVER
     -------------------------------------------------------------------------- */
  const revealElements = document.querySelectorAll('.reveal-on-scroll');

  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.1 });

    revealElements.forEach(el => observer.observe(el));
  } else {
    revealElements.forEach(el => el.classList.add('is-visible'));
  }
});