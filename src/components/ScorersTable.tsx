import React from 'react';
import { MatchResult, Player } from '../types';

interface ScorersTableProps {
  matches: MatchResult[];
}

export function ScorersTable({ matches }: ScorersTableProps) {
  // Create a map to store player stats
  const playerStatsMap = new Map<string, Player & { 
    totalPlayedSets: number;
    totalServePoints: number;
    totalAttackPoints: number;
    totalBlockPoints: number;
  }>();

  // Process all matches and accumulate stats for each player
  matches.forEach(match => {
    [...match.homePlayers, ...match.awayPlayers]
      .filter(player => player.role !== 'Libero')
      .forEach(player => {
      const playerKey = `${player.team.code}-${player.lastName}-${player.firstName}`;
      const existingPlayer = playerStatsMap.get(playerKey);

      if (existingPlayer) {
        // Add played sets from this match to existing total
        existingPlayer.totalPlayedSets += player.playedSets;
        existingPlayer.totalServePoints += player.servePoints;
        existingPlayer.totalAttackPoints += player.attackPoints;
        existingPlayer.totalBlockPoints += player.blockPoints;
      } else {
        // Create new player entry with initial played sets
        playerStatsMap.set(playerKey, {
          ...player,
          totalPlayedSets: player.playedSets,
          totalServePoints: player.servePoints,
          totalAttackPoints: player.attackPoints,
          totalBlockPoints: player.blockPoints
        });
      }
    });
  });

  // Convert map to array for rendering
  const uniquePlayers = Array.from(playerStatsMap.values());

  return (
    <div className="overflow-x-auto">
      <h2 className="text-xl font-semibold text-gray-700 mb-4">Scorers</h2>
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Player</th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Player Role</th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Played Sets</th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total Points</th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Points per Set</th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Serve Points</th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Serve Points per Set</th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Attack Points</th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Attack Point per Set</th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Block Points</th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Block Point per Set</th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {uniquePlayers
            .filter(player => player.totalPlayedSets > 0)
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
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{player.totalPlayedSets}</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {player.totalServePoints + player.totalAttackPoints + player.totalBlockPoints}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {player.totalPlayedSets > 0 ? 
                  ((player.totalServePoints + player.totalAttackPoints + player.totalBlockPoints) / player.totalPlayedSets).toFixed(2) 
                  : '0.00'}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{player.totalServePoints}</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {player.totalPlayedSets > 0 ? (player.totalServePoints / player.totalPlayedSets).toFixed(2) : '0.00'}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{player.totalAttackPoints}</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {player.totalPlayedSets > 0 ? (player.totalAttackPoints / player.totalPlayedSets).toFixed(2) : '0.00'}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{player.totalBlockPoints}</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {player.totalPlayedSets > 0 ? (player.totalBlockPoints / player.totalPlayedSets).toFixed(2) : '0.00'}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
