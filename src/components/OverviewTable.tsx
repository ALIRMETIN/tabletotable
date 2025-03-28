import React from 'react';
import { TeamSummary } from '../types';

interface OverviewTableProps {
  stats: TeamSummary[];
}

const formatPercentage = (value: number): string => {
  return `${value.toFixed(1)}%`;
};

const formatValueWithPercentage = (value: number, total: number): string => {
  const percentage = (value / total) * 100;
  return `${value} (${percentage.toFixed(1)}%)`;
};

const formatServeStats = (aces: number, serves: number): string => {
  const percentage = (aces / serves) * 100;
  return `${aces} (${percentage.toFixed(1)}%) [${serves} serves]`;
};

export function OverviewTable({ stats }: OverviewTableProps) {
  return (
    <div className="overflow-x-auto">
      <h2 className="text-xl font-semibold text-gray-700 mb-4">Overall</h2>
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Team</th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Matches</th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Won Matches</th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Lost Matches</th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Won Sets</th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Lost Sets</th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Points</th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Lost Points</th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Sideout Point %</th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Breakpoint Point %</th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Opponent Err %</th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Serve Point %</th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Serve Points per Set</th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Reception #,+ %</th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Attack Point %</th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Attack Points per Set</th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Block Point %</th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Block Points per Set</th>
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
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{formatValueWithPercentage(team.wins, team.matches)}</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{formatValueWithPercentage(team.matches - team.wins, team.matches)}</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{formatValueWithPercentage(team.wonSets, team.sets)}</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{formatValueWithPercentage(team.sets - team.wonSets, team.sets)}</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{formatValueWithPercentage(team.wonPoints, team.wonPoints + team.lostPoints)}</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{formatValueWithPercentage(team.lostPoints, team.wonPoints + team.lostPoints)}</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{formatPercentage(team.sideoutPercentage)}</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{formatPercentage(team.breakPercentage)}</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{formatPercentage(team.oppKillPercentage)}</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{team.serves}</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{(team.aces / team.sets).toFixed(2)}</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{formatPercentage(team.receptionPercentage)}</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{formatPercentage(team.killPercentage)}</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{(team.kills / team.sets).toFixed(2)}</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{formatPercentage(team.blockPercentage)}</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{(team.blocks / team.sets).toFixed(2)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
