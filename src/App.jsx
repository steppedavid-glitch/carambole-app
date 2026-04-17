import React, { useState, useEffect } from "react";

export default function App() {

  // ---------------- STATE ----------------
  const [players, setPlayers] = useState([]);
  const [name, setName] = useState("");
  const [photo, setPhoto] = useState(null);
  const [photoKey, setPhotoKey] = useState(0);

  const [selected, setSelected] = useState([]);
  const [targets, setTargets] = useState({});
  const [colors, setColors] = useState({});
  const [game, setGame] = useState(false);

  const [scores, setScores] = useState({});
  const [history, setHistory] = useState([]);
  const [active, setActive] = useState(null);
  const [input, setInput] = useState("");

  const [games, setGames] = useState([]);
  const [undoStack, setUndoStack] = useState([]);

  // ---------------- STORAGE ----------------
  useEffect(() => {
    const p = localStorage.getItem("players");
    const g = localStorage.getItem("games");

    if (p) setPlayers(JSON.parse(p));
    if (g) setGames(JSON.parse(g));
  }, []);

  useEffect(() => {
    localStorage.setItem("players", JSON.stringify(players));
  }, [players]);

  useEffect(() => {
    localStorage.setItem("games", JSON.stringify(games));
  }, [games]);

  // ---------------- PLAYER ----------------
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
    setPhotoKey(k => k + 1);
  };

  const togglePlayer = (p) => {
    setSelected(prev =>
      prev.find(x => x.id === p.id)
        ? prev.filter(x => x.id !== p.id)
        : [...prev, p]
    );
  };

  // ---------------- GAME ----------------
  const startGame = () => {
    const s = {};
    const t = {};
    const c = {};

    selected.forEach((p, i) => {
      s[p.id] = 0;
      t[p.id] = i === 0 ? 10 : 20;
      c[p.id] = i === 0 ? "white" : "yellow";
    });

    setScores(s);
    setTargets(t);
    setColors(c);
    setHistory([]);
    setUndoStack([]);
    setActive(selected[0].id);
    setGame(true);
  };

  const submitScore = () => {
    const value = Number(input || 0);
    if (isNaN(value)) return;

    setUndoStack(prev => [...prev, {
      scores: { ...scores },
      history: [...history],
      active
    }]);

    const newScores = {
      ...scores,
      [active]: scores[active] + value
    };

    const newHistory = [...history, {
      player: active,
      value
    }];

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

    const next = selected.find(p => p.id !== active)?.id;
    setActive(next);
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
    setUndoStack([]);
  };

  // ---------------- UI ----------------
  const btn = {
    height: 80,
    fontSize: 30,
    borderRadius: 14
  };

  return (
    <div style={{
      minHeight: "100vh",
      padding: 20,
      background: "linear-gradient(135deg,#0f172a,#1e293b)",
      color: "white"
    }}>

      <h1 style={{ textAlign: "center" }}>🎱 Carambole Pro</h1>

      {!game && (
        <>
          <input value={name} onChange={e => setName(e.target.value)} />
          <input key={photoKey} type="file" onChange={handlePhoto} />
          <button onClick={addPlayer}>➕</button>

          {players.map(p => (
            <div key={p.id} style={{ display:"flex", gap:10, marginTop:10 }}>
              <label>
                {p.photo
                  ? <img src={p.photo} style={{width:50,height:50,borderRadius:"50%"}} />
                  : <div style={{width:50,height:50,background:"#444",borderRadius:"50%"}} />
                }
                <input type="file" hidden onChange={(e)=>updatePhoto(p.id,e)} />
              </label>

              <button onClick={()=>togglePlayer(p)}>
                {p.name}
              </button>
            </div>
          ))}

          {selected.length >= 2 && (
            <button onClick={startGame}>Start match</button>
          )}
        </>
      )}

      {game && (
        <>
          {/* SCORE */}
          <div style={{ display:"flex", gap:10 }}>
            {selected.map(p => {

              const playerHistory = history.filter(h => h.player === p.id);
              const lastThree = playerHistory.slice(-3);

              return (
                <div key={p.id} style={{
                  flex:1,
                  padding:12,
                  borderRadius:14,
                  background: active === p.id ? "#22c55e" : "#1e293b",
                  boxShadow: active === p.id ? "0 0 15px #22c55e" : "none"
                }}>

                  <div>
                    {colors[p.id] === "white" ? "⚪" : "🟡"} {p.name}
                  </div>

                  <div style={{ fontSize:42 }}>{scores[p.id]}</div>
                  <div>/ {targets[p.id]}</div>

                  {/* SCORE HISTORY */}
                  <div style={{
                    maxHeight:90,
                    overflowY:"auto",
                    marginTop:6
                  }}>
                    {lastThree.map((h,i)=>(
                      <div key={i} style={{
                        fontSize:16,
                        fontWeight: i === lastThree.length -1 ? "bold" : "normal"
                      }}>
                        +{h.value}
                      </div>
                    ))}

                    {playerHistory.length > 3 && (
                      <div style={{ fontSize:12, opacity:0.6 }}>
                        ... {playerHistory.length - 3} vorige
                      </div>
                    )}
                  </div>

                </div>
              );
            })}
          </div>

          <div style={{ textAlign:"center", fontSize:42, margin:10 }}>
            {input || 0}
          </div>

          {/* KEYPAD */}
          <div style={{
            position:"sticky",
            bottom:0,
            background:"#0f172a",
            paddingTop:10
          }}>
            <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:10 }}>
              {[1,2,3,4,5,6,7,8,9].map(n => (
                <button key={n} style={btn} onClick={()=>setInput(v=>v+n)}>{n}</button>
              ))}
              <button style={{...btn, background:"#facc15"}} onClick={()=>setInput("")}>C</button>
              <button style={btn} onClick={()=>setInput(v=>v+"0")}>0</button>
              <button style={{...btn, background:"#22c55e"}} onClick={submitScore}>OK</button>
            </div>

            <div style={{ display:"grid", gridTemplateColumns:"repeat(2,1fr)", gap:10, marginTop:10 }}>
              <button style={{...btn, background:"#ef4444"}} onClick={undo}>Undo</button>
              <button style={{...btn, background:"#3b82f6"}} onClick={resetGame}>New</button>
            </div>
          </div>

        </>
      )}
    </div>
  );
}
