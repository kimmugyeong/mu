# 테니스 토너먼트 매니저 (로컬 정적 앱)

관리자가 선수 목록을 입력해 단일 제거(single-elimination) 대진을 생성하고, 각 매치의 결과를 입력해 우승자를 자동으로 다음 라운드에 올리는 간단한 웹 데모입니다.

주요 기능
- 선수 등록 / 삭제
- 대진 크기(4/8/16) 선택 후 대진 생성
- 각 매치에 점수 입력 → 자동으로 다음 라운드에 우승자 반영
- 상태는 브라우저의 localStorage에 저장됩니다

로컬에서 실행하기

```powershell
# 이 디렉토리에서
python -m http.server 8000
# 브라우저에서 열기
Start-Process "msedge" "http://localhost:8000"
```

파일 설명
- `index.html` — 메인 UI
- `styles.css` — 스타일
- `script.js` — 대진 생성/진행 로직 및 localStorage persistence

다음으로 할 일(선택)
- 대진 시드 로직 개선(랜덤/토너먼트 시드 규칙)
- 승자 결정 규칙(세트 기반의 상세 점수 입력)
- CSV/Excel import-export
- 백엔드 연동 (저장/공유)

원하시면 다음 단계 중 하나를 먼저 진행하겠습니다. 어떤 기능을 추가할까요?
