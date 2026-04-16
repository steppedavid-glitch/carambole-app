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

    setUndoStack(prev => [...prev, { scores: { ...scores }, history: [...history] }]);

    const newScores = { ...scores, [activePlayer]: scores[activePlayer] + val };
    const newHistory = [...history, { player: activePlayer, value: val }];

    setScores(newScores);
    setHistory(newHistory);
    setInputValue("");

    const win = selected.find(p => targets[p.id] && newScores[p.id] >= targets[p.id]);

    if (win) {
      // 🔥 FIX: eerst game opslaan
      setGames(prev => [...prev, { players: selected, winner: win }]);

      // daarna alles resetten
      setTimeout(() => {
        setCurrentGame(false);
        setSelected([]);
        setScores({});
        setHistory([]);
        setUndoStack([]);
      }, 50);

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

  const avatar = (p) => p.photo ? (
    <img src={p.photo} style={{ width: 50, height: 50, borderRadius: '50%' }} />
  ) : (
    <div style={{ width:50, height:50, borderRadius:'50%', background:'#e2e8f0', display:'flex', alignItems:'center', justifyContent:'center' }}>+</div>
  );

  const stats = (p) => {
    const played = games.filter(g => g.players?.find(x => x.id === p.id));
    const wins = played.filter(g => g.winner && g.winner.id === p.id);
    return wins.length;
  };

  return (
    <div style={{ padding: 20, background: '#f1f5f9' }}>

      {/* HEADER */}
      <div style={{ textAlign: "center", marginBottom: 20 }}>
        <div style={{
          display: "inline-block",
          padding: "14px 28px",
          borderRadius: 20,
          background: "linear-gradient(135deg, #2563eb, #22c55e)",
          color: "white",
          fontSize: 30,
          fontWeight: "800",
          boxShadow: "0 0 25px rgba(37,99,235,0.5)"
        }}>
          🎱 Carambole John, David, Bjarni & Friends
        </div>
      </div>

      {!currentGame && (
        <div>
          <h3>Spelers</h3>
          {players.map(p => (
            <div key={p.id} style={{ display:'flex', alignItems:'center', gap:10, marginBottom:10 }}>

              <label style={{ cursor:'pointer' }}>
                {avatar(p)}
                <input type="file" style={{display:'none'}} onChange={(e)=>updatePlayerPhoto(p.id,e.target.files[0])} />
              </label>

              <div style={{ fontSize:18, fontWeight:600 }}>{p.name}</div>
              <div>🏆 {stats(p)}</div>

            </div>
          ))}

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

                {/* SCROLL FIX */}
                <div style={{ maxHeight:120, overflowY:'auto', fontSize:14 }}>
                  {history.filter(h=>h.player===p.id).map((h,i)=>(
                    <div key={i}>+{h.value}</div>
                  ))}
                </div>

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
