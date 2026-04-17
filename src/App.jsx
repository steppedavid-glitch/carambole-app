import React, { useState, useEffect } from "react";

export default function App() {

  // ---------- STATE ----------
  const [players, setPlayers] = useState([]);
  const [name, setName] = useState("");
  const [photo, setPhoto] = useState(null);

  const [selected, setSelected] = useState([]);
  const [game, setGame] = useState(false);

  const [scores, setScores] = useState({});
  const [targets, setTargets] = useState({});
  const [history, setHistory] = useState([]);
  const [active, setActive] = useState(null);
  const [input, setInput] = useState("");

  const [games, setGames] = useState([]);
  const [undoStack, setUndoStack] = useState([]);

  // ---------- STORAGE ----------
  useEffect(() => {
    try {
      setPlayers(JSON.parse(localStorage.getItem("players")) || []);
      setGames(JSON.parse(localStorage.getItem("games")) || []);
    } catch {
      setPlayers([]);
      setGames([]);
    }
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
        photo
      }
    ]);

    setName("");
    setPhoto(null);
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
    const t = {};

    selected.forEach((p, i) => {
      s[p.id] = 0;
      t[p.id] = i === 0 ? 10 : 20;
    });

    setScores(s);
    setTargets(t);
    setHistory([]);
    setUndoStack([]);
    setActive(selected[0].id);
    setGame(true);
  };

  const submitScore = () => {
    const val = Number(input);
    if (isNaN(val)) return;

    setUndoStack(prev => [...prev, { scores, history, active }]);

    const newScores = {
      ...scores,
      [active]: scores[active] + val
    };

    const newHistory = [...history, { player: active, val }];

    const winner = selected.find(p => newScores[p.id] >= targets[p.id]);

    if (winner) {
      setGames(prev => [...prev, { players: selected, winner }]);
      resetGame();
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
    setScores({});
    setTargets({});
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

  const ranking = [...players].sort(
    (a, b) => getStats(b).wins - getStats(a).wins
  );

  const btn = {
    height: 70,
    fontSize: 24,
    borderRadius: 12,
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
            🎱 Carambole Elite
          </div>
        </div>

        {/* START */}
        {!game && (
          <>
            <div style={{
              background: "#1e293b",
              padding: 20,
              borderRadius: 16,
              marginBottom: 20,
              display: "flex",
              gap: 10
            }}>
              <input value={name} onChange={e => setName(e.target.value)} style={{ flex: 1, padding: 10 }} />
              <input type="file" onChange={handlePhoto} />
              <button onClick={addPlayer}>➕</button>
            </div>

            {players.map(p => (
              <div key={p.id} style={{
                background: "#1e293b",
                padding: 14,
                borderRadius: 12,
                marginBottom: 10,
                display: "flex",
                alignItems: "center",
                gap: 10
              }}>
                {p.photo && <img src={p.photo} style={{ width: 50, height: 50, borderRadius: "50%" }} />}
                <button onClick={() => togglePlayer(p)} style={{ flex: 1 }}>
                  {p.name}
                </button>
                <input type="file" onChange={(e)=>updatePhoto(p.id,e)} />
              </div>
            ))}

            {selected.length >= 2 && (
              <button onClick={startGame} style={{ width: "100%", padding: 14 }}>
                ▶️ Start match
              </button>
            )}

            <h3>🏆 Ranking</h3>
            {ranking.map((p,i)=>{
              const s = getStats(p);
              return (
                <div key={p.id}>
                  {i+1}. {p.name} — {s.wins}W ({s.winRate}%)
                </div>
              );
            })}
          </>
        )}

        {/* GAME */}
        {game && (
          <>
            <div style={{ display: "flex", gap: 10 }}>
              {selected.map(p => (
                <div key={p.id} style={{
                  flex: 1,
                  padding: 14,
                  borderRadius: 14,
                  background: active === p.id ? "#22c55e" : "#1e293b",
                  boxShadow: active === p.id ? "0 0 15px #22c55e" : "none"
                }}>
                  {p.photo && <img src={p.photo} style={{ width: 40, borderRadius: "50%" }} />}
                  <div>{p.name}</div>
                  <div style={{ fontSize: 40 }}>{scores[p.id]}</div>
                  <div>/ {targets[p.id]}</div>
                </div>
              ))}
            </div>

            <div style={{ textAlign: "center", fontSize: 40 }}>
              {input || 0}
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 10 }}>
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
