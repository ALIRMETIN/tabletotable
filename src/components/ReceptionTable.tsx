import React from 'react';
import { MatchResult } from '../types';

interface PlayerReceptionStats {
  totalReceptions: number;
  receptionMistakes: number;
  negativeReceptions: number;
  positiveReceptions: number;
  jumpServeReceptions: number;
  jumpServePositive: number;
  jumpServeNegative: number;
  jumpServeMistakes: number;
  floatServeReceptions: number;
  floatServePositive: number;
  floatServeNegative: number;
  floatServeMistakes: number;
}

interface ReceptionTableProps {
  matches: MatchResult[];
}

interface PlayerIdentifier {
  teamCode: string;
  number: string;
  lastName: string;
  firstName: string;
}

export function ReceptionTable({ matches }: ReceptionTableProps) {
  // Create a map to store player reception stats using a composite key
  const playerStatsMap = new Map<string, PlayerReceptionStats & PlayerIdentifier>();

  // Process all matches to count receptions
  matches.forEach(match => {
    const lines = match.rawData;
    let isReadingScout = false;
    let currentHomeTeam = match.homeTeam;
    let currentAwayTeam = match.awayTeam;
    
    // Create player lookup maps for this match
    const homePlayerMap = new Map(match.homePlayers.map(p => [p.number.padStart(2, '0'), p]));
    const awayPlayerMap = new Map(match.awayPlayers.map(p => [p.number.padStart(2, '0'), p]));

    for (const line of lines) {
      if (line.startsWith('[3SCOUT]')) {
        isReadingScout = true;
        continue;
      } else if (line.startsWith('[3ENDSCOUT]')) {
        isReadingScout = false;
        continue;
      }

      if (isReadingScout && line.trim()) {
        if (line.length >= 6 && line[3] === 'R') {
          const playerKey = line.substring(0, 3);
          const playerNumber = playerKey.substring(1);
          const isHomeTeam = playerKey.startsWith('*');
          const team = isHomeTeam ? currentHomeTeam : currentAwayTeam;
          const player = isHomeTeam ? homePlayerMap.get(playerNumber) : awayPlayerMap.get(playerNumber);
          
          if (!player) continue;
          
          const compositeKey = `${team.code}-${player.lastName}-${player.firstName}`;
          const receptionValue = line[5] || '';
          
          const currentStats = playerStatsMap.get(compositeKey) || {
            teamCode: team.code,
            number: player.number,
            lastName: player.lastName,
            firstName: player.firstName,
            totalReceptions: 0,
            receptionMistakes: 0,
            negativeReceptions: 0,
            positiveReceptions: 0,
            jumpServeReceptions: 0,
            jumpServePositive: 0,
            jumpServeNegative: 0,
            jumpServeMistakes: 0,
            floatServeReceptions: 0,
            floatServePositive: 0,
            floatServeNegative: 0,
            floatServeMistakes: 0
          };
          
          // Count mistakes (=)
          const isMistake = receptionValue === '=';
          // Count negative receptions (/)
          const isNegative = receptionValue === '/';
          // Count positive receptions (# and +)
          const isPositive = ['#', '+'].includes(receptionValue);
          // Check serve type
          const isJumpServe = line[4] === 'Q';
          const isFloatServe = line[4] === 'M';
          
          const positiveCount = isPositive ? 1 : 0;
          const negativeCount = isNegative ? 1 : 0;
          const mistakeCount = isMistake ? 1 : 0;
          
          // Update serve type specific stats
          if (isJumpServe) {
            currentStats.jumpServeReceptions++;
            currentStats.jumpServePositive += positiveCount;
            currentStats.jumpServeNegative += negativeCount;
            currentStats.jumpServeMistakes += mistakeCount;
          } else if (isFloatServe) {
            currentStats.floatServeReceptions++;
            currentStats.floatServePositive += positiveCount;
            currentStats.floatServeNegative += negativeCount;
            currentStats.floatServeMistakes += mistakeCount;
          }
          
          playerStatsMap.set(compositeKey, {
            ...currentStats,
            totalReceptions: currentStats.totalReceptions + 1,
            receptionMistakes: currentStats.receptionMistakes + mistakeCount,
            negativeReceptions: currentStats.negativeReceptions + negativeCount,
            positiveReceptions: currentStats.positiveReceptions + positiveCount
          });
        }
      }
    }
  });

  // Get all unique players from all matches
  const allPlayers = matches.flatMap(match => [...match.homePlayers, ...match.awayPlayers]);
  const uniquePlayers = Array.from(new Map(allPlayers.map(player => 
    [`${player.team.code}-${player.lastName}-${player.firstName}`, player] 
  )).values());

  // Helper function to get player stats
  const getPlayerStats = (player: any): PlayerReceptionStats => {
    const compositeKey = `${player.team.code}-${player.lastName}-${player.firstName}`;
    const stats = playerStatsMap.get(compositeKey);
    return stats || {
      totalReceptions: 0,
      receptionMistakes: 0,
      negativeReceptions: 0,
      positiveReceptions: 0,
      jumpServeReceptions: 0,
      jumpServePositive: 0,
      jumpServeNegative: 0,
      jumpServeMistakes: 0,
      floatServeReceptions: 0,
      floatServePositive: 0,
      floatServeNegative: 0,
      floatServeMistakes: 0
    };
  };

  // Helper function to calculate percentage
  const calculatePercentage = (value: number, total: number): string => {
    if (total === 0) return '-';
    return `${((value / total) * 100).toFixed(1)}%`;
  };

  // Helper function to calculate reception efficiency
  const calculateEfficiency = (stats: PlayerReceptionStats): string => {
    if (stats.totalReceptions === 0) return '-';
    // Calculate efficiency: ((# + +) - (= + /)) / Tot * 100
    const positiveCount = stats.positiveReceptions;
    const negativeCount = stats.receptionMistakes + stats.negativeReceptions;
    const efficiency = ((positiveCount - negativeCount) / stats.totalReceptions) * 100;
    return `${efficiency.toFixed(1)}%`;
  };

  // Helper function to format serve reception stats
  const formatServeReceptionStats = (total: number, efficiency: number): string => {
    if (total === 0) return '-';
    return `${total} (${efficiency.toFixed(1)}%)`;
  };

  // Helper function to calculate serve type efficiency
  const calculateServeTypeEfficiency = (stats: {
    total: number,
    positive: number,
    negative: number,
    mistakes: number
  }): number => {
    if (stats.total === 0) return 0;
    return ((stats.positive - (stats.mistakes + stats.negative)) / stats.total) * 100;
  };

  return (
    <div className="overflow-x-auto">
      <h2 className="text-xl font-semibold text-gray-700 mb-4">Reception</h2>
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Player</th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Position</th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total Reception</th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Reception Efficiency %</th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Jump Reception (Eff)</th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Float Reception (Eff)</th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Reception Mistakes</th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Negative Reception</th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Positive Reception</th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {uniquePlayers
            .filter(player => player.role === 'Libero' || player.role === 'Outside Hitter' || player.role === 'Opposite')
            .map((player, index) => {
            const stats = getPlayerStats(player);
            
            // Only show players who have at least one reception
            if (stats.totalReceptions === 0) return null;
            
            return (
            <tr key={`${player.team.code}-${player.lastName}-${player.firstName}`} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="flex items-center">
                  <div>
                    <div className="text-sm font-medium text-gray-900">
                      {player.lastName} {player.firstName}
                    </div>
                    <div className="text-xs text-gray-500">
                      {player.team.name}
                    </div>
                  </div>
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{player.role}</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{stats.totalReceptions || '-'}</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{calculateEfficiency(stats)}</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {formatServeReceptionStats(
                  stats.jumpServeReceptions,
                  calculateServeTypeEfficiency({
                    total: stats.jumpServeReceptions,
                    positive: stats.jumpServePositive,
                    negative: stats.jumpServeNegative,
                    mistakes: stats.jumpServeMistakes
                  })
                )}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {formatServeReceptionStats(
                  stats.floatServeReceptions,
                  calculateServeTypeEfficiency({
                    total: stats.floatServeReceptions,
                    positive: stats.floatServePositive,
                    negative: stats.floatServeNegative,
                    mistakes: stats.floatServeMistakes
                  })
                )}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {stats.receptionMistakes ? `${stats.receptionMistakes} (${calculatePercentage(stats.receptionMistakes, stats.totalReceptions)})` : '-'}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {stats.negativeReceptions ? `${stats.negativeReceptions} (${calculatePercentage(stats.negativeReceptions, stats.totalReceptions)})` : '-'}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {stats.positiveReceptions ? `${stats.positiveReceptions} (${calculatePercentage(stats.positiveReceptions, stats.totalReceptions)})` : '-'}
              </td>
            </tr>
          )})}
        </tbody>
      </table>
    </div>
  );
}
