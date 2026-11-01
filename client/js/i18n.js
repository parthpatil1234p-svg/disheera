/*
 * Copyright (C) 2026 Disheera Technologies Inc.
 * Licensed under the GNU Affero General Public License v3.0 or later.
 * See the LICENSE file for details.
 */
/**
 * i18n.js - Multilingual Localization (English, मराठी, हिन्दी) & Web Speech API Voice Reader
 * Disheera Technologies Inc.
 * Enables zero-latency vernacular career guidance for Maharashtra & Khandesh engineering students.
 */

(function () {
  'use strict';

  // ── 1. Dictionary Definitions (EN, MR, HI) ───────────────────────
  const TRANSLATIONS = {
    en: {
      nav_platform: 'Platform',
      nav_solutions: 'Solutions',
      nav_for_recruiters: 'For Recruiters',
      nav_pricing: 'Pricing',
      nav_login: 'Log In',
      nav_get_started: 'Start Free',
      nav_dashboard: 'Dashboard',
      nav_roadmap: 'Roadmap',
      nav_recommendations: 'Recommendations',
      nav_quiz: 'Skill Quiz',
      nav_jobs: 'Job Board',
      nav_support: 'Support Desk',
      nav_passport: 'Skill Passport',
      btn_listen: 'Listen',
      btn_speaking: 'Speaking...',
      btn_stop: 'Stop Audio',
      btn_submit_project: 'Submit Project for Verification',
      badge_verified: 'Verified',
      badge_project_verified: 'Project Verified',
      radar_title: 'Maharashtra Industrial Proximity Radar',
      radar_subtitle: 'Explore regional engineering and agri-tech employers in Jalgaon, Aurangabad & Nashik.',
      concept_event_loop_title: 'Event Loop',
      concept_event_loop_desc: 'Mechanism in JavaScript that handles asynchronous callbacks without blocking the main execution thread.',
      concept_api_title: 'REST API',
      concept_api_desc: 'Standard protocol for software components to communicate securely over HTTP using JSON payloads.',
      concept_plc_title: 'PLC & SCADA',
      concept_plc_desc: 'Industrial computers and monitoring screens controlling factory assembly lines and automated pumps.',
      concept_irrigation_title: 'Smart Micro-Irrigation',
      concept_irrigation_desc: 'Automated water conservation grid modulating dripper valves via soil moisture telemetry.'
    },
    mr: {
      nav_platform: 'प्लॅटफॉर्म',
      nav_solutions: 'समाधाने',
      nav_for_recruiters: 'रिक्रूटर्ससाठी',
      nav_pricing: 'किंमत',
      nav_login: 'लॉग इन करा',
      nav_get_started: 'मोफत सुरू करा',
      nav_dashboard: 'डॅशबोर्ड',
      nav_roadmap: 'करिअर रोडमॅप',
      nav_recommendations: 'शिफारसी',
      nav_quiz: 'कौशल्य चाचणी',
      nav_jobs: 'नोकरी संधी',
      nav_support: 'मदत केंद्र',
      nav_passport: 'स्किल पासपोर्ट',
      btn_listen: 'ऐका',
      btn_speaking: 'ऑडिओ सुरू आहे...',
      btn_stop: 'थांबवा',
      btn_submit_project: 'प्रकल्प पडताळणीसाठी पाठवा',
      badge_verified: 'प्रमाणित',
      badge_project_verified: 'प्रकल्प प्रमाणित',
      radar_title: 'महाराष्ट्र औद्योगिक निकटता रडार',
      radar_subtitle: 'जळगाव, छत्रपती संभाजीनगर आणि नाशिकमधील स्थानिक कंपन्यांच्या नोकऱ्या पहा.',
      concept_event_loop_title: 'इव्हेंट लूप (Event Loop)',
      concept_event_loop_desc: 'जाव्हास्क्रिप्टमधील असिंक्रोनस कार्ये मुख्य थ्रेड ब्लॉक न करता हाताळणारी यंत्रणा.',
      concept_api_title: 'रेस्ट एपीआय (REST API)',
      concept_api_desc: 'सॉफ्टवेअर प्रोग्राम्समधील सुरक्षित माहिती देवाणघेवाणीचा जागतिक स्टँडर्ड प्रोटोकॉल.',
      concept_plc_title: 'पीएलसी आणि स्काडा (PLC/SCADA)',
      concept_plc_desc: 'फॅक्टरी आणि पाईपलाईनमधील स्वयंचलित मशिनरी नियंत्रित करणारे इंडस्ट्रियल संगणक.',
      concept_irrigation_title: 'स्मार्ट सूक्ष्म-सिंचन तंत्रज्ञान',
      concept_irrigation_desc: 'जमिनीतील आर्द्रता सेन्सरद्वारे स्वयंचलित ठिबक सिंचन पाणी वाटप करणारी स्मार्ट यंत्रणा.'
    },
    hi: {
      nav_platform: 'प्लेटफ़ॉर्म',
      nav_solutions: 'समाधान',
      nav_for_recruiters: 'रिक्रूटर्स के लिए',
      nav_pricing: 'मूल्य',
      nav_login: 'लॉग इन करें',
      nav_get_started: 'मुफ़्त शुरू करें',
      nav_dashboard: 'डैशबोर्ड',
      nav_roadmap: 'करियर रोडमैप',
      nav_recommendations: 'सिफारिशें',
      nav_quiz: 'कौशल परीक्षण',
      nav_jobs: 'नौकरी के अवसर',
      nav_support: 'सहायता केंद्र',
      nav_passport: 'स्किल पासपोर्ट',
      btn_listen: 'सुनें',
      btn_speaking: 'ऑडियो जारी है...',
      btn_stop: 'रोकें',
      btn_submit_project: 'परियोजना सत्यापन हेतु जमा करें',
      badge_verified: 'सत्यापित',
      badge_project_verified: 'प्रोजेक्ट सत्यापित',
      radar_title: 'महाराष्ट्र औद्योगिक निकटता रडार',
      radar_subtitle: 'जलगांव, औरंगाबाद और नासिक की प्रमुख कंपनियों में स्थानीय इंजीनियरिंग करियर अवसर।',
      concept_event_loop_title: 'इवेंट लूप (Event Loop)',
      concept_event_loop_desc: 'जावास्क्रिप्ट में मुख्य थ्रेड को ब्लॉक किए बिना कार्यों को निष्पादित करने वाली प्रणाली।',
      concept_api_title: 'रेस्ट एपीआई (REST API)',
      concept_api_desc: 'सॉफ्टवेयर सिस्टम्स के बीच सुरक्षित डेटा आदान-प्रदान का मानक प्रोटोकॉल।',
      concept_plc_title: 'पीएलसी और स्काडा (PLC/SCADA)',
      concept_plc_desc: 'कारखानों में स्वचालित असेंबली लाइनों और पंपों को नियंत्रित करने वाले औद्योगिक कंप्यूटर।',
      concept_irrigation_title: 'स्मार्ट सूक्ष्म-सिंचाई तकनीक',
      concept_irrigation_desc: 'मिट्टी की नमी सेंसर द्वारा स्वतः ड्रिप सिंचाई नियंत्रित करने वाली प्रणाली।'
    }
  };

  let currentLang = localStorage.getItem('cp_lang') || 'en';
  let speechSynth = window.speechSynthesis || null;
  let currentUtterance = null;
  let isSpeaking = false;

  // ── 2. Speech Engine (Web Speech API) ───────────────────────────
  function getVoiceForLang(langCode) {
    if (!speechSynth) return null;
    const voices = speechSynth.getVoices();
    if (!voices || voices.length === 0) return null;

    if (langCode === 'mr') {
      return voices.find(v => v.lang.startsWith('mr') || v.lang === 'mr-IN') ||
             voices.find(v => v.lang.startsWith('hi') || v.lang === 'hi-IN') ||
             voices[0];
    }
    if (langCode === 'hi') {
      return voices.find(v => v.lang.startsWith('hi') || v.lang === 'hi-IN') ||
             voices[0];
    }
    return voices.find(v => v.lang.startsWith('en-IN') || v.lang.startsWith('en')) || voices[0];
  }

  function speakText(text, lang, onEndCallback) {
    if (!speechSynth) {
      console.warn('[i18n Speech] Web Speech API not supported on this device.');
      return;
    }

    stopSpeaking();

    const targetLang = lang || currentLang;
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = targetLang === 'mr' ? 'mr-IN' : targetLang === 'hi' ? 'hi-IN' : 'en-IN';
    utterance.rate = targetLang === 'mr' ? 0.95 : 1.0;
    utterance.pitch = 1.0;

    const matchedVoice = getVoiceForLang(targetLang);
    if (matchedVoice) {
      utterance.voice = matchedVoice;
    }

    utterance.onstart = () => {
      isSpeaking = true;
      currentUtterance = utterance;
      updateListenButtonStates(true);
    };

    utterance.onend = () => {
      isSpeaking = false;
      currentUtterance = null;
      updateListenButtonStates(false);
      if (typeof onEndCallback === 'function') onEndCallback();
    };

    utterance.onerror = (e) => {
      console.warn('[i18n Speech] Utterance error:', e);
      isSpeaking = false;
      currentUtterance = null;
      updateListenButtonStates(false);
    };

    speechSynth.speak(utterance);
  }

  function stopSpeaking() {
    if (speechSynth && speechSynth.speaking) {
      speechSynth.cancel();
    }
    isSpeaking = false;
    currentUtterance = null;
    updateListenButtonStates(false);
  }

  function updateListenButtonStates(active) {
    document.querySelectorAll('.cp-listen-btn').forEach(btn => {
      const icon = btn.querySelector('i');
      const textSpan = btn.querySelector('.cp-listen-label');
      if (active) {
        if (icon) icon.className = 'bi bi-volume-mute-fill text-warning';
        if (textSpan) textSpan.textContent = t('btn_speaking');
      } else {
        if (icon) icon.className = 'bi bi-volume-up-fill text-info';
        if (textSpan) textSpan.textContent = t('btn_listen');
      }
    });
  }

  // Helper to construct a listen button
  function createListenButton(textToRead, lang) {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'btn btn-outline-info btn-xs cp-listen-btn rounded-pill px-2.5 py-1 d-inline-flex align-items-center gap-1 font-mono shadow-sm';
    btn.style.fontSize = '0.75rem';
    btn.innerHTML = `<i class="bi bi-volume-up-fill text-info"></i> <span class="cp-listen-label">${t('btn_listen')}</span>`;
    btn.setAttribute('aria-label', 'Listen to text');

    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      e.preventDefault();
      if (isSpeaking) {
        stopSpeaking();
      } else {
        speakText(textToRead, lang || currentLang);
      }
    });

    return btn;
  }

  // ── 3. Translation Helper Functions ────────────────────────────
  function t(key) {
    const dict = TRANSLATIONS[currentLang] || TRANSLATIONS.en;
    return dict[key] || TRANSLATIONS.en[key] || key;
  }

  function setLanguage(lang) {
    if (!TRANSLATIONS[lang]) lang = 'en';
    currentLang = lang;
    localStorage.setItem('cp_lang', lang);

    // Apply translations across DOM elements with data-i18n
    document.querySelectorAll('[data-i18n]').forEach(el => {
      const key = el.getAttribute('data-i18n');
      if (key) {
        const translation = t(key);
        if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') {
          el.placeholder = translation;
        } else {
          el.textContent = translation;
        }
      }
    });

    // Update active state in selectors
    document.querySelectorAll('.cp-lang-selector').forEach(sel => {
      sel.value = lang;
    });

    // Notify listeners
    window.dispatchEvent(new CustomEvent('cp-language-changed', { detail: { lang } }));
  }

  // ── 4. Inject Language Selector into Navbar / Page ──────────────
  function injectLanguageSwitcher() {
    // Avoid double injection
    if (document.getElementById('cpGlobalLangSelectorWrapper')) return;

    // Look for right-side nav container or fallback to body
    const navEnd = document.querySelector('.navbar .d-flex.align-items-center.gap-2') ||
                   document.querySelector('.navbar-nav') ||
                   document.querySelector('.navbar');

    const wrapper = document.createElement('div');
    wrapper.id = 'cpGlobalLangSelectorWrapper';
    wrapper.className = 'd-inline-flex align-items-center gap-1 ms-2';
    wrapper.innerHTML = `
      <div class="input-group input-group-sm" style="width: auto;">
        <span class="input-group-text bg-light text-primary border-line px-2 py-0.5" style="font-size: 0.72rem;">
          <i class="bi bi-translate"></i>
        </span>
        <select class="form-select form-select-sm cp-lang-selector bg-white text-ink border-line font-mono py-0.5 ps-2 pe-4" style="font-size: 0.72rem; cursor: pointer;" aria-label="Select Language">
          <option value="en" ${currentLang === 'en' ? 'selected' : ''}>EN (English)</option>
          <option value="mr" ${currentLang === 'mr' ? 'selected' : ''}>MR (मराठी)</option>
          <option value="hi" ${currentLang === 'hi' ? 'selected' : ''}>HI (हिन्दी)</option>
        </select>
      </div>
    `;

    const selectEl = wrapper.querySelector('.cp-lang-selector');
    selectEl.addEventListener('change', (e) => {
      setLanguage(e.target.value);
    });

    if (navEnd) {
      navEnd.prepend(wrapper);
    }
  }

  // ── 5. Initialize on DOM Load ──────────────────────────────────
  document.addEventListener('DOMContentLoaded', () => {
    injectLanguageSwitcher();
    setLanguage(currentLang);

    // Warm up speech synthesis voices if available
    if (speechSynth && speechSynth.onvoiceschanged !== undefined) {
      speechSynth.onvoiceschanged = () => {
        // Voices loaded
      };
    }
  });

  // ── 6. Global Window API ───────────────────────────────────────
  window.cpI18n = {
    t,
    setLanguage,
    getLanguage: () => currentLang,
    speakText,
    stopSpeaking,
    isSpeaking: () => isSpeaking,
    createListenButton,
    TRANSLATIONS
  };
})();
