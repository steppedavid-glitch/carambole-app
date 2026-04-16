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

  const [winner, setWinner] = useState(null);

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

    setScores(newScores);

    const newHistory = [...history, {
      turn: turns,
      ...Object.fromEntries(selected.map(p => [p.name, newScores[p.id]]))
    }];

    setHistory(newHistory);
    setInputValue("");

    const win = selected.find(p => newScores[p.id] >= targets[p.id]);

    if (win) {
      setWinner(win);
      setGames(prev => [...prev, { players: selected, scores: newScores, winner: win, history: newHistory }]);
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

  const newMatch = () => {
    setWinner(null);
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
      <div style={{ position: 'absolute', bottom: 0, right: 0, width: 16, height: 16, borderRadius: '50%', background: p.color === 'yellow' ? '#facc15' : '#ffffff', border: '2px solid #000' }} />
    </div>
  );

  return (
    <div style={{ minHeight: '100vh', padding: 20, background: '#f1f5f9' }}>

      <h1 style={{ textAlign: 'center' }}>🎱 Carambole John & David Steppe</h1>

      {/* WINNER */}
      {winner && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
          <div style={{ background: 'white', padding: 30, borderRadius: 16, textAlign: 'center' }}>
            {winner.photo && <img src={winner.photo} alt="" style={{ width: 120, height: 120, borderRadius: '50%', marginBottom: 10 }} />}
            <h2>🏆 {winner.name} wint!</h2>
            <button onClick={newMatch}>Nieuwe match</button>
          </div>
        </div>
      )}

      {!currentGame && (
        <div>
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

              <input
                type="file"
                onChange={(e) => {
                  const file = e.target.files[0];
                  const reader = new FileReader();
                  reader.onload = () => {
                    setPlayers(prev => prev.map(pl => pl.id === p.id ? { ...pl, photo: reader.result } : pl));
                  };
                  if (file) reader.readAsDataURL(file);
                }}
              />

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
          <div style={{ display: 'flex' }}>
            {selected.map(p => (
              <div key={p.id} style={{ flex: 1, textAlign: 'center', padding: 20 }}>
                {avatar(p)}
                <div>{p.name}</div>
                <div>{scores[p.id]}</div>
                <div>/ {targets[p.id]}</div>
              </div>
            ))}
          </div>

          <div>{inputValue || 0}</div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)' }}>
            {[1,2,3,4,5,6,7,8,9].map(n => (
              <button key={n} onClick={() => addDigit(n.toString())}>{n}</button>
            ))}
            <button onClick={clearInput}>C</button>
            <button onClick={() => addDigit('0')}>0</button>
            <button onClick={submitScore}>OK</button>
          </div>

          <button onClick={undo}>Undo</button>
          <button onClick={nextTurn}>Beurt</button>
          <button onClick={newMatch}>New</button>
        </div>
      )}

    </div>
  );
}
