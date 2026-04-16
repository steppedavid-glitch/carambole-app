import React, { useState, useEffect } from "react";

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

  const submitScore = () => {
    setUndoStack(prev => [...prev, { scores: { ...scores }, history: [...history], turns, activePlayer }]);

    const val = Number(inputValue || 0);
    const newScores = { ...scores, [activePlayer]: scores[activePlayer] + val };

    const newHistory = [...history, {
      turn: turns,
      ...Object.fromEntries(selected.map(p => [p.name, newScores[p.id]]))
    }];

    setScores(newScores);
    setHistory(newHistory);
    setInputValue("");

    const win = selected.find(p => newScores[p.id] >= targets[p.id]);

    if (win) {
      setGames(prev => [...prev, {
        players: selected,
        scores: newScores,
        winner: win,
        history: newHistory
      }]);

      // DIRECT TERUG NAAR START
      setCurrentGame(false);
      setSelected([]);
      setScores({});
      setHistory([]);
      setTurns(1);
      return;
    }

    const next = selected.find(p => p.id !== activePlayer)?.id;
    setActivePlayer(next);
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

  const avatar = (p) => (
    <div style={{ position: 'relative', display: 'inline-block' }}>
      {p.photo && <img src={p.photo} alt="" width={50} height={50} style={{ borderRadius: '50%' }} />}
      <div style={{ position: 'absolute', bottom: 0, right: 0, width: 14, height: 14, borderRadius: '50%', background: p.color === 'yellow' ? '#facc15' : '#ffffff', border: '2px solid #000' }} />
    </div>
  );

  // STATS
  const stats = (p) => {
    const played = games.filter(g => g.players.find(x => x.id === p.id));
    const wins = played.filter(g => g.winner.id === p.id);
    return { played: played.length, wins: wins.length };
  };

  const ranking = [...players]
    .map(p => ({ name: p.name, wins: stats(p).wins }))
    .sort((a, b) => b.wins - a.wins);

  return (
    <div style={{ minHeight: '100vh', padding: 20, background: '#f1f5f9' }}>

      <h1 style={{ textAlign: 'center' }}>🎱 Carambole Pro John Steppe</h1>

      {!currentGame && (
        <div>

          {/* PLAYERS */}
          <h3>Spelers</h3>
          {players.map(p => {
            const s = stats(p);
            return (
              <div key={p.id}>
                {avatar(p)} {p.name} | 🎯 {s.played} | 🏆 {s.wins}
              </div>
            );
          })}

          {/* RANKING */}
          <h3>Ranking</h3>
          {ranking.map((r, i) => (
            <div key={i}>#{i + 1} {r.name} ({r.wins})</div>
          ))}

          <h3>Speler toevoegen</h3>
          <input value={newPlayer} onChange={e => setNewPlayer(e.target.value)} />
          <select value={ballColor} onChange={e => setBallColor(e.target.value)}>
            <option value="white">Wit</option>
            <option value="yellow">Geel</option>
          </select>
          <input type="file" onChange={handlePhoto} />
          <button onClick={addPlayer}>Toevoegen</button>

          <h3>Selecteer spelers</h3>
          {players.map(p => (
            <div key={p.id}>
              <button onClick={() => setSelected(prev => prev.find(x => x.id === p.id) ? prev.filter(x => x.id !== p.id) : [...prev, p])}>
                {avatar(p)} {p.name}
              </button>

              {selected.find(x => x.id === p.id) && (
                <input type="number" placeholder="target" value={targets[p.id] || ''} onChange={e => setTargets({ ...targets, [p.id]: Number(e.target.value) })} />
              )}
            </div>
          ))}

          {selected.length === 2 && <button onClick={startGame}>Start match</button>}
        </div>
      )}

      {currentGame && (
        <div>
          <div style={{ display: 'flex', gap: 10 }}>
            {selected.map(p => (
              <div key={p.id} style={{
                flex: 1,
                textAlign: 'center',
                padding: 20,
                background: activePlayer === p.id ? '#22c55e' : '#e2e8f0',
                borderRadius: 16,
                border: activePlayer === p.id ? '4px solid #16a34a' : '2px solid transparent',
                boxShadow: activePlayer === p.id ? '0 0 25px rgba(34,197,94,0.7)' : 'none'
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
              <button key={n} onClick={() => addDigit(n.toString())} style={{ height: 80 }}>{n}</button>
            ))}
            <button onClick={clearInput} style={{ height: 80, background: '#facc15' }}>C</button>
            <button onClick={() => addDigit('0')} style={{ height: 80 }}>0</button>
            <button onClick={submitScore} style={{ height: 80, background: '#22c55e', color: 'white' }}>OK</button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 12, marginTop: 12 }}>
            <button onClick={undo} style={{ height: 80, background: '#ef4444', color: 'white' }}>Undo</button>
            <button onClick={nextTurn} style={{ height: 80, background: '#3b82f6', color: 'white' }}>Beurt</button>
            <button onClick={() => setCurrentGame(false)} style={{ height: 80, background: '#6b7280', color: 'white' }}>Stop</button>
          </div>
        </div>
      )}

    </div>
  );
}
