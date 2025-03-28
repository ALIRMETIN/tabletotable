import { ParsedData, Team, Player, SetResult, MatchResult, TeamStats, TeamSummary } from '../types';

const fixSpecialCharacters = (text: string): string => {
  const replacements: { [key: string]: string } = {
    'Ý': 'İ',
    'Ð': 'Ğ',
    'Þ': 'Ş',
    'ý': 'ı',
    'ð': 'ğ',
    'þ': 'ş',
    'ü': 'ü',
    'Ü': 'Ü',
    'ö': 'ö',
    'Ö': 'Ö',
    'ç': 'ç',
    'Ç': 'Ç',
    'é': 'é',
    'è': 'è',
    'ë': 'ë',
    'á': 'á',
    'à': 'à',
    'ä': 'ä',
    'í': 'í',
    'ì': 'ì',
    'ï': 'ï',
    'ó': 'ó',
    'ò': 'ò',
    'ô': 'ô',
    'ń': 'ń',
    'ñ': 'ñ'
  };

  return text.replace(/[ÝÐÞýðþüÜöÖçÇéèëáàäíìïóòôńñ]/g, char => replacements[char] || char);
};

const getRoleString = (roleNumber: string): string => {
  switch (roleNumber) {
    case '1': return 'Libero';
    case '2': return 'Outside Hitter';
    case '3': return 'Opposite';
    case '4': return 'Middle Blocker';
    case '5': return 'Setter';
    default: return '-';
  }
};

const parsePlayers = (lines: string[], homeTeam: Team, awayTeam: Team): { homePlayers: Player[], awayPlayers: Player[] } => {
  const homePlayers: Player[] = [];
  const awayPlayers: Player[] = [];
  const playerMap = new Map<string, Player>();
  let isReadingHomePlayers = false;
  let isReadingAwayPlayers = false;
  let isReadingScout = false;

  // First pass: Create player entries
  for (const line of lines) {
    if (line.startsWith('[3PLAYERS-H]')) {
      isReadingHomePlayers = true;
      isReadingAwayPlayers = false;
      continue;
    } else if (line.startsWith('[3PLAYERS-V]')) {
      isReadingHomePlayers = false;
      isReadingAwayPlayers = true;
      continue;
    } else if (line.startsWith('[3ATTACKCOMBINATION]')) {
      break;
    }

    if ((isReadingHomePlayers || isReadingAwayPlayers) && line.includes(';')) {
      const parts = line.split(';');
      if (parts.length >= 15) {
        // Count filled cells in positions 4-8 (indices 3-7)
        let playedSets = 0;
        for (let i = 3; i <= 7; i++) {
          if (parts[i]?.trim()) {
            playedSets++;
          }
        }

        // Get the role from the 14th position (index 13)
        let roleNumber = '-';
        for (let i = 0; i < parts.length; i++) {
          if (i === 13 && parts[i]?.trim()) {
            roleNumber = parts[i].trim();
            break;
          }
        }

        const player: Player = {
          number: parts[1].trim(),  // Forma numarasını olduğu gibi al
          lastName: fixSpecialCharacters(parts[9]?.trim() || ''),
          firstName: fixSpecialCharacters(parts[10]?.trim() || ''),
          playedSets,
          servePoints: 0,
          attackPoints: 0,
          blockPoints: 0,
          role: getRoleString(roleNumber),
          team: isReadingHomePlayers ? homeTeam : awayTeam
        };
        
        // Oyuncuyu hem normal numarası hem de 0'lı hali ile kaydet
        const paddedNumber = player.number.padStart(2, '0');
        const teamPrefix = isReadingHomePlayers ? '*' : 'a';
        playerMap.set(`${teamPrefix}${player.number}`, player);
        playerMap.set(`${teamPrefix}${paddedNumber}`, player);

        if (isReadingHomePlayers) {
          homePlayers.push(player);
        } else {
          awayPlayers.push(player);
        }
      }
    }
  }

  // İkinci geçiş: [3SCOUT] bölümünden servis sayılarını hesapla
  for (const line of lines) {
    if (line.startsWith('[3SCOUT]')) {
      isReadingScout = true;
      continue;
    } else if (line.startsWith('[3ENDSCOUT]')) {
      isReadingScout = false;
      continue;
    }

    if (isReadingScout && line.trim()) {
      // Servis, atak ve blok sayısı kontrolü
      if (line.length >= 6 && line[5] === '#') {
        const prefix = line[0]; // * veya a
        const playerNumber = line.substring(1, 3); // 01, 02, 03 gibi
        const playerKey = `${prefix}${playerNumber}`;
        const actionType = line[3]; // S, A veya B
        
        const player = playerMap.get(playerKey);
        if (player) {
          if (actionType === 'S') {
            player.servePoints++;
          } else if (actionType === 'A') {
            player.attackPoints++;
          } else if (actionType === 'B') {
            player.blockPoints++;
          }
        }
      }
    }
  }

  return { homePlayers, awayPlayers };
};

const isValidSetScore = (homeScore: number, awayScore: number): boolean => {
  if ((homeScore >= 25 || awayScore >= 25) && Math.abs(homeScore - awayScore) >= 2) {
    return true;
  }
  if ((homeScore >= 15 || awayScore >= 15) && Math.abs(homeScore - awayScore) >= 2) {
    return true;
  }
  return false;
};

const isValidMatch = (sets: SetResult[]): boolean => {
  const homeWins = sets.filter(set => set.isWin).length;
  const awayWins = sets.filter(set => !set.isWin).length;
  return homeWins === 3 || awayWins === 3;
};

const parseStats = (lines: string[]): TeamStats => {
  // Initialize with default values
  const stats: TeamStats = {
    points: 0,
    totalPoints: 0,
    breaks: 0,
    breakAttempts: 0,
    aces: 0,
    serves: 0,
    sideouts: 0,
    sideoutAttempts: 0,
    receptions: 0,
    receptionAttempts: 0,
    kills: 0,
    attackAttempts: 0,
    blocks: 0,
    blockAttempts: 0,
    cars: 0,
    carAttempts: 0
  };

  let isReadingStats = false;
  let isReadingScout = false;
  let lastServeIndex = -1;
  let lastReceptionIndex = -1;
  let lastEorAIndex = -1;
  let homeSideoutAttempts = 0;
  let homeSideoutPoints = 0;
  let awaySideoutAttempts = 0;
  let awaySideoutPoints = 0;
  let lastReceptionTeam = '';
  let lastServeTeam = '';
  const scoutLines: string[] = [];

  for (const line of lines) {
    if (line.startsWith('[3STATS]')) {
      isReadingStats = true;
      isReadingScout = false;
      continue;
    } else if (line.startsWith('[3SCOUT]')) {
      isReadingStats = false;
      isReadingScout = true;
      continue;
    } else if (line.startsWith('[3ENDSCOUT]')) {
      isReadingScout = false;
      continue;
    }
    
    if (isReadingScout && line.trim()) {
      scoutLines.push(line);
      const currentIndex = scoutLines.length - 1;

      // Check for serve
      if (line.length >= 4 && line[3] === 'S') {
        lastServeIndex = currentIndex;
        lastReceptionIndex = -1;
        lastEorAIndex = -1;
        lastServeTeam = line[0];
      }
      // Check for reception after serve
      else if (lastServeIndex >= 0 && line.length >= 4 && line[3] === 'R') {
        if (currentIndex === lastServeIndex + 1) {
          lastReceptionIndex = currentIndex;
          lastReceptionTeam = line[0];  // * veya a
          // Reception yapan takım için sideout girişimi sayılır
          if (lastReceptionTeam === '*') {
            homeSideoutAttempts++;
          } else {
            awaySideoutAttempts++;
          }
        }
      }
      // Check for E or A after reception
      else if (lastReceptionIndex >= 0 && line.length >= 4 && (line[3] === 'E' || line[3] === 'A')) {
        if (currentIndex === lastReceptionIndex + 1) {
          lastEorAIndex = currentIndex;
        }
      }
      // Check for attack after E or A
      else if (lastEorAIndex >= 0 && line.length >= 6 && line[3] === 'A') {
        if (currentIndex === lastEorAIndex + 1) {
          // If attack is a point (#), count it as a sideout point
          // Reception yapan takım sayı aldıysa sideout point sayılır
          if (line[5] === '#' && line[0] === lastReceptionTeam) {
            if (lastReceptionTeam === '*') {
              homeSideoutPoints++;
            } else {
              awaySideoutPoints++;
            }
          }
          // Reset tracking
          lastServeIndex = -1;
          lastReceptionIndex = -1;
          lastEorAIndex = -1;
        }
      }
    } else if (isReadingStats && line.includes(';')) {
      const parts = line.split(';');
      if (parts.length >= 4) {
        const [category, success, attempts] = [parts[1], parseInt(parts[2]), parseInt(parts[3])];
        
        switch (category.trim()) {
          case 'Points':
            stats.points = success;
            stats.totalPoints = attempts;
            break;
          case 'Break':
            stats.breaks = success;
            stats.breakAttempts = attempts;
            break;
          case 'Serve':
            stats.aces = success;
            stats.serves = attempts;
            break;
          case 'Sideout':
            stats.sideouts = lastServeTeam === '*' ? awaySideoutPoints : homeSideoutPoints;
            stats.sideoutAttempts = lastServeTeam === '*' ? awaySideoutAttempts : homeSideoutAttempts;
            break;
          case 'Reception':
            stats.receptions = success;
            stats.receptionAttempts = attempts;
            break;
          case 'Attack':
            stats.kills = success;
            stats.attackAttempts = attempts;
            break;
          case 'Block':
            stats.blocks = success;
            stats.blockAttempts = attempts;
            break;
          case 'CAR':
            stats.cars = success;
            stats.carAttempts = attempts;
            break;
        }
      }
    }
  }

  return stats;
};

export const parseFile = async (file: File): Promise<MatchResult> => {
  const buffer = await file.arrayBuffer();
  const text = new TextDecoder('windows-1252').decode(buffer);
  console.log('File content length:', text.length);
  const lines = text.split('\n');
  console.log('Number of lines:', lines.length);

  let teams: Team[] = [];
  let sets: SetResult[] = [];
  let totalHomePoints = 0;
  let totalAwayPoints = 0;
  let isReadingTeams = false;
  let isReadingSets = false;

  for (const line of lines) {
    if (line.startsWith('[3TEAMS]')) {
      isReadingTeams = true;
      isReadingSets = false;
      continue;
    } else if (line.startsWith('[3SET]')) {
      isReadingTeams = false;
      isReadingSets = true;
      continue;
    }

    if (line.trim() === '') continue;

    const parts = line.split(';');

    if (isReadingTeams && parts.length > 2) {
      teams.push({
        code: parts[0],
        name: fixSpecialCharacters(parts[1].trim())
      });
      console.log('Found team:', parts[0], parts[1].trim());
    } else if (isReadingSets && parts[0] === 'True' && parts.length >= 5) {
      const setScore = parts[4].trim();
      if (setScore) {
        const [homeScore, awayScore] = setScore.split('-').map(Number);
        if (isValidSetScore(homeScore, awayScore)) {
          console.log('Found valid set score:', setScore);
          const isWin = homeScore > awayScore;
          totalHomePoints += homeScore;
          totalAwayPoints += awayScore;
          sets.push({
            score: setScore,
            isWin,
            homePoints: homeScore,
            awayPoints: awayScore
          });
        }
      }
    }
  }

  if (teams.length < 2) {
    throw new Error('Invalid DVW file: Could not find team information');
  }

  if (!isValidMatch(sets)) {
    throw new Error('Invalid match: Match must be won by first team to win 3 sets');
  }

  const stats = parseStats(lines);
  const { homePlayers, awayPlayers } = parsePlayers(lines, teams[0], teams[1]);

  const matchResult: MatchResult = {
    homeTeam: teams[0],
    awayTeam: teams[1],
    sets,
    isWin: sets.filter(set => set.isWin).length === 3,
    stats,
    totalHomePoints,
    totalAwayPoints,
    homePlayers,
    awayPlayers,
    rawData: lines
  };

  return matchResult;
};

export const calculateTeamSummary = (team: Team, matches: MatchResult[]): TeamSummary => {
  const teamMatches = matches.filter(m => 
    m.homeTeam.code === team.code || m.awayTeam.code === team.code
  );

  let totalSets = 0;
  let wonSets = 0;
  let wonPoints = 0;
  let lostPoints = 0;
  let totalAces = 0;
  let totalKills = 0;
  let totalBlocks = 0;

  teamMatches.forEach(match => {
    const isHomeTeam = match.homeTeam.code === team.code;
    totalSets += match.sets.length;
    
    // Calculate won sets
    if (isHomeTeam) {
      wonSets += match.sets.filter(set => set.isWin).length;
      wonPoints += match.totalHomePoints;
      lostPoints += match.totalAwayPoints;
    } else {
      wonSets += match.sets.filter(set => !set.isWin).length;
      wonPoints += match.totalAwayPoints;
      lostPoints += match.totalHomePoints;
    }

    totalAces += match.stats.aces;
    totalKills += match.stats.kills;
    totalBlocks += match.stats.blocks;
  });

  const wins = teamMatches.filter(m => 
    (m.homeTeam.code === team.code && m.isWin) || 
    (m.awayTeam.code === team.code && !m.isWin)
  ).length;

  const totalStats = teamMatches.reduce((acc, match) => {
    const stats = match.stats;
    return {
      points: acc.points + stats.points,
      totalPoints: acc.totalPoints + stats.totalPoints,
      breaks: acc.breaks + stats.breaks,
      breakAttempts: acc.breakAttempts + stats.breakAttempts,
      aces: acc.aces + stats.aces,
      serves: acc.serves + stats.serves,
      sideouts: acc.sideouts + stats.sideouts,
      sideoutAttempts: acc.sideoutAttempts + stats.sideoutAttempts,
      receptions: acc.receptions + stats.receptions,
      receptionAttempts: acc.receptionAttempts + stats.receptionAttempts,
      kills: acc.kills + stats.kills,
      attackAttempts: acc.attackAttempts + stats.attackAttempts,
      blocks: acc.blocks + stats.blocks,
      blockAttempts: acc.blockAttempts + stats.blockAttempts,
      cars: acc.cars + stats.cars,
      carAttempts: acc.carAttempts + stats.carAttempts
    };
  }, {
    points: 0, totalPoints: 0, breaks: 0, breakAttempts: 0,
    aces: 0, serves: 0, sideouts: 0, sideoutAttempts: 0,
    receptions: 0, receptionAttempts: 0, kills: 0, attackAttempts: 0,
    blocks: 0, blockAttempts: 0, cars: 0, carAttempts: 0
  });

  return {
    team,
    matches: teamMatches.length,
    wins,
    sets: totalSets,
    wonSets,
    wonPoints,
    lostPoints,
    winPercentage: (wins / teamMatches.length) * 100,
    pointsRatio: (totalStats.points / totalStats.totalPoints) * 100,
    breakPercentage: (totalStats.breaks / totalStats.breakAttempts) * 100,
    acePercentage: (totalStats.aces / totalStats.serves) * 100,
    sideoutPercentage: (totalStats.sideouts / totalStats.sideoutAttempts) * 100,
    receptionPercentage: (totalStats.receptions / totalStats.receptionAttempts) * 100,
    killPercentage: (totalStats.kills / totalStats.attackAttempts) * 100,
    oppKillPercentage: ((totalStats.attackAttempts - totalStats.kills) / totalStats.attackAttempts) * 100,
    blockPercentage: (totalStats.blocks / totalStats.blockAttempts) * 100,
    carPercentage: (totalStats.cars / totalStats.carAttempts) * 100,
    aces: totalAces,
    kills: totalKills,
    blocks: totalBlocks
  };
};

export const parseFiles = async (files: FileList): Promise<ParsedData> => {
  const matches: MatchResult[] = [];
  
  for (let i = 0; i < files.length; i++) {
    try {
      const match = await parseFile(files[i]);
      matches.push(match);
    } catch (error) {
      console.error(`Error parsing file ${files[i].name}:`, error);
    }
  }

  // Get unique teams
  const teams = Array.from(new Set(matches.flatMap(m => [m.homeTeam, m.awayTeam])
    .map(t => JSON.stringify(t))))
    .map(t => JSON.parse(t));

  // Calculate stats for each team
  const teamStats = teams.map(team => calculateTeamSummary(team, matches));

  return { matches, teamStats };
};
