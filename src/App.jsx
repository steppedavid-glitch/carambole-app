import React, { useState, useEffect } from "react";

export default function App() {
  const [players, setPlayers] = useState(() => JSON.parse(localStorage.getItem("players")) || []);
  const [games, setGames] = useState(() => JSON.parse(localStorage.getItem("games")) || []);

  const [newPlayer, setNewPlayer] = useState("");
  const [ballColor, setBallColor] = useState("white");

  const [selected, setSelected] = useState([]);
  const [scores, setScores] = useState({});
  const [targets, setTargets] = useState({});
  const [turns, setTurns] = useState(0);
  const [series, setSeries] = useState({});
  const [currentGame, setCurrentGame] = useState(false);

  const [activePlayer, setActivePlayer] = useState(null);
  const [inputValue, setInputValue] = useState("");
  const [winner, setWinner] = useState(null);

  useEffect(() => localStorage.setItem("players", JSON.stringify(players)), [players]);
  useEffect(() => localStorage.setItem("games", JSON.stringify(games)), [games]);

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
    const initSeries = {};
    selected.forEach(p => {
      initScores[p.id] = 0;
      initSeries[p.id] = { current: 0, best: 0 };
    });
    setScores(initScores);
    setSeries(initSeries);
    setTurns(1);
    setCurrentGame(true);
    setActivePlayer(selected[0]?.id);
  };

  const addDigit = (d) => setInputValue(prev => prev + d);
  const clearInput = () => setInputValue("");

  const submitScore = () => {
    if (!activePlayer) return;
    const val = Number(inputValue || 0);

    // update score
    const newScores = { ...scores, [activePlayer]: scores[activePlayer] + val };
    setScores(newScores);

    // update series
    setSeries(prev => {
      const curr = val > 0 ? prev[activePlayer].current + val : 0;
      return {
        ...prev,
        [activePlayer]: {
          current: curr,
          best: Math.max(curr, prev[activePlayer].best)
        }
      };
    });

    setInputValue("");

    // winner check
    const win = selected.find(p => newScores[p.id] >= targets[p.id]);
    if (win) {
      setWinner(win);
      setGames([...games, {
        players: selected,
        scores: newScores,
        winner: win,
        turns,
        series
      }]);
      setCurrentGame(false);
      return;
    }

    const next = selected.find(p => p.id !== activePlayer)?.id;
    setActivePlayer(next);
  };

  const nextTurn = () => {
    setTurns(turns + 1);
    setSeries(prev =>
      Object.fromEntries(Object.entries(prev).map(([k, v]) => [k, { ...v, current: 0 }]))
    );
  };

  const stats = (p) => {
    const played = games.filter(g => g.players.find(x => x.id === p.id));
    const wins = played.filter(g => g.winner.id === p.id);
    const bestSeries = Math.max(0, ...played.map(g => g.series?.[p.id]?.best || 0));
    return { played: played.length, wins: wins.length, bestSeries };
  };

  return (
    <div style={{ minHeight: "100vh", background: "linear-gradient(135deg,#e6f0f3,#cfdfe6)", padding: 10 }}>

      <h1 style={{ textAlign: "center" }}>🎱 Carambole Pro John Steppe</h1>

      {/* WINNER MODAL */}
      {winner && (
        <div style={{
          position: "fixed",
          top: 0, left: 0, right: 0, bottom: 0,
          background: "rgba(0,0,0,0.6)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center"
        }}>
          <div style={{ background: "white", padding: 30, borderRadius: 12, textAlign: "center" }}>
            <h2>🏆 {winner.name} wint!</h2>
            <button onClick={() => setWinner(null)}>Sluiten</button>
          </div>
        </div>
      )}

      {currentGame && (
        <>
          <div style={{ display: "flex", borderRadius: 12, overflow: "hidden", marginBottom: 10 }}>
            {selected.map(p => (
              <div key={p.id} style={{ flex: 1, padding: 15, textAlign: "center",
                background: activePlayer === p.id ? "#27ae60" : "#ecf0f1" }}>
                <div>{p.name}</div>
                <div style={{ fontSize: 40 }}>{scores[p.id]}</div>
                <div>/ {targets[p.id]}</div>
                <div>🔥 {series[p.id]?.best}</div>
              </div>
            ))}
          </div>

          <div style={{ textAlign: "center" }}>Beurt: {turns}</div>

          <div style={{ textAlign: "center", fontSize: 32 }}>{inputValue || 0}</div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 10 }}>
            {[1,2,3,4,5,6,7,8,9].map(n => (
              <button key={n} onClick={() => addDigit(n.toString())} style={btn()}>{n}</button>
            ))}
            <button onClick={clearInput} style={btn("#bdc3c7")}>C</button>
            <button onClick={() => addDigit("0")} style={btn()}>0</button>
            <button onClick={submitScore} style={btn("#27ae60","white")}>OK</button>
          </div>

          <button onClick={nextTurn} style={{ width: "100%", marginTop: 10, padding: 15, background: "#f1c40f" }}>
            Volgende beurt
          </button>
        </>
      )}

      {!currentGame && (
        <>
          <input value={newPlayer} onChange={e => setNewPlayer(e.target.value)} placeholder="Naam" />
          <select value={ballColor} onChange={e => setBallColor(e.target.value)}>
            <option value="white">Wit</option>
            <option value="yellow">Geel</option>
          </select>
          <button onClick={addPlayer}>Toevoegen</button>

          <h3>Spelers</h3>
          {players.map(p => {
            const s = stats(p);
            return (
              <div key={p.id}>
                {p.name} | 🎯 {s.played} | 🏆 {s.wins} | 🔥 {s.bestSeries}
              </div>
            );
          })}

          {players.map(p => (
            <button key={p.id} onClick={() => selectPlayer(p)}>{p.name}</button>
          ))}

          {selected.length === 2 && (
            <button onClick={startGame}>Start match</button>
          )}
        </>
      )}
    </div>
  );
}

function btn(bg = "#fff", color = "#000") {
  return { padding: 20, fontSize: 20, borderRadius: 10, background: bg, color: color };
}
