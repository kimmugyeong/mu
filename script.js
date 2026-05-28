// Tournament manager
const STORAGE_KEY = 'tm:bracket:v1';

function $(s, root=document){ return root.querySelector(s); }
function $all(s, root=document){ return [...root.querySelectorAll(s)]; }

document.addEventListener('DOMContentLoaded', ()=>{
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
  renderPlayers();
  if(state.bracket) renderBracket();

  addPlayerBtn.addEventListener('click', ()=>{
    const name = playerNameInput.value.trim();
    if(!name) return;
    state.players.push(name);
    playerNameInput.value='';
    saveState(); renderPlayers();
  });

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

