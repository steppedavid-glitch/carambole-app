import React, { useState, useEffect } from "react";

export default function App() {

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

  // LOAD
  useEffect(() => {
    const p = localStorage.getItem("players");
    const g = localStorage.getItem("games");

    if (p) setPlayers(JSON.parse(p));
    if (g) setGames(JSON.parse(g));
  }, []);

  // SAVE
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

  // 🎯 START GAME MET AUTO TARGET + KLEUR
  const startGame = () => {
    const init = {};
    const newTargets = {};
    const newColors = {};

    selected.forEach((p, i) => {
      init[p.id] = 0;
      newTargets[p.id] = i === 0 ? 10 : 20;
      newColors[p.id] = i === 0 ? "white" : "yellow";
    });

    setScores(init);
    setTargets(newTargets);
    setColors(newColors);
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
      p => newScores[p.id] >= targets[p.id]
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

  return (
    <div style={{
      minHeight: "100vh",
      padding: 20,
      background: "#0f172a",
      color: "white"
    }}>

      <h1 style={{ textAlign: "center" }}>
        🎱 Carambole
      </h1>

      {!game && (
        <div>

          {/* ADD */}
          <input value={name} onChange={e => setName(e.target.value)} />
          <input key={photoKey} type="file" onChange={handlePhoto} />
          <button onClick={addPlayer}>➕</button>

          {/* PLAYERS */}
          {players.map(p => (
            <div key={p.id} style={{ display: "flex", gap: 10, marginTop: 10 }}>

              <label>
                {p.photo ? (
                  <img src={p.photo} style={{ width: 50, height: 50, borderRadius: "50%" }} />
                ) : (
                  <div style={{ width: 50, height: 50, background: "#444", borderRadius: "50%" }} />
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

          {selected.length >= 2 && (
            <button onClick={startGame}>Start match</button>
          )}

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
                background: active === p.id ? "#22c55e" : "#333"
              }}>
                <div>
                  {colors[p.id] === "white" ? "⚪" : "🟡"} {p.name}
                </div>

                <div style={{ fontSize: 40 }}>{scores[p.id]}</div>
                <div>/ {targets[p.id]}</div>

                <div style={{ maxHeight: 100, overflow: "auto" }}>
                  {history.filter(h => h.player === p.id).map((h, i) => (
                    <div key={i}>+{h.value}</div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div style={{ fontSize: 40 }}>{input || 0}</div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)" }}>
            {[1,2,3,4,5,6,7,8,9].map(n => (
              <button key={n} onClick={() => setInput(v => v + n)}>{n}</button>
            ))}
            <button onClick={()=>setInput("")}>C</button>
            <button onClick={()=>setInput(v=>v+"0")}>0</button>
            <button onClick={submitScore}>OK</button>
          </div>

          <button onClick={undo}>Undo</button>
          <button onClick={()=>setGame(false)}>New</button>

        </div>
      )}

    </div>
  );
}
