import React, { useState, useEffect } from "react";

export default function App() {
  const [players, setPlayers] = useState(() => JSON.parse(localStorage.getItem("players")) || []);
  const [games, setGames] = useState(() => JSON.parse(localStorage.getItem("games")) || []);

  const [newPlayer, setNewPlayer] = useState("");
  const [photo, setPhoto] = useState(null);

  const [selected, setSelected] = useState([]);
  const [scores, setScores] = useState({});
  const [targets, setTargets] = useState({});
  const [history, setHistory] = useState([]);
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

  const updatePlayerPhoto = (id, file) => {
    const reader = new FileReader();
    reader.onload = () => {
      setPlayers(prev => prev.map(p => p.id === id ? { ...p, photo: reader.result } : p));
    };
    if (file) reader.readAsDataURL(file);
  };

  const addPlayer = () => {
    if (!newPlayer) return;
    setPlayers([...players, { name: newPlayer, id: Date.now(), photo }]);
    setNewPlayer("");
    setPhoto(null);
  };

  const startGame = () => {
    const initScores = {};
    selected.forEach(p => initScores[p.id] = 0);
    setScores(initScores);
    setHistory([]);
    setCurrentGame(true);
    setActivePlayer(selected[0].id);
    setUndoStack([]);
  };

  const submitScore = () => {
    const val = Number(inputValue || 0);

    // save undo
    setUndoStack(prev => [...prev, { scores: { ...scores }, history: [...history] }]);

    const newScores = { ...scores, [activePlayer]: scores[activePlayer] + val };

    const newHistory = [...history, {
      player: activePlayer,
      value: val,
      scores: newScores
    }];

    setScores(newScores);
    setHistory(newHistory);
    setInputValue("");

    const win = selected.find(p => targets[p.id] && newScores[p.id] >= targets[p.id]);

    if (win) {
      const game = {
        players: selected,
        scores: newScores,
        winner: win,
        history: newHistory
      };

      setGames(prev => [...prev, game]);

      // reset
      setCurrentGame(false);
      setSelected([]);
      setScores({});
      setHistory([]);
      setUndoStack([]);
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
    setUndoStack([...undoStack]);
  };

  const avatar = (p) => p.photo && (
    <img src={p.photo} style={{ width: 40, height: 40, borderRadius: '50%' }} />
  );

  const stats = (p) => {
    const played = games.filter(g => g.players?.find(x => x.id === p.id));
    const wins = played.filter(g => g.winner && g.winner.id === p.id);
    return { played: played.length, wins: wins.length };
  };

  return (
    <div style={{ padding: 20, background: '#f1f5f9' }}>

      <h1 style={{ textAlign: 'center' }}>🎱 Carambole John & David Steppe</h1>

      {!currentGame && (
        <div>
          <h3>Spelers</h3>
          {players.map(p => {
            const s = stats(p);
            return (
              <div key={p.id}>
                {avatar(p)} {p.name} | 🏆 {s.wins}
                <input type="file" onChange={(e)=>updatePlayerPhoto(p.id,e.target.files[0])} />
              </div>
            );
          })}

          <h3>Speler toevoegen</h3>
          <input value={newPlayer} onChange={e => setNewPlayer(e.target.value)} />
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
              <div key={p.id} style={{ flex:1, padding:10, background: activePlayer===p.id?'#22c55e':'#e2e8f0', borderRadius:12 }}>
                {avatar(p)}
                <div>{p.name}</div>
                <div style={{ fontSize: 40 }}>{scores[p.id]}</div>
              </div>
            ))}
          </div>

          {/* SCORE HISTORY */}
          <div style={{ marginTop:10 }}>
            {history.map((h,i) => (
              <div key={i}>
                {players.find(p=>p.id===h.player)?.name}: +{h.value}
              </div>
            ))}
          </div>

          <div style={{ textAlign: 'center', fontSize: 36 }}>{inputValue || 0}</div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 10 }}>
            {[1,2,3,4,5,6,7,8,9].map(n => (
              <button key={n} onClick={() => setInputValue(v=>v+n)} style={{ height: 80, fontSize: 32 }}>{n}</button>
            ))}
            <button style={{ height:80, fontSize:32, background:'#facc15' }} onClick={()=>setInputValue('')}>C</button>
            <button style={{ height:80, fontSize:32 }} onClick={()=>setInputValue(v=>v+'0')}>0</button>
            <button style={{ height:80, fontSize:32, background:'#22c55e', color:'white' }} onClick={submitScore}>OK</button>
          </div>

          <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:10, marginTop:10 }}>
            <button style={{ height:80, fontSize:32, background:'#ef4444', color:'white' }} onClick={undo}>Undo</button>
            <button style={{ height:80, fontSize:32, background:'#3b82f6', color:'white' }} onClick={()=>setActivePlayer(selected.find(p=>p.id!==activePlayer)?.id)}>Beurt</button>
            <button style={{ height:80, fontSize:32, background:'#6b7280', color:'white' }} onClick={()=>setCurrentGame(false)}>New</button>
          </div>

        </div>
      )}

    </div>
  );
}
