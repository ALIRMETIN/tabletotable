import React, { useState, useRef } from 'react';
import { FileUp, Download, Trophy, Table, Trash2, Award, Zap, Shield, Swords, Target } from 'lucide-react';
import { utils, writeFile } from 'xlsx';
import { ParsedData, MatchResult, TabType } from './types';
import { parseFiles } from './utils/parseFile';
import { OverviewTable } from './components/OverviewTable';
import { ScorersTable } from './components/ScorersTable';
import { ServingTable } from './components/ServingTable';
import { ReceptionTable } from './components/ReceptionTable';
import { AttackingTable } from './components/AttackingTable';
import { BlockingTable } from './components/BlockingTable';

function App() {
  const [parsedData, setParsedData] = useState<ParsedData | null>(null);
  const [activeTab, setActiveTab] = useState<TabType>('matches');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;
    console.log('Files selected:', files.length);

    try {
      const data = await parseFiles(files);
      console.log('Parsed data:', data);
      setParsedData(data);
    } catch (error) {
      console.error('Error parsing files:', error);
      alert('Error parsing files. Please make sure they are valid DVW files.');
    }
  };

  const clearFiles = () => {
    setParsedData(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const exportToExcel = () => {
    if (!parsedData) return;

    const wb = utils.book_new();

    // Maç Sonuçları Sayfası
    const matchData = parsedData.matches.map((match, index) => ({
      'Match Number': index + 1,
      'Home Team': match.homeTeam.name,
      'Away Team': match.awayTeam.name,
      'Winner': match.isWin ? match.homeTeam.name : match.awayTeam.name,
      'Final Score': `${match.sets.filter(s => s.isWin).length}-${match.sets.filter(s => !s.isWin).length}`,
      'Set Scores': match.sets.map(s => s.score).join(', ')
    }));
    const matchSheet = utils.json_to_sheet(matchData);
    utils.book_append_sheet(wb, matchSheet, 'Match Results');

    // Genel İstatistikler Sayfası
    const overviewData = parsedData.teamStats.map(team => ({
      'Team': team.team.name,
      'Matches': team.matches,
      'Won Matches': team.wins,
      'Lost Matches': team.matches - team.wins,
      'Won Sets': team.wonSets,
      'Lost Sets': team.sets - team.wonSets,
      'Won Points': team.wonPoints,
      'Lost Points': team.lostPoints,
      'Points in Sideout %': team.sideoutPercentage.toFixed(1),
      'Points in Breakpoint %': team.breakPercentage.toFixed(1),
      'Opponent Errors %': team.oppKillPercentage.toFixed(1),
      'Serve Points %': team.acePercentage.toFixed(1),
      'Reception #,+ %': team.receptionPercentage.toFixed(1),
      'Attack Points %': team.killPercentage.toFixed(1),
      'Block Points %': team.blockPercentage.toFixed(1)
    }));
    const overviewSheet = utils.json_to_sheet(overviewData);
    utils.book_append_sheet(wb, overviewSheet, 'Overview');

    // Sayı Kazananlar Sayfası
    const scorersData = parsedData.matches.flatMap(match => {
      const players = [...match.homePlayers, ...match.awayPlayers];
      return players.map(player => ({
        'Player': `${player.lastName} ${player.firstName}` || '-',
        'Team': player.team.name || '-',
        'Role': player.role || '-',
        'Played Sets': player.playedSets || '-',
        'Total Points': (player.servePoints + player.attackPoints + player.blockPoints) || '-',
        'Points per Set': player.playedSets ? ((player.servePoints + player.attackPoints + player.blockPoints) / player.playedSets).toFixed(2) : '-',
        'Serve Points': player.servePoints || '-',
        'Serve Points per Set': player.playedSets ? (player.servePoints / player.playedSets).toFixed(2) : '-',
        'Attack Points': player.attackPoints || '-',
        'Attack Points per Set': player.playedSets ? (player.attackPoints / player.playedSets).toFixed(2) : '-',
        'Block Points': player.blockPoints || '-',
        'Block Points per Set': player.playedSets ? (player.blockPoints / player.playedSets).toFixed(2) : '-'
      }));
    });
    const scorersSheet = utils.json_to_sheet(scorersData);
    utils.book_append_sheet(wb, scorersSheet, 'Scorers');

    // Diğer sayfalar için boş veri şablonu
    const emptyRow = {
      'Player': '-',
      'Team': '-',
      'Role': '-',
      'Total': '-',
      'Efficiency %': '-',
      'Mistakes': '-',
      'Mistakes %': '-',
      'Negative': '-',
      'Negative %': '-',
      'Positive': '-',
      'Positive %': '-',
      'Points': '-',
      'Points %': '-'
    };
    const placeholderData = [emptyRow];

    const servingSheet = utils.json_to_sheet(placeholderData);
    const attackingSheet = utils.json_to_sheet(placeholderData);
    const blockingSheet = utils.json_to_sheet(placeholderData);
    const receptionSheet = utils.json_to_sheet(placeholderData);

    utils.book_append_sheet(wb, servingSheet, 'Serving');
    utils.book_append_sheet(wb, attackingSheet, 'Attacking');
    utils.book_append_sheet(wb, blockingSheet, 'Blocking');
    utils.book_append_sheet(wb, receptionSheet, 'Reception');

    writeFile(wb, 'volleyball_analysis.xlsx');
  };

  const renderMatchResult = (match: MatchResult, index: number) => {
    const homeSetWins = match.sets.filter(s => s.isWin).length;
    const awaySetWins = match.sets.filter(s => !s.isWin).length;
    const winner = match.isWin ? match.homeTeam : match.awayTeam;

    return (
      <div key={index} className="bg-gray-50 p-6 rounded-lg mb-4">
        <div className="flex justify-between items-center">
          <div className={`text-center flex-1 ${match.isWin ? 'text-indigo-600' : ''}`}>
            <p className="text-lg font-semibold">{match.homeTeam.name}</p>
            <p className="text-sm text-gray-500">({match.homeTeam.code})</p>
          </div>
          <div className="text-center px-4">
            <p className="text-2xl font-bold text-indigo-600">
              {homeSetWins}-{awaySetWins}
            </p>
            <p className="text-sm text-gray-500">Best of 5</p>
          </div>
          <div className={`text-center flex-1 ${!match.isWin ? 'text-indigo-600' : ''}`}>
            <p className="text-lg font-semibold">{match.awayTeam.name}</p>
            <p className="text-sm text-gray-500">({match.awayTeam.code})</p>
          </div>
        </div>
        <div className="mt-4 text-center">
          <div className="bg-indigo-50 rounded-lg p-3 inline-block">
            <Trophy className="w-5 h-5 text-indigo-600 inline-block mr-2" />
            <span className="font-medium text-indigo-600">
              Winner: {winner.name}
            </span>
          </div>
          <div className="mt-3 space-x-2">
            {match.sets.map((set, idx) => (
              <span
                key={idx}
                className={`inline-block px-3 py-1 rounded-full text-sm ${
                  set.isWin === match.isWin
                    ? 'bg-green-100 text-green-700'
                    : 'bg-red-100 text-red-700'
                }`}
              >
                {set.score}
              </span>
            ))}
          </div>
        </div>
      </div>
    );
  };

  const tabs = [
    { id: 'matches', label: 'Match Results', icon: Trophy },
    { id: 'overview', label: 'Overview', icon: Table },
    { id: 'scorers', label: 'Scorers', icon: Award },
    { id: 'serving', label: 'Serving', icon: Zap },
    { id: 'reception', label: 'Reception', icon: Shield },
    { id: 'attacking', label: 'Attacking', icon: Swords },
    { id: 'blocking', label: 'Blocking', icon: Target }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="bg-white rounded-xl shadow-lg p-8">
          <div className="flex items-center justify-center mb-8">
            <Trophy className="w-8 h-8 text-indigo-600 mr-3" />
            <h1 className="text-3xl font-bold text-gray-800">volleyscouting.com</h1>
          </div>

          <div className="space-y-6">
            {/* File Upload Section */}
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileUpload}
                accept=".dvw"
                multiple
                className="hidden"
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
              >
                <FileUp className="w-5 h-5 mr-2" />
                Upload DVW Files
              </button>
              <p className="mt-2 text-sm text-gray-500">You can select multiple DVW files</p>
            </div>

            {/* Content */}
            {parsedData && parsedData.matches.length > 0 && (
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <div className="flex space-x-2 overflow-x-auto pb-2">
                    {tabs.map(({ id, label, icon: Icon }) => (
                      <button
                        key={id}
                        onClick={() => setActiveTab(id as TabType)}
                        className={`px-4 py-2 rounded-lg whitespace-nowrap ${
                          activeTab === id
                            ? 'bg-indigo-100 text-indigo-700'
                            : 'text-gray-600 hover:bg-gray-100'
                        }`}
                      >
                        <Icon className="w-5 h-5 inline-block mr-2" />
                        {label}
                      </button>
                    ))}
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={exportToExcel}
                      className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                    >
                      <Download className="w-5 h-5 mr-2" />
                      Export All Data
                    </button>
                    <button
                      onClick={clearFiles}
                      className="inline-flex items-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                    >
                      <Trash2 className="w-5 h-5 mr-2" />
                      Clear DVW Files
                    </button>
                  </div>
                </div>

                <div className="space-y-4">
                  {activeTab === 'matches' && (
                    <>
                      <h2 className="text-xl font-semibold text-gray-700">
                        Match Results ({parsedData.matches.length} matches)
                      </h2>
                      <div className="space-y-4">
                        {parsedData.matches.map((match, index) => renderMatchResult(match, index))}
                      </div>
                    </>
                  )}
                  {activeTab === 'overview' && <OverviewTable stats={parsedData.teamStats} />}
                  {activeTab === 'scorers' && <ScorersTable matches={parsedData.matches} />}
                  {activeTab === 'serving' && <ServingTable matches={parsedData.matches} />}
                  {activeTab === 'reception' && <ReceptionTable matches={parsedData.matches} />}
                  {activeTab === 'attacking' && <AttackingTable matches={parsedData.matches} />}
                  {activeTab === 'blocking' && <BlockingTable matches={parsedData.matches} />}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
