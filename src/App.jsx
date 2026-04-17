import React, { useState, useEffect } from "react";

export default function App() {

  // ---------- STATE ----------
  const [players, setPlayers] = useState([]);
  const [name, setName] = useState("");

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
    setPlayers(JSON.parse(localStorage.getItem("players")) || []);
    setGames(JSON.parse(localStorage.getItem("games")) || []);
  }, []);

  useEffect(() => {
    localStorage.setItem("players", JSON.stringify(players));
  }, [players]);

  useEffect(() => {
    localStorage.setItem("games", JSON.stringify(games));
  }, [games]);

  // ---------- PLAYER ----------
  const addPlayer = () => {
    if (!name.trim()) return;
    setPlayers(prev => [...prev, { id: crypto.randomUUID(), name }]);
    setName("");
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
    setActive(selected[(idx + 1) % selected.length].id);
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
    const playerTurns = history.filter(h => h.player === player.id);

    const total = playerTurns.reduce((sum, t) => sum + t.val, 0);

    return {
      moyenne: playerTurns.length ? (total / playerTurns.length).toFixed(2) : 0,
      best: Math.max(0, ...playerTurns.map(t => t.val))
    };
  };

  // ---------- UI ----------
  const btn = {
    height: 65,
    fontSize: 22,
    borderRadius: 10
  };

  return (
    <div style={{
      padding: 20,
      minHeight: "100vh",
      background: "linear-gradient(135deg,#0f172a,#1e293b)",
      color: "white"
    }}>

      <h1 style={{ textAlign: "center" }}>🎱 Carambole Elite</h1>

      {!game && (
        <>
          <input value={name} onChange={e => setName(e.target.value)} />
          <button onClick={addPlayer}>➕</button>

          {players.map(p => (
            <div key={p.id}>
              <button onClick={() => togglePlayer(p)}>
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
          <div style={{ display: "flex", gap: 10 }}>
            {selected.map(p => {

              const last = history.filter(h => h.player === p.id).slice(-3);
              const stats = getStats(p);

              return (
                <div key={p.id} style={{
                  flex: 1,
                  padding: 12,
                  borderRadius: 12,
                  background: active === p.id ? "#22c55e" : "#1e293b"
                }}>
                  <div>{p.name}</div>

                  <div style={{ fontSize: 32 }}>{scores[p.id]}</div>
                  <div>/ {targets[p.id]}</div>

                  <div style={{ fontSize: 12 }}>
                    Moy: {stats.moyenne} | Best: {stats.best}
                  </div>

                  {/* MINI GRAPH */}
                  <div style={{
                    display: "flex",
                    gap: 2,
                    marginTop: 6,
                    height: 30
                  }}>
                    {history
                      .filter(h => h.player === p.id)
                      .slice(-10)
                      .map((h, i) => (
                        <div key={i} style={{
                          width: 6,
                          height: h.val * 5,
                          background: "#38bdf8"
                        }} />
                      ))}
                  </div>

                  {last.map((h,i)=>(
                    <div key={i}>+{h.val}</div>
                  ))}

                </div>
              );
            })}
          </div>

          <div style={{ textAlign: "center", fontSize: 36 }}>
            {input || 0}
          </div>

          {/* KEYPAD */}
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(3,1fr)",
            gap: 10
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
  );
}
