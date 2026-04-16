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

  // FOTO NIEUW
  const handlePhoto = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => setPhoto(reader.result);
    reader.readAsDataURL(file);

    e.target.value = "";
  };

  // FOTO UPDATE
  const updatePlayerPhoto = (id, file, input) => {
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      setPlayers(prev => prev.map(p => p.id === id ? { ...p, photo: reader.result } : p));
    };

    reader.readAsDataURL(file);
    if (input) input.value = "";
  };

  // SPELER TOEVOEGEN
  const addPlayer = () => {
    if (!newPlayer.trim()) return;

    setPlayers(prev => [
      ...prev,
      {
        id: Date.now() + Math.random(),
        name: newPlayer,
        photo: photo || null
      }
    ]);

    setNewPlayer("");
    setPhoto(null);
    const input = document.getElementById("newPlayerPhoto");
    if (input) input.value = "";
  };

  const startGame = () => {
    const init = {};
    selected.forEach(p => init[p.id] = 0);

    setScores(init);
    setHistory([]);
    setUndoStack([]);
    setActivePlayer(selected[0].id);
    setCurrentGame(true);
  };

  const submitScore = () => {
    const val = Number(inputValue || 0);

    setUndoStack(prev => [...prev, {
      scores: { ...scores },
      history: [...history],
      activePlayer
    }]);

    const newScores = {
      ...scores,
      [activePlayer]: scores[activePlayer] + val
    };

    const newHistory = [...history, { player: activePlayer, value: val }];

    setScores(newScores);
    setHistory(newHistory);
    setInputValue("");

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
    setActivePlayer(last.activePlayer);
    setUndoStack([...undoStack]);
  };

  const stats = (p) => {
    const played = games.filter(g => g.players.find(x => x.id === p.id));
    const wins = played.filter(g => g.winner && g.winner.id === p.id);
    return wins.length;
  };

  const avatar = (p) => (
    <label style={{ cursor: "pointer" }}>
      {p.photo ? (
        <img src={p.photo} style={{ width: 50, height: 50, borderRadius: "50%" }} />
      ) : (
        <div style={{ width: 50, height: 50, borderRadius: "50%", background: "#e2e8f0", display: "flex", alignItems: "center", justifyContent: "center" }}>+</div>
      )}
      <input type="file" style={{ display: "none" }} onChange={(e) => updatePlayerPhoto(p.id, e.target.files[0], e.target)} />
    </label>
  );

  return (
    <div style={{ padding: 20, background: "#f1f5f9" }}>

      <div style={{ textAlign: "center", marginBottom: 20 }}>
        <div style={{
          display: "inline-block",
          padding: "14px 28px",
          borderRadius: 20,
          background: "linear-gradient(135deg,#2563eb,#22c55e)",
          color: "white",
          fontSize: 28,
          fontWeight: "800"
        }}>
          🎱 Carambole Pro John Steppe
        </div>
      </div>

      {!currentGame && (
        <div>
          <h3>Spelers</h3>
          {players.map(p => (
            <div key={p.id} style={{ display: "flex", gap: 10, alignItems: "center", marginBottom: 10 }}>
              {avatar(p)}
              <div>{p.name}</div>
              <div>🏆 {stats(p)}</div>
            </div>
          ))}

          <h3>Toevoegen</h3>
          <input value={newPlayer} onChange={e => setNewPlayer(e.target.value)} />
          <input id="newPlayerPhoto" type="file" onChange={handlePhoto} />
          <button onClick={addPlayer}>Add</button>

          <h3>Selecteer spelers</h3>
          {players.map(p => (
            <div key={p.id}>
              <button onClick={() => setSelected(prev =>
                prev.find(x => x.id === p.id)
                  ? prev.filter(x => x.id !== p.id)
                  : [...prev, p]
              )}>
                {p.name}
              </button>

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

          {selected.length >= 2 && <button onClick={startGame}>Start</button>}
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

                <div style={{ maxHeight: 100, overflow: "auto", fontSize: 14 }}>
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
              <button key={n} onClick={() => setInputValue(v => v + n)} style={{ height: 80, fontSize: 32 }}>{n}</button>
            ))}
            <button style={{ height:80, fontSize:32 }} onClick={()=>setInputValue("")}>C</button>
            <button style={{ height:80, fontSize:32 }} onClick={()=>setInputValue(v=>v+"0")}>0</button>
            <button style={{ height:80, fontSize:32 }} onClick={submitScore}>OK</button>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 10 }}>
            <button style={{ height:80 }} onClick={undo}>Undo</button>
            <button style={{ height:80 }} onClick={()=>setActivePlayer(selected.find(p=>p.id!==activePlayer)?.id)}>Beurt</button>
            <button style={{ height:80 }} onClick={()=>setCurrentGame(false)}>New</button>
          </div>

        </div>
      )}

    </div>
  );
}
