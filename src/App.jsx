import React, { useState } from "react";

export default function App() {
  const [players, setPlayers] = useState([]);
  const [name, setName] = useState("");

  const addPlayer = () => {
    if (!name.trim()) return;

    setPlayers(prev => [
      ...prev,
      {
        id: crypto.randomUUID(),
        name: name.trim()
      }
    ]);

    setName("");
  };

  return (
    <div style={{ padding: 20 }}>
      <h1>Test spelers</h1>

      <input
        value={name}
        onChange={e => setName(e.target.value)}
        placeholder="Naam"
      />

      <button onClick={addPlayer}>Toevoegen</button>

      <div style={{ marginTop: 20 }}>
        {players.map(p => (
          <div key={p.id}>{p.name}</div>
        ))}
      </div>
    </div>
  );
}
