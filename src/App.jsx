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
      const p = JSON.parse(localStorage.getItem("players")) || [];
      const g = JSON.parse(localStorage.getItem("games")) || [];
      setPlayers(p);
      setGames(g);
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

  // ---------- PLAYER ----------
  const handlePhoto = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => setPhoto(reader.result);
    reader.readAsDataURL(file);
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

    const winner = selected.find(
      p => newScores[p.id] >= targets[p.id]
    );

    if (winner) {
      setGames(prev => [...prev, { players: selected, winner }]);
      resetGame();
      return;
    }

    setScores(newScores);
    setHistory(newHistory);
    setInput("");

    const next = selected.find(p => p.id !== active);
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

  // ---------- UI ----------
  const card = {
    background: "#1e293b",
    padding: 16,
    borderRadius: 16,
    marginBottom: 12
  };

  const btn = {
    padding: 14,
    borderRadius: 12,
    fontSize: 18
  };

  return (
    <div style={{
      minHeight: "100vh",
      padding: 20,
      background: "linear-gradient(135deg,#0f172a,#1e293b)",
      color: "white"
    }}>

      {/* HEADER */}
      <div style={{ textAlign: "center", marginBottom: 30 }}>
        <div style={{
          padding: "14px 28px",
          borderRadius: 16,
          background: "linear-gradient(135deg,#2563eb,#22c55e)",
          fontSize: 26,
          fontWeight: "bold"
        }}>
          🎱 Carambole Pro
        </div>
      </div>

      {/* START SCREEN */}
      {!game && (
        <>
          <div style={card}>
            <input
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="Naam speler"
              style={{ padding: 10, marginRight: 10 }}
            />

            <input type="file" onChange={handlePhoto} />

            <button onClick={addPlayer} style={btn}>
              ➕
            </button>
          </div>

          {players.map(p => (
            <div key={p.id} style={{
              ...card,
              display: "flex",
              alignItems: "center",
              gap: 12
            }}>
              {p.photo && (
                <img src={p.photo} style={{
                  width: 50,
                  height: 50,
                  borderRadius: "50%"
                }} />
              )}

              <button
                onClick={() => togglePlayer(p)}
                style={{
                  ...btn,
                  flex: 1,
                  background: selected.find(x => x.id === p.id)
                    ? "#22c55e"
                    : "#334155"
                }}
              >
                {p.name}
              </button>
            </div>
          ))}

          {selected.length >= 2 && (
            <button onClick={startGame} style={{
              ...btn,
              width: "100%",
              background: "#2563eb"
            }}>
              ▶️ Start match
            </button>
          )}
        </>
      )}

      {/* GAME */}
      {game && (
        <>
          <div style={{ display: "flex", gap: 10 }}>
            {selected.map(p => {

              const last = history.filter(h => h.player === p.id).slice(-3);

              return (
                <div key={p.id} style={{
                  ...card,
                  flex: 1,
                  background: active === p.id ? "#22c55e" : "#1e293b"
                }}>
                  <div style={{ fontSize: 18 }}>{p.name}</div>

                  <div style={{ fontSize: 40 }}>
                    {scores[p.id]}
                  </div>

                  <div>/ {targets[p.id]}</div>

                  {last.map((h,i)=>(
                    <div key={i}>+{h.val}</div>
                  ))}
                </div>
              );
            })}
          </div>

          <div style={{ textAlign: "center", fontSize: 40 }}>
            {input || 0}
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 10 }}>
            {[1,2,3,4,5,6,7,8,9].map(n => (
              <button key={n} style={btn} onClick={()=>setInput(v=>v+n)}>{n}</button>
            ))}
            <button style={btn} onClick={()=>setInput("")}>C</button>
            <button style={btn} onClick={()=>setInput(v=>v+"0")}>0</button>
            <button style={{...btn, background:"#22c55e"}} onClick={submitScore}>OK</button>
          </div>

          <button onClick={undo} style={{...btn, marginTop:10}}>Undo</button>
          <button onClick={resetGame} style={{...btn, marginTop:10}}>Nieuwe match</button>
        </>
      )}
    </div>
  );
}
