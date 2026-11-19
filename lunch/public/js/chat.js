// Real-time Chat Module (No login required, Nickname only)
class LunchChat {
  constructor() {
    this.ws = null;
    this.nickname = this.getStoredNickname() || this.generateRandomNickname();
    this.avatarColor = this.getStoredAvatarColor() || this.generateRandomColor();
    this.unreadCount = 0;
    this.activeTab = 'menu';

    this.initDOM();
    this.connectWebSocket();
    this.loadHistory();
  }

  getStoredNickname() {
    return localStorage.getItem('lunch_user_nickname') || '';
  }

  getStoredAvatarColor() {
    return localStorage.getItem('lunch_user_avatar_color') || '';
  }

  setNickname(name) {
    if (!name || !name.trim()) return;
    this.nickname = name.trim().slice(0, 15);
    localStorage.setItem('lunch_user_nickname', this.nickname);
    this.updateNicknameUI();
  }

  generateRandomNickname() {
    const adjectives = [
      '배고픈', '행복한', '불타는', '칼퇴원츄', '든든한',
      '신나는', '얼큰한', '바삭한', '달콤한', '프로혼밥',
      '고기러버', '맵부심', '쫄깃한', '황금빛', '야근탈출'
    ];
    const nouns = [
      '판다 🐼', '제육 🥩', '돈까스 🍱', '순대국 🍲', '라면 🍜',
      '피자 🍕', '초밥 🍣', '비빔밥 🍚', '마라탕 🥘', '버거 🍔',
      '칼국수 🥢', '치킨 🍗', '붕어빵 🐟', '냥이 🐱', '곰돌이 🐻'
    ];
    const adj = adjectives[Math.floor(Math.random() * adjectives.length)];
    const noun = nouns[Math.floor(Math.random() * nouns.length)];
    const randomName = `${adj} ${noun}`;
    this.setNickname(randomName);
    return randomName;
  }

  generateRandomColor() {
    const colors = ['#FF6B4A', '#4DABF7', '#38D9A9', '#FF922B', '#845EF7', '#F06595', '#20C997', '#FA5252'];
    const chosen = colors[Math.floor(Math.random() * colors.length)];
    localStorage.setItem('lunch_user_avatar_color', chosen);
    return chosen;
  }

  initDOM() {
    this.chatList = document.getElementById('chat-messages-list');
    this.splitChatList = document.getElementById('split-chat-messages-list');

    this.chatInput = document.getElementById('chat-input');
    this.splitChatInput = document.getElementById('split-chat-input');

    this.chatSendBtn = document.getElementById('chat-send-btn');
    this.splitChatSendBtn = document.getElementById('split-chat-send-btn');

    this.nicknameDisplay = document.getElementById('chat-user-nickname');
    this.splitNicknameDisplay = document.getElementById('split-chat-user-nickname');
    this.headerNickname = document.getElementById('header-nickname-text');

    this.onlineBadge = document.getElementById('online-users-count');
    this.splitOnlineBadge = document.getElementById('split-online-users-count');
    this.chatBadge = document.getElementById('chat-nav-badge');

    this.updateNicknameUI();

    // Send Button click (Mobile)
    if (this.chatSendBtn) {
      this.chatSendBtn.addEventListener('click', () => this.sendMessage());
    }

    // Send Button click (Split)
    if (this.splitChatSendBtn) {
      this.splitChatSendBtn.addEventListener('click', () => {
        const text = this.splitChatInput ? this.splitChatInput.value.trim() : '';
        if (text) {
          this.sendMessage(text);
          this.splitChatInput.value = '';
          this.splitChatInput.focus();
        }
      });
    }

    // Enter Key (Mobile)
    if (this.chatInput) {
      this.chatInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
          e.preventDefault();
          this.sendMessage();
        }
      });
    }

    // Enter Key (Split)
    if (this.splitChatInput) {
      this.splitChatInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
          e.preventDefault();
          const text = this.splitChatInput.value.trim();
          if (text) {
            this.sendMessage(text);
            this.splitChatInput.value = '';
          }
        }
      });
    }

    // Quick Emoji clicks (Mobile)
    document.querySelectorAll('.quick-emoji-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const emoji = e.currentTarget.getAttribute('data-emoji');
        if (this.chatInput) {
          this.chatInput.value += emoji;
          this.chatInput.focus();
        }
      });
    });

    // Quick Emoji clicks (Split)
    document.querySelectorAll('.quick-emoji-btn-split').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const emoji = e.currentTarget.getAttribute('data-emoji');
        if (this.splitChatInput) {
          this.splitChatInput.value += emoji;
          this.splitChatInput.focus();
        }
      });
    });

    // Randomize Nickname button
    const randomNickBtn = document.getElementById('random-nickname-btn');
    if (randomNickBtn) {
      randomNickBtn.addEventListener('click', () => {
        this.generateRandomNickname();
        if (window.confetti) window.confetti.fire(window.innerWidth / 2, 100, 20);
      });
    }
  }

  updateNicknameUI() {
    if (this.nicknameDisplay) this.nicknameDisplay.textContent = this.nickname;
    if (this.splitNicknameDisplay) this.splitNicknameDisplay.textContent = this.nickname;
    if (this.headerNickname) this.headerNickname.textContent = this.nickname;
    const authorInput = document.getElementById('menu-author-input');
    if (authorInput) authorInput.value = this.nickname;
  }

  connectWebSocket() {
    // Check if hosted on Vercel or similar serverless platform where WS isn't supported
    const isVercel = window.location.hostname.endsWith('vercel.app');
    if (isVercel) {
      console.log('🌐 Vercel environment detected: using HTTP Polling mode');
      this.startPolling();
      return;
    }

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}`;

    try {
      this.ws = new WebSocket(wsUrl);

      this.ws.onopen = () => {
        console.log('⚡ LunchChat WebSocket Connected');
        if (this.pollingInterval) {
          clearInterval(this.pollingInterval);
          this.pollingInterval = null;
        }
      };

      this.ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          this.handleServerEvent(data);
        } catch (err) {
          console.error('Error parsing WS message:', err);
        }
      };

      this.ws.onclose = () => {
        console.log('WS Connection closed, switching to polling fallback...');
        this.startPolling();
        setTimeout(() => this.connectWebSocket(), 10000);
      };

      this.ws.onerror = (err) => {
        console.warn('WS Error, falling back to HTTP polling');
        this.startPolling();
      };
    } catch (e) {
      console.warn('WS Init failed, fallback to polling:', e);
      this.startPolling();
    }
  }

  startPolling() {
    if (this.pollingInterval) return;
    this.pollingInterval = setInterval(async () => {
      await this.pollNewMessages();
    }, 3000);
  }

  async pollNewMessages() {
    try {
      const res = await fetch('/api/chats');
      const data = await res.json();
      if (data.success && data.chats) {
        const lastExistingId = this.lastKnownChatId;
        const newChats = lastExistingId
          ? data.chats.filter(c => !this.renderedChatIds.has(c.id))
          : data.chats;

        newChats.forEach(chat => this.appendMessage(chat, true));
      }
    } catch (err) {
      // quiet poll error
    }
  }

  handleServerEvent(data) {
    switch (data.type) {
      case 'USER_COUNT':
        if (this.onlineBadge) {
          this.onlineBadge.textContent = `${data.payload.count}명 대화중`;
        }
        if (this.splitOnlineBadge) {
          this.splitOnlineBadge.textContent = `${data.payload.count}명 대화중`;
        }
        break;

      case 'NEW_CHAT':
        this.appendMessage(data.payload);
        if (this.activeTab !== 'chat') {
          this.unreadCount++;
          if (this.chatBadge) {
            this.chatBadge.style.display = 'inline-flex';
            this.chatBadge.textContent = this.unreadCount > 9 ? '9+' : this.unreadCount;
          }
        }
        break;

      case 'MENU_ADDED':
        if (window.lunchApp) window.lunchApp.onMenuAdded(data.payload);
        break;

      case 'MENU_LIKED':
        if (window.lunchApp) window.lunchApp.onMenuLiked(data.payload);
        break;

      case 'MENU_DELETED':
        if (window.lunchApp) window.lunchApp.onMenuDeleted(data.payload);
        break;
    }
  }

  async loadHistory() {
    this.renderedChatIds = new Set();
    try {
      const res = await fetch('/api/chats');
      const data = await res.json();
      if (data.success && data.chats) {
        if (this.chatList) this.chatList.innerHTML = '';
        if (this.splitChatList) this.splitChatList.innerHTML = '';
        data.chats.forEach(chat => this.appendMessage(chat, false));
        this.scrollToBottom();
      }
      if (data.onlineCount) {
        if (this.onlineBadge) this.onlineBadge.textContent = `${data.onlineCount}명 대화중`;
        if (this.splitOnlineBadge) this.splitOnlineBadge.textContent = `${data.onlineCount}명 대화중`;
      }
    } catch (err) {
      console.error('Failed to load chat history:', err);
    }
  }

  async sendMessage(overrideText) {
    const text = overrideText || (this.chatInput ? this.chatInput.value.trim() : '');
    if (!text) return;

    if (!this.nickname) {
      this.generateRandomNickname();
    }

    const payload = {
      nickname: this.nickname,
      message: text,
      avatarColor: this.avatarColor
    };

    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({ type: 'CHAT_MESSAGE', payload }));
    } else {
      // HTTP POST fallback for Vercel
      try {
        const res = await fetch('/api/chats', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        const data = await res.json();
        if (data.success && data.chat) {
          this.appendMessage(data.chat, true);
        }
      } catch (err) {
        console.error('HTTP Chat send error:', err);
      }
    }

    if (!overrideText && this.chatInput) {
      this.chatInput.value = '';
      this.chatInput.focus();
    }
  }

  createMessageHTML(chat) {
    const isMe = chat.nickname === this.nickname;
    const isSystem = chat.isSystem;

    if (isSystem) {
      return `
        <div class="system-bubble">
          <span class="system-icon">📢</span>
          <span class="system-text">${this.escapeHTML(chat.message)}</span>
        </div>
      `;
    }

    const initial = (chat.nickname || '익').substring(0, 1);
    const avatarStyle = chat.avatarColor ? `style="background:${chat.avatarColor}"` : '';

    return `
      ${!isMe ? `<div class="chat-avatar" ${avatarStyle}>${initial}</div>` : ''}
      <div class="chat-content">
        ${!isMe ? `<div class="chat-sender">${this.escapeHTML(chat.nickname)}</div>` : ''}
        <div class="chat-bubble-row">
          ${isMe ? `<span class="chat-time">${chat.time || ''}</span>` : ''}
          <div class="chat-bubble">
            ${this.escapeHTML(chat.message)}
          </div>
          ${!isMe ? `<span class="chat-time">${chat.time || ''}</span>` : ''}
        </div>
      </div>
    `;
  }

  appendMessage(chat, shouldScroll = true) {
    if (!chat) return;
    if (this.renderedChatIds && chat.id) {
      if (this.renderedChatIds.has(chat.id)) return;
      this.renderedChatIds.add(chat.id);
    }
    const isSystem = chat.isSystem;
    const className = `chat-item ${isSystem ? 'system' : isMe ? 'me' : 'other'}`;
    const inner = this.createMessageHTML(chat);

    if (this.chatList) {
      const msgEl = document.createElement('div');
      msgEl.className = className;
      msgEl.innerHTML = inner;
      this.chatList.appendChild(msgEl);
    }

    if (this.splitChatList) {
      const msgEl = document.createElement('div');
      msgEl.className = className;
      msgEl.innerHTML = inner;
      this.splitChatList.appendChild(msgEl);
    }

    if (shouldScroll) {
      this.scrollToBottom();
    }
  }

  scrollToBottom() {
    if (this.chatList) {
      this.chatList.scrollTop = this.chatList.scrollHeight;
    }
    if (this.splitChatList) {
      this.splitChatList.scrollTop = this.splitChatList.scrollHeight;
    }
  }

  setActiveTab(tabName) {
    this.activeTab = tabName;
    if (tabName === 'chat') {
      this.unreadCount = 0;
      if (this.chatBadge) {
        this.chatBadge.style.display = 'none';
      }
      setTimeout(() => this.scrollToBottom(), 100);
    }
  }

  escapeHTML(str) {
    return String(str || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }
}

window.lunchChat = null;
