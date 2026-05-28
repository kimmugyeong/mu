# 시합관리 시스템 (데모 클론)

간단한 정적 복제본 데모입니다. 원본 사이트와 비슷한 레이아웃과 기본 상호작용(경기목록 토글, 팝업)을 재현합니다.

Try it locally

1) 브라우저에서 직접 열기 (파일://)

  - `index.html` 파일을 더블클릭하거나 브라우저에서 열면 됩니다.

2) 간단한 로컬 서버 (PowerShell)

```powershell
# Python 3.x이 설치되어 있다면
python -m http.server 8000

# 또는 PowerShell 내장: (간단히 이 폴더에서 실행)
Start-Process "msedge" "http://localhost:8000"
```

구성

- `index.html` — 메인 페이지
- `styles.css` — 스타일
- `script.js` — 최소 상호작용 스크립트

원하시면 원본 사이트와 더 시각적으로 가깝게 만들겠습니다(글꼴, 색상, 애니메이션 추가). 어떤 부분을 먼저 개선할까요? (예: 모바일 반응성, 실제 API 연결, 더 많은 카드/데이터)
