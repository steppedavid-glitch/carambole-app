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

    const newPlayer = {
      id: crypto.randomUUID(),
      name: name.trim(),
      photo: photo || null
    };

    setPlayers(prev => [...prev, newPlayer]);

    setName("");
    setPhoto(null);
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

    setUndoStack(prev => [
      ...prev,
      { scores, history, active }
    ]);

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
  return (
    <div style={{
      padding: 20,
      background: "#0f172a",
      minHeight: "100vh",
      color: "white"
    }}>

      <h1 style={{ textAlign: "center" }}>
        🎱 Carambole
      </h1>

      {/* ---------- START SCREEN ---------- */}
      {!game && (
        <>
          <div style={{ marginBottom: 20 }}>
            <input
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="Speler naam"
            />

            <input type="file" onChange={handlePhoto} />

            <button onClick={addPlayer}>Toevoegen</button>
          </div>

          {players.map(p => (
            <div key={p.id} style={{ marginBottom: 10 }}>

              <img
                src={p.photo || ""}
                alt=""
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: "50%",
                  objectFit: "cover",
                  background: "#444"
                }}
              />

              <button onClick={() => togglePlayer(p)}>
                {p.name}
              </button>

              <input
                type="file"
                onChange={(e) => updatePhoto(p.id, e)}
              />

            </div>
          ))}

          {selected.length >= 2 && (
            <button onClick={startGame}>
              Start match
            </button>
          )}
        </>
      )}

      {/* ---------- GAME ---------- */}
      {game && (
        <>
          <div style={{ display: "flex", gap: 10 }}>
            {selected.map(p => {

              const playerHistory =
                history.filter(h => h.player === p.id).slice(-3);

              return (
                <div key={p.id} style={{
                  flex: 1,
                  background: active === p.id ? "#22c55e" : "#333",
                  padding: 10
                }}>
                  {p.name}

                  <div style={{ fontSize: 30 }}>
                    {scores[p.id]}
                  </div>

                  <div>
                    / {targets[p.id]}
                  </div>

                  {playerHistory.map((h, i) => (
                    <div key={i}>+{h.val}</div>
                  ))}

                </div>
              );
            })}
          </div>

          <div style={{ fontSize: 30 }}>
            {input || 0}
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)" }}>
            {[1,2,3,4,5,6,7,8,9].map(n => (
              <button key={n} onClick={()=>setInput(v=>v+n)}>{n}</button>
            ))}
            <button onClick={()=>setInput("")}>C</button>
            <button onClick={()=>setInput(v=>v+"0")}>0</button>
            <button onClick={submitScore}>OK</button>
          </div>

          <button onClick={undo}>Undo</button>
          <button onClick={resetGame}>Nieuwe match</button>
        </>
      )}
    </div>
  );
}
