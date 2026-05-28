// Tournament manager
const STORAGE_KEY = 'tm:bracket:v1';

function $(s, root=document){ return root.querySelector(s); }
function $all(s, root=document){ return [...root.querySelectorAll(s)]; }

document.addEventListener('DOMContentLoaded', ()=>{
  console.log('TM: DOMContentLoaded');
  const addPlayerBtn = $('#addPlayer');
  const clearPlayersBtn = $('#clearPlayers');
  const playerNameInput = $('#playerName');
  const playersList = $('#playersList');
  const generateBtn = $('#generateBracket');
  const bracketSizeSelect = $('#bracketSize');
  const bracketContainer = $('#bracketContainer');
  const resetBracketBtn = $('#resetBracket');
  const exportJsonBtn = $('#exportJson');

  let state = loadState();
  console.log('TM: loaded state', state);
  renderPlayers();
  if(state.bracket) renderBracket();

  // show ready status
  const statusEl = document.getElementById('appStatus'); if(statusEl) statusEl.textContent = '준비됨';

  addPlayerBtn.addEventListener('click', ()=>{
    const name = playerNameInput.value.trim();
    if(!name) return;
    state.players.push(name);
    playerNameInput.value='';
    saveState(); renderPlayers();
  });

  // enter key to add
  playerNameInput.addEventListener('keydown', (e)=>{ if(e.key === 'Enter'){ addPlayerBtn.click(); } });

  clearPlayersBtn.addEventListener('click', ()=>{
    if(!confirm('선수 목록을 초기화하시겠습니까?')) return;
    state.players = []; state.bracket = null; saveState(); renderPlayers(); renderBracket();
  });

  generateBtn.addEventListener('click', ()=>{
    const size = Number(bracketSizeSelect.value);
    if(state.players.length < 2){ alert('최소 2명 이상 필요합니다.'); return; }
    const bracket = buildBracket(state.players, size);
    state.bracket = bracket;
    saveState(); renderBracket();
  });

  resetBracketBtn.addEventListener('click', ()=>{
    if(!confirm('대진을 초기화하시겠습니까?')) return;
    state.bracket = null; saveState(); renderBracket();
  });

  exportJsonBtn.addEventListener('click', ()=>{
    const data = JSON.stringify(state.bracket||{}, null, 2);
    const w = window.open(); w.document.write('<pre>'+escapeHtml(data)+'</pre>');
  });

  function renderPlayers(){
    playersList.innerHTML = '';
    state.players.forEach((p,i)=>{
      const el = document.createElement('div'); el.className='player-item';
      el.innerHTML = `<div>${i+1}. ${escapeHtml(p)}</div><div><button data-i="${i}" class="remove">삭제</button></div>`;
      playersList.appendChild(el);
    });
    $all('.remove', playersList).forEach(b=>b.addEventListener('click', e=>{ const i=Number(b.dataset.i); state.players.splice(i,1); saveState(); renderPlayers(); }));
  }

  function renderBracket(){
    bracketContainer.innerHTML = '';
    const bracket = state.bracket;
    if(!bracket){ bracketContainer.textContent = '대진이 없습니다. 선수 수를 추가하고 "대진 생성"을 눌러주세요.'; return; }
    // bracket.rounds = [[match,match],[...],...]
    bracket.rounds.forEach((round, rIdx)=>{
      const rnd = document.createElement('div'); rnd.className='round';
      round.forEach((match, mIdx)=>{
        const tpl = document.getElementById('matchTemplate');
        const node = tpl.content.firstElementChild.cloneNode(true);
        const slotA = $('.playerA', node); const slotB = $('.playerB', node);
        slotA.textContent = match.a||'-'; slotB.textContent = match.b||'-';
        const scoreA = $('.scoreA', node); const scoreB = $('.scoreB', node);
        if(match.scoreA!=null) scoreA.value = match.scoreA;
        if(match.scoreB!=null) scoreB.value = match.scoreB;
        const enterBtn = $('.enterResult', node);
        enterBtn.addEventListener('click', ()=>{
          const sa = Number(scoreA.value||0), sb = Number(scoreB.value||0);
          if(isNaN(sa) || isNaN(sb)){ alert('숫자를 입력하세요'); return; }
          match.scoreA = sa; match.scoreB = sb; match.winner = sa>sb? 'a' : (sb>sa? 'b' : null);
          advanceWinners(state.bracket);
          saveState(); renderBracket();
        });
        rnd.appendChild(node);
      });
      bracketContainer.appendChild(rnd);
    });
  }

  // helpers & state
  function saveState(){ localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); }
  function loadState(){ try{ const raw = localStorage.getItem(STORAGE_KEY); return raw? JSON.parse(raw):{players:[], bracket:null}; }catch(e){ return {players:[], bracket:null}; } }
  function escapeHtml(s){ return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }

});

// Build single-elimination bracket seeded from players array into size (power of two)
function buildBracket(players, size){
  // pad players with BYE to length size
  const slots = Array.from(players);
  while(slots.length < size) slots.push('BYE');
  // simple seeding: shuffle or keep order; here keep order and pair sequentially
  const rounds = [];
  let current = [];
  for(let i=0;i<slots.length;i+=2){ current.push({ a: slots[i], b: slots[i+1], scoreA:null, scoreB:null, winner:null }); }
  rounds.push(current);
  while(current.length > 1){
    const next = Array.from({length: Math.ceil(current.length/2)}, ()=>({a:null,b:null,scoreA:null,scoreB:null,winner:null}));
    rounds.push(next);
    current = next;
  }
  return { rounds };
}

// For each round, if match has winner, place into next round slot
function advanceWinners(bracket){
  for(let r=0;r<bracket.rounds.length-1;r++){
    const round = bracket.rounds[r];
    const next = bracket.rounds[r+1];
    for(let m=0;m<round.length;m++){
      const match = round[m];
      const winnerName = determineWinnerName(match);
      const targetIdx = Math.floor(m/2);
      if(!next[targetIdx]) continue;
      if(m%2===0) next[targetIdx].a = winnerName;
      else next[targetIdx].b = winnerName;
    }
  }
}

function determineWinnerName(match){
  if(!match) return null;
  if(match.winner==='a') return match.a;
  if(match.winner==='b') return match.b;
  if(match.scoreA!=null && match.scoreB!=null){ if(match.scoreA>match.scoreB) return match.a; if(match.scoreB>match.scoreA) return match.b; }
  // if one side is BYE, other wins
  if(match.a==='BYE' && match.b!=='BYE') return match.b;
  if(match.b==='BYE' && match.a!=='BYE') return match.a;
  return null;
}

(function () {
  // 요소 참조
  const playerNameInput = document.getElementById('playerName');
  const addPlayerBtn = document.getElementById('addPlayer');
  const clearPlayersBtn = document.getElementById('clearPlayers');
  const playersListEl = document.getElementById('playersList');
  const bracketSizeEl = document.getElementById('bracketSize');
  const generateBracketBtn = document.getElementById('generateBracket');
  const bracketContainer = document.getElementById('bracketContainer');
  const resetBracketBtn = document.getElementById('resetBracket');
  const exportJsonBtn = document.getElementById('exportJson');
  const appStatus = document.getElementById('appStatus');
  const matchTemplate = document.getElementById('matchTemplate');

  // 상태 및 로컬스토리지 키
  const STORAGE_PLAYERS = 'tm_players';
  const STORAGE_BRACKET = 'tm_bracket';
  let players = [];
  let bracket = null; // { size, rounds: [ [match, ...], ... ] }

  // 유틸
  function savePlayers() { localStorage.setItem(STORAGE_PLAYERS, JSON.stringify(players)); }
  function saveBracket() { localStorage.setItem(STORAGE_BRACKET, JSON.stringify(bracket)); }
  function loadState() {
    const p = localStorage.getItem(STORAGE_PLAYERS);
    const b = localStorage.getItem(STORAGE_BRACKET);
    if (p) players = JSON.parse(p);
    if (b) bracket = JSON.parse(b);
  }
  function setStatus(text) { appStatus.textContent = text; }

  // 렌더링
  function renderPlayers() {
    playersListEl.innerHTML = '';
    if (!players.length) {
      playersListEl.textContent = '등록된 선수가 없습니다.';
      return;
    }
    players.forEach((name, idx) => {
      const div = document.createElement('div');
      div.className = 'player-item';
      div.innerHTML = `<div>${idx + 1}. ${escapeHtml(name)}</div><button class="remove" data-idx="${idx}" aria-label="선수 제거">삭제</button>`;
      playersListEl.appendChild(div);
    });
  }

  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, (m) => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
  }

  function renderBracket() {
    bracketContainer.innerHTML = '';
    if (!bracket || !bracket.rounds || !bracket.rounds.length) {
      bracketContainer.textContent = '대진이 없습니다. 선수 수를 추가하고 "대진 생성"을 눌러주세요.';
      return;
    }
    bracket.rounds.forEach((roundMatches, rIdx) => {
      const roundWrap = document.createElement('div');
      roundWrap.className = 'round';
      const title = document.createElement('h3');
      title.textContent = `라운드 ${rIdx + 1}`;
      title.style.margin = '8px 0';
      roundWrap.appendChild(title);
      roundMatches.forEach((m, mIdx) => {
        const tpl = matchTemplate.content.cloneNode(true);
        const root = tpl.querySelector('.match');
        const slotA = root.querySelector('.playerA');
        const slotB = root.querySelector('.playerB');
        const scoreA = root.querySelector('.scoreA');
        const scoreB = root.querySelector('.scoreB');
        const enterBtn = root.querySelector('.enterResult');

        slotA.textContent = m.playerA ?? '-';
        slotB.textContent = m.playerB ?? '-';
        scoreA.value = m.scoreA ?? '';
        scoreB.value = m.scoreB ?? '';

        // 비어있는 매치(둘다 null)는 비활성화
        const disabled = !(m.playerA || m.playerB);
        if (disabled) {
          scoreA.disabled = scoreB.disabled = enterBtn.disabled = true;
        }

        // 메타를 dataset에 저장(이벤트 처리에 사용)
        root.dataset.round = rIdx;
        root.dataset.match = mIdx;

        roundWrap.appendChild(root);
      });
      bracketContainer.appendChild(roundWrap);
    });
  }

  // 로직: 대진 생성 (셔플 후 부전승 채움)
  function generateBracket() {
    const size = parseInt(bracketSizeEl.value, 10);
    if (!size || (size & (size - 1)) !== 0) {
      alert('대진 크기는 2의 제곱수여야 합니다 (4,8,16...).');
      return;
    }
    if (players.length < 2) { alert('선수를 최소 2명 이상 등록하세요.'); return; }
    if (players.length > size) { alert('선수 수가 선택한 대진 크기보다 많습니다. 선수 수를 줄이거나 대진 크기를 키우세요.'); return; }

    // 셔플
    const pool = players.slice();
    for (let i = pool.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [pool[i], pool[j]] = [pool[j], pool[i]];
    }
    // 빈 슬롯은 null로 채움 (부전승)
    while (pool.length < size) pool.push(null);

    // 라운드 생성
    const rounds = [];
    let current = [];
    for (let i = 0; i < pool.length; i += 2) {
      current.push({
        playerA: pool[i],
        playerB: pool[i + 1],
        scoreA: null,
        scoreB: null
      });
    }
    rounds.push(current);

    // 향후 라운드를 빈 매치 갯수로 미리 생성
    let matches = current.length;
    while (matches > 1) {
      matches = Math.ceil(matches / 2);
      const next = new Array(matches).fill(null).map(() => ({ playerA: null, playerB: null, scoreA: null, scoreB: null }));
      rounds.push(next);
    }

    bracket = { size, rounds };
    saveBracket();
    setStatus('대진 생성됨');
    renderBracket();
  }

  // 결과 입력 및 자동 진출
  function enterResult(roundIndex, matchIndex, sA, sB) {
    const round = bracket.rounds[roundIndex];
    if (!round) return;
    const match = round[matchIndex];
    if (!match) return;

    match.scoreA = Number.isFinite(+sA) ? Number(sA) : null;
    match.scoreB = Number.isFinite(+sB) ? Number(sB) : null;

    // 결정: 부전승 처리(상대가 null) 혹은 점수 비교
    let winner = null;
    if (match.playerA && !match.playerB) winner = match.playerA;
    else if (!match.playerA && match.playerB) winner = match.playerB;
    else if (Number.isFinite(match.scoreA) && Number.isFinite(match.scoreB)) {
      if (match.scoreA > match.scoreB) winner = match.playerA;
      else if (match.scoreB > match.scoreA) winner = match.playerB;
    }
    // 승자가 정해지면 다음 라운드로 진출
    if (winner !== null) {
      const nextRoundIndex = roundIndex + 1;
      if (bracket.rounds[nextRoundIndex]) {
        const nextMatchIndex = Math.floor(matchIndex / 2);
        const slot = (matchIndex % 2 === 0) ? 'playerA' : 'playerB';
        bracket.rounds[nextRoundIndex][nextMatchIndex][slot] = winner;
        saveBracket();
        setStatus(`라운드 ${roundIndex + 1} 매치 ${matchIndex + 1} 처리: ${winner} 진출`);
      }
    } else {
      setStatus('승자가 결정되지 않았습니다. 올바른 점수를 입력하세요.');
    }
    saveBracket();
    renderBracket();
  }

  // 이벤트 바인딩
  addPlayerBtn.addEventListener('click', () => {
    const name = playerNameInput.value.trim();
    if (!name) return;
    if (players.includes(name)) { alert('동일한 이름의 선수가 이미 등록되어 있습니다.'); return; }
    players.push(name);
    playerNameInput.value = '';
    savePlayers();
    renderPlayers();
    setStatus('선수 추가됨');
  });

  clearPlayersBtn.addEventListener('click', () => {
    if (!confirm('모든 선수를 초기화하시겠습니까?')) return;
    players = [];
    savePlayers();
    renderPlayers();
    setStatus('선수 목록 초기화됨');
  });

  playersListEl.addEventListener('click', (e) => {
    if (e.target.matches('.remove')) {
      const idx = parseInt(e.target.dataset.idx, 10);
      if (!Number.isFinite(idx)) return;
      players.splice(idx, 1);
      savePlayers();
      renderPlayers();
      setStatus('선수 제거됨');
    }
  });

  generateBracketBtn.addEventListener('click', generateBracket);

  bracketContainer.addEventListener('click', (e) => {
    if (e.target.matches('.enterResult')) {
      const matchEl = e.target.closest('.match');
      const rIdx = parseInt(matchEl.dataset.round, 10);
      const mIdx = parseInt(matchEl.dataset.match, 10);
      const sA = matchEl.querySelector('.scoreA').value;
      const sB = matchEl.querySelector('.scoreB').value;
      enterResult(rIdx, mIdx, sA, sB);
    }
  });

  resetBracketBtn.addEventListener('click', () => {
    if (!confirm('대진을 초기화하시겠습니까? 모든 입력된 결과가 삭제됩니다.')) return;
    bracket = null;
    localStorage.removeItem(STORAGE_BRACKET);
    renderBracket();
    setStatus('대진 초기화됨');
  });

  exportJsonBtn.addEventListener('click', () => {
    const data = { players, bracket };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'tournament.json';
    a.click();
    URL.revokeObjectURL(url);
    setStatus('JSON 내보내기 완료');
  });

  // 초기화 로직: 로드 및 렌더
  loadState();
  renderPlayers();
  renderBracket();
  setStatus('준비 완료');
})();

