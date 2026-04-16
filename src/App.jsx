import React, { useState, useEffect } from "react";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";

const Card = ({ children, style }) => (
  <div style={{ background: "#fff", borderRadius: 16, padding: 16, boxShadow: "0 8px 24px rgba(0,0,0,0.08)", ...style }}>
    {children}
  </div>
);

const Button = ({ children, onClick, style }) => (
  <button onClick={onClick} style={{ padding: 14, borderRadius: 12, border: "none", fontWeight: 600, cursor: "pointer", ...style }}>
    {children}
  </button>
);

export default function App() {
  const [players, setPlayers] = useState(() => JSON.parse(localStorage.getItem("players")) || []);
  const [games, setGames] = useState(() => JSON.parse(localStorage.getItem("games")) || []);

  const [newPlayer, setNewPlayer] = useState("");
  const [ballColor, setBallColor] = useState("white");

  const [selected, setSelected] = useState([]);
  const [scores, setScores] = useState({});
  const [history, setHistory] = useState([]);
  const [targets, setTargets] = useState({});
  const [turns, setTurns] = useState(1);
  const [currentGame, setCurrentGame] = useState(false);
  const [activePlayer, setActivePlayer] = useState(null);
  const [inputValue, setInputValue] = useState("");

  // NEW: undo stack
  const [undoStack, setUndoStack] = useState([]);

  useEffect(() => localStorage.setItem("games", JSON.stringify(games)), [games]);
  useEffect(() => localStorage.setItem("players", JSON.stringify(players)), [players]);

  const addPlayer = () => {
    if (!newPlayer) return;
    setPlayers([...players, { name: newPlayer, id: Date.now(), color: ballColor }]);
    setNewPlayer("");
  };

  const startGame = () => {
    const initScores = {};
    selected.forEach(p => initScores[p.id] = 0);
    setScores(initScores);
    setHistory([]);
    setTurns(1);
    setCurrentGame(true);
    setActivePlayer(selected[0].id);
    setUndoStack([]);
  };

  const addDigit = (d) => setInputValue(prev => prev + d);
  const clearInput = () => setInputValue("");

  const submitScore = () => {
    if (!activePlayer) return;

    // save snapshot for undo
    setUndoStack(prev => [...prev, {
      scores: { ...scores },
      history: [...history],
      turns,
      activePlayer
    }]);

    const val = Number(inputValue || 0);
    const newScores = { ...scores, [activePlayer]: scores[activePlayer] + val };

    setScores(newScores);

    const snapshot = {
      turn: turns,
      ...Object.fromEntries(selected.map(p => [p.name, newScores[p.id]]))
    };
    setHistory(prev => [...prev, snapshot]);

    setInputValue("");

    const next = selected.find(p => p.id !== activePlayer)?.id;
    setActivePlayer(next);

    const win = selected.find(p => newScores[p.id] >= targets[p.id]);
    if (win) {
      setGames([...games, { players: selected, scores: newScores, winner: win, history }]);
      setCurrentGame(false);
    }
  };

  const undo = () => {
    const last = undoStack[undoStack.length - 1];
    if (!last) return;

    setScores(last.scores);
    setHistory(last.history);
    setTurns(last.turns);
    setActivePlayer(last.activePlayer);
    setUndoStack(prev => prev.slice(0, -1));
  };

  const nextTurn = () => setTurns(turns + 1);

  const newMatch = () => {
    setCurrentGame(false);
    setSelected([]);
    setScores({});
    setHistory([]);
    setTurns(1);
    setInputValue("");
    setUndoStack([]);
  };

  const stats = (p) => {
    const played = games.filter(g => g.players.find(x => x.id === p.id));
    const wins = played.filter(g => g.winner.id === p.id);

    const avg = played.length
      ? (played.reduce((sum, g) => sum + (g.scores[p.id] / (g.history?.length || 1)), 0) / played.length).toFixed(2)
      : 0;

    return { played: played.length, wins: wins.length, avg };
  };

  const ranking = [...players]
    .map(p => ({ name: p.name, ...stats(p) }))
    .sort((a, b) => b.wins - a.wins);

  const headToHead = (p1, p2) => {
    const matches = games.filter(g =>
      g.players.find(x => x.id === p1.id) &&
      g.players.find(x => x.id === p2.id)
    );
    return {
      p1: matches.filter(g => g.winner.id === p1.id).length,
      p2: matches.filter(g => g.winner.id === p2.id).length
    };
  };

  return (
    <div style={{ minHeight: "100vh", background: "#f1f5f9", padding: 20 }}>

      <h1 style={{ textAlign: "center" }}>🎱 Carambole Pro John Steppe</h1>

      {currentGame && (
        <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 20 }}>

          {/* GAME */}
          <Card>
            <div style={{ display: "flex", gap: 10 }}>
              {selected.map(p => (
                <div key={p.id} style={{ flex: 1, textAlign: "center", padding: 20,
                  background: activePlayer === p.id ? "#22c55e" : "#e2e8f0", borderRadius: 12 }}>
                  <div>{p.name}</div>
                  <div style={{ fontSize: 48 }}>{scores[p.id]}</div>
                  <div>/ {targets[p.id]}</div>
                </div>
              ))}
            </div>

            <div style={{ textAlign: "center", margin: 10 }}>Beurt: {turns}</div>
            <div style={{ textAlign: "center", fontSize: 40 }}>{inputValue || 0}</div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 10 }}>
              {[1,2,3,4,5,6,7,8,9].map(n => (
                <Button key={n} onClick={() => addDigit(n.toString())} style={{ background: "#fff" }}>{n}</Button>
              ))}
              <Button onClick={clearInput} style={{ background: "#fbbf24" }}>C</Button>
              <Button onClick={() => addDigit("0")} style={{ background: "#fff" }}>0</Button>
              <Button onClick={submitScore} style={{ background: "#22c55e", color: "white" }}>OK</Button>
            </div>

            {/* NEW CONTROLS */}
            <div style={{ display: "flex", gap: 10, marginTop: 10 }}>
              <Button onClick={undo} style={{ flex: 1, background: "#ef4444", color: "white" }}>
                ↩️ Undo
              </Button>
              <Button onClick={nextTurn} style={{ flex: 1, background: "#3b82f6", color: "white" }}>
                Volgende beurt
              </Button>
              <Button onClick={newMatch} style={{ flex: 1, background: "#6b7280", color: "white" }}>
                Nieuwe match
              </Button>
            </div>
          </Card>

          {/* GRAPH */}
          <Card>
            <h3>Scoreverloop</h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={history}>
                <XAxis dataKey="turn" />
                <YAxis />
                <Tooltip />
                {selected.map(p => (
                  <Line key={p.id} type="monotone" dataKey={p.name} stroke="#2563eb" />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </Card>

        </div>
      )}

      {!currentGame && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 20 }}>

          {/* ADD PLAYER */}
          <Card style={{ gridColumn: "span 3" }}>
            <h3>Speler toevoegen</h3>
            <div style={{ display: "flex", gap: 10 }}>
              <input value={newPlayer} onChange={e => setNewPlayer(e.target.value)} placeholder="Naam" style={{ flex: 1, padding: 10 }} />
              <select value={ballColor} onChange={e => setBallColor(e.target.value)}>
                <option value="white">Wit</option>
                <option value="yellow">Geel</option>
              </select>
              <Button onClick={addPlayer} style={{ background: "#2563eb", color: "white" }}>Toevoegen</Button>
            </div>
          </Card>

          {/* PLAYERS */}
          <Card>
            <h3>Spelers</h3>
            {players.map(p => {
              const s = stats(p);
              return (
                <div key={p.id} style={{ marginBottom: 8 }}>
                  {p.name} | 🎯 {s.played} | 🏆 {s.wins} | Moy {s.avg}
                </div>
              );
            })}
          </Card>

          {/* RANKING */}
          <Card>
            <h3>Ranking</h3>
            {ranking.map((r, i) => (
              <div key={i}>#{i + 1} {r.name}</div>
            ))}
          </Card>

          {/* HEAD TO HEAD */}
          <Card>
            <h3>Onderlinge stats</h3>
            {players.map((p1, i) =>
              players.slice(i + 1).map(p2 => {
                const h = headToHead(p1, p2);
                return (
                  <div key={p1.id + p2.id}>
                    {p1.name} vs {p2.name}: {h.p1} - {h.p2}
                  </div>
                );
              })
            )}
          </Card>

          {/* SELECT */}
          <Card style={{ gridColumn: "span 3" }}>
            <h3>Selecteer spelers</h3>
            {players.map(p => (
              <Button key={p.id} onClick={() => setSelected(prev => prev.find(x => x.id === p.id) ? prev.filter(x => x.id !== p.id) : [...prev, p])} style={{ marginBottom: 5, width: "100%" }}>
                {p.name}
              </Button>
            ))}

            {selected.length === 2 && (
              <Button onClick={startGame} style={{ marginTop: 10, width: "100%", background: "#22c55e", color: "white" }}>
                Start match
              </Button>
            )}
          </Card>

        </div>
      )}

    </div>
  );
}
