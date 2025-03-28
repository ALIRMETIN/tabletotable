import React from 'react';
import { MatchResult } from '../types';

interface PlayerAttackStats {
  totalAttacks: number;
  attackPoints: number;
  attackMistakes: number;
  attackBlocked: number;
  negativeAttacks: number;
  positiveAttacks: number;
}

interface AttackingTableProps {
  matches: MatchResult[];
}

export function AttackingTable({ matches }: AttackingTableProps) {
  // Create a map to store player attack stats
  const playerStatsMap = new Map<string, PlayerAttackStats>();

  // Process all matches to count attacks
  matches.forEach(match => {
    const lines = match.rawData;
    let isReadingScout = false;
    
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
        // Check if this is an attack action (4th character is 'A')
        if (line.length >= 6 && line[3] === 'A') {
          const playerKey = line.substring(0, 3);
          const playerNumber = playerKey.substring(1);
          const isHomeTeam = playerKey.startsWith('*');
          const player = isHomeTeam ? homePlayerMap.get(playerNumber) : awayPlayerMap.get(playerNumber);
          
          if (!player) continue;
          
          const compositeKey = `${player.team.code}-${player.lastName}-${player.firstName}`;
          const currentStats = playerStatsMap.get(compositeKey) || { 
            totalAttacks: 0,
            attackPoints: 0,
            attackMistakes: 0,
            attackBlocked: 0,
            negativeAttacks: 0,
            positiveAttacks: 0
          };
          
          // Check attack result
          const isPoint = line[5] === '#';
          const isMistake = line[5] === '=';
          const isBlocked = line[5] === '/';
          const isNegative = line[5] === '-' || line[5] === '!';
          const isPositive = line[5] === '+';
          
          playerStatsMap.set(compositeKey, {
            ...currentStats,
            totalAttacks: currentStats.totalAttacks + 1,
            attackPoints: currentStats.attackPoints + (isPoint ? 1 : 0),
            attackMistakes: currentStats.attackMistakes + (isMistake ? 1 : 0),
            attackBlocked: currentStats.attackBlocked + (isBlocked ? 1 : 0),
            negativeAttacks: currentStats.negativeAttacks + (isNegative ? 1 : 0),
            positiveAttacks: currentStats.positiveAttacks + (isPositive ? 1 : 0)
          });
        }
      }
    }
  });

  // Get all unique players from all matches
  const allPlayers = matches.flatMap(match => 
    [...match.homePlayers, ...match.awayPlayers].filter(player => player.role !== 'Libero')
  );
  const uniquePlayers = Array.from(new Map(allPlayers.map(player => 
    [`${player.team.code}-${player.lastName}-${player.firstName}`, player]
  )).values());

  // Helper function to get player stats
  const getPlayerStats = (player: any): PlayerAttackStats => {
    const compositeKey = `${player.team.code}-${player.lastName}-${player.firstName}`;
    return playerStatsMap.get(compositeKey) || { 
      totalAttacks: 0,
      attackPoints: 0,
      attackMistakes: 0,
      attackBlocked: 0,
      negativeAttacks: 0,
      positiveAttacks: 0
    };
  };

  // Helper function to calculate attack efficiency
  const calculateAttackEfficiency = (stats: PlayerAttackStats): string => {
    if (stats.totalAttacks === 0) return '-';
    const efficiency = ((stats.attackPoints - (stats.attackBlocked + stats.attackMistakes)) / stats.totalAttacks) * 100;
    return `${efficiency.toFixed(1)}%`;
  };

  // Helper function to format mistakes with percentage
  const formatMistakes = (stats: PlayerAttackStats): string => {
    if (stats.totalAttacks === 0) return '-';
    const percentage = (stats.attackMistakes / stats.totalAttacks * 100).toFixed(1);
    return `${stats.attackMistakes} (${percentage}%)`;
  };

  // Helper function to format blocked attacks with percentage
  const formatBlocked = (stats: PlayerAttackStats): string => {
    if (stats.totalAttacks === 0) return '-';
    const percentage = (stats.attackBlocked / stats.totalAttacks * 100).toFixed(1);
    return `${stats.attackBlocked} (${percentage}%)`;
  };

  // Helper function to format negative attacks with percentage
  const formatNegative = (stats: PlayerAttackStats): string => {
    if (stats.totalAttacks === 0) return '-';
    const percentage = (stats.negativeAttacks / stats.totalAttacks * 100).toFixed(1);
    return `${stats.negativeAttacks} (${percentage}%)`;
  };

  // Helper function to format positive attacks with percentage
  const formatPositive = (stats: PlayerAttackStats): string => {
    if (stats.totalAttacks === 0) return '-';
    const percentage = (stats.positiveAttacks / stats.totalAttacks * 100).toFixed(1);
    return `${stats.positiveAttacks} (${percentage}%)`;
  };

  // Helper function to format attack points with percentage
  const formatPoints = (stats: PlayerAttackStats): string => {
    if (stats.totalAttacks === 0) return '-';
    const percentage = (stats.attackPoints / stats.totalAttacks * 100).toFixed(1);
    return `${stats.attackPoints} (${percentage}%)`;
  };

  return (
    <div className="overflow-x-auto">
      <h2 className="text-xl font-semibold text-gray-700 mb-4">Attacking</h2>
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Player</th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Player Role</th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total Attack</th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Attack Efficiency %</th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Attack Mistakes</th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Attack Mistakes per Set</th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Attack Blocked</th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Attack Blocked per Set</th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Negative Attack</th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Positive Attack</th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Attack Point</th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Attack Point per Set</th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {uniquePlayers
            .filter(player => getPlayerStats(player).totalAttacks > 0)
            .map((player, index) => (
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
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{getPlayerStats(player).totalAttacks || '-'}</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{calculateAttackEfficiency(getPlayerStats(player))}</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{formatMistakes(getPlayerStats(player))}</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {(() => {
                  const stats = getPlayerStats(player);
                  if (stats.totalAttacks === 0 || !player.playedSets) return '-';
                  return (stats.attackMistakes / player.playedSets).toFixed(2);
                })()}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{formatBlocked(getPlayerStats(player))}</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {(() => {
                  const stats = getPlayerStats(player);
                  if (stats.totalAttacks === 0 || !player.playedSets) return '-';
                  return (stats.attackBlocked / player.playedSets).toFixed(2);
                })()}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{formatNegative(getPlayerStats(player))}</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{formatPositive(getPlayerStats(player))}</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{formatPoints(getPlayerStats(player))}</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {(() => {
                  const stats = getPlayerStats(player);
                  if (stats.totalAttacks === 0 || !player.playedSets) return '-';
                  return (stats.attackPoints / player.playedSets).toFixed(2);
                })()}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
