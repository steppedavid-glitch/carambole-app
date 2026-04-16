import React, { useState, useEffect } from "react";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";

const Card = ({ children, style }) => (
  <div style={{ background: "var(--card)", borderRadius: 16, padding: 16, boxShadow: "0 8px 24px rgba(0,0,0,0.08)", ...style }}>
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

  const [winner, setWinner] = useState(null);
  const [darkMode, setDarkMode] = useState(() => JSON.parse(localStorage.getItem("darkMode")) || false);

  useEffect(() => localStorage.setItem("players", JSON.stringify(players)), [players]);
  useEffect(() => localStorage.setItem("games", JSON.stringify(games)), [games]);
  useEffect(() => localStorage.setItem("darkMode", JSON.stringify(darkMode)), [darkMode]);

  const theme = {
    '--bg': darkMode ? '#0f172a' : '#f1f5f9',
    '--card': darkMode ? '#1e293b' : '#ffffff',
    '--text': darkMode ? '#e2e8f0' : '#0f172a'
  };

  const handlePhoto = (e) => {
    const file = e.target.files[0];
    const reader = new FileReader();
    reader.onload = () => setPhoto(reader.result);
    if (file) reader.readAsDataURL(file);
  };

  const addPlayer = () => {
    if (!newPlayer) return;
    setPlayers([...players, { name: newPlayer, id: Date.now(), color: ballColor, photo }]);
    setNewPlayer("");
    setPhoto(null);
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

  const playSound = () => {
    const audio = new Audio("https://actions.google.com/sounds/v1/cartoon/wood_plank_flicks.ogg");
    audio.play();
  };

  const submitScore = () => {
    setUndoStack(prev => [...prev, { scores: { ...scores }, history: [...history], turns, activePlayer }]);

    const val = Number(inputValue || 0);
    const newScores = { ...scores, [activePlayer]: scores[activePlayer] + val };

    setScores(newScores);

    setHistory(prev => [...prev, {
      turn: turns,
      ...Object.fromEntries(selected.map(p => [p.name, newScores[p.id]]))
    }]);

    playSound();
    setInputValue("");

    const next = selected.find(p => p.id !== activePlayer)?.id;
    setActivePlayer(next);

    const win = selected.find(p => newScores[p.id] >= targets[p.id]);
    if (win) {
      setWinner(win);
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

  const avatar = (p) => (
    <div style={{ position: 'relative', display: 'inline-block' }}>
      {p.photo && <img src={p.photo} alt="" width={60} height={60} style={{ borderRadius: '50%' }} />}
      <div style={{ position: 'absolute', bottom: 0, right: 0, width: 18, height: 18, borderRadius: '50%', background: p.color === 'yellow' ? '#facc15' : '#ffffff', border: '2px solid #000' }} />
    </div>
  );

  return (
    <div style={{ minHeight: '100vh', padding: 20, background: 'var(--bg)', color: 'var(--text)', ...theme }}>

      {/* HEADER */}
      <div style={{ textAlign: 'center', marginBottom: 20 }}>
        <h1 style={{ fontSize: 28, fontWeight: '800', background: 'linear-gradient(90deg,#2563eb,#22c55e)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
          🎱 Carambole Pro John Steppe
        </h1>
        <Button onClick={() => setDarkMode(!darkMode)}>🌙 Toggle</Button>
      </div>

      {/* WINNER SCREEN */}
      {winner && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
          <div style={{ background: 'white', padding: 30, borderRadius: 16 }}>
            <div style={{ textAlign: 'center' }}>
              {winner.photo && (
                <img
                  src={winner.photo}
                  alt=""
                  style={{ width: 120, height: 120, borderRadius: '50%', objectFit: 'cover', marginBottom: 15, border: '4px solid #22c55e' }}
                />
              )}
              <h2 style={{ fontSize: 24 }}>🏆 {winner.name} wint!</h2>
            </div>
            <Button onClick={() => { setWinner(null); setSelected([]); }}>Terug</Button>
          </div>
        </div>
      )}

      {!currentGame && (
        <Card>
          <h3>Speler toevoegen</h3>
          <input value={newPlayer} onChange={e => setNewPlayer(e.target.value)} placeholder="Naam" />
          <select value={ballColor} onChange={e => setBallColor(e.target.value)}>
            <option value="white">Wit</option>
            <option value="yellow">Geel</option>
          </select>
          <input type="file" onChange={handlePhoto} />
          <Button onClick={addPlayer}>Toevoegen</Button>

          <h3>Selecteer spelers</h3>
          {players.map(p => (
            <div key={p.id}>
              <Button onClick={() => setSelected(prev => prev.find(x => x.id === p.id) ? prev.filter(x => x.id !== p.id) : [...prev, p])}>
                {avatar(p)} {p.name}
              </Button>

              {selected.find(x => x.id === p.id) && (
                <input type="number" placeholder="target" value={targets[p.id] || ''} onChange={e => setTargets({ ...targets, [p.id]: Number(e.target.value) })} />
              )}
            </div>
          ))}

          {selected.length === 2 && (
            <Button onClick={startGame}>Start match</Button>
          )}
        </Card>
      )}

      {currentGame && (
        <Card>
          <div style={{ display: 'flex', gap: 10 }}>
            {selected.map(p => (
              <div key={p.id} style={{ flex: 1, textAlign: 'center', padding: 20,
                background: activePlayer === p.id ? '#22c55e' : '#e2e8f0',
                border: activePlayer === p.id ? '3px solid #16a34a' : '2px solid transparent',
                boxShadow: activePlayer === p.id ? '0 0 25px rgba(34,197,94,0.7)' : 'none',
                transform: activePlayer === p.id ? 'scale(1.03)' : 'scale(1)',
                transition: 'all 0.3s ease'
              }}>
                {avatar(p)}
                <div>{p.name}</div>
                <div style={{ fontSize: 40 }}>{scores[p.id]}</div>
                <div>/ {targets[p.id]}</div>
              </div>
            ))}
          </div>

          <div style={{ textAlign: 'center', fontSize: 30 }}>{inputValue || 0}</div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 12 }}>
            {[1,2,3,4,5,6,7,8,9].map(n => (
              <Button key={n} onClick={() => addDigit(n.toString())} style={{ height: 80 }}>{n}</Button>
            ))}
            <Button onClick={clearInput} style={{ height: 80 }}>C</Button>
            <Button onClick={() => addDigit('0')} style={{ height: 80 }}>0</Button>
            <Button onClick={submitScore} style={{ height: 80, background: '#22c55e', color: 'white' }}>OK</Button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 12, marginTop: 10 }}>
            <Button onClick={undo} style={{ height: 80, background: '#ef4444', color: 'white' }}>Undo</Button>
            <Button onClick={nextTurn} style={{ height: 80, background: '#3b82f6', color: 'white' }}>Beurt</Button>
            <Button onClick={newMatch} style={{ height: 80, background: '#6b7280', color: 'white' }}>New</Button>
          </div>
        </Card>
      )}

    </div>
  );
}
