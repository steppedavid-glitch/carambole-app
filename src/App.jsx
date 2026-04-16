import React, { useState, useEffect } from "react";

export default function App() {
  const [players, setPlayers] = useState(() => JSON.parse(localStorage.getItem("players")) || []);
  const [games, setGames] = useState(() => JSON.parse(localStorage.getItem("games")) || []);

  const [newPlayer, setNewPlayer] = useState("");
  const [photo, setPhoto] = useState(null);
  const [photoKey, setPhotoKey] = useState(0);

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
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => setPhoto(reader.result);
    reader.readAsDataURL(file);
  };

  const updatePlayerPhoto = (id, e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      setPlayers(prev => prev.map(p => p.id === id ? { ...p, photo: reader.result } : p));
    };

    reader.readAsDataURL(file);
    e.target.value = "";
  };

  const addPlayer = () => {
    if (!newPlayer.trim()) return;

    const newP = {
      id: crypto.randomUUID(),
      name: newPlayer.trim(),
      photo: photo || null
    };

    setPlayers(prev => [...prev, newP]);

    setNewPlayer("");
    setPhoto(null);
    setPhotoKey(prev => prev + 1);
  };

  const startGame = () => {
    const init = {};
    selected.forEach(p => (init[p.id] = 0));

    setScores(init);
    setHistory([]);
    setUndoStack([]);
    setActivePlayer(selected[0].id);
    setCurrentGame(true);
  };

  const submitScore = () => {
    const val = Number(inputValue || 0);

    const snapshot = {
      scores: { ...scores },
      history: [...history],
      activePlayer
    };

    setUndoStack(prev => [...prev, snapshot]);

    const newScores = {
      ...scores,
      [activePlayer]: scores[activePlayer] + val
    };

    const newHistory = [...history, { player: activePlayer, value: val }];

    const win = selected.find(p => targets[p.id] && newScores[p.id] >= targets[p.id]);

    if (win) {
      setGames(prev => [...prev, { players: selected, winner: win }]);

      setCurrentGame(false);
      setSelected([]);
      setScores({});
      setHistory([]);
      setUndoStack([]);
      setTargets({});
      setActivePlayer(null);
      setInputValue("");
      return;
    }

    setScores(newScores);
    setHistory(newHistory);
    setInputValue("");

    const next = selected.find(p => p.id !== activePlayer)?.id;
    setActivePlayer(next);
  };

  const undo = () => {
    const last = undoStack.pop();
    if (!last) return;

    setScores(last.scores);
    setHistory(last.history);
    setActivePlayer(last.activePlayer);
    setUndoStack([...undoStack]);
  };

  const stats = (p) => {
    const played = games.filter(g => g.players.find(x => x.id === p.id));
    const wins = played.filter(g => g.winner?.id === p.id);
    return wins.length;
  };

  const avatar = (p) => (
    <label style={{ cursor: "pointer" }}>
      {p.photo ? (
        <img src={p.photo} style={{ width: 60, height: 60, borderRadius: "50%" }} />
      ) : (
        <div style={{ width: 60, height: 60, borderRadius: "50%", background: "#e2e8f0", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24 }}>+</div>
      )}
      <input type="file" style={{ display: "none" }} onChange={(e) => updatePlayerPhoto(p.id, e)} />
    </label>
  );

  const bigBtn = {
    padding: 14,
    fontSize: 18,
    borderRadius: 12,
    marginTop: 8
  };

  return (
    <div style={{ padding: 20, background: "#f1f5f9" }}>

      <div style={{ textAlign: "center", marginBottom: 20 }}>
        <div style={{
          display: "inline-block",
          padding: "16px 30px",
          borderRadius: 20,
          background: "linear-gradient(135deg,#2563eb,#22c55e)",
          color: "white",
          fontSize: 32,
          fontWeight: "800"
        }}>
          🎱 Carambole Pro John Steppe
        </div>
      </div>

      {!currentGame && (
        <div>

          <h2 style={{ fontSize: 24 }}>Spelers</h2>
          {players.map(p => (
            <div key={p.id} style={{ display: "flex", gap: 12, alignItems: "center", marginBottom: 12 }}>
              {avatar(p)}
              <div style={{ fontSize: 20, fontWeight: 600 }}>{p.name}</div>
              <div style={{ fontSize: 18 }}>🏆 {stats(p)}</div>
            </div>
          ))}

          <h2 style={{ fontSize: 24 }}>Toevoegen</h2>
          <input style={{ fontSize: 18, padding: 8 }} value={newPlayer} onChange={e => setNewPlayer(e.target.value)} />
          <input key={photoKey} type="file" onChange={handlePhoto} />
          <br />
          <button style={{ ...bigBtn, background: "#22c55e", color: "white" }} onClick={addPlayer}>Toevoegen</button>

          <h2 style={{ fontSize: 24 }}>Selecteer spelers</h2>
          {players.map(p => (
            <div key={p.id}>
              <button
                style={{ ...bigBtn, width: "100%", background: selected.find(x=>x.id===p.id)?"#22c55e":"white" }}
                onClick={() => setSelected(prev =>
                  prev.find(x => x.id === p.id)
                    ? prev.filter(x => x.id !== p.id)
                    : [...prev, p]
                )}
              >
                {p.name}
              </button>

              {selected.find(x => x.id === p.id) && (
                <input
                  style={{ fontSize: 18, padding: 6 }}
                  type="number"
                  placeholder="target"
                  value={targets[p.id] || ""}
                  onChange={e => setTargets({ ...targets, [p.id]: Number(e.target.value) })}
                />
              )}
            </div>
          ))}

          {selected.length >= 2 && (
            <button style={{ ...bigBtn, background: "#2563eb", color: "white" }} onClick={startGame}>
              Start match
            </button>
          )}
        </div>
      )}

      {currentGame && (
        <div>

          <div style={{ display: "flex", gap: 10 }}>
            {selected.map(p => (
              <div key={p.id} style={{ flex: 1, padding: 10, background: activePlayer === p.id ? "#22c55e" : "#e2e8f0", borderRadius: 12 }}>
                {avatar(p)}
                <div>{p.name}</div>
                <div style={{ fontSize: 40 }}>{scores[p.id]}</div>

                <div style={{ maxHeight: 100, overflow: "auto" }}>
                  {history.filter(h => h.player === p.id).map((h, i) => (
                    <div key={i}>+{h.value}</div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div style={{ textAlign: "center", fontSize: 36 }}>{inputValue || 0}</div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 10 }}>
            {[1,2,3,4,5,6,7,8,9].map(n => (
              <button key={n} style={{ height: 80, fontSize: 32 }} onClick={() => setInputValue(v => v + n)}>{n}</button>
            ))}
            <button style={{ height:80, fontSize:32, background:"#facc15" }} onClick={()=>setInputValue("")}>C</button>
            <button style={{ height:80, fontSize:32 }} onClick={()=>setInputValue(v=>v+"0")}>0</button>
            <button style={{ height:80, fontSize:32, background:"#22c55e", color:"white" }} onClick={submitScore}>OK</button>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 10 }}>
            <button style={{ height:80, background:"#ef4444", color:"white" }} onClick={undo}>Undo</button>
            <button style={{ height:80, background:"#3b82f6", color:"white" }} onClick={()=>setActivePlayer(selected.find(p=>p.id!==activePlayer)?.id)}>Beurt</button>
            <button style={{ height:80, background:"#6b7280", color:"white" }} onClick={()=>setCurrentGame(false)}>New</button>
          </div>

        </div>
      )}

    </div>
  );
}
