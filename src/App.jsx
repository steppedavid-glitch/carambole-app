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
    selected.forEach(p => (init[p.id] = 0));

    setScores(init);
    setActive(selected[0].id);
    setGame(true);
  };

  const submitScore = () => {
    const val = Number(input || 0);

    const newScores = {
      ...scores,
      [active]: scores[active] + val
    };

    // 🏆 winnaar check
    const win = selected.find(
      p => targets[p.id] && newScores[p.id] >= targets[p.id]
    );

    if (win) {
      setGames(prev => [...prev, { players: selected, winner: win }]);

      // 🔄 reset (GEEN BUGS)
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

  return (
    <div style={{ padding: 20 }}>

      <h1>🎱 Carambole</h1>

      {!game && (
        <div>

          {/* TOEVOEGEN */}
          <div>
            <input value={name} onChange={e => setName(e.target.value)} />
            <input key={photoKey} type="file" onChange={handlePhoto} />
            <button onClick={addPlayer}>Toevoegen</button>
          </div>

          {/* SPELERS */}
          {players.map(p => (
            <div key={p.id} style={{ display: "flex", gap: 10, marginTop: 10 }}>

              <label>
                {p.photo ? (
                  <img src={p.photo} style={{ width: 40, height: 40 }} />
                ) : (
                  <div style={{ width: 40, height: 40, background: "#ddd" }}>+</div>
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

              {/* TARGET */}
              {selected.find(x => x.id === p.id) && (
                <input
                  type="number"
                  placeholder="target"
                  value={targets[p.id] || ""}
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

          {/* 🏆 STATS */}
          <h3>Resultaten</h3>
          {games.map((g, i) => (
            <div key={i}>
              {g.winner.name} won
            </div>
          ))}
        </div>
      )}

      {game && (
        <div>

          <div style={{ display: "flex", gap: 10 }}>
            {selected.map(p => (
              <div key={p.id} style={{
                padding: 10,
                background: active === p.id ? "#22c55e" : "#ddd"
              }}>
                {p.name}
                <div>{scores[p.id]}</div>
                <div>/ {targets[p.id]}</div>
              </div>
            ))}
          </div>

          <div style={{ fontSize: 30 }}>{input || 0}</div>

          <div>
            {[1,2,3,4,5,6,7,8,9].map(n => (
              <button key={n} onClick={() => setInput(v => v + n)}>{n}</button>
            ))}
            <button onClick={()=>setInput("")}>C</button>
            <button onClick={()=>setInput(v=>v+"0")}>0</button>
            <button onClick={submitScore}>OK</button>
          </div>

        </div>
      )}

    </div>
  );
}
