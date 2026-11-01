/*
 * Copyright (C) 2026 Disheera Technologies Inc.
 * Licensed under the GNU Affero General Public License v3.0 or later.
 * See the LICENSE file for details.
 */
/**
 * client/js/tech-logos.js — Unified Technology & Programming Logo Resolver
 * Powered by All_logo_and_pictures SVG pack (bablubambal) + curated vector icons
 */

(function () {
  'use strict';

  const LOGO_BASE_PATH = 'assets/tech-logos';

  // Comprehensive alias dictionary mapping skill/language/tech names to SVG/PNG paths
  const TECH_LOGO_MAP = {
    // Programming Languages
    'javascript': `${LOGO_BASE_PATH}/languages/javascript.svg`,
    'js': `${LOGO_BASE_PATH}/languages/javascript.svg`,
    'typescript': `${LOGO_BASE_PATH}/languages/typescript.svg`,
    'ts': `${LOGO_BASE_PATH}/languages/typescript.svg`,
    'python': `${LOGO_BASE_PATH}/languages/python.svg`,
    'py': `${LOGO_BASE_PATH}/languages/python.svg`,
    'c': `${LOGO_BASE_PATH}/languages/c.svg`,
    'c++': `${LOGO_BASE_PATH}/languages/cpp.svg`,
    'cpp': `${LOGO_BASE_PATH}/languages/cpp.svg`,
    'cplusplus': `${LOGO_BASE_PATH}/languages/cpp.svg`,
    'c#': `${LOGO_BASE_PATH}/languages/csharp.svg`,
    'csharp': `${LOGO_BASE_PATH}/languages/csharp.svg`,
    'c-sharp': `${LOGO_BASE_PATH}/languages/csharp.svg`,
    'java': `${LOGO_BASE_PATH}/languages/java.svg`,
    'go': `${LOGO_BASE_PATH}/languages/go.svg`,
    'golang': `${LOGO_BASE_PATH}/languages/go.svg`,
    'rust': `${LOGO_BASE_PATH}/languages/rust.svg`,
    'dart': `${LOGO_BASE_PATH}/languages/dart.svg`,
    'kotlin': `${LOGO_BASE_PATH}/languages/kotlin.svg`,
    'ruby': `${LOGO_BASE_PATH}/languages/ruby.svg`,
    'php': `${LOGO_BASE_PATH}/languages/php.png`,
    'bash': `${LOGO_BASE_PATH}/languages/bash.svg`,
    'shell': `${LOGO_BASE_PATH}/languages/bash.svg`,
    'haskell': `${LOGO_BASE_PATH}/languages/haskell.svg`,
    'julia': `${LOGO_BASE_PATH}/social-icons/julia.svg`,

    // Web & Core Essentials
    'html': `${LOGO_BASE_PATH}/others/html.svg`,
    'html5': `${LOGO_BASE_PATH}/others/html.svg`,
    'css': `${LOGO_BASE_PATH}/others/css.svg`,
    'css3': `${LOGO_BASE_PATH}/others/css.svg`,
    'git': `${LOGO_BASE_PATH}/others/git.svg`,
    'npm': `${LOGO_BASE_PATH}/others/npm.svg`,
    'json': `${LOGO_BASE_PATH}/others/json.svg`,
    'markdown': `${LOGO_BASE_PATH}/social-icons/markdown.svg`,
    'markdown / docs': `${LOGO_BASE_PATH}/social-icons/markdown.svg`,
    'docs': `${LOGO_BASE_PATH}/social-icons/markdown.svg`,
    'documentation': `${LOGO_BASE_PATH}/social-icons/markdown.svg`,
    'responsive-design': `${LOGO_BASE_PATH}/others/html.svg`,
    'responsive design': `${LOGO_BASE_PATH}/others/html.svg`,
    'sass': `${LOGO_BASE_PATH}/social-icons/sass.svg`,
    'scss': `${LOGO_BASE_PATH}/social-icons/sass.svg`,

    // Frameworks & Runtimes
    'react': `${LOGO_BASE_PATH}/frameworks/react.svg`,
    'react.js': `${LOGO_BASE_PATH}/frameworks/react.svg`,
    'reactjs': `${LOGO_BASE_PATH}/frameworks/react.svg`,
    'react-native': `${LOGO_BASE_PATH}/frameworks/react.svg`,
    'react native': `${LOGO_BASE_PATH}/frameworks/react.svg`,
    'nextjs': `${LOGO_BASE_PATH}/custom/nextjs.svg`,
    'next.js': `${LOGO_BASE_PATH}/custom/nextjs.svg`,
    'next': `${LOGO_BASE_PATH}/custom/nextjs.svg`,
    'vue': `${LOGO_BASE_PATH}/frameworks/vuejs.svg`,
    'vue.js': `${LOGO_BASE_PATH}/frameworks/vuejs.svg`,
    'vuejs': `${LOGO_BASE_PATH}/frameworks/vuejs.svg`,
    'angular': `${LOGO_BASE_PATH}/frameworks/angular.svg`,
    'angular.js': `${LOGO_BASE_PATH}/frameworks/angular.svg`,
    'angularjs': `${LOGO_BASE_PATH}/frameworks/angular.svg`,
    'svelte': `${LOGO_BASE_PATH}/social-icons/svelte.svg`,
    'node': `${LOGO_BASE_PATH}/frameworks/nodejs.svg`,
    'node.js': `${LOGO_BASE_PATH}/frameworks/nodejs.svg`,
    'nodejs': `${LOGO_BASE_PATH}/frameworks/nodejs.svg`,
    'express': `${LOGO_BASE_PATH}/frameworks/nodejs.svg`,
    'express.js': `${LOGO_BASE_PATH}/frameworks/nodejs.svg`,
    'bootstrap': `${LOGO_BASE_PATH}/frameworks/boostrap.svg`,
    'tailwind': `${LOGO_BASE_PATH}/custom/tailwind.svg`,
    'tailwind css': `${LOGO_BASE_PATH}/custom/tailwind.svg`,
    'tailwindcss': `${LOGO_BASE_PATH}/custom/tailwind.svg`,
    'tailwind-css': `${LOGO_BASE_PATH}/custom/tailwind.svg`,
    'flutter': `${LOGO_BASE_PATH}/social-icons/flutter.svg`,
    'redux': `${LOGO_BASE_PATH}/frameworks/redux.svg`,
    'django': `${LOGO_BASE_PATH}/frameworks/django.svg`,
    'flask': `${LOGO_BASE_PATH}/frameworks/flask.svg`,
    'fastapi': `${LOGO_BASE_PATH}/frameworks/flask.svg`,
    'laravel': `${LOGO_BASE_PATH}/frameworks/laravel.svg`,
    'rails': `${LOGO_BASE_PATH}/frameworks/rails.svg`,
    'ruby on rails': `${LOGO_BASE_PATH}/frameworks/rails.svg`,
    'spring': `${LOGO_BASE_PATH}/frameworks/spring.svg`,
    'spring boot': `${LOGO_BASE_PATH}/frameworks/spring.svg`,
    'spring-boot': `${LOGO_BASE_PATH}/frameworks/spring.svg`,
    'android': `${LOGO_BASE_PATH}/frameworks/android.svg`,
    'deno': `${LOGO_BASE_PATH}/frameworks/deno.svg`,
    'jquery': `${LOGO_BASE_PATH}/frameworks/jquery.svg`,
    'wordpress': `${LOGO_BASE_PATH}/social-icons/wordpress.svg`,

    // Databases
    'mongodb': `${LOGO_BASE_PATH}/databases/mongodb.svg`,
    'mongo': `${LOGO_BASE_PATH}/databases/mongodb.svg`,
    'mysql': `${LOGO_BASE_PATH}/databases/mysql.svg`,
    'sql': `${LOGO_BASE_PATH}/databases/mysql.svg`,
    'postgresql': `${LOGO_BASE_PATH}/databases/postgresql.svg`,
    'postgres': `${LOGO_BASE_PATH}/databases/postgresql.svg`,
    'redis': `${LOGO_BASE_PATH}/databases/redis.svg`,
    'cassandra': `${LOGO_BASE_PATH}/databases/cassandra.svg`,
    'oracle': `${LOGO_BASE_PATH}/databases/oracle.svg`,
    'database-design': `${LOGO_BASE_PATH}/custom/database-design.svg`,
    'database design': `${LOGO_BASE_PATH}/custom/database-design.svg`,

    // Cloud, Containers & DevOps
    'docker': `${LOGO_BASE_PATH}/cloud/docker.svg`,
    'kubernetes': `${LOGO_BASE_PATH}/cloud/docker.svg`,
    'k8s': `${LOGO_BASE_PATH}/cloud/docker.svg`,
    'firebase': `${LOGO_BASE_PATH}/cloud/firebase.svg`,
    'github': `${LOGO_BASE_PATH}/cloud/github.svg`,
    'gitlab': `${LOGO_BASE_PATH}/cloud/gitlab.svg`,
    'bitbucket': `${LOGO_BASE_PATH}/cloud/bitbucket.svg`,
    'aws': `${LOGO_BASE_PATH}/cloud/amazon.svg`,
    'amazon web services': `${LOGO_BASE_PATH}/cloud/amazon.svg`,
    'azure': `${LOGO_BASE_PATH}/cloud/azure.svg`,
    'gcp': `${LOGO_BASE_PATH}/cloud/gcloud.svg`,
    'google cloud': `${LOGO_BASE_PATH}/cloud/gcloud.svg`,
    'digitalocean': `${LOGO_BASE_PATH}/social-icons/digitalocean.svg`,
    'ansible': `${LOGO_BASE_PATH}/cloud/ansible.svg`,
    'heroku': `${LOGO_BASE_PATH}/cloud/heroku.svg`,
    'terraform': `${LOGO_BASE_PATH}/cloud/terraform.png`,
    'ci-cd': `${LOGO_BASE_PATH}/cloud/github.svg`,
    'ci/cd': `${LOGO_BASE_PATH}/cloud/github.svg`,
    'linux': `${LOGO_BASE_PATH}/social-icons/linux.svg`,

    // Data Analytics, AI & Machine Learning
    'excel': `${LOGO_BASE_PATH}/custom/excel.svg`,
    'ms excel': `${LOGO_BASE_PATH}/custom/excel.svg`,
    'microsoft excel': `${LOGO_BASE_PATH}/custom/excel.svg`,
    'power-bi': `${LOGO_BASE_PATH}/custom/power-bi.svg`,
    'power bi': `${LOGO_BASE_PATH}/custom/power-bi.svg`,
    'powerbi': `${LOGO_BASE_PATH}/custom/power-bi.svg`,
    'statistics': `${LOGO_BASE_PATH}/custom/statistics.svg`,
    'stats': `${LOGO_BASE_PATH}/custom/statistics.svg`,
    'data-visualization': `${LOGO_BASE_PATH}/custom/data-visualization.svg`,
    'data visualization': `${LOGO_BASE_PATH}/custom/data-visualization.svg`,
    'data-cleaning': `${LOGO_BASE_PATH}/custom/data-cleaning.svg`,
    'data cleaning': `${LOGO_BASE_PATH}/custom/data-cleaning.svg`,
    'generative-ai': `${LOGO_BASE_PATH}/custom/generative-ai.svg`,
    'generative ai': `${LOGO_BASE_PATH}/custom/generative-ai.svg`,
    'generative ai & llms': `${LOGO_BASE_PATH}/custom/generative-ai.svg`,
    'generative ai and llms': `${LOGO_BASE_PATH}/custom/generative-ai.svg`,
    'llms': `${LOGO_BASE_PATH}/custom/generative-ai.svg`,
    'llm': `${LOGO_BASE_PATH}/custom/generative-ai.svg`,
    'langchain': `${LOGO_BASE_PATH}/custom/generative-ai.svg`,
    'machine-learning': `${LOGO_BASE_PATH}/custom/machine-learning.svg`,
    'machine learning': `${LOGO_BASE_PATH}/custom/machine-learning.svg`,
    'deep-learning': `${LOGO_BASE_PATH}/custom/machine-learning.svg`,
    'deep learning': `${LOGO_BASE_PATH}/custom/machine-learning.svg`,
    'nlp': `${LOGO_BASE_PATH}/custom/machine-learning.svg`,
    'natural-language-processing': `${LOGO_BASE_PATH}/custom/machine-learning.svg`,
    'natural language processing': `${LOGO_BASE_PATH}/custom/machine-learning.svg`,
    'scikit-learn': `${LOGO_BASE_PATH}/custom/machine-learning.svg`,
    'pandas': `${LOGO_BASE_PATH}/custom/pandas.svg`,
    'pytorch': `${LOGO_BASE_PATH}/custom/pytorch.svg`,
    'tensorflow': `${LOGO_BASE_PATH}/custom/tensorflow.svg`,
    'kaggle': `${LOGO_BASE_PATH}/social-icons/kaggle.svg`,

    // APIs, Networking & Security
    'api': `${LOGO_BASE_PATH}/custom/api.svg`,
    'apis': `${LOGO_BASE_PATH}/custom/api.svg`,
    'rest-apis': `${LOGO_BASE_PATH}/custom/api.svg`,
    'rest apis': `${LOGO_BASE_PATH}/custom/api.svg`,
    'restful apis': `${LOGO_BASE_PATH}/custom/api.svg`,
    'postman': `${LOGO_BASE_PATH}/custom/api.svg`,
    'authentication': `${LOGO_BASE_PATH}/custom/cybersecurity.svg`,
    'cybersecurity': `${LOGO_BASE_PATH}/custom/cybersecurity.svg`,
    'cybersecurity-fundamentals': `${LOGO_BASE_PATH}/custom/cybersecurity.svg`,
    'cybersecurity fundamentals': `${LOGO_BASE_PATH}/custom/cybersecurity.svg`,
    'ethical-hacking': `${LOGO_BASE_PATH}/custom/cybersecurity.svg`,
    'ethical hacking': `${LOGO_BASE_PATH}/custom/cybersecurity.svg`,
    'owasp': `${LOGO_BASE_PATH}/custom/cybersecurity.svg`,
    'owasp-basics': `${LOGO_BASE_PATH}/custom/cybersecurity.svg`,
    'owasp basics': `${LOGO_BASE_PATH}/custom/cybersecurity.svg`,
    'networking': `${LOGO_BASE_PATH}/custom/api.svg`,

    // UI/UX & Design
    'figma': `${LOGO_BASE_PATH}/custom/figma.svg`,
    'wireframing': `${LOGO_BASE_PATH}/custom/figma.svg`,
    'prototyping': `${LOGO_BASE_PATH}/custom/figma.svg`,
    'visual-design': `${LOGO_BASE_PATH}/custom/figma.svg`,
    'visual design': `${LOGO_BASE_PATH}/custom/figma.svg`,
    'user-research': `${LOGO_BASE_PATH}/custom/figma.svg`,
    'user research': `${LOGO_BASE_PATH}/custom/figma.svg`,
    'blender': `${LOGO_BASE_PATH}/custom/blender.svg`,
    'motion-graphics': `${LOGO_BASE_PATH}/custom/motion-graphics.svg`,
    'motion graphics': `${LOGO_BASE_PATH}/custom/motion-graphics.svg`,
    'typography': `${LOGO_BASE_PATH}/custom/typography.svg`,
    'adobe-illustrator': `${LOGO_BASE_PATH}/social-icons/adobe.svg`,
    'adobe illustrator': `${LOGO_BASE_PATH}/social-icons/adobe.svg`,
    'brand-identity': `${LOGO_BASE_PATH}/custom/typography.svg`,
    'brand identity': `${LOGO_BASE_PATH}/custom/typography.svg`,

    // Professional, Soft Skills & Collaboration
    'problem-solving': `${LOGO_BASE_PATH}/custom/problem-solving.svg`,
    'problem solving': `${LOGO_BASE_PATH}/custom/problem-solving.svg`,
    'communication': `${LOGO_BASE_PATH}/custom/communication.svg`,
    'teamwork': `${LOGO_BASE_PATH}/custom/teamwork.svg`,
    'leadership': `${LOGO_BASE_PATH}/custom/teamwork.svg`,
    'agile': `${LOGO_BASE_PATH}/social-icons/trello.svg`,
    'scrum': `${LOGO_BASE_PATH}/social-icons/trello.svg`,
    'agile-scrum': `${LOGO_BASE_PATH}/social-icons/trello.svg`,
    'agile scrum': `${LOGO_BASE_PATH}/social-icons/trello.svg`,
    'product-management': `${LOGO_BASE_PATH}/social-icons/trello.svg`,
    'product management': `${LOGO_BASE_PATH}/social-icons/trello.svg`,
    'user-stories': `${LOGO_BASE_PATH}/social-icons/trello.svg`,
    'user stories': `${LOGO_BASE_PATH}/social-icons/trello.svg`,
    'slack': `${LOGO_BASE_PATH}/social-icons/slack.svg`,
    'trello': `${LOGO_BASE_PATH}/social-icons/trello.svg`,

    // Business, Finance & Marketing
    'financial-modeling': `${LOGO_BASE_PATH}/custom/financial-modeling.svg`,
    'financial modeling': `${LOGO_BASE_PATH}/custom/financial-modeling.svg`,
    'dcf-valuation': `${LOGO_BASE_PATH}/custom/financial-modeling.svg`,
    'dcf valuation': `${LOGO_BASE_PATH}/custom/financial-modeling.svg`,
    'accounting': `${LOGO_BASE_PATH}/custom/financial-modeling.svg`,
    'business-operations': `${LOGO_BASE_PATH}/custom/financial-modeling.svg`,
    'business operations': `${LOGO_BASE_PATH}/custom/financial-modeling.svg`,
    'management-consulting': `${LOGO_BASE_PATH}/custom/financial-modeling.svg`,
    'management consulting': `${LOGO_BASE_PATH}/custom/financial-modeling.svg`,
    'market-research': `${LOGO_BASE_PATH}/custom/financial-modeling.svg`,
    'market research': `${LOGO_BASE_PATH}/custom/financial-modeling.svg`,
    'seo': `${LOGO_BASE_PATH}/custom/seo.svg`,
    'search engine optimization': `${LOGO_BASE_PATH}/custom/seo.svg`,
    'copywriting': `${LOGO_BASE_PATH}/custom/copywriting.svg`,
    'content-marketing': `${LOGO_BASE_PATH}/custom/copywriting.svg`,
    'content marketing': `${LOGO_BASE_PATH}/custom/copywriting.svg`,
    'google-analytics': `${LOGO_BASE_PATH}/social-icons/google.svg`,
    'google analytics': `${LOGO_BASE_PATH}/social-icons/google.svg`,
    'google-ads': `${LOGO_BASE_PATH}/social-icons/google.svg`,
    'google ads': `${LOGO_BASE_PATH}/social-icons/google.svg`,
    'meta-ads': `${LOGO_BASE_PATH}/social-icons/facebook.svg`,
    'meta ads': `${LOGO_BASE_PATH}/social-icons/facebook.svg`,
    'social-media-growth': `${LOGO_BASE_PATH}/social-icons/twitter.svg`,
    'social media growth': `${LOGO_BASE_PATH}/social-icons/twitter.svg`,

    // IDEs & Text Editors
    'vscode': `${LOGO_BASE_PATH}/text-editors/vscode.svg`,
    'vs code': `${LOGO_BASE_PATH}/text-editors/vscode.svg`,
    'sublime': `${LOGO_BASE_PATH}/text-editors/sublime.svg`,
    'atom': `${LOGO_BASE_PATH}/text-editors/atom.svg`,
    'android studio': `${LOGO_BASE_PATH}/ides/android-studio.svg`,
    'android-studio': `${LOGO_BASE_PATH}/ides/android-studio.svg`,
    'intellij': `${LOGO_BASE_PATH}/ides/intellij.svg`,
    'pycharm': `${LOGO_BASE_PATH}/ides/pycharm.svg`,
    'phpstorm': `${LOGO_BASE_PATH}/ides/phpstorm.svg`,
    'datagrip': `${LOGO_BASE_PATH}/ides/datagrip.svg`,

    // Web3, Blockchain, Ethereum & Smart Contracts
    'solidity': `${LOGO_BASE_PATH}/social-icons/ethereum.svg`,
    'solidity (smart contracts)': `${LOGO_BASE_PATH}/social-icons/ethereum.svg`,
    'smart contracts': `${LOGO_BASE_PATH}/social-icons/ethereum.svg`,
    'smart-contracts': `${LOGO_BASE_PATH}/social-icons/ethereum.svg`,
    'smart contract architecture': `${LOGO_BASE_PATH}/social-icons/ethereum.svg`,
    'smart contract': `${LOGO_BASE_PATH}/social-icons/ethereum.svg`,
    'web3': `${LOGO_BASE_PATH}/social-icons/ethereum.svg`,
    'web3js': `${LOGO_BASE_PATH}/social-icons/ethereum.svg`,
    'web3.js': `${LOGO_BASE_PATH}/social-icons/ethereum.svg`,
    'web3.js & ethers.js': `${LOGO_BASE_PATH}/social-icons/ethereum.svg`,
    'ethers': `${LOGO_BASE_PATH}/social-icons/ethereum.svg`,
    'ethers.js': `${LOGO_BASE_PATH}/social-icons/ethereum.svg`,
    'blockchain': `${LOGO_BASE_PATH}/social-icons/ethereum.svg`,
    'bitcoin': `${LOGO_BASE_PATH}/social-icons/bitcoin.svg`,

    // Search Engine Optimization & Search
    'baidu-seo': `${LOGO_BASE_PATH}/social-icons/baidu.svg`,
    'baidu seo': `${LOGO_BASE_PATH}/social-icons/baidu.svg`,
    'baidu': `${LOGO_BASE_PATH}/social-icons/baidu.svg`,
    'technical-seo': `${LOGO_BASE_PATH}/custom/seo.svg`,
    'technical seo': `${LOGO_BASE_PATH}/custom/seo.svg`,
    'aeo': `${LOGO_BASE_PATH}/custom/seo.svg`,

    // Testing & QA
    'cypress': `${LOGO_BASE_PATH}/social-icons/codeberg.svg`,
    'playwright': `${LOGO_BASE_PATH}/custom/api.svg`,
    'selenium': `${LOGO_BASE_PATH}/custom/api.svg`,

    // Streaming, Messaging & Caching
    'kafka': `${LOGO_BASE_PATH}/databases/redis.svg`,
    'rabbitmq': `${LOGO_BASE_PATH}/databases/redis.svg`,

    // Game Engines
    'unity': `${LOGO_BASE_PATH}/social-icons/ea.svg`,
    'unreal': `${LOGO_BASE_PATH}/social-icons/ea.svg`,
    'unreal-engine': `${LOGO_BASE_PATH}/social-icons/ea.svg`,
    'unreal engine': `${LOGO_BASE_PATH}/social-icons/ea.svg`,
  };

  /**
   * Normalize input name to look up in the map
   */
  function normalizeKey(name) {
    if (!name) return '';
    return String(name).toLowerCase().trim().replace(/[\-_]/g, ' ').replace(/\s+/g, ' ');
  }

  /**
   * Get the relative logo URL for a tech/skill name
   * @param {string} techName
   * @returns {string|null} Relative URL to logo or null if not found
   */
  function getLogoUrl(techName) {
    if (!techName) return null;
    const raw = String(techName).toLowerCase().trim();
    if (TECH_LOGO_MAP[raw]) return TECH_LOGO_MAP[raw];

    const key = normalizeKey(techName);
    if (!key) return null;
    if (TECH_LOGO_MAP[key]) return TECH_LOGO_MAP[key];

    // Strip parenthetical text, e.g. "Solidity (Smart Contracts)" -> "solidity"
    const stripped = key.replace(/\(.*?\)/g, '').trim();
    if (stripped && TECH_LOGO_MAP[stripped]) return TECH_LOGO_MAP[stripped];

    // Check inside parenthetical text, e.g. "(Smart Contracts)" -> "smart contracts"
    const parenMatch = key.match(/\((.*?)\)/);
    if (parenMatch && parenMatch[1]) {
      const inside = normalizeKey(parenMatch[1]);
      if (inside && TECH_LOGO_MAP[inside]) return TECH_LOGO_MAP[inside];
    }

    // Split on compounds like '&', '/', 'and', or ','
    const parts = key.split(/[\&,\/]|(?:\band\b)/).map(p => normalizeKey(p)).filter(Boolean);
    for (const part of parts) {
      if (TECH_LOGO_MAP[part]) return TECH_LOGO_MAP[part];
    }

    // Try kebab case: e.g. "power-bi" or "power bi"
    const kebab = key.replace(/\s+/g, '-');
    if (TECH_LOGO_MAP[kebab]) return TECH_LOGO_MAP[kebab];
    if (stripped) {
      const strippedKebab = stripped.replace(/\s+/g, '-');
      if (TECH_LOGO_MAP[strippedKebab]) return TECH_LOGO_MAP[strippedKebab];
    }

    // Try without punctuation (e.g. "node.js" -> "nodejs", "c++" -> "cpp")
    const cleanKey = key.replace(/[\.\-_]/g, '');
    if (TECH_LOGO_MAP[cleanKey]) return TECH_LOGO_MAP[cleanKey];

    // Direct substring search
    for (const [mapKey, url] of Object.entries(TECH_LOGO_MAP)) {
      if (mapKey.length > 2 && (key.includes(mapKey) || mapKey.includes(key))) {
        return url;
      }
    }

    return null;
  }

  /**
   * Render an <img> tag with safe fallback
   * @param {string} techName
   * @param {object} [options]
   * @param {number} [options.size=16]
   * @param {string} [options.className='']
   * @param {string} [options.alt='']
   * @returns {string} HTML string
   */
  function getLogoImg(techName, options = {}) {
    const size = options.size || 16;
    const className = options.className || '';
    const alt = options.alt || techName || 'Technology';
    const url = getLogoUrl(techName);

    if (!url) {
      return '';
    }

    return `<img src="${url}" alt="${alt}" width="${size}" height="${size}" class="tech-brand-logo ${className}" style="width:${size}px; height:${size}px; max-width:${size}px; max-height:${size}px; object-fit:contain; vertical-align:middle; flex-shrink:0; display:inline-block;" onerror="this.style.display='none'" />`;
  }

  // Export to window
  window.TechLogos = {
    getLogoUrl,
    getLogoImg,
    map: TECH_LOGO_MAP,
  };
})();
