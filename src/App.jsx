import React, { useState } from "react";

export default function App() {

  const [players, setPlayers] = useState([]);
  const [name, setName] = useState("");
  const [photo, setPhoto] = useState(null);
  const [photoKey, setPhotoKey] = useState(0);

  const [selected, setSelected] = useState([]);
  const [targets, setTargets] = useState({});
  const [game, setGame] = useState(false);
  const [scores, setScores] = useState({});
  const [history, setHistory] = useState([]);
  const [active, setActive] = useState(null);
  const [input, setInput] = useState("");
  const [games, setGames] = useState([]);
  const [undoStack, setUndoStack] = useState([]);

  // FOTO
  const handlePhoto = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => setPhoto(reader.result);
    reader.readAsDataURL(file);
  };

  const updatePhoto = (id, e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      setPlayers(prev =>
        prev.map(p =>
          p.id === id ? { ...p, photo: reader.result } : p
        )
      );
    };

    reader.readAsDataURL(file);
    e.target.value = "";
  };

  const addPlayer = () => {
    if (!name.trim()) return;

    setPlayers(prev => [
      ...prev,
      {
        id: crypto.randomUUID(),
        name: name.trim(),
        photo: photo || null
      }
    ]);

    setName("");
    setPhoto(null);
    setPhotoKey(prev => prev + 1);
  };

  const startGame = () => {
    const init = {};
    selected.forEach(p => init[p.id] = 0);

    setScores(init);
    setHistory([]);
    setUndoStack([]);
    setActive(selected[0].id);
    setGame(true);
  };

  const submitScore = () => {
    const val = Number(input || 0);

    setUndoStack(prev => [...prev, {
      scores: { ...scores },
      history: [...history],
      active
    }]);

    const newScores = {
      ...scores,
      [active]: scores[active] + val
    };

    const newHistory = [...history, {
      player: active,
      value: val
    }];

    const win = selected.find(
      p => targets[p.id] && newScores[p.id] >= targets[p.id]
    );

    if (win) {
      setGames(prev => [...prev, { players: selected, winner: win }]);

      setGame(false);
      setSelected([]);
      setTargets({});
      setScores({});
      setHistory([]);
      setActive(null);
      setInput("");
      return;
    }

    setScores(newScores);
    setHistory(newHistory);
    setInput("");

    const next = selected.find(p => p.id !== active)?.id;
    setActive(next);
  };

  const undo = () => {
    const last = undoStack.pop();
    if (!last) return;

    setScores(last.scores);
    setHistory(last.history);
    setActive(last.active);
    setUndoStack([...undoStack]);
  };

  const getStats = (player) => {
    const played = games.filter(g =>
      g.players.find(p => p.id === player.id)
    );

    const wins = played.filter(g => g.winner.id === player.id);

    const winRate = played.length
      ? Math.round((wins.length / played.length) * 100)
      : 0;

    return { played: played.length, wins: wins.length, winRate };
  };

  const ranking = [...players].sort((a, b) =>
    getStats(b).wins - getStats(a).wins
  );

  const btn = {
    height: 80,
    fontSize: 28,
    borderRadius: 12
  };

  return (
    <div style={{
      minHeight: "100vh",
      padding: 20,
      background: "linear-gradient(135deg,#0f172a,#1e293b)",
      color: "white"
    }}>

      {/* HEADER */}
      <div style={{ textAlign: "center", marginBottom: 20 }}>
        <div style={{
          padding: "16px 30px",
          borderRadius: 20,
          background: "linear-gradient(135deg,#2563eb,#22c55e)",
          fontSize: 28,
          fontWeight: "800",
          display: "inline-block",
          boxShadow: "0 0 20px rgba(37,99,235,0.6)"
        }}>
          🎱 Carambole Pro John Steppe
        </div>
      </div>

      {!game && (
        <div>

          {/* ADD */}
          <div style={{
            background: "#1e293b",
            padding: 15,
            borderRadius: 16,
            marginBottom: 20
          }}>
            <input
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="Naam speler"
              style={{ padding: 10, marginRight: 10 }}
            />

            <input key={photoKey} type="file" onChange={handlePhoto} />

            <button onClick={addPlayer} style={{
              marginLeft: 10,
              padding: 10,
              background: "#22c55e",
              borderRadius: 10,
              color: "white"
            }}>
              ➕
            </button>
          </div>

          {/* PLAYERS */}
          {players.map(p => (
            <div key={p.id} style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              padding: 12,
              marginBottom: 10,
              background: "#1e293b",
              borderRadius: 14
            }}>

              <label>
                {p.photo ? (
                  <img src={p.photo} style={{
                    width: 60,
                    height: 60,
                    borderRadius: "50%",
                    border: "2px solid #22c55e"
                  }} />
                ) : (
                  <div style={{
                    width: 60,
                    height: 60,
                    borderRadius: "50%",
                    background: "#334155",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center"
                  }}>+</div>
                )}

                <input type="file" hidden onChange={(e) => updatePhoto(p.id, e)} />
              </label>

              <button
                onClick={() =>
                  setSelected(prev =>
                    prev.find(x => x.id === p.id)
                      ? prev.filter(x => x.id !== p.id)
                      : [...prev, p]
                  )
                }
                style={{
                  flex: 1,
                  padding: 10,
                  borderRadius: 10,
                  background: selected.find(x => x.id === p.id)
                    ? "#22c55e"
                    : "#334155",
                  color: "white"
                }}
              >
                {p.name}
              </button>

              {selected.find(x => x.id === p.id) && (
                <input
                  type="number"
                  placeholder="🎯"
                  style={{ width: 60 }}
                  onChange={e =>
                    setTargets({ ...targets, [p.id]: Number(e.target.value) })
                  }
                />
              )}
            </div>
          ))}

          {selected.length >= 2 && (
            <button onClick={startGame} style={{
              width: "100%",
              padding: 16,
              background: "#2563eb",
              borderRadius: 14,
              fontSize: 18
            }}>
              ▶️ Start match
            </button>
          )}

          {/* RANKING */}
          <h2 style={{ marginTop: 20 }}>🏆 Ranking</h2>

          {ranking.map((p, i) => {
            const s = getStats(p);
            return (
              <div key={p.id} style={{
                display: "flex",
                justifyContent: "space-between",
                padding: 12,
                marginBottom: 8,
                background: "#1e293b",
                borderRadius: 12
              }}>
                <div>{i + 1}. {p.name}</div>
                <div>{s.wins}W / {s.played} | {s.winRate}%</div>
              </div>
            );
          })}
        </div>
      )}

      {game && (
        <div>

          <div style={{ display: "flex", gap: 10 }}>
            {selected.map(p => (
              <div key={p.id} style={{
                flex: 1,
                padding: 16,
                borderRadius: 16,
                background: active === p.id ? "#22c55e" : "#1e293b",
                boxShadow: active === p.id ? "0 0 20px #22c55e" : "none"
              }}>
                <div>{p.name}</div>
                <div style={{ fontSize: 48 }}>{scores[p.id]}</div>

                {/* SCOREVERLOOP */}
                <div style={{ maxHeight: 120, overflow: "auto", fontSize: 14 }}>
                  {history.filter(h => h.player === p.id).map((h, i) => (
                    <div key={i}>+{h.value}</div>
                  ))}
                </div>

              </div>
            ))}
          </div>

          <div style={{ textAlign: "center", fontSize: 48, margin: 20 }}>
            {input || 0}
          </div>

          {/* KEYPAD */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 10 }}>
            {[1,2,3,4,5,6,7,8,9].map(n => (
              <button key={n} style={btn} onClick={() => setInput(v => v + n)}>{n}</button>
            ))}
            <button style={{ ...btn, background:"#facc15" }} onClick={()=>setInput("")}>C</button>
            <button style={btn} onClick={()=>setInput(v=>v+"0")}>0</button>
            <button style={{ ...btn, background:"#22c55e", color:"white" }} onClick={submitScore}>OK</button>
          </div>

          <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:10 }}>
            <button style={{ ...btn, background:"#ef4444", color:"white" }} onClick={undo}>Undo</button>
            <button style={{ ...btn, background:"#3b82f6", color:"white" }} onClick={()=>setActive(selected.find(p=>p.id!==active)?.id)}>Beurt</button>
            <button style={{ ...btn, background:"#6b7280", color:"white" }} onClick={()=>setGame(false)}>New</button>
          </div>

        </div>
      )}

    </div>
  );
}
