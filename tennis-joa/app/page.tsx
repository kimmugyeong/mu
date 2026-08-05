"use client"; // 👈 최상단 첫 번째 줄에 이 문구를 추가하세요!

export default function Home() {
  return (
    <div className="flex-1 flex flex-col justify-between p-6">
      {/* 기존 코드 생략... */}
      
      <button 
        onClick={() => alert("터치 반응이 정상 동작합니다!")}
        className="..."
      >
        터치해 보세요
      </button>
    </div>
  );
}