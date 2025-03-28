import React from 'react';
import { MatchResult } from '../types';

interface PlayerServingStats {
  totalServes: number;
  serveMistakes: number;
  maxConsecutiveServes: number;
  negativeServes: number;
  positiveServes: number;
  servePoints: number;
  jumpServes: number;
  jumpServePoints: number;
  jumpServeMistakes: number;
  jumpServePositive: number;
  floatServes: number;
  floatServePoints: number;
  floatServeMistakes: number;
  floatServePositive: number;
}

interface ServingTableProps {
  matches: MatchResult[];
}

export function ServingTable({ matches }: ServingTableProps) {
  // Create a map to store player serving stats
  const playerStatsMap = new Map<string, PlayerServingStats>();

  // Process all matches to count serves
  matches.forEach(match => {
    const lines = match.rawData;
    let isReadingScout = false;
    
    // Track consecutive serves
    let currentServer = '';
    let consecutiveCount = 0;
    
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
        // Check if this is a serve action (4th character is 'S')
        if (line.length >= 6 && line[3] === 'S') {
          const playerKey = line.substring(0, 3);
          const playerNumber = playerKey.substring(1);
          const isHomeTeam = playerKey.startsWith('*');
          const player = isHomeTeam ? homePlayerMap.get(playerNumber) : awayPlayerMap.get(playerNumber);
          
          if (!player) continue;
          
          const compositeKey = `${player.team.code}-${player.lastName}-${player.firstName}`;
          const currentStats = playerStatsMap.get(compositeKey) || { 
            totalServes: 0, 
            serveMistakes: 0,
            maxConsecutiveServes: 0,
            negativeServes: 0,
            positiveServes: 0,
            servePoints: 0,
            jumpServes: 0,
            jumpServePoints: 0,
            jumpServeMistakes: 0,
            jumpServePositive: 0,
            floatServes: 0,
            floatServePoints: 0,
            floatServeMistakes: 0,
            floatServePositive: 0
          };
          
          // Check if this is a serve mistake (6th character is '=')
          const isServeMistake = line[5] === '=';
          // Check if this is a negative serve (6th character is '-')
          const isNegativeServe = line[5] === '-';
          // Check if this is a positive serve (6th character is '+' or '/')
          const isPositiveServe = line[5] === '+' || line[5] === '/';
          // Check if this is a serve point (6th character is '#')
          const isServePoint = line[5] === '#';
          // Check if this is a jump serve (5th character is 'Q')
          const isJumpServe = line[4] === 'Q';
          const isFloatServe = line[4] === 'M' || line[4] === 'H';
          
          // Update consecutive serves count
          if (playerKey === currentServer) {
            consecutiveCount++;
          } else {
            currentServer = playerKey;
            consecutiveCount = 1;
          }
          
          playerStatsMap.set(compositeKey, {
            ...currentStats,
            totalServes: currentStats.totalServes + 1,
            maxConsecutiveServes: Math.max(currentStats.maxConsecutiveServes, consecutiveCount),
            serveMistakes: currentStats.serveMistakes + (isServeMistake ? 1 : 0),
            negativeServes: currentStats.negativeServes + (isNegativeServe ? 1 : 0),
            positiveServes: currentStats.positiveServes + (isPositiveServe ? 1 : 0),
            servePoints: currentStats.servePoints + (isServePoint ? 1 : 0),
            jumpServes: currentStats.jumpServes + (isJumpServe ? 1 : 0),
            jumpServePoints: currentStats.jumpServePoints + (isJumpServe && isServePoint ? 1 : 0),
            jumpServeMistakes: currentStats.jumpServeMistakes + (isJumpServe && isServeMistake ? 1 : 0),
            jumpServePositive: currentStats.jumpServePositive + (isJumpServe && isPositiveServe ? 1 : 0),
            floatServes: currentStats.floatServes + (isFloatServe ? 1 : 0),
            floatServePoints: currentStats.floatServePoints + (isFloatServe && isServePoint ? 1 : 0),
            floatServeMistakes: currentStats.floatServeMistakes + (isFloatServe && isServeMistake ? 1 : 0),
            floatServePositive: currentStats.floatServePositive + (isFloatServe && isPositiveServe ? 1 : 0)
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
  const getPlayerStats = (player: any): PlayerServingStats => {
    const compositeKey = `${player.team.code}-${player.lastName}-${player.firstName}`;
    return playerStatsMap.get(compositeKey) || { 
      totalServes: 0, 
      serveMistakes: 0, 
      maxConsecutiveServes: 0,
      negativeServes: 0, 
      positiveServes: 0,
      servePoints: 0,
      jumpServes: 0,
      jumpServePoints: 0,
      jumpServeMistakes: 0,
      servePoints: 0,
      floatServes: 0,
      floatServePoints: 0,
      floatServeMistakes: 0,
      floatServePositive: 0
    };
  };

  // Helper function to calculate jump serve efficiency using the formula ((#+/) - (=)) / Tot
  const calculateJumpServeEfficiency = (stats: PlayerServingStats): number => {
    if (stats.jumpServes === 0) return 0;
    return ((stats.jumpServePoints + stats.jumpServePositive - stats.jumpServeMistakes) / stats.jumpServes) * 100;
  };

  // Helper function to calculate float serve efficiency using the formula ((#+/) - (=)) / Tot
  const calculateFloatServeEfficiency = (stats: PlayerServingStats): number => {
    if (stats.floatServes === 0) return 0;
    return ((stats.floatServePoints + stats.floatServePositive - stats.floatServeMistakes) / stats.floatServes) * 100;
  };

  // Helper function to format mistakes with percentage
  const formatMistakes = (stats: PlayerServingStats): string => {
    if (stats.totalServes === 0) return '-';
    const percentage = (stats.serveMistakes / stats.totalServes * 100).toFixed(1);
    return `${stats.serveMistakes} (${percentage}%)`;
  };

  return (
    <div className="overflow-x-auto">
      <h2 className="text-xl font-semibold text-gray-700 mb-4">Serving</h2>
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Player</th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Player Role</th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total Serve</th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Jump Serve (Eff)</th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Float Serve (Eff)</th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Max in A Row</th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Serve Efficiency %</th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Serve Mistakes</th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Serve Mistakes per Set</th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Positive Serve</th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Negative Serve</th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Serve Point</th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Serve Point per Set</th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {uniquePlayers
            .filter(player => {
              const stats = getPlayerStats(player);
              return stats.totalServes > 0;
            })
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
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{getPlayerStats(player).totalServes || '-'}</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {(() => {
                  const stats = getPlayerStats(player);
                  if (stats.jumpServes === 0) return '-';
                  const efficiency = calculateJumpServeEfficiency(stats);
                  return `${stats.jumpServes} (${efficiency.toFixed(1)}%)`;
                })()}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {(() => {
                  const stats = getPlayerStats(player);
                  if (stats.floatServes === 0) return '-';
                  const efficiency = calculateFloatServeEfficiency(stats);
                  return `${stats.floatServes} (${efficiency.toFixed(1)}%)`;
                })()}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{getPlayerStats(player).maxConsecutiveServes || '-'}</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {(() => {
                  const stats = getPlayerStats(player);
                  if (stats.totalServes === 0) return '-';
                  const efficiency = ((stats.servePoints + stats.positiveServes - stats.serveMistakes) / stats.totalServes) * 100;
                  return `${efficiency.toFixed(1)}%`;
                })()}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {(() => {
                  const stats = getPlayerStats(player);
                  if (stats.totalServes === 0) return '-';
                  const percentage = ((stats.serveMistakes / stats.totalServes) * 100).toFixed(1);
                  return `${stats.serveMistakes} (${percentage}%)`;
                })()}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {(() => {
                  const stats = getPlayerStats(player);
                  if (stats.totalServes === 0 || !player.playedSets) return '-';
                  return (stats.serveMistakes / player.playedSets).toFixed(2);
                })()}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {(() => {
                  const stats = getPlayerStats(player);
                  if (stats.totalServes === 0) return '-';
                  const percentage = ((stats.positiveServes / stats.totalServes) * 100).toFixed(1);
                  return `${stats.positiveServes} (${percentage}%)`;
                })()}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {(() => {
                  const stats = getPlayerStats(player);
                  if (stats.totalServes === 0) return '-';
                  const percentage = ((stats.negativeServes / stats.totalServes) * 100).toFixed(1);
                  return `${stats.negativeServes} (${percentage}%)`;
                })()}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {(() => {
                  const stats = getPlayerStats(player);
                  if (stats.totalServes === 0) return '-';
                  const percentage = ((stats.servePoints / stats.totalServes) * 100).toFixed(1);
                  return `${stats.servePoints} (${percentage}%)`;
                })()}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {(() => {
                  const stats = getPlayerStats(player);
                  if (stats.totalServes === 0 || !player.playedSets) return '-';
                  return (stats.servePoints / player.playedSets).toFixed(2);
                })()}
              </td>
            </tr>
            ))}
        </tbody>
      </table>
    </div>
  );
}
