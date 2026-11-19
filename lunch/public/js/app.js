// Main Application Logic
class LunchApp {
  constructor() {
    this.menus = [];
    this.currentCategory = '전체';
    this.currentSort = 'likes'; // Default to popular
    this.searchQuery = '';
    this.activeTab = 'menu';

    this.categoryIcons = {
      '전체': '🍱',
      '한식': '🍚',
      '중식': '🥟',
      '양식': '🍝',
      '분식': '🍢',
      '면종류': '🍜',
      '일식/아시안': '🍣',
      '기타': '🍔'
    };

    this.categoryGradients = {
      '한식': 'linear-gradient(135deg, #FF6B4A, #FFA938)',
      '중식': 'linear-gradient(135deg, #FF3366, #FF6B4A)',
      '양식': 'linear-gradient(135deg, #845EF7, #5C7CFA)',
      '분식': 'linear-gradient(135deg, #FF922B, #FCC419)',
      '면종류': 'linear-gradient(135deg, #20C997, #38D9A9)',
      '일식/아시안': 'linear-gradient(135deg, #339AF0, #22B8CF)',
      '기타': 'linear-gradient(135deg, #F06595, #CC5DE8)'
    };

    this.init();
  }

  async init() {
    this.initDOM();
    this.bindEvents();
    await this.fetchMenus();
    this.initRoulette();
    window.lunchChat = new LunchChat();
  }

  initDOM() {
    this.menuListContainer = document.getElementById('menu-card-list');
    this.menuCountBadge = document.getElementById('menu-total-count');
    this.topMenuName = document.getElementById('top-menu-name');
    this.searchInput = document.getElementById('menu-search-input');
    this.clearSearchBtn = document.getElementById('clear-search-btn');
    this.sortSelect = document.getElementById('sort-select');

    // Modals
    this.addModal = document.getElementById('add-menu-modal');
    this.nicknameModal = document.getElementById('nickname-modal');
    this.rouletteResultModal = document.getElementById('roulette-result-modal');

    // Roulette elements
    this.rouletteCategorySelect = document.getElementById('roulette-category-filter');
    this.spinBtn = document.getElementById('spin-roulette-btn');
  }

  bindEvents() {
    // Tab switching
    document.querySelectorAll('.nav-tab-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const tab = e.currentTarget.getAttribute('data-tab');
        if (tab === 'add') {
          this.openAddModal();
        } else {
          this.switchTab(tab);
        }
      });
    });

    // Category filter clicks
    document.querySelectorAll('.cat-pill').forEach(pill => {
      pill.addEventListener('click', (e) => {
        document.querySelectorAll('.cat-pill').forEach(p => p.classList.remove('active'));
        e.currentTarget.classList.add('active');
        this.currentCategory = e.currentTarget.getAttribute('data-category');
        this.renderMenus();
      });
    });

    // Search input
    if (this.searchInput) {
      this.searchInput.addEventListener('input', (e) => {
        this.searchQuery = e.target.value.trim().toLowerCase();
        if (this.clearSearchBtn) {
          this.clearSearchBtn.style.display = this.searchQuery ? 'block' : 'none';
        }
        this.renderMenus();
      });
    }

    if (this.clearSearchBtn) {
      this.clearSearchBtn.addEventListener('click', () => {
        this.searchInput.value = '';
        this.searchQuery = '';
        this.clearSearchBtn.style.display = 'none';
        this.renderMenus();
      });
    }

    // Sort select
    if (this.sortSelect) {
      this.sortSelect.addEventListener('change', (e) => {
        this.currentSort = e.target.value;
        this.renderMenus();
      });
    }

    // Add Menu Modal
    const openAddBtn = document.getElementById('open-add-modal-hero-btn');
    if (openAddBtn) {
      openAddBtn.addEventListener('click', () => this.openAddModal());
    }

    const closeAddBtn = document.getElementById('close-add-modal-btn');
    if (closeAddBtn) {
      closeAddBtn.addEventListener('click', () => this.closeAddModal());
    }

    const addForm = document.getElementById('add-menu-form');
    if (addForm) {
      addForm.addEventListener('submit', (e) => this.handleMenuSubmit(e));
    }

    // Nickname Modal
    const headerNickBtn = document.getElementById('header-nickname-btn');
    if (headerNickBtn) {
      headerNickBtn.addEventListener('click', () => this.openNicknameModal());
    }

    const closeNickBtn = document.getElementById('close-nickname-modal-btn');
    if (closeNickBtn) {
      closeNickBtn.addEventListener('click', () => this.closeNicknameModal());
    }

    const nickForm = document.getElementById('nickname-form');
    if (nickForm) {
      nickForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const input = document.getElementById('custom-nickname-input');
        if (input && input.value.trim()) {
          window.lunchChat.setNickname(input.value.trim());
          this.closeNicknameModal();
          if (window.confetti) window.confetti.fire(window.innerWidth / 2, 100, 30);
        }
      });
    }

    // Split View Toggle for Desktop
    const splitToggle = document.getElementById('split-view-toggle');
    if (splitToggle) {
      splitToggle.addEventListener('click', () => {
        document.body.classList.toggle('dual-split-mode');
        const isActive = document.body.classList.contains('dual-split-mode');
        splitToggle.classList.toggle('active', isActive);
        splitToggle.title = isActive ? '단일 모바일 뷰로 전환' : '스플릿 듀얼 뷰(메뉴+톡)로 전환';
      });
    }

    // Dark Mode Toggle
    const themeToggle = document.getElementById('theme-toggle');
    if (themeToggle) {
      themeToggle.addEventListener('click', () => {
        document.body.classList.toggle('dark-theme');
        const isDark = document.body.classList.contains('dark-theme');
        themeToggle.textContent = isDark ? '☀️' : '🌙';
        localStorage.setItem('lunch_theme', isDark ? 'dark' : 'light');
      });

      if (localStorage.getItem('lunch_theme') === 'dark') {
        document.body.classList.add('dark-theme');
        themeToggle.textContent = '☀️';
      }
    }

    // Close result modal
    const closeResultBtn = document.getElementById('close-result-modal-btn');
    if (closeResultBtn) {
      closeResultBtn.addEventListener('click', () => {
        if (this.rouletteResultModal) this.rouletteResultModal.classList.remove('open');
      });
    }

    // Share winning menu to chat
    const shareResultBtn = document.getElementById('share-result-to-chat-btn');
    if (shareResultBtn) {
      shareResultBtn.addEventListener('click', () => {
        const winningName = shareResultBtn.getAttribute('data-winner');
        if (winningName && window.lunchChat) {
          window.lunchChat.sendMessage(`🎲 오늘의 점심 결정! 룰렛으로 [${winningName}] 당첨됐어요! 같이 드실 분? 🙋‍♂️`);
          this.switchTab('chat');
          if (this.rouletteResultModal) this.rouletteResultModal.classList.remove('open');
        }
      });
    }
  }

  initRoulette() {
    this.roulette = new LunchRoulette('roulette-canvas');
    this.updateRouletteItems();

    if (this.rouletteCategorySelect) {
      this.rouletteCategorySelect.addEventListener('change', () => {
        this.updateRouletteItems();
      });
    }

    if (this.spinBtn) {
      this.spinBtn.addEventListener('click', () => {
        if (this.roulette.isSpinning) return;
        this.spinBtn.disabled = true;
        this.spinBtn.classList.add('spinning');

        this.roulette.spin((winner) => {
          this.spinBtn.disabled = false;
          this.spinBtn.classList.remove('spinning');
          this.showWinnerModal(winner);
        });
      });
    }
  }

  updateRouletteItems() {
    if (!this.roulette) return;
    const cat = this.rouletteCategorySelect ? this.rouletteCategorySelect.value : '전체';
    let filtered = this.menus;
    if (cat && cat !== '전체') {
      filtered = this.menus.filter(m => m.category === cat);
    }
    if (filtered.length === 0) {
      filtered = [{ name: '메뉴를 등록해주세요', category: '기타' }];
    }
    this.roulette.setItems(filtered);
  }

  showWinnerModal(winner) {
    if (!winner || !this.rouletteResultModal) return;

    if (window.confetti) {
      window.confetti.fire(window.innerWidth / 2, window.innerHeight * 0.4, 100);
    }

    const titleEl = document.getElementById('result-winner-name');
    const catEl = document.getElementById('result-winner-category');
    const descEl = document.getElementById('result-winner-desc');
    const priceEl = document.getElementById('result-winner-price');
    const shareBtn = document.getElementById('share-result-to-chat-btn');

    if (titleEl) titleEl.textContent = winner.name;
    if (catEl) catEl.textContent = `${this.categoryIcons[winner.category] || '🍱'} ${winner.category}`;
    if (descEl) descEl.textContent = winner.description || '오늘의 운명적인 맛있는 점심!';
    if (priceEl) priceEl.textContent = winner.price ? `₩${Number(winner.price).toLocaleString()}` : '';
    if (shareBtn) shareBtn.setAttribute('data-winner', winner.name);

    this.rouletteResultModal.classList.add('open');
  }

  switchTab(tabName) {
    this.activeTab = tabName;

    // Update nav buttons
    document.querySelectorAll('.nav-tab-btn').forEach(btn => {
      btn.classList.toggle('active', btn.getAttribute('data-tab') === tabName);
    });

    // Update view panels
    document.querySelectorAll('.tab-view-panel').forEach(panel => {
      panel.classList.toggle('active', panel.id === `tab-${tabName}`);
    });

    if (window.lunchChat) {
      window.lunchChat.setActiveTab(tabName);
    }

    if (tabName === 'roulette') {
      this.updateRouletteItems();
      setTimeout(() => {
        if (this.roulette) this.roulette.resize();
      }, 50);
    }
  }

  async fetchMenus() {
    try {
      const res = await fetch('/api/menus');
      const data = await res.json();
      if (data.success && data.menus) {
        this.menus = data.menus;
        this.renderMenus();
        this.updateHeaderStats();
        if (this.roulette) this.updateRouletteItems();
      }
    } catch (err) {
      console.error('Failed to fetch menus:', err);
    }
  }

  renderMenus() {
    if (!this.menuListContainer) return;

    let list = [...this.menus];

    // Filter Category
    if (this.currentCategory !== '전체') {
      list = list.filter(m => m.category === this.currentCategory);
    }

    // Filter Search
    if (this.searchQuery) {
      const q = this.searchQuery;
      list = list.filter(m =>
        m.name.toLowerCase().includes(q) ||
        (m.restaurant && m.restaurant.toLowerCase().includes(q)) ||
        (m.tags && m.tags.some(t => t.toLowerCase().includes(q))) ||
        (m.description && m.description.toLowerCase().includes(q))
      );
    }

    // Sort
    if (this.currentSort === 'likes') {
      list.sort((a, b) => (b.likes || 0) - (a.likes || 0));
    } else if (this.currentSort === 'priceAsc') {
      list.sort((a, b) => (a.price || 0) - (b.price || 0));
    } else if (this.currentSort === 'priceDesc') {
      list.sort((a, b) => (b.price || 0) - (a.price || 0));
    } else {
      list.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
    }

    if (list.length === 0) {
      this.menuListContainer.innerHTML = `
        <div class="empty-state-card">
          <div class="empty-icon">🍽️</div>
          <h3>등록된 점심 메뉴가 없습니다!</h3>
          <p>새로운 맛있는 메뉴를 첫 번째로 등록해보세요.</p>
          <button class="primary-gradient-btn" onclick="lunchApp.openAddModal()">
            ✨ 새 메뉴 등록하기
          </button>
        </div>
      `;
      return;
    }

    this.menuListContainer.innerHTML = list.map((menu, index) => {
      const icon = this.categoryIcons[menu.category] || '🍱';
      const gradient = this.categoryGradients[menu.category] || 'linear-gradient(135deg, #FF6B4A, #FFA938)';
      const isTop3 = index < 3 && this.currentSort === 'likes';
      const rankBadge = isTop3 ? `<span class="rank-badge rank-${index + 1}">TOP ${index + 1} 🔥</span>` : '';

      return `
        <div class="menu-card" data-id="${menu.id}">
          <div class="menu-card-header">
            <div class="menu-category-badge" style="background: ${gradient}">
              <span>${icon}</span> ${menu.category}
            </div>
            ${rankBadge}
            <div class="menu-card-actions">
              <button class="icon-action-btn share-to-chat-btn" title="대화창에 추천하기" onclick="lunchApp.recommendToChat('${this.escapeQuotes(menu.name)}')">
                💬
              </button>
              <button class="icon-action-btn delete-menu-btn" title="메뉴 삭제" onclick="lunchApp.deleteMenu('${menu.id}')">
                🗑️
              </button>
            </div>
          </div>

          <div class="menu-card-body">
            <h3 class="menu-title">${this.escapeHTML(menu.name)}</h3>
            ${menu.restaurant ? `
              <div class="menu-restaurant">
                <span class="location-icon">📍</span> ${this.escapeHTML(menu.restaurant)}
              </div>
            ` : ''}
            ${menu.description ? `
              <p class="menu-desc">${this.escapeHTML(menu.description)}</p>
            ` : ''}

            ${menu.tags && menu.tags.length > 0 ? `
              <div class="menu-tags">
                ${menu.tags.map(t => `<span class="tag-chip">#${this.escapeHTML(t)}</span>`).join('')}
              </div>
            ` : ''}
          </div>

          <div class="menu-card-footer">
            <div class="menu-price-box">
              <span class="price-val">₩${Number(menu.price || 0).toLocaleString()}</span>
              <span class="menu-author">by ${this.escapeHTML(menu.author || '익명')}</span>
            </div>
            <button class="like-btn" id="like-btn-${menu.id}" onclick="lunchApp.likeMenu('${menu.id}', event)">
              <span class="heart-icon">❤️</span>
              <span class="like-count">${menu.likes || 0}</span>
            </button>
          </div>
        </div>
      `;
    }).join('');
  }

  updateHeaderStats() {
    if (this.menuCountBadge) {
      this.menuCountBadge.textContent = `${this.menus.length}개`;
    }

    if (this.topMenuName && this.menus.length > 0) {
      const topMenu = [...this.menus].sort((a, b) => (b.likes || 0) - (a.likes || 0))[0];
      if (topMenu) {
        this.topMenuName.textContent = `${topMenu.name} (❤️ ${topMenu.likes})`;
      }
    }
  }

  async likeMenu(id, event) {
    if (event) {
      const btn = event.currentTarget;
      btn.classList.add('liked-animate');
      setTimeout(() => btn.classList.remove('liked-animate'), 600);

      // Create floating heart effect
      this.createFloatingHeart(event.clientX, event.clientY);
    }

    // Optimistic UI update
    const target = this.menus.find(m => m.id === id);
    if (target) {
      target.likes = (target.likes || 0) + 1;
      const countEl = document.querySelector(`#like-btn-${id} .like-count`);
      if (countEl) countEl.textContent = target.likes;
      this.updateHeaderStats();
    }

    try {
      await fetch(`/api/menus/${id}/like`, { method: 'POST' });
    } catch (err) {
      console.error('Like error:', err);
    }
  }

  createFloatingHeart(x, y) {
    const heart = document.createElement('div');
    heart.className = 'floating-heart-anim';
    heart.textContent = '❤️';
    heart.style.left = `${x || window.innerWidth / 2}px`;
    heart.style.top = `${y || window.innerHeight / 2}px`;
    document.body.appendChild(heart);

    setTimeout(() => {
      heart.remove();
    }, 1000);
  }

  async deleteMenu(id) {
    if (!confirm('정말 이 점심 메뉴를 삭제하시겠습니까?')) return;

    try {
      const res = await fetch(`/api/menus/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        this.menus = this.menus.filter(m => m.id !== id);
        this.renderMenus();
        this.updateHeaderStats();
        if (this.roulette) this.updateRouletteItems();
      }
    } catch (err) {
      console.error('Delete error:', err);
    }
  }

  recommendToChat(menuName) {
    if (window.lunchChat) {
      window.lunchChat.sendMessage(`🍱 오늘의 점심 추천! [${menuName}] 어때요? 완전 강추합니다! 😋`);
      this.switchTab('chat');
    }
  }

  openAddModal() {
    if (this.addModal) {
      this.addModal.classList.add('open');
      const nameInput = document.getElementById('menu-name-input');
      if (nameInput) setTimeout(() => nameInput.focus(), 200);

      const authorInput = document.getElementById('menu-author-input');
      if (authorInput && window.lunchChat) {
        authorInput.value = window.lunchChat.nickname;
      }
    }
  }

  closeAddModal() {
    if (this.addModal) this.addModal.classList.remove('open');
  }

  openNicknameModal() {
    if (this.nicknameModal) {
      this.nicknameModal.classList.add('open');
      const input = document.getElementById('custom-nickname-input');
      if (input && window.lunchChat) {
        input.value = window.lunchChat.nickname;
        setTimeout(() => input.focus(), 200);
      }
    }
  }

  closeNicknameModal() {
    if (this.nicknameModal) this.nicknameModal.classList.remove('open');
  }

  async handleMenuSubmit(e) {
    e.preventDefault();
    const name = document.getElementById('menu-name-input').value.trim();
    const category = document.querySelector('input[name="menu-category"]:checked')?.value || '한식';
    const price = document.getElementById('menu-price-input').value;
    const restaurant = document.getElementById('menu-restaurant-input').value.trim();
    const description = document.getElementById('menu-desc-input').value.trim();
    const rawTags = document.getElementById('menu-tags-input').value.trim();
    const author = document.getElementById('menu-author-input').value.trim() || window.lunchChat.nickname;

    if (!name) {
      alert('메뉴 이름을 입력해주세요!');
      return;
    }

    const tags = rawTags ? rawTags.split(',').map(t => t.trim().replace(/^#/, '')).filter(Boolean) : [];

    const payload = {
      name,
      category,
      price: price ? Number(price) : 9000,
      restaurant,
      description,
      tags,
      author
    };

    try {
      const res = await fetch('/api/menus', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (data.success) {
        this.closeAddModal();
        e.target.reset();

        // Celebration
        if (window.confetti) {
          window.confetti.fire(window.innerWidth / 2, window.innerHeight * 0.5, 70);
        }

        // Notify in Chat
        if (window.lunchChat) {
          window.lunchChat.sendMessage(`✨ 새 메뉴 등록! [${category}] [${name}]이(가) 메뉴판에 추가되었습니다! 🎉`);
        }
      }
    } catch (err) {
      console.error('Submit menu error:', err);
      alert('메뉴 등록에 실패했습니다. 다시 시도해주세요.');
    }
  }

  // WebSocket event listeners
  onMenuAdded(menu) {
    const existing = this.menus.find(m => m.id === menu.id);
    if (!existing) {
      this.menus.unshift(menu);
      this.renderMenus();
      this.updateHeaderStats();
      if (this.roulette) this.updateRouletteItems();
    }
  }

  onMenuLiked(payload) {
    const target = this.menus.find(m => m.id === payload.id);
    if (target) {
      target.likes = payload.likes;
      const countEl = document.querySelector(`#like-btn-${payload.id} .like-count`);
      if (countEl) countEl.textContent = payload.likes;
      this.updateHeaderStats();
    }
  }

  onMenuDeleted(payload) {
    this.menus = this.menus.filter(m => m.id !== payload.id);
    this.renderMenus();
    this.updateHeaderStats();
    if (this.roulette) this.updateRouletteItems();
  }

  escapeHTML(str) {
    return String(str || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  escapeQuotes(str) {
    return String(str || '').replace(/'/g, "\\'").replace(/"/g, '&quot;');
  }
}

document.addEventListener('DOMContentLoaded', () => {
  window.lunchApp = new LunchApp();
});
