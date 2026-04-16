import React, { useState, useEffect } from "react";

export default function App() {
  const [players, setPlayers] = useState(() => JSON.parse(localStorage.getItem("players")) || []);
  const [games, setGames] = useState(() => JSON.parse(localStorage.getItem("games")) || []);
  const [newPlayer, setNewPlayer] = useState("");

  useEffect(() => localStorage.setItem("players", JSON.stringify(players)), [players]);
  useEffect(() => localStorage.setItem("games", JSON.stringify(games)), [games]);

  const addPlayer = () => {
    if (!newPlayer) return;
    setPlayers([...players, { name: newPlayer, id: Date.now() }]);
    setNewPlayer("");
  };

  const addGame = (p1, p2, winner) => {
    setGames([...games, { p1, p2, winner }]);
  };

  const getStats = (player) => {
    const played = games.filter(g => g.p1 === player || g.p2 === player);
    const wins = games.filter(g => g.winner === player);
    return {
      played: played.length,
      wins: wins.length,
      rate: played.length ? ((wins.length / played.length) * 100).toFixed(0) : 0
    };
  };

  return (
    <div style={{ padding: 20 }}>
      <h1>🎱 Carambole Tracker</h1>

      <h2>Spelers</h2>
      <input value={newPlayer} onChange={e => setNewPlayer(e.target.value)} />
      <button onClick={addPlayer}>Toevoegen</button>

      {players.map(p => {
        const s = getStats(p.name);
        return (
          <div key={p.id}>
            {p.name} | 🎯 {s.played} | 🏆 {s.wins} | {s.rate}%
          </div>
        );
      })}

      <h2>Simuleer match</h2>
      {players.length >= 2 && (
        <button onClick={() => addGame(players[0].name, players[1].name, players[0].name)}>
          {players[0].name} wint van {players[1].name}
        </button>
      )}
    </div>
  );
}
