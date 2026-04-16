import React, { useState } from "react";

export default function App() {
  const [players, setPlayers] = useState([]);
  const [name, setName] = useState("");
  const [photo, setPhoto] = useState(null);
  const [photoKey, setPhotoKey] = useState(0);

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

  return (
    <div style={{ padding: 20 }}>

      <h1>Spelers</h1>

      {/* TOEVOEGEN */}
      <div style={{ marginBottom: 20 }}>
        <input
          value={name}
          onChange={e => setName(e.target.value)}
          placeholder="Naam"
          style={{ fontSize: 18, padding: 6 }}
        />

        <input
          key={photoKey}
          type="file"
          onChange={handlePhoto}
        />

        <button
          onClick={addPlayer}
          style={{ padding: 10, fontSize: 16 }}
        >
          Toevoegen
        </button>
      </div>

      {/* LIJST */}
      {players.map(p => (
        <div key={p.id} style={{ display: "flex", gap: 10, marginBottom: 10 }}>

          <label style={{ cursor: "pointer" }}>
            {p.photo ? (
              <img
                src={p.photo}
                style={{ width: 50, height: 50, borderRadius: "50%" }}
              />
            ) : (
              <div style={{
                width: 50,
                height: 50,
                borderRadius: "50%",
                background: "#ddd",
                display: "flex",
                alignItems: "center",
                justifyContent: "center"
              }}>
                +
              </div>
            )}

            <input
              type="file"
              style={{ display: "none" }}
              onChange={(e) => updatePhoto(p.id, e)}
            />
          </label>

          <div style={{ fontSize: 18 }}>
            {p.name}
          </div>

        </div>
      ))}

    </div>
  );
}
