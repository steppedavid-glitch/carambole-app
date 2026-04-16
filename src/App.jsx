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
  const [photo, setPhoto] = useState(null);

  const [selected, setSelected] = useState([]);
  const [scores, setScores] = useState({});
  const [targets, setTargets] = useState({});
  const [history, setHistory] = useState([]);
  const [turns, setTurns] = useState(1);
  const [currentGame, setCurrentGame] = useState(false);
  const [activePlayer, setActivePlayer] = useState(null);
  const [inputValue, setInputValue] = useState("");
  const [undoStack, setUndoStack] = useState([]);

  useEffect(() => localStorage.setItem("players", JSON.stringify(players)), [players]);
  useEffect(() => localStorage.setItem("games", JSON.stringify(games)), [games]);

  const addPlayer = () => {
    if (!newPlayer) return;
    setPlayers([...players, {
      name: newPlayer,
      id: Date.now(),
      color: ballColor,
      photo
    }]);
    setNewPlayer("");
    setPhoto(null);
  };

  const handlePhoto = (e) => {
    const file = e.target.files[0];
    const reader = new FileReader();
    reader.onload = () => setPhoto(reader.result);
    if (file) reader.readAsDataURL(file);
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
    setUndoStack(prev => [...prev, { scores: { ...scores }, history: [...history], turns, activePlayer }]);

    const val = Number(inputValue || 0);
    const newScores = { ...scores, [activePlayer]: scores[activePlayer] + val };

    setScores(newScores);

    setHistory(prev => [...prev, {
      turn: turns,
      ...Object.fromEntries(selected.map(p => [p.name, newScores[p.id]]))
    }]);

    setInputValue("");

    const next = selected.find(p => p.id !== activePlayer)?.id;
    setActivePlayer(next);

    const win = selected.find(p => newScores[p.id] >= targets[p.id]);
    if (win) {
      setGames([...games, { players: selected, scores: newScores, winner: win }]);
      setCurrentGame(false);
    }
  };

  const undo = () => {
    const last = undoStack.pop();
    if (!last) return;
    setScores(last.scores);
    setHistory(last.history);
    setTurns(last.turns);
    setActivePlayer(last.activePlayer);
    setUndoStack([...undoStack]);
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

  return (
    <div style={{ minHeight: "100vh", background: "#f1f5f9", padding: 20 }}>
      <h1 style={{ textAlign: "center" }}>🎱 Carambole Pro John Steppe</h1>

      {!currentGame && (
        <>
          <Card>
            <h3>Speler toevoegen</h3>
            <input value={newPlayer} onChange={e => setNewPlayer(e.target.value)} placeholder="Naam" />
            <select value={ballColor} onChange={e => setBallColor(e.target.value)}>
              <option value="white">Wit</option>
              <option value="yellow">Geel</option>
            </select>
            <input type="file" accept="image/*" onChange={handlePhoto} />
            <Button onClick={addPlayer}>Toevoegen</Button>
          </Card>

          <Card>
            <h3>Selecteer spelers + target</h3>
            {players.map(p => (
              <div key={p.id} style={{ marginBottom: 10 }}>
                <Button onClick={() => setSelected(prev => prev.find(x => x.id === p.id) ? prev.filter(x => x.id !== p.id) : [...prev, p])}>
                  {p.photo && <img src={p.photo} alt="" width={30} style={{ borderRadius: "50%", marginRight: 10 }} />}
                  {p.name}
                </Button>

                {selected.find(x => x.id === p.id) && (
                  <input
                    type="number"
                    placeholder="target"
                    value={targets[p.id] || ""}
                    onChange={e => setTargets({ ...targets, [p.id]: Number(e.target.value) })}
                  />
                )}
              </div>
            ))}

            {selected.length === 2 && (
              <Button onClick={startGame}>Start match</Button>
            )}
          </Card>
        </>
      )}

      {currentGame && (
        <Card>
          <div style={{ display: "flex", gap: 10 }}>
            {selected.map(p => (
              <div key={p.id} style={{ flex: 1, textAlign: "center", padding: 20, background: activePlayer === p.id ? "#22c55e" : "#e2e8f0" }}>
                {p.photo && <img src={p.photo} alt="" width={60} style={{ borderRadius: "50%" }} />}
                <div>{p.name}</div>
                <div style={{ fontSize: 40 }}>{scores[p.id]}</div>
                <div>/ {targets[p.id]}</div>
              </div>
            ))}
          </div>

          <div style={{ textAlign: "center" }}>{inputValue || 0}</div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 10 }}>
            {[1,2,3,4,5,6,7,8,9].map(n => (
              <Button key={n} onClick={() => addDigit(n.toString())}>{n}</Button>
            ))}
            <Button onClick={clearInput}>C</Button>
            <Button onClick={() => addDigit("0")}>0</Button>
            <Button onClick={submitScore}>OK</Button>
          </div>

          <div style={{ display: "flex", gap: 10, marginTop: 10 }}>
            <Button onClick={undo}>Undo</Button>
            <Button onClick={nextTurn}>Volgende beurt</Button>
            <Button onClick={newMatch}>Nieuwe match</Button>
          </div>
        </Card>
      )}
    </div>
  );
}
