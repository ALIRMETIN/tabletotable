import React from 'react';
import { TeamSummary } from '../types';

interface StatsTableProps {
  stats: TeamSummary[];
}

const formatPercentage = (value: number): string => {
  return value.toFixed(1) + '%';
};

export function StatsTable({ stats }: StatsTableProps) {
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Team</th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Matches</th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Win %</th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Points Ratio</th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Break %</th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ace %</th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Sideout %</th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Reception %</th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Kill %</th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Opp Kill %</th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Block %</th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">CAR %</th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {stats.map((team, index) => (
            <tr key={team.team.code} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="flex items-center">
                  <div>
                    <div className="text-sm font-medium text-gray-900">{team.team.name}</div>
                    <div className="text-sm text-gray-500">{team.team.code}</div>
                  </div>
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{team.matches}</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{formatPercentage(team.winPercentage)}</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{formatPercentage(team.pointsRatio)}</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{formatPercentage(team.breakPercentage)}</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{formatPercentage(team.acePercentage)}</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{formatPercentage(team.sideoutPercentage)}</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{formatPercentage(team.receptionPercentage)}</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{formatPercentage(team.killPercentage)}</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{formatPercentage(team.oppKillPercentage)}</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{formatPercentage(team.blockPercentage)}</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{formatPercentage(team.carPercentage)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
