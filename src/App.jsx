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

    // winnaar check
    const winner = selected.find(p => newScores[p.id] >= targets[p.id]);
    if (winner) {
      setGames([...games, {
        players: selected,
        scores: newScores,
        winner,
        turns
      }]);
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

  return (
    <div style={{ padding: 20 }}>
      <h1>🎱 Carambole Pro</h1>

      <h2>Spelers</h2>
      <input value={newPlayer} onChange={e => setNewPlayer(e.target.value)} />
      <button onClick={addPlayer}>Toevoegen</button>

      {players.map(p => (
        <div key={p.id}>
          <button onClick={() => selectPlayer(p)}>{p.name}</button>
        </div>
      ))}

      {selected.length === 2 && !currentGame && (
        <div>
          <h2>Game setup</h2>
          {selected.map(p => (
            <div key={p.id}>
              {p.name}
              <input
                type="number"
                value={targets[p.id]}
                onChange={e => setTargets({ ...targets, [p.id]: Number(e.target.value) })}
              />
            </div>
          ))}
          <button onClick={startGame}>Start</button>
        </div>
      )}

      {currentGame && (
        <div>
          <h2>Match</h2>
          {selected.map(p => (
            <div key={p.id}>
              <b>{p.name}</b> — {scores[p.id]} / {targets[p.id]}
              | Moy: {(scores[p.id]/(turns||1)).toFixed(2)}
              | Serie: {series[p.id]?.best}
              <button onClick={() => updateScore(p.id, 1)}>+1</button>
              <button onClick={() => updateScore(p.id, -1)}>-1</button>
            </div>
          ))}

          <div>Beurten: {turns}</div>
          <button onClick={nextTurn}>Volgende beurt</button>
        </div>
      )}

      <h2>Historiek</h2>
      {games.map((g, i) => (
        <div key={i}>
          {g.players[0].name} vs {g.players[1].name} → 🏆 {g.winner.name}
        </div>
      ))}
    </div>
  );
}
