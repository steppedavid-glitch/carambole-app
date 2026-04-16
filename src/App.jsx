import React, { useState, useEffect } from "react";

export default function App() {
  const [players, setPlayers] = useState(() => JSON.parse(localStorage.getItem("players")) || []);
  const [newPlayer, setNewPlayer] = useState("");
  const [ballColor, setBallColor] = useState("white");

  const [selected, setSelected] = useState([]);
  const [scores, setScores] = useState({});
  const [inputs, setInputs] = useState({});
  const [targets, setTargets] = useState({});
  const [turns, setTurns] = useState(0);
  const [currentGame, setCurrentGame] = useState(false);

  useEffect(() => localStorage.setItem("players", JSON.stringify(players)), [players]);

  const addPlayer = () => {
    if (!newPlayer) return;
    setPlayers([...players, { name: newPlayer, id: Date.now(), color: ballColor }]);
    setNewPlayer("");
  };

  const selectPlayer = (p) => {
    if (selected.find(x => x.id === p.id)) {
      setSelected(selected.filter(x => x.id !== p.id));
    } else if (selected.length < 2) {
      setSelected([...selected, p]);
      setTargets({ ...targets, [p.id]: 20 });
      setInputs({ ...inputs, [p.id]: 0 });
    }
  };

  const startGame = () => {
    const initScores = {};
    selected.forEach(p => initScores[p.id] = 0);
    setScores(initScores);
    setTurns(0);
    setCurrentGame(true);
  };

  const updateScore = (id) => {
    const val = Number(inputs[id] || 0);
    setScores({ ...scores, [id]: scores[id] + val });
    setInputs({ ...inputs, [id]: 0 });
  };

  const getColorStyle = (color) => {
    if (color === "yellow") return { background: "#f1c40f", color: "black" };
    return { background: "#ecf0f1", color: "black" };
  };

  return (
    <div style={{ background: "#111", color: "white", minHeight: "100vh", padding: 15 }}>
      <h1 style={{ fontSize: 28 }}>🎱 Carambole Pro</h1>

      {!currentGame && (
        <>
          <h2>Spelers toevoegen</h2>

          <input
            value={newPlayer}
            onChange={e => setNewPlayer(e.target.value)}
            placeholder="Naam"
            style={{ padding: 10, fontSize: 16, width: "60%" }}
          />

          <select
            value={ballColor}
            onChange={e => setBallColor(e.target.value)}
            style={{ padding: 10, marginLeft: 10 }}
          >
            <option value="white">Wit</option>
            <option value="yellow">Geel</option>
          </select>

          <button onClick={addPlayer} style={{ padding: 10, marginLeft: 10 }}>
            Toevoegen
          </button>

          <h2 style={{ marginTop: 20 }}>Selecteer spelers</h2>

          {players.map(p => (
            <button
              key={p.id}
              onClick={() => selectPlayer(p)}
              style={{
                display: "block",
                width: "100%",
                marginBottom: 10,
                padding: 15,
                fontSize: 18,
                borderRadius: 8,
                border: "none",
                ...getColorStyle(p.color),
                opacity: selected.find(x => x.id === p.id) ? 1 : 0.5
              }}
            >
              {p.name} ({p.color})
            </button>
          ))}

          {selected.length === 2 && (
            <div style={{ marginTop: 20 }}>
              <h2>Game setup</h2>
              {selected.map(p => (
                <div key={p.id} style={{ marginBottom: 10 }}>
                  {p.name}
                  <input
                    type="number"
                    value={targets[p.id]}
                    onChange={e => setTargets({ ...targets, [p.id]: Number(e.target.value) })}
                    style={{ marginLeft: 10, padding: 8, width: 80 }}
                  />
                </div>
              ))}

              <button
                onClick={startGame}
                style={{ width: "100%", padding: 15, fontSize: 18, background: "#3498db", border: "none", borderRadius: 8 }}
              >
                Start match
              </button>
            </div>
          )}
        </>
      )}

      {currentGame && (
        <div>
          <h2>Match</h2>

          {selected.map(p => (
            <div key={p.id} style={{ marginBottom: 20 }}>
              <div style={{ fontSize: 20 }}>{p.name}</div>
              <div style={{ fontSize: 32, fontWeight: "bold" }}>
                {scores[p.id]} / {targets[p.id]}
              </div>

              <input
                type="number"
                value={inputs[p.id] || ""}
                onChange={e => setInputs({ ...inputs, [p.id]: e.target.value })}
                placeholder="punten"
                style={{ padding: 15, fontSize: 18, width: "100%", marginBottom: 10 }}
              />

              <button
                onClick={() => updateScore(p.id)}
                style={{ width: "100%", padding: 15, fontSize: 18, background: "#2ecc71", border: "none", borderRadius: 8 }}
              >
                Voeg punten toe
              </button>
            </div>
          ))}

          <div style={{ fontSize: 18 }}>Beurten: {turns}</div>

          <button
            onClick={() => setTurns(turns + 1)}
            style={{ width: "100%", padding: 15, fontSize: 18, marginTop: 10, background: "#f1c40f", border: "none", borderRadius: 8 }}
          >
            Volgende beurt
          </button>
        </div>
      )}
    </div>
  );
}
