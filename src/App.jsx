import React, { useState, useEffect } from "react";

export default function App() {

  // ---------- STATE ----------
  const [players, setPlayers] = useState([]);
  const [name, setName] = useState("");

  const [editingId, setEditingId] = useState(null);
  const [editingName, setEditingName] = useState("");

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
    setTargets(JSON.parse(localStorage.getItem("targets")) || {}); // ✅ toegevoegd
  }, []);

  useEffect(() => {
    localStorage.setItem("players", JSON.stringify(players));
  }, [players]);

  useEffect(() => {
    localStorage.setItem("games", JSON.stringify(games));
  }, [games]);

  useEffect(() => {
    localStorage.setItem("targets", JSON.stringify(targets)); // ✅ toegevoegd
  }, [targets]);

  // ---------- PLAYER ----------
  const addPlayer = () => {
    if (!name.trim()) return;

    setPlayers(prev => [...prev, { id: crypto.randomUUID(), name }]);
    setName("");
  };

  const updatePlayer = (id) => {
    setPlayers(prev =>
      prev.map(p =>
        p.id === id ? { ...p, name: editingName } : p
      )
    );
    setEditingId(null);
  };

  const deletePlayer = (id) => {
    setPlayers(prev => prev.filter(p => p.id !== id));
    setGames(prev =>
      prev.filter(g => !g.players.find(p => p.id === id))
    );
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
      setGames(prev => [
        ...prev,
        {
          players: selected,
          winner,
          history: newHistory
        }
      ]);

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
    // setTargets({}); ❌ verwijderd zodat targets blijven
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

  const getHighScores = () => {
    const scoresMap = {};

    games.forEach(g => {
      if (!g.history) return;

      g.history.forEach(h => {
        if (!scoresMap[h.player] || h.val > scoresMap[h.player]) {
          scoresMap[h.player] = h.val;
        }
      });
    });

    return players.map(p => ({
      name: p.name,
      score: scoresMap[p.id] || 0
    }))
    .sort((a, b) => b.score - a.score);
  };

  const getMoyennes = () => {
    const stats = {};

    games.forEach(g => {
      if (!g.history) return;

      g.history.forEach(h => {
        if (!stats[h.player]) {
          stats[h.player] = { total: 0, turns: 0 };
        }

        stats[h.player].total += h.val;
        stats[h.player].turns += 1;
      });
    });

    return players.map(p => {
      const s = stats[p.id];

      const avg = s && s.turns
        ? (s.total / s.turns).toFixed(2)
        : 0;

      return {
        name: p.name,
        avg: Number(avg)
      };
    })
    .sort((a, b) => b.avg - a.avg);
  };

  const ranking = [...players].sort(
  (a, b) => getStats(b).winRate - getStats(a).winRate
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

        {!game && (
          <>
            {/* ADD */}
            <div style={{
              background: "#1e293b",
              padding: 20,
              borderRadius: 16,
              marginBottom: 20,
              display: "flex",
              gap: 10
            }}>
              <input
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="Nieuwe speler"
                style={{ flex: 1, padding: 12, borderRadius: 10 }}
              />
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

                  {editingId === p.id ? (
                    <>
                      <input
                        value={editingName}
                        onChange={e => setEditingName(e.target.value)}
                        style={{ flex: 1 }}
                      />
                      <button onClick={() => updatePlayer(p.id)}>💾</button>
                    </>
                  ) : (
                    <>
                      <div style={{ flex: 1 }}>{p.name}</div>
                      <button onClick={() => {
                        setEditingId(p.id);
                        setEditingName(p.name);
                      }}>✏️</button>
                      <button onClick={() => deletePlayer(p.id)}>🗑</button>
                    </>
                  )}

                  {/* ✅ TARGET ALTijd zichtbaar */}
                  <input
                    type="number"
                    value={targets[p.id] || ""}
                    placeholder="🎯"
                    onChange={e =>
                      setTargets({
                        ...targets,
                        [p.id]: Number(e.target.value)
                      })
                    }
                    style={{ width: 70 }}
                  />

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

            {/* GRID STATS */}
            <div style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: 20,
              marginTop: 30
            }}>
              <div>
                <h3>🏆 Ranking</h3>
                {ranking.map((p,i)=>(
                  <div key={p.id}>
  {i+1}. {p.name} — {getStats(p).wins}W - {getStats(p).played - getStats(p).wins}V ({getStats(p).winRate}%)
</div>

              <div>
                <h3>🔥 Hoogste score</h3>
                {getHighScores().map((p,i)=>(
                  <div key={i}>{i+1}. {p.name} — {p.score}</div>
                ))}
              </div>

              <div>
                <h3>🎯 Moyenne</h3>
                {getMoyennes().map((p,i)=>(
                  <div key={i}>{i+1}. {p.name} — {p.avg}</div>
                ))}
              </div>

              <div>
                <h3>🤝 Duels</h3>
                {getHeadToHead().map((m,i)=>(
                  <div key={i}>{m.p1} vs {m.p2} → {m.w1}-{m.w2}</div>
                ))}
              </div>
            </div>
          </>
        )}

        {/* GAME */}
        {game && (
          <>
            <div style={{ display: "flex", gap: 10 }}>
              {selected.map(p => {

                const playerHistory = history.filter(h => h.player === p.id);
                const lastThree = playerHistory.slice(-3);

                return (
                  <div key={p.id} style={{
                    flex: 1,
                    padding: 10,
                    borderRadius: 10,
                    background:
                      active === p.id
                        ? selected.findIndex(x => x.id === p.id) === 0
                          ? "#facc15"
                          : "#ffffff"
                        : "#1e293b",
                    color:
                      active === p.id &&
                      selected.findIndex(x => x.id === p.id) === 1
                        ? "#000000"
                        : "white"
                  }}>
                    {p.name}
                    <div style={{ fontSize: 28 }}>{scores[p.id]}</div>
                    <div>/ {targets[p.id]}</div>

                    <div style={{
                      marginTop: 6,
                      maxHeight: 80,
                      overflowY: "auto",
                      background: "rgba(0,0,0,0.2)",
                      borderRadius: 6,
                      padding: 4
                    }}>
                      {lastThree.map((h, i) => (
                        <div key={i}>
                          +{h.val}
                        </div>
                      ))}
                    </div>

                  </div>
                );
              })}
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
              <button style={{...btn, background:"#be185d", color:"#ffffff"}} onClick={()=>setActive(selected[(selected.findIndex(p => p.id === active)+1)%selected.length].id)}>Beurt</button>
              <button style={{...btn, background:"#6b7280"}} onClick={resetGame}>New</button>
            </div>
          </>
        )}

      </div>
    </div>
  );
}
