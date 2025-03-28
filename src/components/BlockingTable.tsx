import React from 'react';
import { MatchResult } from '../types';

interface PlayerBlockStats {
  totalBlocks: number;
  blockPoints: number;
  blockMistakes: number;
  blockPositive: number;
  blockNegative: number;
}

interface BlockingTableProps {
  matches: MatchResult[];
}

export function BlockingTable({ matches }: BlockingTableProps) {
  // Create a map to store player block stats
  const playerStatsMap = new Map<string, PlayerBlockStats>();

  // Process all matches to count blocks
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
        // Check if this is a block action (4th character is 'B')
        if (line.length >= 4 && line[3] === 'B') {
          const playerKey = line.substring(0, 3);
          const playerNumber = playerKey.substring(1);
          const isHomeTeam = playerKey.startsWith('*');
          const player = isHomeTeam ? homePlayerMap.get(playerNumber) : awayPlayerMap.get(playerNumber);
          
          if (!player) continue;
          
          const compositeKey = `${player.team.code}-${player.lastName}-${player.firstName}`;
          const currentStats = playerStatsMap.get(compositeKey) || { 
            totalBlocks: 0,
            blockPoints: 0,
            blockMistakes: 0,
            blockPositive: 0,
            blockNegative: 0
          };
          
          // Check block result (6th character for T= and T/)
          const isPoint = line[5] === '#'; 
          const isMistake = line[5] === '=' || line[5] === '/';
          const isNegative = line[5] === '-' || line[5] === '!';
          const isPositive = line[5] === '!';
          
          playerStatsMap.set(compositeKey, {
            ...currentStats,
            totalBlocks: currentStats.totalBlocks + 1,
            blockPoints: currentStats.blockPoints + (isPoint ? 1 : 0),
            blockMistakes: currentStats.blockMistakes + (isMistake ? 1 : 0),
            blockPositive: currentStats.blockPositive + (isPositive ? 1 : 0),
            blockNegative: currentStats.blockNegative + (isNegative ? 1 : 0)
          });
        }
      }
    }
  });

  const allPlayers = matches.flatMap(match => 
    [...match.homePlayers, ...match.awayPlayers].filter(player => player.role !== 'Libero')
  );
  const uniquePlayers = Array.from(new Map(allPlayers.map(player => 
    [`${player.team.code}-${player.lastName}-${player.firstName}`, player]
  )).values());

  // Helper function to get player stats
  const getPlayerStats = (player: any): PlayerBlockStats => {
    const compositeKey = `${player.team.code}-${player.lastName}-${player.firstName}`;
    return playerStatsMap.get(compositeKey) || { 
      totalBlocks: 0,
      blockPoints: 0,
      blockMistakes: 0,
      blockPositive: 0,
      blockNegative: 0
    };
  };

  // Helper function to calculate block efficiency using the formula ((#+!) - (/=)) / Tot
  const calculateBlockEfficiency = (stats: PlayerBlockStats): string => {
    if (stats.totalBlocks === 0) return '-';
    const efficiency = ((stats.blockPoints + stats.blockPositive - (stats.blockMistakes + stats.blockNegative)) / stats.totalBlocks) * 100;
    return `${efficiency.toFixed(1)}%`;
  };

  // Helper functions to format stats with percentages
  const formatWithPercentage = (value: number, total: number): string => {
    if (total === 0) return '-';
    const percentage = (value / total * 100).toFixed(1);
    return `${value} (${percentage}%)`;
  };

  return (
    <div className="overflow-x-auto">
      <h2 className="text-xl font-semibold text-gray-700 mb-4">Blocking</h2>
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Player</th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Player Role</th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total Block</th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Block Efficiency %</th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Block Mistakes</th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Negative Block</th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Positive Block</th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Block Point</th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {uniquePlayers.map((player, index) => (
            getPlayerStats(player).totalBlocks > 0 && (
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
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{getPlayerStats(player).totalBlocks || '-'}</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{calculateBlockEfficiency(getPlayerStats(player))}</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {formatWithPercentage(getPlayerStats(player).blockMistakes, getPlayerStats(player).totalBlocks)}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {formatWithPercentage(getPlayerStats(player).blockNegative, getPlayerStats(player).totalBlocks)}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {formatWithPercentage(getPlayerStats(player).blockPositive, getPlayerStats(player).totalBlocks)}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {formatWithPercentage(getPlayerStats(player).blockPoints, getPlayerStats(player).totalBlocks)}
              </td>
            </tr>)
          ))}
        </tbody>
      </table>
    </div>
  );
}
