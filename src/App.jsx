import React, { useState, useEffect } from "react";

export default function App() {
  const [players, setPlayers] = useState(() => JSON.parse(localStorage.getItem("players")) || []);
  const [newPlayer, setNewPlayer] = useState("");
  const [ballColor, setBallColor] = useState("white");

  const [selected, setSelected] = useState([]);
  const [scores, setScores] = useState({});
  const [targets, setTargets] = useState({});
  const [turns, setTurns] = useState(0);
  const [currentGame, setCurrentGame] = useState(false);

  const [activePlayer, setActivePlayer] = useState(null);
  const [inputValue, setInputValue] = useState("");

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
      setTargets(prev => ({ ...prev, [p.id]: 20 }));
    }
  };

  const startGame = () => {
    const initScores = {};
    selected.forEach(p => initScores[p.id] = 0);
    setScores(initScores);
    setTurns(1);
    setCurrentGame(true);
    setActivePlayer(selected[0]?.id);
  };

  const addDigit = (d) => setInputValue(prev => prev + d);
  const clearInput = () => setInputValue("");

  const submitScore = () => {
    if (!activePlayer) return;
    const val = Number(inputValue || 0);
    const newScores = { ...scores, [activePlayer]: scores[activePlayer] + val };
    setScores(newScores);
    setInputValue("");

    // wissel speler
    const next = selected.find(p => p.id !== activePlayer)?.id;
    setActivePlayer(next);
  };

  const getColor = (c) => c === "yellow" ? "#f1c40f" : "#ecf0f1";

  return (
    <div style={{ minHeight: "100vh", background: "linear-gradient(180deg,#0f2027,#203a43,#2c5364)", color: "white", padding: 10 }}>

      <h1 style={{ textAlign: "center" }}>🎱 Carambole Pro John Steppe</h1>

      {!currentGame && (
        <>
          <input value={newPlayer} onChange={e => setNewPlayer(e.target.value)} placeholder="Naam" />
          <select value={ballColor} onChange={e => setBallColor(e.target.value)}>
            <option value="white">Wit</option>
            <option value="yellow">Geel</option>
          </select>
          <button onClick={addPlayer}>Toevoegen</button>

          <h3>Selecteer spelers</h3>
          {players.map(p => (
            <button key={p.id} onClick={() => selectPlayer(p)} style={{
              display: "block", width: "100%", margin: 5, padding: 12,
              background: getColor(p.color), color: "black",
              opacity: selected.find(x => x.id === p.id) ? 1 : 0.5
            }}>{p.name}</button>
          ))}

          {selected.length === 2 && (
            <>
              {selected.map(p => (
                <div key={p.id}>{p.name}
                  <input type="number" value={targets[p.id]}
                    onChange={e => setTargets({ ...targets, [p.id]: Number(e.target.value) })} />
                </div>
              ))}
              <button onClick={startGame}>Start</button>
            </>
          )}
        </>
      )}

      {currentGame && (
        <>
          {/* SCOREBOARD */}
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10 }}>
            {selected.map(p => (
              <div key={p.id} style={{ flex: 1, textAlign: "center", padding: 10, background: activePlayer === p.id ? "#27ae60" : "#333" }}>
                <div>{p.name}</div>
                <div style={{ fontSize: 40 }}>{scores[p.id]}</div>
                <div>/ {targets[p.id]}</div>
              </div>
            ))}
          </div>

          <div style={{ textAlign: "center" }}>Beurt: {turns}</div>

          {/* NUMPAD */}
          <div style={{ marginTop: 20 }}>
            <div style={{ fontSize: 30, textAlign: "center", marginBottom: 10 }}>{inputValue || 0}</div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 10 }}>
              {[1,2,3,4,5,6,7,8,9].map(n => (
                <button key={n} onClick={() => addDigit(n.toString())} style={{ padding: 20, fontSize: 20 }}>{n}</button>
              ))}
              <button onClick={clearInput}>C</button>
              <button onClick={() => addDigit("0")}>0</button>
              <button onClick={submitScore} style={{ background: "#2ecc71" }}>OK</button>
            </div>
          </div>

          <button onClick={() => setTurns(turns + 1)} style={{ width: "100%", marginTop: 15, padding: 15, background: "#f1c40f" }}>
            Volgende beurt
          </button>
        </>
      )}
    </div>
  );
}
