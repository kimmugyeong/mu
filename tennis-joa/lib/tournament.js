export function buildTournamentGroups(players, groupCount) {
  const groups = Array.from({ length: groupCount }, () => []);
  const sortedPlayers = [...players];

  sortedPlayers.forEach((player, index) => {
    groups[index % groupCount].push(player);
  });

  return groups;
}

export function buildKbkPairings(players) {
  if (players.length < 2) {
    return [];
  }

  const arranged = [...players];
  if (arranged.length % 2 === 1) {
    arranged.push("BYE");
  }

  const pairings = [];
  const count = arranged.length;

  for (let round = 0; round < count - 1; round += 1) {
    for (let i = 0; i < count / 2; i += 1) {
      const first = arranged[i];
      const second = arranged[count - 1 - i];
      if (first === "BYE" || second === "BYE") {
        continue;
      }
      pairings.push([first, second]);
    }

    const rotation = arranged.splice(1, 1)[0];
    arranged.push(rotation);
  }

  return pairings;
}
