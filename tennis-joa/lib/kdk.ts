export type KDKPlayer = {
  id: string;
  name: string;
};

export type KDKMatch = {
  id: string;
  roundNum: number;
  team1: [string, string];
  team2: [string, string];
  team1Score: number | null;
  team2Score: number | null;
  isCompleted: boolean;
};

export type KDKGroupResult = {
  groupName: string;
  players: string[];
  matches: KDKMatch[];
  standings: {
    playerName: string;
    wins: number;
    losses: number;
    pointsFor: number;
    pointsAgainst: number;
    diff: number;
    winRate: number;
    rank: number;
  }[];
};

/**
 * 4인 기준 표준 KDK 대진표 생성 (복식)
 * R1: (P1, P2) vs (P3, P4)
 * R2: (P1, P3) vs (P2, P4)
 * R3: (P1, P4) vs (P2, P3)
 */
export function generate4PlayerKDKMatches(players: string[], groupPrefix = ""): KDKMatch[] {
  if (players.length < 4) {
    // 4명 미만일 경우 기본 매칭
    return [
      {
        id: `${groupPrefix}_m1`,
        roundNum: 1,
        team1: [players[0] || "선수1", players[1] || "선수2"],
        team2: [players[2] || "선수3", players[3] || "선수4"],
        team1Score: null,
        team2Score: null,
        isCompleted: false,
      },
    ];
  }

  const p = players;
  return [
    {
      id: `${groupPrefix}_r1`,
      roundNum: 1,
      team1: [p[0], p[1]],
      team2: [p[2], p[3]],
      team1Score: null,
      team2Score: null,
      isCompleted: false,
    },
    {
      id: `${groupPrefix}_r2`,
      roundNum: 2,
      team1: [p[0], p[2]],
      team2: [p[1], p[3]],
      team1Score: null,
      team2Score: null,
      isCompleted: false,
    },
    {
      id: `${groupPrefix}_r3`,
      roundNum: 3,
      team1: [p[0], p[3]],
      team2: [p[1], p[2]],
      team1Score: null,
      team2Score: null,
      isCompleted: false,
    },
  ];
}

/**
 * 경기 결과(점수) 기반으로 개인별 성적표 (승/패/득/실/득실차/승률/순위) 계산
 */
export function calculateGroupStandings(players: string[], matches: KDKMatch[]) {
  const statsMap: Record<
    string,
    { wins: number; losses: number; pointsFor: number; pointsAgainst: number }
  > = {};

  players.forEach((p) => {
    statsMap[p] = { wins: 0, losses: 0, pointsFor: 0, pointsAgainst: 0 };
  });

  matches.forEach((m) => {
    if (m.team1Score === null || m.team2Score === null) return;
    const s1 = Number(m.team1Score);
    const s2 = Number(m.team2Score);

    const isTeam1Win = s1 > s2;
    const isTeam2Win = s2 > s1;

    // Team 1 플레이어들 업데이트
    m.team1.forEach((p) => {
      if (!statsMap[p]) statsMap[p] = { wins: 0, losses: 0, pointsFor: 0, pointsAgainst: 0 };
      statsMap[p].pointsFor += s1;
      statsMap[p].pointsAgainst += s2;
      if (isTeam1Win) statsMap[p].wins += 1;
      else if (isTeam2Win) statsMap[p].losses += 1;
    });

    // Team 2 플레이어들 업데이트
    m.team2.forEach((p) => {
      if (!statsMap[p]) statsMap[p] = { wins: 0, losses: 0, pointsFor: 0, pointsAgainst: 0 };
      statsMap[p].pointsFor += s2;
      statsMap[p].pointsAgainst += s1;
      if (isTeam2Win) statsMap[p].wins += 1;
      else if (isTeam1Win) statsMap[p].losses += 1;
    });
  });

  const list = Object.keys(statsMap).map((playerName) => {
    const st = statsMap[playerName];
    const totalMatches = st.wins + st.losses;
    const diff = st.pointsFor - st.pointsAgainst;
    const winRate = totalMatches > 0 ? Math.round((st.wins / totalMatches) * 100) : 0;
    return {
      playerName,
      wins: st.wins,
      losses: st.losses,
      pointsFor: st.pointsFor,
      pointsAgainst: st.pointsAgainst,
      diff,
      winRate,
      rank: 1,
    };
  });

  // 순위 정렬 (1순위 승수 desc, 2순위 득실차 desc, 3순위 총 득점 desc)
  list.sort((a, b) => {
    if (b.wins !== a.wins) return b.wins - a.wins;
    if (b.diff !== a.diff) return b.diff - a.diff;
    return b.pointsFor - a.pointsFor;
  });

  list.forEach((item, index) => {
    item.rank = index + 1;
  });

  return list;
}
