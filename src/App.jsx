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
    const storedPlayers = localStorage.getItem("players");
    const storedGames = localStorage.getItem("games");

    if (storedPlayers) setPlayers(JSON.parse(storedPlayers));
    if (storedGames) setGames(JSON.parse(storedGames));
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
      setPlayers((prev) =>
        prev.map((p) =>
          p.id === id ? { ...p, photo: reader.result } : p
        )
      );
    };

    reader.readAsDataURL(file);
    e.target.value = "";
  };

  const addPlayer = () => {
    if (!name.trim()) return;

    setPlayers((prev) => [
      ...prev,
      {
        id: crypto.randomUUID(),
        name: name.trim(),
        photo: photo || null,
      },
    ]);

    setName("");
    setPhoto(null);
    setPhotoKey((k) => k + 1);
  };

  const togglePlayer = (player) => {
    setSelected((prev) =>
      prev.find((p) => p.id === player.id)
        ? prev.filter((p) => p.id !== player.id)
        : [...prev, player]
    );
  };

  // ---------------- GAME ----------------
  const startGame = () => {
    const initScores = {};
    const newTargets = {};
    const newColors = {};

    selected.forEach((p, index) => {
      initScores[p.id] = 0;
      newTargets[p.id] = index === 0 ? 10 : 20;
      newColors[p.id] = index === 0 ? "white" : "yellow";
    });

    setScores(initScores);
    setTargets(newTargets);
    setColors(newColors);
    setHistory([]);
    setUndoStack([]);
    setActive(selected[0].id);
    setGame(true);
  };

  const submitScore = () => {
    const value = Number(input || 0);

    setUndoStack((prev) => [
      ...prev,
      { scores: { ...scores }, history: [...history], active },
    ]);

    const updatedScores = {
      ...scores,
      [active]: scores[active] + value,
    };

    const updatedHistory = [
      ...history,
      { player: active, value },
    ];

    const winner = selected.find(
      (p) => updatedScores[p.id] >= targets[p.id]
    );

    if (winner) {
      setGames((prev) => [...prev, { players: selected, winner }]);
      resetGame();
      return;
    }

    setScores(updatedScores);
    setHistory(updatedHistory);
    setInput("");

    const next =
      selected.find((p) => p.id !== active)?.id || active;

    setActive(next);
  };

  const undo = () => {
    if (!undoStack.length) return;

    const last = undoStack[undoStack.length - 1];

    setScores(last.scores);
    setHistory(last.history);
    setActive(last.active);
    setUndoStack((prev) => prev.slice(0, -1));
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

  // ---------------- STATS ----------------
  const getStats = (player) => {
    const played = games.filter((g) =>
      g.players.find((p) => p.id === player.id)
    );

    const wins = played.filter(
      (g) => g.winner.id === player.id
    );

    return {
      played: played.length,
      wins: wins.length,
      winRate: played.length
        ? Math.round((wins.length / played.length) * 100)
        : 0,
    };
  };

  const ranking = [...players].sort(
    (a, b) => getStats(b).wins - getStats(a).wins
  );

  // ---------------- UI ----------------
  const btn = {
    height: 80,
    fontSize: 30,
    borderRadius: 14,
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
          padding: "16px 32px",
          borderRadius: 20,
          background: "linear-gradient(135deg,#2563eb,#22c55e)",
          fontSize: 28,
          fontWeight: "bold",
          boxShadow: "0 0 25px rgba(37,99,235,0.6)"
        }}>
          🎱 Carambole Pro
        </div>
      </div>

      {!game && (
        <>
          {/* ADD PLAYER */}
          <div style={{
            background: "#1e293b",
            padding: 16,
            borderRadius: 16,
            marginBottom: 20
          }}>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Naam speler"
              style={{ padding: 10, marginRight: 10 }}
            />

            <input key={photoKey} type="file" onChange={handlePhoto} />

            <button onClick={addPlayer}>➕</button>
          </div>

          {/* PLAYERS */}
          {players.map((p) => (
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
                    background: "#334155"
                  }} />
                )}

                <input type="file" hidden onChange={(e) => updatePhoto(p.id, e)} />
              </label>

              <button
                onClick={() => togglePlayer(p)}
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
            </div>
          ))}

          {selected.length >= 2 && (
            <button
              onClick={startGame}
              style={{
                width: "100%",
                padding: 16,
                background: "#2563eb",
                borderRadius: 14
              }}
            >
              ▶️ Start match
            </button>
          )}

          {/* RANKING */}
          <h2 style={{ marginTop: 20 }}>🏆 Ranking</h2>

          {ranking.map((p, i) => {
            const s = getStats(p);
            return (
              <div key={p.id} style={{
                padding: 12,
                marginBottom: 6,
                background: "#1e293b",
                borderRadius: 12
              }}>
                {i + 1}. {p.name} — {s.wins}W ({s.winRate}%)
              </div>
            );
          })}
        </>
      )}

      {game && (
        <>
          {/* SCORE */}
          <div style={{ display: "flex", gap: 10 }}>
            {selected.map((p) => (
              <div key={p.id} style={{
                flex: 1,
                padding: 14,
                borderRadius: 14,
                background: active === p.id ? "#22c55e" : "#1e293b",
                boxShadow: active === p.id ? "0 0 15px #22c55e" : "none"
              }}>
                <div>
                  {colors[p.id] === "white" ? "⚪" : "🟡"} {p.name}
                </div>

                <div style={{ fontSize: 42 }}>{scores[p.id]}</div>

                <div>/ {targets[p.id]}</div>

                <div style={{ maxHeight: 100, overflow: "auto" }}>
                  {history.filter(h => h.player === p.id).map((h, i) => (
                    <div key={i}>+{h.value}</div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div style={{ textAlign: "center", fontSize: 42 }}>
            {input || 0}
          </div>

          {/* KEYPAD */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 10 }}>
            {[1,2,3,4,5,6,7,8,9].map(n => (
              <button key={n} style={btn} onClick={() => setInput(v => v + n)}>{n}</button>
            ))}
            <button style={{ ...btn, background:"#facc15" }} onClick={()=>setInput("")}>C</button>
            <button style={btn} onClick={()=>setInput(v=>v+"0")}>0</button>
            <button style={{ ...btn, background:"#22c55e" }} onClick={submitScore}>OK</button>
          </div>

          <button onClick={undo}>Undo</button>
          <button onClick={resetGame}>New match</button>
        </>
      )}
    </div>
  );
}
