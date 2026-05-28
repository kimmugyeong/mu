document.addEventListener('DOMContentLoaded',()=>{
  document.querySelectorAll('.grp-matches-toggle').forEach(btn=>{
    btn.addEventListener('click',()=>{
      const card=btn.closest('.grp-card');
      const sec=card.querySelector('.grp-matches-section');
      if(!sec) return;
      const opened = sec.classList.toggle('force-show');
      btn.textContent = opened ? '📂 경기목록 접기' : '📋 경기목록 보기';
    });
  });

  // popup
  const popup=document.getElementById('matchListPopup');
  const popupBody=document.getElementById('matchListPopupBody');
  document.getElementById('mlpClose').addEventListener('click',()=>{ popup.classList.remove('show'); popup.setAttribute('aria-hidden','true'); popupBody.innerHTML=''; });

  document.querySelectorAll('.grp-card .match-card').forEach((mc,idx)=>{
    mc.addEventListener('click',()=>{
      openMatchListPopupFromElement(mc, idx);
    });
  });

  // result/notify buttons inside cards
  document.querySelectorAll('.match-actions .result').forEach(btn=>{ btn.addEventListener('click',(e)=>{ e.stopPropagation(); alert('결과입력 클릭 (데모)'); }); });
  document.querySelectorAll('.match-actions .notify').forEach(btn=>{ btn.addEventListener('click',(e)=>{ e.stopPropagation(); alert('알림 클릭 (데모)'); }); });
});

function openMatchListPopupFromElement(el, idx){
  const popup=document.getElementById('matchListPopup');
  const body=document.getElementById('matchListPopupBody');
  body.innerHTML='';
  // build a simple card
  const title=(el.querySelector('.m3hdr')?.textContent||'경기');
  const meta=(el.querySelector('.m3meta')?.textContent||'');
  const score=(el.querySelector('.m3meta')?.textContent.match(/(\d+[:：]\d+)/)||[])[0]||'';

  const card=document.createElement('div');
  card.className='mlp-card';
  card.innerHTML = `
    <div class="mlp-meta">
      <span class="mlp-chip">${idx+1}경기</span>
      <span class="mlp-chip">${meta}</span>
    </div>
    <div class="mlp-teams">${title}</div>
    ${score?`<div class="mlp-score">${score}</div>`:''}
    <div class="mlp-actions">
      <button class="btn btn-primary">✏️ 결과입력</button>
      <button class="btn btn-outline">🔔 알림</button>
    </div>
  `;
  body.appendChild(card);
  popup.classList.add('show');
  popup.setAttribute('aria-hidden','false');
}
