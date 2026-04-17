import React, { useState, useEffect } from "react";

export default function App() {

  // ---------- STATE ----------
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

  // ---------- STORAGE ----------
  useEffect(() => {
    setPlayers(JSON.parse(localStorage.getItem("players")) || []);
    setGames(JSON.parse(localStorage.getItem("games")) || []);
  }, []);

  useEffect(() => {
    localStorage.setItem("players", JSON.stringify(players));
  }, [players]);

  useEffect(() => {
    localStorage.setItem("games", JSON.stringify(games));
  }, [games]);

  // ---------- PHOTO ----------
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
  };

  // ---------- PLAYER ----------
  const addPlayer = () => {
    if (!name.trim()) return;

    setPlayers(prev => [
      ...prev,
      {
        id: crypto.randomUUID(),
        name,
        photo: photo || null
      }
    ]);

    setName("");
    setPhoto(null);
    setPhotoKey(k => k + 1);
  };

  const togglePlayer = (p) => {
    setSelected(prev =>
      prev.find(x => x.id === p.id)
        ? prev.filter(x => x.id !== p.id)
        : [...prev, p]
    );
  };

  // ---------- GAME ----------
  const startGame = () => {
    if (selected.length < 2) return;

    const s = {};
    selected.forEach(p => s[p.id] = 0);

    setScores(s);
    setHistory([]);
    setUndoStack([]);
    setActive(selected[0].id);
    setGame(true);
  };

  const submitScore = () => {
    const val = Number(input);
    if (isNaN(val)) return;

    const newScores = {
      ...scores,
      [active]: scores[active] + val
    };

    const newHistory = [...history, { player: active, val }];

    const winner = selected.find(p =>
      targets[p.id] && newScores[p.id] >= targets[p.id]
    );

    if (winner) {
      setGames(prev => [...prev, { players: selected, winner }]);

      setTimeout(() => {
        resetGame();
      }, 50);

      return;
    }

    setScores(newScores);
    setHistory(newHistory);
    setInput("");

    const idx = selected.findIndex(p => p.id === active);
    const next = selected[(idx + 1) % selected.length];
    setActive(next.id);
  };

  const undo = () => {
    if (!undoStack.length) return;

    const last = undoStack[undoStack.length - 1];
    setScores(last.scores);
    setHistory(last.history);
    setActive(last.active);
    setUndoStack(prev => prev.slice(0, -1));
  };

  const resetGame = () => {
    setGame(false);
    setSelected([]);
    setTargets({});
    setScores({});
    setHistory([]);
    setActive(null);
    setInput("");
  };

  // ---------- STATS ----------
  const getStats = (player) => {
    const played = games.filter(g =>
      g.players.find(p => p.id === player.id)
    );

    const wins = played.filter(g => g.winner.id === player.id);

    return {
      wins: wins.length,
      played: played.length,
      winRate: played.length
        ? Math.round((wins.length / played.length) * 100)
        : 0
    };
  };

  const getHeadToHead = () => {
    const results = {};

    games.forEach(g => {
      if (g.players.length !== 2) return;

      const [p1, p2] = g.players;
      const key = [p1.name, p2.name].sort().join(" vs ");

      if (!results[key]) {
        results[key] = { p1: p1.name, p2: p2.name, w1: 0, w2: 0 };
      }

      if (g.winner.id === p1.id) results[key].w1++;
      else results[key].w2++;
    });

    return Object.values(results);
  };

  const ranking = [...players].sort(
    (a, b) => getStats(b).wins - getStats(a).wins
  );

  const btn = {
    height: 55,
    fontSize: 20,
    borderRadius: 10,
    width: "100%"
  };

  return (
    <div style={{
      minHeight: "100vh",
      padding: 20,
      background: "linear-gradient(135deg,#0f172a,#1e293b)",
      color: "white",
      display: "flex",
      justifyContent: "center"
    }}>

      <div style={{ width: "100%", maxWidth: 900 }}>

        {/* HEADER */}
        <div style={{ textAlign: "center", marginBottom: 30 }}>
          <div style={{
            padding: "16px 32px",
            borderRadius: 20,
            background: "linear-gradient(135deg,#2563eb,#22c55e)",
            fontSize: 28,
            fontWeight: "bold",
            boxShadow: "0 0 25px rgba(37,99,235,0.6)"
          }}>
            🎱 Carambole John, David & Bjarni
          </div>
        </div>

        {/* START */}
        {!game && (
          <>
            {/* ADD */}
            <div style={{
              background: "#1e293b",
              padding: 20,
              borderRadius: 16,
              marginBottom: 20,
              display: "flex",
              gap: 10,
              alignItems: "center"
            }}>
              <input
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="Nieuwe speler"
                style={{ flex: 1, padding: 12, borderRadius: 10 }}
              />

              <input key={photoKey} type="file" onChange={handlePhoto} />

              <button onClick={addPlayer} style={{
                background: "#22c55e",
                padding: "10px 16px",
                borderRadius: 10
              }}>➕</button>
            </div>

            {/* PLAYERS */}
            {players.map(p => {
              const isSelected = selected.find(x => x.id === p.id);

              return (
                <div key={p.id} style={{
                  background: "#1e293b",
                  padding: 14,
                  borderRadius: 12,
                  marginBottom: 10,
                  display: "flex",
                  alignItems: "center",
                  gap: 10
                }}>
                  <label>
                    {p.photo ? (
                      <img src={p.photo} style={{
                        width: 50,
                        height: 50,
                        borderRadius: "50%",
                        objectFit: "cover"
                      }} />
                    ) : (
                      <div style={{
                        width: 50,
                        height: 50,
                        borderRadius: "50%",
                        background: "#334155",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center"
                      }}>📸</div>
                    )}
                    <input type="file" hidden onChange={(e)=>updatePhoto(p.id,e)} />
                  </label>

                  <div style={{ flex: 1 }}>{p.name}</div>

                  {isSelected && (
                    <input
                      type="number"
                      placeholder="🎯"
                      onChange={e =>
                        setTargets({
                          ...targets,
                          [p.id]: Number(e.target.value)
                        })
                      }
                      style={{ width: 70 }}
                    />
                  )}

                  <button onClick={() => togglePlayer(p)} style={{
                    background: isSelected ? "#22c55e" : "#334155",
                    padding: "8px 12px",
                    borderRadius: 8
                  }}>
                    {isSelected ? "✓" : "Selecteer"}
                  </button>
                </div>
              );
            })}

            {selected.length >= 2 && (
              <button onClick={startGame} style={{
                width: "100%",
                padding: 16,
                marginTop: 20,
                borderRadius: 12,
                background: "#2563eb"
              }}>
                ▶️ Start match
              </button>
            )}

            {/* RANKING */}
            <h3 style={{ marginTop: 30 }}>🏆 Ranking</h3>
            {ranking.map((p,i)=>{
              const s = getStats(p);
              return (
                <div key={p.id}>
                  {i+1}. {p.name} — {s.wins}W ({s.winRate}%)
                </div>
              );
            })}

            {/* HEAD TO HEAD */}
            <h3 style={{ marginTop: 30 }}>🤝 Onderlinge duels</h3>
            {getHeadToHead().map((m, i) => (
              <div key={i}>
                {m.p1} vs {m.p2} → {m.w1} - {m.w2}
              </div>
            ))}
          </>
        )}

        {/* GAME */}
        {game && (
          <>
            <div style={{ display: "flex", gap: 10 }}>
              {selected.map(p => (
                <div key={p.id} style={{
                  flex: 1,
                  padding: 10,
                  borderRadius: 10,
                  background: active === p.id ? "#22c55e" : "#1e293b"
                }}>
                  {p.name}
                  <div style={{ fontSize: 28 }}>{scores[p.id]}</div>
                  <div>/ {targets[p.id]}</div>
                </div>
              ))}
            </div>

            <div style={{ textAlign: "center", fontSize: 32 }}>
              {input || 0}
            </div>

            <div style={{
              display: "grid",
              gridTemplateColumns: "repeat(3,1fr)",
              gap: 8
            }}>
              {[1,2,3,4,5,6,7,8,9].map(n => (
                <button key={n} style={btn} onClick={()=>setInput(v=>v+n)}>{n}</button>
              ))}

              <button style={{...btn, background:"#facc15"}} onClick={()=>setInput("")}>C</button>
              <button style={btn} onClick={()=>setInput(v=>v+"0")}>0</button>
              <button style={{...btn, background:"#22c55e"}} onClick={submitScore}>OK</button>

              <button style={{...btn, background:"#ef4444"}} onClick={undo}>Undo</button>
              <button style={{...btn, background:"#3b82f6"}} onClick={()=>{
                const idx = selected.findIndex(p => p.id === active);
                setActive(selected[(idx + 1) % selected.length].id);
              }}>Beurt</button>
              <button style={{...btn, background:"#6b7280"}} onClick={resetGame}>New</button>
            </div>
          </>
        )}

      </div>
    </div>
  );
}
