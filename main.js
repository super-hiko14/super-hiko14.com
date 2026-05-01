// Theme management directly as early as possible to avoid flash
(function() {
  let theme = 'light';
  try {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme) {
      theme = savedTheme;
    } else if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      theme = 'dark';
    }
  } catch (_) {
    theme = 'light';
  }
  document.documentElement.setAttribute('data-theme', theme);
})();

// Page transition progress bar
(function() {
  var SK = 'navProgress';

  function createBar() {
    var bar = document.createElement('div');
    bar.id = 'nav-progress';
    document.body.insertBefore(bar, document.body.firstChild);
    return bar;
  }

  // ページA: リンククリック時にフラグを立てる
  document.addEventListener('DOMContentLoaded', function() {
    document.addEventListener('click', function(e) {
      var link = e.target.closest('a');
      if (!link) return;
      if (link.target === '_blank') return;
      if (link.hasAttribute('download')) return;
      var href = link.getAttribute('href');
      if (!href || href.startsWith('#') || href.startsWith('mailto:') || href.startsWith('tel:') || href.startsWith('javascript:')) return;
      
      // サブドメイン間移動対応: クッキーにフラグを立てる（ドメイン全体で共有）
      document.cookie = SK + "=1; path=/; domain=super-hiko14.com; max-age=10";
      
      try { sessionStorage.setItem(SK, '1'); } catch(_) {}
    });

    // ページB: 到着時にフラグを確認してアニメーション
    var pending = false;
    try {
      if (sessionStorage.getItem(SK) === '1') {
        pending = true;
        sessionStorage.removeItem(SK);
      } else {
        // クッキーを確認
        var match = document.cookie.match(new RegExp('(^| )' + SK + '=([^;]+)'));
        if (match && match[2] === '1') {
          pending = true;
          // 使用後は削除（期限切れにする）
          document.cookie = SK + "=; path=/; domain=super-hiko14.com; max-age=0";
        }
      }
    } catch(_) {}
    
    if (pending) {
      var bar = createBar();
      // 山形: 長い右上がりから 100% までスゾッと引き、その後フェード
      bar.classList.add('nav-progress-arrive-start');
      // リフロー寧
      void bar.offsetWidth;
      bar.classList.remove('nav-progress-arrive-start');
      bar.classList.add('nav-progress-arrive');
      setTimeout(function() {
        bar.classList.add('nav-progress-arrive-done');
        setTimeout(function() { bar.remove(); }, 600);
      }, 380);
    }
  });
})();

document.addEventListener('DOMContentLoaded', () => {
  document.body.classList.add('js-animate');

  // Theme management initialize buttons
  initTheme();

  // Site-wide hamburger navigation
  initSiteNav();

  // About page tabs (?tab=overview/details/links)
  initAboutTabs();
  
  // Scroll to top functionality
  initScrollToTop();

  // Birthday section initialization
  initBirthday();

  // Misskey follower count
  initMisskeyFollowers();

  const observerOptions = {
    root: null,
    rootMargin: "0px 0px -15% 0px",
    threshold: 0.1
  };

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');
        // 他の要素よりも早く表示させるための遅延解消（オプション）
      }
    });
  }, observerOptions);

  document.querySelectorAll('.box').forEach(el => {
    observer.observe(el);
  });

  // 初回チェック: ページ読み込み時にすでに表示範囲内にある要素を即座に表示
  // 少し遅らせることで、js-animateクラス付与直後の状態からアニメーションを開始させる
  setTimeout(() => {
    document.querySelectorAll('.box').forEach(el => {
      const rect = el.getBoundingClientRect();
      if (rect.top < window.innerHeight * 0.9) {
        el.classList.add('is-visible');
      }
    });
  }, 100);

  // Blog page functionality
  if (document.body.classList.contains('blog-page')) {
    initBlogPage();
  }

  // Diary page functionality
  if (document.body.classList.contains('diary-page')) {
    initDiaryPage();
  }
});

function initAboutTabs() {
  const tabs = document.querySelectorAll('.tab-item');
  const contents = document.querySelectorAll('.tab-content');
  if (!tabs.length || !contents.length || tabs.length !== contents.length) return;

  const tabKeys = ['overview', 'details'];

  function resolveTabIndex(rawTab) {
    if (!rawTab) return 0;
    const value = String(rawTab).trim().toLowerCase();

    if (/^\d+$/.test(value)) {
      const index = parseInt(value, 10);
      return index >= 0 && index < tabKeys.length ? index : 0;
    }

    const aliases = {
      overview: 0,
      summary: 0,
      gaiyou: 0,
      '概要': 0,
      details: 1,
      detail: 1,
      shosai: 1,
      '詳細': 1
    };

    return aliases[value] ?? 0;
  }

  function applyTab(index, updateUrl) {
    tabs.forEach((tab, i) => {
      tab.classList.toggle('active', i === index);
    });

    contents.forEach((content, i) => {
      content.classList.toggle('active', i === index);
    });

    if (updateUrl) {
      const url = new URL(window.location.href);
      url.searchParams.set('tab', tabKeys[index] || tabKeys[0]);
      window.history.replaceState({}, '', url);
    }
  }

  const initialTab = new URLSearchParams(window.location.search).get('tab');
  applyTab(resolveTabIndex(initialTab), false);

  tabs.forEach((tab, i) => {
    tab.addEventListener('click', () => {
      applyTab(i, true);
    });
  });

  window.switchTab = (index) => {
    const next = Number(index);
    if (Number.isNaN(next) || next < 0 || next >= tabs.length) return;
    applyTab(next, true);
  };
}

function initDiaryPage() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = now.getDate();
  const monthLabel = `${year}.${month}`;

  document.querySelectorAll('.diary-month-group').forEach(group => {
    const label = group.querySelector('.diary-month-label');
    if (label && label.textContent.trim() === monthLabel) {
      group.querySelectorAll('.diary-entry').forEach(entry => {
        const dateEl = entry.querySelector('.diary-date');
        if (dateEl && parseInt(dateEl.textContent.trim(), 10) === day) {
          entry.classList.add('diary-today');
        }
      });
    }
  });
}

function initTheme() {
  // Theme toggle button
  const themeToggle = document.querySelector('.theme-toggle');
  if (themeToggle) {
    themeToggle.addEventListener('click', () => {
      const currentTheme = document.documentElement.getAttribute('data-theme');
      const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
      document.documentElement.setAttribute('data-theme', newTheme);
      if (window._refreshGitHubCalendar) {
        window._refreshGitHubCalendar();
      }
      try {
        localStorage.setItem('theme', newTheme);
      } catch (_) {
      }
    });
  }
}

function initScrollToTop() {
  const scrollBtn = document.querySelector('.scroll-to-top');
  if (scrollBtn) {
    scrollBtn.addEventListener('click', () => {
      window.scrollTo({
        top: 0,
        behavior: 'smooth'
      });
    });
  }
}

function initBlogPage() {
  const blogList = document.getElementById('blog-list');
  const noResults = document.getElementById('no-results');
  const searchInput = document.getElementById('search-input');
  const filterButtons = document.querySelectorAll('.filter-btn');
  const sortButtons = document.querySelectorAll('.sort-btn');

  let blogPosts = [];
  let currentFilter = 'all';
  let currentSort = 'desc';
  let searchQuery = '';

  // URLパラメータからカテゴリを取得
  const urlParams = new URLSearchParams(window.location.search);
  const categoryParam = urlParams.get('category');
  if (categoryParam) {
    currentFilter = categoryParam;
    updateFilterButtons(currentFilter);
  }

  // JSONデータを取得
  fetch('./posts.json')
    .then(response => response.json())
    .then(data => {
      blogPosts = data;
      renderBlogPosts();
    })
    .catch(error => {
      console.error('Error loading blog posts:', error);
      blogList.innerHTML = '<p>記事の読み込みに失敗しました。</p>';
    });

  function updateFilterButtons(filter) {
    filterButtons.forEach(btn => {
      if (btn.dataset.category === filter) {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }
    });
  }

  function updateCategoryUrl(category) {
    const url = new URL(window.location);
    if (category === 'all') {
      url.searchParams.delete('category');
    } else {
      url.searchParams.set('category', category);
    }
    window.history.pushState({}, '', url);
  }

  function renderBlogPosts() {
    let filteredPosts = [...blogPosts];

    // カテゴリフィルター
    if (currentFilter !== 'all') {
      filteredPosts = filteredPosts.filter(post => post.category === currentFilter);
    }

    // 検索フィルター
    if (searchQuery) {
      filteredPosts = filteredPosts.filter(post => 
        post.title.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // 並び替え
    filteredPosts.sort((a, b) => {
      const dateA = new Date(a.date);
      const dateB = new Date(b.date);
      return currentSort === 'desc' ? dateB - dateA : dateA - dateB;
    });

    // 表示
    if (filteredPosts.length === 0) {
      blogList.innerHTML = '';
      noResults.style.display = 'block';
    } else {
      noResults.style.display = 'none';
      blogList.innerHTML = filteredPosts.map(post => {
        const displayDate = post.date ? post.date.replace(/-/g, '.') : '';
        return `
        <a href="${post.url}" class="blog-item">
          <div class="blog-item-header">
            <h3 class="blog-item-title">${post.title}</h3>
            <span class="blog-item-category">${post.category === 'diary' ? 'Diary' : 'Tech'}</span>
          </div>
          <div class="blog-item-date">${displayDate}</div>
          <p class="blog-item-excerpt">${post.excerpt}</p>
        </a>
      `}).join('');
    }
  }

  // イベントリスナー
  filterButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      const category = btn.dataset.category;
      currentFilter = category;
      updateFilterButtons(category);
      updateCategoryUrl(category);
      renderBlogPosts();
    });
  });

  sortButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      sortButtons.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      currentSort = btn.dataset.sort;
      renderBlogPosts();
    });
  });

  searchInput.addEventListener('input', (e) => {
    searchQuery = e.target.value;
    renderBlogPosts();
  });
}

// Site-wide hamburger navigation
function initSiteNav() {
  const nav    = document.querySelector('.site-nav');
  const toggle = document.querySelector('.site-nav-toggle');
  const drawer = document.querySelector('.site-nav-drawer');
  if (!toggle || !drawer || !nav) return;
  let lockedScrollY = 0;

  /* ---------- Submenu data for each site ---------- */
  const SUBMENU_DATA = {
    'super-hiko14.com': [
      { label: 'Contact', url: 'https://super-hiko14.com/contact/' }
    ],
    'about.super-hiko14.com': [
      { label: 'Super Hiko14', url: 'https://about.super-hiko14.com/super-hiko14/' },
      { label: 'KokyuJene', url: 'https://about.super-hiko14.com/kokyujene/' }
    ],
    'tools.super-hiko14.com': [
      { label: 'Base64', url: 'https://tools.super-hiko14.com/base64/' },
      { label: 'Calendar(alpha)', url: 'https://tools.super-hiko14.com/calendar/' },
      { label: 'Clock(beta)', url: 'https://tools.super-hiko14.com/clock/' },
      { label: 'Memo', url: 'https://tools.super-hiko14.com/memo/' },
      { label: 'Polygon', url: 'https://tools.super-hiko14.com/polygon/' },
      { label: 'Study', url: 'https://tools.super-hiko14.com/study/' }
    ],
    'kokyujene.super-hiko14.com': [],
    'super-hiko14.me': [
      { label: 'Home', url: 'https://super-hiko14.me/' },
      { label: 'Diary', url: 'https://super-hiko14.me/diary/' }
    ],
    'legal.super-hiko14.com': [
      { label: 'Privacy Policy', url: 'https://legal.super-hiko14.com/privacypolicy/' },
      { label: 'Terms', url: 'https://legal.super-hiko14.com/terms/' },
      { label: 'Auth Privacy Policy', url: 'https://legal.super-hiko14.com/auth/privacypolicy/' },
      { label: 'Auth Terms', url: 'https://legal.super-hiko14.com/auth/terms/' }
    ]
  };

  /* ---------- inject backdrop ---------- */
  const backdrop = document.createElement('div');
  backdrop.className = 'site-nav-backdrop';
  backdrop.setAttribute('aria-hidden', 'true');
  document.body.appendChild(backdrop);

  /* ---------- inject drawer header ---------- */
  const drawerHeader = document.createElement('div');
  drawerHeader.className = 'site-nav-drawer-header';
  drawerHeader.innerHTML =
    '<span class="site-nav-drawer-brand">' +
      '<svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">' +
        '<path d="M3 18h18v-2H3v2zm0-5h18v-2H3v2zm0-7v2h18V6H3z"/>' +
      '</svg>' +
      'Navigation' +
    '</span>';
  drawer.insertBefore(drawerHeader, drawer.firstChild);

  /* ---------- inject icons per nav item ---------- */
  const ICON_MAP = {
    'super-hiko14.com':        '<path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>',
    'about.super-hiko14.com':  '<path d="M11 17h2v-6h-2v6zm1-15C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zM11 9h2V7h-2v2z"/>',
    'kokyujene.super-hiko14.com': '<path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"/>',
    'tools.super-hiko14.com':  '<path d="M22.7 19l-9.1-9.1c.9-2.3.4-5-1.5-6.9-2-2-5-2.4-7.4-1.3L9 6 6 9 1.6 4.7C.4 7.1.9 10.1 2.9 12.1c1.9 1.9 4.6 2.4 6.9 1.5l9.1 9.1c.4.4 1 .4 1.4 0l2.3-2.3c.5-.4.5-1.1.1-1.4z"/>',
    'super-hiko14.me':         '<path d="M18 2h-2V1c0-.6-.4-1-1-1s-1 .4-1 1v1H9V1c0-.6-.4-1-1-1S7 .4 7 1v1H5C3.9 2 3 2.9 3 4v16c0 1.1.9 2 2 2h13c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 18H5V8h13v12zM7 10h5v5H7z"/>',
    'legal.super-hiko14.com':  '<path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm0 4l5 2.18V11c0 3.5-2.33 6.79-5 7.93-2.67-1.14-5-4.43-5-7.93V7.18L12 5z"/>',
  };
  
  // SVG arrow definitions
  const downArrowSvg = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="14" height="14"><path d="M 6 9 L 12 15 L 18 9" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg>';
  const rightArrowSvg = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="14" height="14"><path d="M 9 6 L 15 12 L 9 18" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg>';

  drawer.querySelectorAll('a[href]').forEach(link => {
    try {
      const host = new URL(link.href).hostname;
      const path = ICON_MAP[host];
      if (!path) return;
      const iconEl = document.createElement('span');
      iconEl.className = 'site-nav-item-icon';
      iconEl.setAttribute('aria-hidden', 'true');
      iconEl.innerHTML =
        '<svg viewBox="0 0 24 24" fill="currentColor" width="13" height="13">' + path + '</svg>';
      link.insertBefore(iconEl, link.firstChild);
    } catch (_) {}
  });

  // Convert arrow text to SVG
  const arrows = drawer.querySelectorAll('.site-nav-item-arrow');
  arrows.forEach((arrowEl) => {
    if (!arrowEl) return;
    arrowEl.innerHTML = downArrowSvg;
    arrowEl.style.display = 'inline-flex';
  });

  /* ---------- open / close ---------- */
  function openNav() {
    toggle.setAttribute('aria-expanded', 'true');
    drawer.setAttribute('aria-hidden', 'false');
    backdrop.classList.add('is-visible');
    if (window.innerWidth <= 680) {
      lockedScrollY = window.scrollY || window.pageYOffset || 0;
      document.body.classList.add('site-nav-open');
      document.body.style.position = 'fixed';
      document.body.style.top = '-' + lockedScrollY + 'px';
      document.body.style.left = '0';
      document.body.style.right = '0';
      document.body.style.width = '100%';
    }
    // フォーカスを最初のリンクへ（少し遅延）
    setTimeout(() => {
      const first = drawer.querySelector('a[href]');
      if (first) first.focus({ preventScroll: true });
    }, 120);
  }

  function closeNav() {
    const wasOpen = toggle.getAttribute('aria-expanded') === 'true';
    toggle.setAttribute('aria-expanded', 'false');
    drawer.setAttribute('aria-hidden', 'true');
    backdrop.classList.remove('is-visible');
    if (window.innerWidth <= 680 && wasOpen) {
      document.body.style.position = '';
      document.body.style.top = '';
      document.body.style.left = '';
      document.body.style.right = '';
      document.body.style.width = '';
      window.scrollTo(0, lockedScrollY);
    }
    document.body.classList.remove('site-nav-open');
  }

  toggle.addEventListener('click', (e) => {
    e.stopPropagation();
    const isOpen = toggle.getAttribute('aria-expanded') === 'true';
    isOpen ? closeNav() : openNav();
  });

  // バックドロップクリックで閉じる
  backdrop.addEventListener('click', () => {
    closeNav();
    toggle.focus();
  });

  document.addEventListener('click', (e) => {
    if (!e.target.closest('.site-nav')) closeNav();
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      closeNav();
      toggle.focus();
    }
  });

  /* ---------- フォーカストラップ ---------- */
  drawer.addEventListener('keydown', (e) => {
    if (e.key !== 'Tab') return;
    if (drawer.getAttribute('aria-hidden') === 'true') return;
    const focusables = Array.from(
      drawer.querySelectorAll('a[href], [tabindex]:not([tabindex="-1"])')
    ).filter(el => el.offsetParent !== null);
    if (!focusables.length) return;
    const first = focusables[0];
    const last  = focusables[focusables.length - 1];
    if (e.shiftKey) {
      if (document.activeElement === first) { e.preventDefault(); last.focus(); }
    } else {
      if (document.activeElement === last) { e.preventDefault(); first.focus(); }
    }
  });

  /* ---------- current page highlight & accordion setup ---------- */
  try {
    const currentHost = location.hostname;
    
    drawer.querySelectorAll('a[href]').forEach(link => {
      try {
        const linkUrl = new URL(link.href);
        const linkHost = linkUrl.hostname;
        const linkLi = link.closest('li');
        const arrowEl = link.querySelector('.site-nav-item-arrow');
        
        // Check if this is the current domain
        const isCurrentDomain = linkHost === currentHost;
        
        if (isCurrentDomain) {
          link.setAttribute('aria-current', 'page');
          // Change arrow to down arrow for current page
          if (arrowEl) {
            arrowEl.innerHTML = downArrowSvg;
            arrowEl.classList.add('is-current-page');
          }
        } else {
          link.removeAttribute('aria-current');
        }
        
        // Setup accordion for links with submenu
        const submenu = SUBMENU_DATA[linkHost];
        if (submenu && submenu.length > 0 && linkLi && arrowEl) {
          // Has submenu: use down arrow
          arrowEl.innerHTML = downArrowSvg;
          arrowEl.style.display = 'inline-flex';
          
          // Create submenu container
          let submenuEl = linkLi.querySelector('.site-nav-submenu');
          if (!submenuEl) {
            submenuEl = document.createElement('ul');
            submenuEl.className = 'site-nav-submenu';
            submenuEl.setAttribute('aria-hidden', 'true');
            linkLi.appendChild(submenuEl);
            
            // Add submenu items
            submenu.forEach(item => {
              const li = document.createElement('li');
              const a = document.createElement('a');
              a.href = item.url;
              a.textContent = item.label;
              li.appendChild(a);
              submenuEl.appendChild(li);
            });
          }
          
          // Make arrow toggle submenu (always clickable for submenu)
          arrowEl.style.cursor = 'pointer';
          arrowEl.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            const isOpen = submenuEl.classList.contains('is-open');
            if (!isOpen) {
              // Open
              submenuEl.classList.add('is-open');
              submenuEl.setAttribute('aria-hidden', 'false');
              arrowEl.classList.add('is-open');
            } else {
              // Close
              submenuEl.classList.remove('is-open');
              submenuEl.setAttribute('aria-hidden', 'true');
              arrowEl.classList.remove('is-open');
            }
          });
        } else if (isCurrentDomain && linkLi && arrowEl) {
          // Current page without submenu: use right arrow
          arrowEl.innerHTML = rightArrowSvg;
          arrowEl.style.display = 'inline-flex';
          arrowEl.style.cursor = 'pointer';
          arrowEl.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            window.scrollTo({ top: 0, behavior: 'smooth' });
            closeNav();
          });
        }
      } catch (_) {}
    });
  } catch (_) {}

  drawer.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', () => closeNav());
  });

  /* ---------- box-tracking position ---------- */
  const boxes = Array.from(document.querySelectorAll('.box'));
  if (!boxes.length) return;

  let lastBoxIdx = -1;
  let rafId = null;
  let transitionTimer = null;

  function findActiveBoxIndex() {
    let idx = -1;
    for (let i = 0; i < boxes.length; i++) {
      const box = boxes[i];
      // 非表示（タブの非アクティブ面など）を除外
      if (box.offsetParent === null) continue;
      // フッターを含むboxは除外
      if (box.querySelector('.footer')) continue;
      const rect = box.getBoundingClientRect();
      if (rect.top < window.innerHeight * 0.75) idx = i;
    }
    // 有効なboxが見つからなければ先頭の可視boxを返す
    if (idx === -1) {
      for (let i = 0; i < boxes.length; i++) {
        if (boxes[i].offsetParent !== null) { idx = i; break; }
      }
    }
    return Math.max(0, idx);
  }

  function applyNavPosition() {
    // スマホは CSS 固定に任せる
    if (window.innerWidth <= 680) {
      nav.style.top = '';
      lastBoxIdx = -1;
      clearTimeout(transitionTimer);
      return;
    }

    const idx  = findActiveBoxIndex();
    const rect = boxes[idx].getBoundingClientRect();
    const minTop = 12;
    const maxTop = window.innerHeight * 0.38; // 画面の38%より下には行かない
    const targetTop = Math.min(maxTop, Math.max(minTop, rect.top - 60));

    if (idx !== lastBoxIdx) {
      nav.style.transition = 'top 0.38s cubic-bezier(0.4, 0, 0.2, 1)';
      clearTimeout(transitionTimer);
      transitionTimer = setTimeout(() => {
        nav.style.transition = 'none';
      }, 420);
      lastBoxIdx = idx;
    }

    nav.style.top = targetTop + 'px';
  }

  function onScroll() {
    if (rafId) return;
    rafId = requestAnimationFrame(() => {
      applyNavPosition();
      rafId = null;
    });
  }

  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', () => {
    lastBoxIdx = -1;
    applyNavPosition();
  });

  // 初回位置設定（ページロード時に下からスライドイン）
  nav.style.transition = 'top 0.55s cubic-bezier(0.4, 0, 0.2, 1)';
  applyNavPosition();
  setTimeout(() => { nav.style.transition = 'none'; }, 580);
}

// Birthday section initialization
function initBirthday() {
  const birthdaySection = document.querySelector('.birthday-section');
  if (!birthdaySection) return;

  // Get birthday month/day from data attributes (default: 12/31)
  const birthdayMonth = parseInt(birthdaySection.getAttribute('data-birthday-month')) || 12;
  const birthdayDay = parseInt(birthdaySection.getAttribute('data-birthday-day')) || 31;

  const todayDateEl = document.getElementById('today-date');
  const birthdayMessageEl = document.getElementById('birthday-message');
  const daysCounterEl = document.getElementById('days-counter');

  function updateBirthdayInfo() {
    const today = new Date();
    const currentYear = today.getFullYear();
    const currentMonth = today.getMonth() + 1;
    const currentDay = today.getDate();

    // Format today's date
    const monthNames = ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'];
    const dayOfWeek = ['日', '月', '火', '水', '木', '金', '土'];
    const todayFormatted = `${currentYear}年 ${monthNames[today.getMonth()]} ${currentDay}日 (${dayOfWeek[today.getDay()]})`;
    todayDateEl.textContent = todayFormatted;

    // Check if today is the birthday
    const isBirthday = currentMonth === birthdayMonth && currentDay === birthdayDay;

    if (isBirthday) {
      // Today is the birthday!
      birthdayMessageEl.innerHTML = '🎉 <strong>本日は誕生日です！おめでとうございます！</strong> 🎉';
      birthdayMessageEl.style.fontSize = '1.2rem';
      birthdayMessageEl.style.fontWeight = 'bold';
      daysCounterEl.textContent = '今日があなたの特別な日です。最高の1日を過ごしてください！';
    } else {
      // Calculate days until the next birthday
      let nextBirthdayDate = new Date(currentYear, birthdayMonth - 1, birthdayDay);
      
      // If the birthday has already passed this year, calculate for next year
      if (nextBirthdayDate < today) {
        nextBirthdayDate = new Date(currentYear + 1, birthdayMonth - 1, birthdayDay);
      }

      const timeDiff = nextBirthdayDate.getTime() - today.getTime();
      const daysLeft = Math.ceil(timeDiff / (1000 * 60 * 60 * 24));

      const nextBirthdayFormatted = `${nextBirthdayDate.getFullYear()}年 ${monthNames[nextBirthdayDate.getMonth()]} ${nextBirthdayDate.getDate()}日`;
      
      birthdayMessageEl.textContent = `次の誕生日は ${nextBirthdayFormatted} です。`;
      daysCounterEl.textContent = `あと ${daysLeft} 日です。`;
    }
  }

  // Initial update
  updateBirthdayInfo();

  // Update at midnight
  setTimeout(updateBirthdayInfo, (24 - new Date().getHours()) * 60 * 60 * 1000);
}

function initMisskeyFollowers() {
  const statsEl = document.getElementById('misskey-stats');
  const countEl = document.getElementById('misskey-followers');
  if (!statsEl || !countEl) return;

  const url = '/api/misskey?username=KokyuJene';
  fetch(url)
    .then((res) => {
      if (!res.ok) return null;
      return res.json();
    })
    .then((data) => {
      if (!data || typeof data.followersCount !== 'number') return;
      countEl.textContent = data.followersCount.toLocaleString('ja-JP');
      statsEl.style.display = '';
    })
    .catch(function() {});
}