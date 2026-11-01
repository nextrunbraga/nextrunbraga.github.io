/**
 * Next Run Club Braga — Aplicação Principal com Suporte a i18n
 */

document.addEventListener('DOMContentLoaded', () => {
  // ==========================================
  // 1. SISTEMA DE INTERNACIONALIZAÇÃO (i18n)
  // ==========================================
  const supportedLangs = ['en', 'pt-PT', 'pt-BR', 'es', 'fr', 'it'];
  const langMetaMap = {
    'en':    { flag: '🇬🇧', code: 'EN' },
    'pt-PT': { flag: '🇵🇹', code: 'PT' },
    'pt-BR': { flag: '🇧🇷', code: 'BR' },
    'es':    { flag: '🇪🇸', code: 'ES' },
    'fr':    { flag: '🇫🇷', code: 'FR' },
    'it':    { flag: '🇮🇹', code: 'IT' }
  };
  const STORAGE_KEY = 'next_run_lang_pref_v3';

  // Detecção de idioma com hierarquia estrita:
  // 1º URL Param (?lang=...) -> 2º LocalStorage ('next_run_lang_pref_v3') -> 3º Default fixo 'pt-PT'
  const detectLanguage = () => {
    // 1. URL Query Param: ?lang=xx
    const urlParams = new URLSearchParams(window.location.search);
    const paramLang = urlParams.get('lang');
    if (paramLang && supportedLangs.includes(paramLang)) {
      return paramLang;
    }

    // 2. LocalStorage (gravado apenas quando o usuário clica em uma bandeira)
    try {
      const storedLang = localStorage.getItem(STORAGE_KEY);
      if (storedLang && supportedLangs.includes(storedLang)) {
        return storedLang;
      }
    } catch (e) {
      console.warn('LocalStorage inacessível:', e);
    }

    // 3. Default Fixo (Sempre Português de Portugal inicialmente — NÃO usa navigator.language)
    return 'en';
  };

  let currentLang = detectLanguage();

  // Helper para obter valor aninhado no dicionário (ex: 'hero.titleMain')
  const getNestedValue = (obj, path) => {
    return path.split('.').reduce((acc, part) => acc && acc[part], obj);
  };

  // Função central para aplicar idioma
  window.setLanguage = (lang, saveToStorage = true) => {
    if (!supportedLangs.includes(lang)) lang = 'en';
    currentLang = lang;

    if (saveToStorage) {
      try {
        localStorage.setItem(STORAGE_KEY, lang);
      } catch (e) {}
    }

    // 1. Tag HTML lang
    document.documentElement.lang = lang;

    // 2. Dicionário do idioma
    const t = window.i18nData[lang] || window.i18nData['pt-PT'] || window.i18nData['en'];

    // 3. Atualizar Meta Tags & Título
    if (t.meta) {
      if (t.meta.title) document.title = t.meta.title;
      const metaDesc = document.querySelector('meta[name="description"]');
      if (metaDesc && t.meta.description) metaDesc.setAttribute('content', t.meta.description);
      const ogTitle = document.querySelector('meta[property="og:title"]');
      if (ogTitle && t.meta.title) ogTitle.setAttribute('content', t.meta.title);
      const ogDesc = document.querySelector('meta[property="og:description"]');
      if (ogDesc && t.meta.description) ogDesc.setAttribute('content', t.meta.description);
    }

    // 4. Traduzir todos os nós com data-i18n
    document.querySelectorAll('[data-i18n]').forEach(el => {
      const key = el.getAttribute('data-i18n');
      const val = getNestedValue(t, key);
      if (val !== undefined && val !== null) {
        el.textContent = val;
      }
    });

    // 5. Traduzir nós com data-i18n-html
    document.querySelectorAll('[data-i18n-html]').forEach(el => {
      const key = el.getAttribute('data-i18n-html');
      const val = getNestedValue(t, key);
      if (val !== undefined && val !== null) {
        el.innerHTML = val;
      }
    });

    // 6. Traduzir atributos específicos (placeholder, title, alt)
    document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
      const key = el.getAttribute('data-i18n-placeholder');
      const val = getNestedValue(t, key);
      if (val !== undefined && val !== null) el.placeholder = val;
    });

    // 7. Atualizar Botões de Idioma (Header Bar e Drawer Mobile)
    updateLanguageSelectorsUI(lang);

    // 8. Atualizar Squad Matcher e Calculadora
    updateSquadMatch();
    updatePaceCalculator();

    // 9. Atualizar URL history sem reload
    const currentUrl = new URL(window.location.href);
    if (currentUrl.searchParams.get('lang') !== lang) {
      currentUrl.searchParams.set('lang', lang);
      window.history.replaceState({}, '', currentUrl.toString());
    }
  };

  const updateLanguageSelectorsUI = (lang) => {
    // 1. Atualizar Botão Compacto do Header (#langTriggerFlag e #langTriggerCode)
    const triggerFlag = document.getElementById('langTriggerFlag');
    const triggerCode = document.getElementById('langTriggerCode');
    const meta = langMetaMap[lang] || langMetaMap['en'];
    if (triggerFlag && meta) triggerFlag.textContent = meta.flag;
    if (triggerCode && meta) triggerCode.textContent = meta.code;

    // 2. Botões do Dropdown Flutuante (#langDropdownMenu .lang-btn)
    document.querySelectorAll('.lang-btn').forEach(btn => {
      const btnLang = btn.getAttribute('data-lang');
      if (btnLang === lang) {
        btn.className = 'lang-btn w-full px-3 py-2.5 rounded-xl flex items-center justify-between text-xs transition-all bg-white text-black font-extrabold shadow-sm';
        btn.setAttribute('aria-pressed', 'true');
      } else {
        btn.className = 'lang-btn w-full px-3 py-2.5 rounded-xl flex items-center justify-between text-xs transition-all bg-transparent text-neutral-300 hover:bg-white/10 hover:text-white font-medium';
        btn.setAttribute('aria-pressed', 'false');
      }
    });

    // 3. Botões da grade do menu mobile (.mobile-lang-btn)
    document.querySelectorAll('.mobile-lang-btn').forEach(btn => {
      const btnLang = btn.getAttribute('data-lang');
      if (btnLang === lang) {
        btn.className = 'mobile-lang-btn py-2.5 px-2 rounded-xl text-xs flex flex-col items-center justify-center gap-1 transition-all bg-white text-black font-black border border-white';
        btn.setAttribute('aria-pressed', 'true');
      } else {
        btn.className = 'mobile-lang-btn py-2.5 px-2 rounded-xl text-xs flex flex-col items-center justify-center gap-1 transition-all bg-white/5 text-slate-300 border border-white/10 font-medium';
        btn.setAttribute('aria-pressed', 'false');
      }
    });
  };

  // Dropdown de Idiomas (Header)
  const langDropdownContainer = document.getElementById('langDropdownContainer');
  const langTriggerBtn = document.getElementById('langTriggerBtn');
  const langDropdownMenu = document.getElementById('langDropdownMenu');
  const langTriggerChevron = document.getElementById('langTriggerChevron');

  const closeLangDropdown = () => {
    if (langDropdownMenu && !langDropdownMenu.classList.contains('hidden')) {
      langDropdownMenu.classList.add('hidden');
      langDropdownMenu.classList.remove('flex');
      if (langTriggerBtn) langTriggerBtn.setAttribute('aria-expanded', 'false');
      if (langTriggerChevron) langTriggerChevron.classList.remove('rotate-180');
    }
  };

  const openLangDropdown = () => {
    if (langDropdownMenu) {
      langDropdownMenu.classList.remove('hidden');
      langDropdownMenu.classList.add('flex');
      if (langTriggerBtn) langTriggerBtn.setAttribute('aria-expanded', 'true');
      if (langTriggerChevron) langTriggerChevron.classList.add('rotate-180');
    }
  };

  const toggleLangDropdown = () => {
    if (langDropdownMenu) {
      if (langDropdownMenu.classList.contains('hidden')) {
        openLangDropdown();
      } else {
        closeLangDropdown();
      }
    }
  };

  if (langTriggerBtn) {
    langTriggerBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      toggleLangDropdown();
    });
  }

  // Fechar dropdown ao clicar fora
  document.addEventListener('click', (e) => {
    if (langDropdownContainer && !langDropdownContainer.contains(e.target)) {
      closeLangDropdown();
    }
  });

  // Fechar dropdown ao pressionar Escape
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      closeLangDropdown();
    }
  });

  // Setup dos listeners de troca de idioma (1 clique)
  const setupLanguageSelectors = () => {
    document.querySelectorAll('.lang-btn, .mobile-lang-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        const selected = btn.getAttribute('data-lang');
        if (selected && supportedLangs.includes(selected)) {
          window.setLanguage(selected, true);
          closeLangDropdown();
        }
      });
    });
  };

  setupLanguageSelectors();


  // ==========================================
  // 2. MENU MOBILE
  // ==========================================
  const mobileMenuBtn = document.getElementById('mobileMenuBtn');
  const mobileNav = document.getElementById('mobileNav');
  const mobileNavClose = document.getElementById('mobileNavClose');
  const mobileLinks = document.querySelectorAll('.mobile-link');

  if (mobileMenuBtn && mobileNav) {
    mobileMenuBtn.addEventListener('click', () => {
      mobileNav.classList.remove('hidden');
      setTimeout(() => mobileNav.classList.remove('opacity-0'), 10);
      document.body.style.overflow = 'hidden';
    });
  }

  const closeNav = () => {
    if (!mobileNav) return;
    mobileNav.classList.add('opacity-0');
    setTimeout(() => {
      mobileNav.classList.add('hidden');
      document.body.style.overflow = 'auto';
    }, 250);
  };

  if (mobileNavClose) mobileNavClose.addEventListener('click', closeNav);
  mobileLinks.forEach(link => link.addEventListener('click', closeNav));


  // ==========================================
  // 3. GALERIA & LIGHTBOX (24 FOTOS)
  // ==========================================
  const filterBtns = document.querySelectorAll('.filter-btn');
  const galleryItems = document.querySelectorAll('.gallery-card');
  const lightboxModal = document.getElementById('lightboxModal');
  const lightboxImg = document.getElementById('lightboxImg');
  const lightboxCaption = document.getElementById('lightboxCaption');
  const lightboxClose = document.getElementById('lightboxClose');
  const lightboxPrev = document.getElementById('lightboxPrev');
  const lightboxNext = document.getElementById('lightboxNext');

  let currentGalleryIndex = 0;
  let visibleGalleryItems = Array.from(galleryItems);

  filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      filterBtns.forEach(b => {
        b.classList.remove('bg-white', 'text-black', 'font-bold');
        b.classList.add('text-slate-300', 'bg-white/5');
      });
      btn.classList.add('bg-white', 'text-black', 'font-bold');
      btn.classList.remove('text-slate-300', 'bg-white/5');

      const filter = btn.getAttribute('data-filter');

      galleryItems.forEach(item => {
        const cat = item.getAttribute('data-category') || '';
        if (filter === 'all' || cat.includes(filter)) {
          item.style.display = 'block';
        } else {
          item.style.display = 'none';
        }
      });

      visibleGalleryItems = Array.from(galleryItems).filter(item => item.style.display !== 'none');
    });
  });

  const openLightbox = (index) => {
    currentGalleryIndex = index;
    const item = visibleGalleryItems[currentGalleryIndex];
    if (!item) return;

    const img = item.querySelector('img');
    const titleEl = item.querySelector('.gallery-title');
    const tagEl = item.querySelector('.gallery-tag');

    const title = titleEl ? titleEl.textContent.trim() : 'Next Run Club';
    const tag = tagEl ? tagEl.textContent.trim() : 'Braga, Portugal';

    lightboxImg.src = img.src;
    lightboxImg.alt = title;
    lightboxCaption.innerHTML = `<span class="text-white font-bold text-base sm:text-lg">${title}</span> &bull; <span class="text-neutral-300 text-sm">${tag}</span>`;

    lightboxModal.classList.add('active');
    document.body.style.overflow = 'hidden';
  };

  const closeLightbox = () => {
    lightboxModal.classList.remove('active');
    document.body.style.overflow = 'auto';
  };

  const nextLightbox = () => {
    if (visibleGalleryItems.length === 0) return;
    currentGalleryIndex = (currentGalleryIndex + 1) % visibleGalleryItems.length;
    openLightbox(currentGalleryIndex);
  };

  const prevLightbox = () => {
    if (visibleGalleryItems.length === 0) return;
    currentGalleryIndex = (currentGalleryIndex - 1 + visibleGalleryItems.length) % visibleGalleryItems.length;
    openLightbox(currentGalleryIndex);
  };

  galleryItems.forEach(item => {
    item.addEventListener('click', () => {
      const idx = visibleGalleryItems.indexOf(item);
      if (idx !== -1) openLightbox(idx);
    });
  });

  if (lightboxClose) lightboxClose.addEventListener('click', closeLightbox);
  if (lightboxNext) lightboxNext.addEventListener('click', nextLightbox);
  if (lightboxPrev) lightboxPrev.addEventListener('click', prevLightbox);

  if (lightboxModal) {
    lightboxModal.addEventListener('click', (e) => {
      if (e.target === lightboxModal) closeLightbox();
    });
  }

  document.addEventListener('keydown', (e) => {
    if (!lightboxModal.classList.contains('active')) return;
    if (e.key === 'Escape') closeLightbox();
    if (e.key === 'ArrowRight') nextLightbox();
    if (e.key === 'ArrowLeft') prevLightbox();
  });


  // ==========================================
  // 4. SQUAD MATCHER & CALCULADORA DE PACE
  // ==========================================
  // Abas do Personalizador
  const tabSquadBtn = document.getElementById('tabSquadBtn');
  const tabPaceBtn = document.getElementById('tabPaceBtn');
  const panelSquad = document.getElementById('panelSquad');
  const panelPace = document.getElementById('panelPace');

  if (tabSquadBtn && tabPaceBtn && panelSquad && panelPace) {
    tabSquadBtn.addEventListener('click', () => {
      tabSquadBtn.classList.add('bg-white', 'text-black', 'font-black');
      tabSquadBtn.classList.remove('text-slate-300', 'bg-white/5');
      tabPaceBtn.classList.remove('bg-white', 'text-black', 'font-black');
      tabPaceBtn.classList.add('text-slate-300', 'bg-white/5');
      panelSquad.classList.remove('hidden');
      panelPace.classList.add('hidden');
    });

    tabPaceBtn.addEventListener('click', () => {
      tabPaceBtn.classList.add('bg-white', 'text-black', 'font-black');
      tabPaceBtn.classList.remove('text-slate-300', 'bg-white/5');
      tabSquadBtn.classList.remove('bg-white', 'text-black', 'font-black');
      tabSquadBtn.classList.add('text-slate-300', 'bg-white/5');
      panelPace.classList.remove('hidden');
      panelSquad.classList.add('hidden');
    });
  }

  // Squad Matcher
  const levelSelect = document.getElementById('levelSelect');
  const distanceSelect = document.getElementById('distanceSelect');
  const paceResultCard = document.getElementById('paceResultCard');
  const paceGroupName = document.getElementById('paceGroupName');
  const paceDescription = document.getElementById('paceDescription');
  const pacePacer = document.getElementById('pacePacer');
  const paceBadge = document.getElementById('paceBadge');

  function updateSquadMatch() {
    if (!levelSelect || !paceResultCard) return;
    const t = window.i18nData[currentLang] || window.i18nData['pt-PT'];
    const groups = t.squads || window.i18nData['pt-PT'].squads;

    const selected = levelSelect.value || 'beginner';
    const group = groups[selected] || groups['beginner'];

    if (paceGroupName) paceGroupName.textContent = group.name;
    if (pacePacer) pacePacer.textContent = group.pacer;
    if (paceBadge) paceBadge.textContent = group.pace;
    if (paceDescription) paceDescription.textContent = group.desc;

    // highlight animation
    paceResultCard.classList.add('scale-[1.01]', 'border-white');
    setTimeout(() => {
      paceResultCard.classList.remove('scale-[1.01]');
    }, 200);
  }

  if (levelSelect) levelSelect.addEventListener('change', updateSquadMatch);
  if (distanceSelect) distanceSelect.addEventListener('change', updateSquadMatch);


  // Calculadora Interativa de Pace & Zonas Fisiológicas
  const calcDistPreset = document.getElementById('calcDistPreset');
  const calcCustomDist = document.getElementById('calcCustomDist');
  const calcHours = document.getElementById('calcHours');
  const calcMins = document.getElementById('calcMins');
  const calcSecs = document.getElementById('calcSecs');
  const btnCalculatePace = document.getElementById('btnCalculatePace');

  // Outputs
  const paceAvgResult = document.getElementById('paceAvgResult');
  const speedAvgResult = document.getElementById('speedAvgResult');
  const z1Pace = document.getElementById('z1Pace');
  const z2Pace = document.getElementById('z2Pace');
  const z3Pace = document.getElementById('z3Pace');
  const z4Pace = document.getElementById('z4Pace');
  const z5Pace = document.getElementById('z5Pace');

  const formatPace = (totalSecondsPerKm) => {
    if (isNaN(totalSecondsPerKm) || totalSecondsPerKm <= 0 || !isFinite(totalSecondsPerKm)) return "--:--";
    const mins = Math.floor(totalSecondsPerKm / 60);
    const secs = Math.round(totalSecondsPerKm % 60);
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  function updatePaceCalculator() {
    if (!calcDistPreset || !calcHours || !calcMins || !calcSecs) return;

    let distance = parseFloat(calcDistPreset.value);
    if (calcDistPreset.value === 'custom') {
      distance = parseFloat(calcCustomDist.value) || 5;
    }

    const hours = parseInt(calcHours.value) || 0;
    const mins = parseInt(calcMins.value) || 0;
    const secs = parseInt(calcSecs.value) || 0;

    const totalSeconds = (hours * 3600) + (mins * 60) + secs;

    if (totalSeconds <= 0 || distance <= 0) return;

    const secondsPerKm = totalSeconds / distance;
    const speedKmh = (distance / (totalSeconds / 3600));

    if (paceAvgResult) {
      paceAvgResult.textContent = `${formatPace(secondsPerKm)} min/km`;
    }
    if (speedAvgResult) {
      speedAvgResult.textContent = `${speedKmh.toFixed(1)} km/h`;
    }

    // Cálculo das Zonas de Treino Fisiológicas com base no Pace Alvo:
    // Z1 (Recuperação): +1:15 a +1:45 min/km (+75s a +105s)
    if (z1Pace) z1Pace.textContent = `${formatPace(secondsPerKm + 85)} - ${formatPace(secondsPerKm + 115)} min/km`;
    // Z2 (Base Aeróbica): +45s a +1:15 min/km (+45s a +75s)
    if (z2Pace) z2Pace.textContent = `${formatPace(secondsPerKm + 45)} - ${formatPace(secondsPerKm + 75)} min/km`;
    // Z3 (Ritmo Maratona): +15s a +35s min/km
    if (z3Pace) z3Pace.textContent = `${formatPace(secondsPerKm + 15)} - ${formatPace(secondsPerKm + 35)} min/km`;
    // Z4 (Limiar de Lactato): -10s a +10s do ritmo alvo
    if (z4Pace) z4Pace.textContent = `${formatPace(secondsPerKm - 10)} - ${formatPace(secondsPerKm + 10)} min/km`;
    // Z5 (VO2 Máximo / Tiros): -35s a -50s do ritmo alvo
    if (z5Pace) z5Pace.textContent = `${formatPace(Math.max(120, secondsPerKm - 45))} - ${formatPace(Math.max(130, secondsPerKm - 30))} min/km`;
  }

  if (calcDistPreset) {
    calcDistPreset.addEventListener('change', () => {
      if (calcDistPreset.value === 'custom') {
        if (calcCustomDist) calcCustomDist.classList.remove('hidden');
      } else {
        if (calcCustomDist) calcCustomDist.classList.add('hidden');
      }
      updatePaceCalculator();
    });
  }

  if (calcCustomDist) calcCustomDist.addEventListener('input', updatePaceCalculator);
  if (calcHours) calcHours.addEventListener('input', updatePaceCalculator);
  if (calcMins) calcMins.addEventListener('input', updatePaceCalculator);
  if (calcSecs) calcSecs.addEventListener('input', updatePaceCalculator);
  if (btnCalculatePace) btnCalculatePace.addEventListener('click', updatePaceCalculator);


  // ==========================================
  // 5. FAQ ACCORDION
  // ==========================================
  const faqItems = document.querySelectorAll('.faq-item');
  faqItems.forEach(item => {
    const trigger = item.querySelector('.faq-trigger');
    const content = item.querySelector('.faq-content');
    const icon = item.querySelector('.faq-icon');

    if (trigger && content) {
      trigger.addEventListener('click', () => {
        const isOpen = !content.classList.contains('hidden');

        // Close all
        document.querySelectorAll('.faq-content').forEach(c => c.classList.add('hidden'));
        document.querySelectorAll('.faq-icon').forEach(i => i.classList.remove('rotate-180'));

        if (!isOpen) {
          content.classList.remove('hidden');
          if (icon) icon.classList.add('rotate-180');
        }
      });
    }
  });


  // ==========================================
  // 6. SCROLL PROGRESS BAR
  // ==========================================
  const progressBar = document.getElementById('scrollProgress');
  window.addEventListener('scroll', () => {
    if (!progressBar) return;
    const winScroll = document.body.scrollTop || document.documentElement.scrollTop;
    const height = document.documentElement.scrollHeight - document.documentElement.clientHeight;
    if (height > 0) {
      const scrolled = (winScroll / height) * 100;
      progressBar.style.width = scrolled + '%';
    }
  });


  // Inicialização com idioma detectado (padrão fixo 'en')
  window.setLanguage(currentLang, false);
  updatePaceCalculator();
});
