import React, { useState, useEffect } from "react";

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

  // 🔥 LOAD DATA
  useEffect(() => {
    const savedPlayers = localStorage.getItem("players");
    const savedGames = localStorage.getItem("games");

    if (savedPlayers) setPlayers(JSON.parse(savedPlayers));
    if (savedGames) setGames(JSON.parse(savedGames));
  }, []);

  // 💾 SAVE DATA
  useEffect(() => {
    localStorage.setItem("players", JSON.stringify(players));
  }, [players]);

  useEffect(() => {
    localStorage.setItem("games", JSON.stringify(games));
  }, [games]);

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

    const winRate = playedGames.length
      ? Math.round((wins.length / playedGames.length) * 100)
      : 0;

    // 🔥 beste serie (alle gespeelde games)
    const playerTurns = games.flatMap(g =>
      (g.players.find(p => p.id === player.id) ? [] : [])
    );

    return {
      played: playedGames.length,
      wins: wins.length,
      winRate,
      moyenne: "-",
      bestSeries: "-",
      bestOpponent: "-"
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

      <div style={{ textAlign: "center", marginBottom: 30 }}>
        <div style={{
          padding: "18px 36px",
          borderRadius: 20,
          background: "linear-gradient(135deg,#2563eb,#22c55e)",
          fontSize: 32,
          fontWeight: "800",
          display: "inline-block",
          boxShadow: "0 0 30px rgba(37,99,235,0.7)"
        }}>
          🎱 Carambole John, David, Bjarni & Friends
        </div>
      </div>

      {!game && (
        <div>

          <div style={{
            background: "#1e293b",
            padding: 20,
            borderRadius: 18,
            marginBottom: 25
          }}>
            <input
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="Naam speler"
              style={{ padding: 12, fontSize: 16, marginRight: 10 }}
            />

            <input key={photoKey} type="file" onChange={handlePhoto} />

            <button onClick={addPlayer} style={{
              marginLeft: 10,
              padding: "10px 16px",
              background: "#22c55e",
              borderRadius: 10,
              color: "white"
            }}>
              ➕
            </button>
          </div>

          {players.map(p => (
            <div key={p.id} style={{
              display: "flex",
              alignItems: "center",
              gap: 14,
              padding: 14,
              marginBottom: 12,
              background: "#1e293b",
              borderRadius: 16
            }}>
              <label>
                {p.photo ? (
                  <img src={p.photo} style={{
                    width: 70,
                    height: 70,
                    borderRadius: "50%"
                  }} />
                ) : (
                  <div style={{
                    width: 70,
                    height: 70,
                    borderRadius: "50%",
                    background: "#334155"
                  }} />
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
            </div>
          ))}

          <h2>🏆 Ranking</h2>
          {ranking.map((p, i) => {
            const s = getAdvancedStats(p);
            return (
              <div key={p.id}>
                {i + 1}. {p.name} — {s.wins} wins ({s.winRate}%)
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
                background: active === p.id ? "#22c55e" : "#1e293b"
              }}>
                {p.name}
                <div style={{ fontSize: 48 }}>{scores[p.id]}</div>
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
            <button style={btn} onClick={()=>setInput("")}>C</button>
            <button style={btn} onClick={()=>setInput(v=>v+"0")}>0</button>
            <button style={btn} onClick={submitScore}>OK</button>
          </div>

        </div>
      )}

    </div>
  );
}
