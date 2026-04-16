import React, { useState, useEffect } from "react";

export default function App() {
  const [players, setPlayers] = useState(() => JSON.parse(localStorage.getItem("players")) || []);
  const [games, setGames] = useState(() => JSON.parse(localStorage.getItem("games")) || []);
  const [newPlayer, setNewPlayer] = useState("");
  const [selected, setSelected] = useState([]);
  const [scores, setScores] = useState({});
  const [targets, setTargets] = useState({});
  const [turns, setTurns] = useState(0);
  const [series, setSeries] = useState({});
  const [currentGame, setCurrentGame] = useState(false);

  useEffect(() => localStorage.setItem("players", JSON.stringify(players)), [players]);
  useEffect(() => localStorage.setItem("games", JSON.stringify(games)), [games]);

  const addPlayer = () => {
    if (!newPlayer) return;
    setPlayers([...players, { name: newPlayer, id: Date.now() }]);
    setNewPlayer("");
  };

  const selectPlayer = (p) => {
    if (selected.find(x => x.id === p.id)) {
      setSelected(selected.filter(x => x.id !== p.id));
    } else if (selected.length < 2) {
      setSelected([...selected, p]);
      setTargets({ ...targets, [p.id]: 30 });
    }
  };

  const startGame = () => {
    const initScores = {};
    const initSeries = {};
    selected.forEach(p => {
      initScores[p.id] = 0;
      initSeries[p.id] = { current: 0, best: 0 };
    });

    setScores(initScores);
    setSeries(initSeries);
    setTurns(0);
    setCurrentGame(true);
  };

  const updateScore = (id, val) => {
    const newScore = scores[id] + val;

    setSeries(prev => {
      const curr = val > 0 ? prev[id].current + val : 0;
      return {
        ...prev,
        [id]: {
          current: curr,
          best: Math.max(curr, prev[id].best)
        }
      };
    });

    const newScores = { ...scores, [id]: newScore };
    setScores(newScores);

    const winner = selected.find(p => newScores[p.id] >= targets[p.id]);
    if (winner) {
      const newGame = {
        players: selected,
        scores: newScores,
        winner,
        turns,
        moyenne: Object.fromEntries(
          selected.map(p => [p.id, (newScores[p.id] / (turns || 1)).toFixed(2)])
        ),
        series
      };

      setGames([...games, newGame]);
      setCurrentGame(false);
      alert(`🏆 ${winner.name} wint!`);
    }
  };

  const nextTurn = () => {
    setTurns(turns + 1);
    setSeries(prev =>
      Object.fromEntries(
        Object.entries(prev).map(([k, v]) => [k, { ...v, current: 0 }])
      )
    );
  };

  // 📊 Stats
  const getStats = (player) => {
    const played = games.filter(g => g.players.find(p => p.id === player.id));
    const wins = played.filter(g => g.winner.id === player.id);

    const avg = played.length
      ? (played.reduce((sum, g) => sum + Number(g.moyenne[player.id] || 0), 0) / played.length).toFixed(2)
      : 0;

    const bestSeries = Math.max(0, ...played.map(g => g.series?.[player.id]?.best || 0));

    return { played: played.length, wins: wins.length, avg, bestSeries };
  };

  const ranking = [...players]
    .map(p => {
      const s = getStats(p);
      return { name: p.name, ...s, rate: s.played ? (s.wins / s.played) : 0 };
    })
    .sort((a, b) => b.rate - a.rate);

  const getHeadToHead = (p1, p2) => {
    const matches = games.filter(g =>
      g.players.find(p => p.id === p1.id) &&
      g.players.find(p => p.id === p2.id)
    );

    return {
      p1: matches.filter(g => g.winner.id === p1.id).length,
      p2: matches.filter(g => g.winner.id === p2.id).length
    };
  };

  return (
    <div style={{ padding: 20 }}>
      <h1>🎱 Carambole Pro</h1>

      <h2>Spelers</h2>
      <input value={newPlayer} onChange={e => setNewPlayer(e.target.value)} />
      <button onClick={addPlayer}>Toevoegen</button>

      {players.map(p => {
        const s = getStats(p);
        return (
          <div key={p.id}>
            {p.name} | 🎯 {s.played} | 🏆 {s.wins} | Moy {s.avg} | 🔥 {s.bestSeries}
          </div>
        );
      })}

      <h2>Ranking</h2>
      {ranking.map((r, i) => (
        <div key={i}>
          #{i + 1} {r.name}
        </div>
      ))}

      <h2>Onderlinge stats</h2>
      {players.map((p1, i) =>
        players.slice(i + 1).map(p2 => {
          const h = getHeadToHead(p1, p2);
          return (
            <div key={p1.id + p2.id}>
              {p1.name} vs {p2.name} → {h.p1} - {h.p2}
            </div>
          );
        })
      )}
    </div>
  );
}
