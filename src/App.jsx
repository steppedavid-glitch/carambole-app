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

  // 🔥 ELITE STATS
  const getAdvancedStats = (player) => {

    const playedGames = games.filter(g =>
      g.players.find(p => p.id === player.id)
    );

    const wins = playedGames.filter(g => g.winner.id === player.id);

    const allTurns = history.filter(h => h.player === player.id);
    const totalPoints = allTurns.reduce((sum, t) => sum + t.value, 0);

    const moyenne = allTurns.length
      ? (totalPoints / allTurns.length).toFixed(2)
      : 0;

    const bestSeries = Math.max(0, ...allTurns.map(t => t.value));

    const vs = {};

    games.forEach(g => {
      if (!g.players.find(p => p.id === player.id)) return;

      const opponent = g.players.find(p => p.id !== player.id);
      if (!opponent) return;

      if (!vs[opponent.name]) {
        vs[opponent.name] = { wins: 0, played: 0 };
      }

      vs[opponent.name].played++;

      if (g.winner.id === player.id) {
        vs[opponent.name].wins++;
      }
    });

    let bestOpponent = "-";
    let bestRate = 0;

    Object.entries(vs).forEach(([name, stat]) => {
      const rate = stat.wins / stat.played;
      if (rate > bestRate) {
        bestRate = rate;
        bestOpponent = name;
      }
    });

    return {
      played: playedGames.length,
      wins: wins.length,
      winRate: playedGames.length
        ? Math.round((wins.length / playedGames.length) * 100)
        : 0,
      moyenne,
      bestSeries,
      vs,
      bestOpponent
    };
  };

  const ranking = [...players].sort((a, b) =>
    getAdvancedStats(b).wins - getAdvancedStats(a).wins
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

      <div style={{ textAlign: "center", marginBottom: 20 }}>
        <div style={{
          padding: "16px 30px",
          borderRadius: 20,
          background: "linear-gradient(135deg,#2563eb,#22c55e)",
          fontSize: 28,
          fontWeight: "800"
        }}>
          🎱 Carambole Pro John Steppe
        </div>
      </div>

      {!game && (
        <div>

          {/* ADD */}
          <div style={{ background: "#1e293b", padding: 15, borderRadius: 16 }}>
            <input value={name} onChange={e => setName(e.target.value)} />
            <input key={photoKey} type="file" onChange={handlePhoto} />
            <button onClick={addPlayer}>➕</button>
          </div>

          {/* PLAYERS */}
          {players.map(p => (
            <div key={p.id} style={{ display: "flex", gap: 10, marginTop: 10 }}>
              <label>
                {p.photo ? (
                  <img src={p.photo} style={{ width: 50, height: 50, borderRadius: "50%" }} />
                ) : (
                  <div style={{ width: 50, height: 50, background: "#334155", borderRadius: "50%" }}>+</div>
                )}
                <input type="file" hidden onChange={(e) => updatePhoto(p.id, e)} />
              </label>

              <button onClick={() =>
                setSelected(prev =>
                  prev.find(x => x.id === p.id)
                    ? prev.filter(x => x.id !== p.id)
                    : [...prev, p]
                )
              }>
                {p.name}
              </button>

              {selected.find(x => x.id === p.id) && (
                <input
                  type="number"
                  placeholder="🎯"
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

          {/* 🏆 ELITE RANKING */}
          <h2 style={{ marginTop: 20 }}>🏆 Elite Ranking</h2>

          {ranking.map((p, i) => {
            const s = getAdvancedStats(p);

            return (
              <div key={p.id} style={{
                padding: 14,
                marginBottom: 10,
                background: "#1e293b",
                borderRadius: 14
              }}>
                <div><b>{i + 1}. {p.name}</b></div>
                <div>🏆 {s.wins}/{s.played} ({s.winRate}%)</div>
                <div>🎯 Moyenne: {s.moyenne}</div>
                <div>🔥 Beste serie: {s.bestSeries}</div>
                <div>🥇 Beste tegenstander: {s.bestOpponent}</div>

                <div style={{ fontSize: 13 }}>
                  {Object.entries(s.vs).map(([name, stat]) => (
                    <div key={name}>
                      vs {name}: {stat.wins}/{stat.played}
                    </div>
                  ))}
                </div>
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
                background: active === p.id ? "#22c55e" : "#1e293b"
              }}>
                {p.name}
                <div style={{ fontSize: 48 }}>{scores[p.id]}</div>

                <div style={{ maxHeight: 120, overflow: "auto" }}>
                  {history.filter(h => h.player === p.id).map((h, i) => (
                    <div key={i}>+{h.value}</div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div style={{ textAlign: "center", fontSize: 48 }}>
            {input || 0}
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 10 }}>
            {[1,2,3,4,5,6,7,8,9].map(n => (
              <button key={n} style={btn} onClick={() => setInput(v => v + n)}>{n}</button>
            ))}
            <button style={{ ...btn, background:"#facc15" }} onClick={()=>setInput("")}>C</button>
            <button style={btn} onClick={()=>setInput(v=>v+"0")}>0</button>
            <button style={{ ...btn, background:"#22c55e" }} onClick={submitScore}>OK</button>
          </div>

          <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:10 }}>
            <button style={{ ...btn, background:"#ef4444" }} onClick={undo}>Undo</button>
            <button style={{ ...btn, background:"#3b82f6" }} onClick={()=>setActive(selected.find(p=>p.id!==active)?.id)}>Beurt</button>
            <button style={{ ...btn, background:"#6b7280" }} onClick={()=>setGame(false)}>New</button>
          </div>

        </div>
      )}

    </div>
  );
}
