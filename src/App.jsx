import React, { useState, useEffect } from "react";

export default function App() {
  const [players, setPlayers] = useState(() => JSON.parse(localStorage.getItem("players")) || []);
  const [newPlayer, setNewPlayer] = useState("");
  const [selected, setSelected] = useState([]);
  const [scores, setScores] = useState({});
  const [turns, setTurns] = useState(0);
  const [targets, setTargets] = useState({});

  useEffect(() => localStorage.setItem("players", JSON.stringify(players)), [players]);

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
    selected.forEach(p => initScores[p.id] = 0);
    setScores(initScores);
    setTurns(0);
  };

  const updateScore = (id, val) => {
    setScores({ ...scores, [id]: scores[id] + val });
  };

  return (
    <div style={{ padding: 20 }}>
      <h1>🎱 Carambole Pro</h1>

      <h2>Spelers</h2>
      <input value={newPlayer} onChange={e => setNewPlayer(e.target.value)} />
      <button onClick={addPlayer}>Toevoegen</button>

      {players.map(p => (
        <div key={p.id}>
          <button onClick={() => selectPlayer(p)}>
            {p.name}
          </button>
        </div>
      ))}

      {selected.length === 2 && (
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

      {Object.keys(scores).length > 0 && (
        <div>
          <h2>Match</h2>
          {selected.map(p => (
            <div key={p.id}>
              {p.name} — {scores[p.id]} / {targets[p.id]} | Moy: {(scores[p.id]/(turns||1)).toFixed(2)}
              <button onClick={() => updateScore(p.id, 1)}>+1</button>
              <button onClick={() => updateScore(p.id, -1)}>-1</button>
            </div>
          ))}
          <div>Beurten: {turns}</div>
          <button onClick={() => setTurns(turns + 1)}>Volgende beurt</button>
        </div>
      )}
    </div>
  );
}
