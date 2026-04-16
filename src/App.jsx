import React, { useState } from "react";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";

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
      turn: history.length + 1,
      player: active,
      value: val,
      total: newScores[active]
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

  // 📊 grafiek data
  const chartData = history.map((h, i) => {
    const obj = { turn: i + 1 };
    selected.forEach(p => {
      const last = history
        .filter(x => x.player === p.id && x.turn <= h.turn)
        .slice(-1)[0];

      obj[p.name] = last ? last.total : 0;
    });
    return obj;
  });

  const getStats = (player) => {
    const played = games.filter(g =>
      g.players.find(p => p.id === player.id)
    );
    const wins = played.filter(g => g.winner.id === player.id);
    const winRate = played.length
      ? Math.round((wins.length / played.length) * 100)
      : 0;

    return { played: played.length, wins: wins.length, winRate };
  };

  const ranking = [...players].sort((a, b) =>
    getStats(b).wins - getStats(a).wins
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

      <h1 style={{ textAlign: "center" }}>
        🎱 Carambole Pro John Steppe
      </h1>

      {!game && (
        <div>

          <input value={name} onChange={e => setName(e.target.value)} />
          <input key={photoKey} type="file" onChange={handlePhoto} />
          <button onClick={addPlayer}>➕</button>

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
            <button onClick={startGame}>Start</button>
          )}

          <h2>🏆 Ranking</h2>
          {ranking.map((p, i) => {
            const s = getStats(p);
            return (
              <div key={p.id}>
                {i + 1}. {p.name} — {s.wins}W / {s.played} ({s.winRate}%)
              </div>
            );
          })}
        </div>
      )}

      {game && (
        <div>

          {/* SCORE */}
          <div style={{ display: "flex", gap: 10 }}>
            {selected.map(p => (
              <div key={p.id} style={{
                flex: 1,
                padding: 10,
                borderRadius: 12,
                background: active === p.id ? "#22c55e" : "#1e293b"
              }}>
                {p.name}
                <div style={{ fontSize: 40 }}>{scores[p.id]}</div>
              </div>
            ))}
          </div>

          {/* 📈 GRAFIEK */}
          <div style={{ height: 200, marginTop: 20 }}>
            <ResponsiveContainer>
              <LineChart data={chartData}>
                <XAxis dataKey="turn" />
                <YAxis />
                <Tooltip />
                {selected.map(p => (
                  <Line key={p.id} type="monotone" dataKey={p.name} stroke="#22c55e" />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div style={{ textAlign: "center", fontSize: 40 }}>
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
