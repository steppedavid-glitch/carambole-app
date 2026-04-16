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
  const [active, setActive] = useState(null);
  const [input, setInput] = useState("");
  const [games, setGames] = useState([]);
  const [undoStack, setUndoStack] = useState([]);

  // FOTO NIEUW
  const handlePhoto = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => setPhoto(reader.result);
    reader.readAsDataURL(file);
  };

  // FOTO UPDATE
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

  // SPELER TOEVOEGEN
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

  // START GAME
  const startGame = () => {
    const init = {};
    selected.forEach(p => (init[p.id] = 0));

    setScores(init);
    setActive(selected[0].id);
    setGame(true);
    setUndoStack([]);
  };

  // SCORE
  const submitScore = () => {
    const val = Number(input || 0);

    setUndoStack(prev => [
      ...prev,
      { scores: { ...scores }, active }
    ]);

    const newScores = {
      ...scores,
      [active]: scores[active] + val
    };

    const win = selected.find(
      p => targets[p.id] && newScores[p.id] >= targets[p.id]
    );

    if (win) {
      setGames(prev => [...prev, { players: selected, winner: win }]);

      setGame(false);
      setSelected([]);
      setTargets({});
      setScores({});
      setActive(null);
      setInput("");
      return;
    }

    setScores(newScores);
    setInput("");

    const next = selected.find(p => p.id !== active)?.id;
    setActive(next);
  };

  const undo = () => {
    const last = undoStack.pop();
    if (!last) return;

    setScores(last.scores);
    setActive(last.active);
    setUndoStack([...undoStack]);
  };

  // 📊 STATS
  const getStats = (player) => {
    const played = games.filter(g =>
      g.players.find(p => p.id === player.id)
    );

    const wins = played.filter(g => g.winner.id === player.id);

    const winRate = played.length
      ? Math.round((wins.length / played.length) * 100)
      : 0;

    return {
      played: played.length,
      wins: wins.length,
      winRate
    };
  };

  // 🏆 RANKING
  const ranking = [...players].sort((a, b) => {
    return getStats(b).wins - getStats(a).wins;
  });

  const btn = {
    height: 80,
    fontSize: 32,
    borderRadius: 12
  };

  return (
    <div style={{ padding: 20, background: "#f1f5f9" }}>

      <h1 style={{ textAlign: "center" }}>
        🎱 Carambole Pro John Steppe
      </h1>

      {!game && (
        <div>

          {/* TOEVOEGEN */}
          <input value={name} onChange={e => setName(e.target.value)} />
          <input key={photoKey} type="file" onChange={handlePhoto} />
          <button onClick={addPlayer}>Toevoegen</button>

          {/* SPELERS */}
          {players.map(p => (
            <div key={p.id} style={{ display: "flex", gap: 10, marginTop: 10, alignItems: "center" }}>

              <label>
                {p.photo ? (
                  <img src={p.photo} style={{ width: 50, height: 50, borderRadius: "50%" }} />
                ) : (
                  <div style={{ width: 50, height: 50, background: "#ddd", borderRadius: "50%" }}>+</div>
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
              >
                {p.name}
              </button>

              {selected.find(x => x.id === p.id) && (
                <input
                  type="number"
                  placeholder="target"
                  onChange={e =>
                    setTargets({ ...targets, [p.id]: Number(e.target.value) })
                  }
                />
              )}
            </div>
          ))}

          {selected.length >= 2 && (
            <button onClick={startGame}>Start match</button>
          )}

          {/* 🏆 RANKING */}
          <h2 style={{ marginTop: 20 }}>🏆 Ranking</h2>

          {ranking.map((p, i) => {
            const s = getStats(p);

            return (
              <div key={p.id} style={{
                display: "flex",
                justifyContent: "space-between",
                padding: 10,
                marginBottom: 6,
                background: "#fff",
                borderRadius: 10
              }}>
                <div>
                  {i + 1}. {p.name}
                </div>

                <div>
                  🏆 {s.wins} | 🎯 {s.played} | {s.winRate}%
                </div>
              </div>
            );
          })}
        </div>
      )}

      {game && (
        <div>

          {/* SPELERS */}
          <div style={{ display: "flex", gap: 10 }}>
            {selected.map(p => (
              <div key={p.id} style={{
                flex: 1,
                padding: 10,
                borderRadius: 12,
                background: active === p.id ? "#22c55e" : "#e2e8f0"
              }}>
                {p.name}
                <div style={{ fontSize: 40 }}>{scores[p.id]}</div>
                <div>/ {targets[p.id]}</div>
              </div>
            ))}
          </div>

          <div style={{ textAlign: "center", fontSize: 40 }}>
            {input || 0}
          </div>

          {/* KEYPAD */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 10 }}>
            {[1,2,3,4,5,6,7,8,9].map(n => (
              <button key={n} style={btn} onClick={() => setInput(v => v + n)}>{n}</button>
            ))}
            <button style={{ ...btn, background: "#facc15" }} onClick={()=>setInput("")}>C</button>
            <button style={btn} onClick={()=>setInput(v=>v+"0")}>0</button>
            <button style={{ ...btn, background: "#22c55e", color: "white" }} onClick={submitScore}>OK</button>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 10 }}>
            <button style={{ ...btn, background: "#ef4444", color: "white" }} onClick={undo}>Undo</button>
            <button style={{ ...btn, background: "#3b82f6", color: "white" }} onClick={()=>setActive(selected.find(p=>p.id!==active)?.id)}>Beurt</button>
            <button style={{ ...btn, background: "#6b7280", color: "white" }} onClick={()=>setGame(false)}>New</button>
          </div>

        </div>
      )}
    </div>
  );
}
