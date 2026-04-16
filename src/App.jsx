import React, { useState, useEffect } from "react";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";

export default function App() {
  const [players, setPlayers] = useState(() => JSON.parse(localStorage.getItem("players")) || []);
  const [games, setGames] = useState(() => JSON.parse(localStorage.getItem("games")) || []);

  const [newPlayer, setNewPlayer] = useState("");
  const [ballColor, setBallColor] = useState("white");
  const [photo, setPhoto] = useState(null);

  const [selected, setSelected] = useState([]);
  const [scores, setScores] = useState({});
  const [targets, setTargets] = useState({});
  const [history, setHistory] = useState([]);
  const [turns, setTurns] = useState(1);
  const [currentGame, setCurrentGame] = useState(false);
  const [activePlayer, setActivePlayer] = useState(null);
  const [inputValue, setInputValue] = useState("");

  useEffect(() => localStorage.setItem("players", JSON.stringify(players)), [players]);
  useEffect(() => localStorage.setItem("games", JSON.stringify(games)), [games]);

  const handlePhoto = (e) => {
    const file = e.target.files[0];
    const reader = new FileReader();
    reader.onload = () => setPhoto(reader.result);
    if (file) reader.readAsDataURL(file);
  };

  const addPlayer = () => {
    if (!newPlayer) return;
    setPlayers([...players, { name: newPlayer, id: Date.now(), color: ballColor, photo }]);
    setNewPlayer("");
    setPhoto(null);
  };

  const startGame = () => {
    const initScores = {};
    selected.forEach(p => initScores[p.id] = 0);
    setScores(initScores);
    setHistory([]);
    setTurns(1);
    setCurrentGame(true);
    setActivePlayer(selected[0].id);
  };

  const addDigit = (d) => setInputValue(prev => prev + d);
  const clearInput = () => setInputValue("");

  const submitScore = () => {
    const val = Number(inputValue || 0);

    const newScores = {
      ...scores,
      [activePlayer]: scores[activePlayer] + val
    };

    const newHistory = [...history, {
      turn: turns,
      ...Object.fromEntries(selected.map(p => [p.name, newScores[p.id]]))
    }];

    setScores(newScores);
    setHistory(newHistory);
    setInputValue("");

    const win = selected.find(p =>
      targets[p.id] && newScores[p.id] >= targets[p.id]
    );

    if (win) {
      const game = {
        players: selected,
        scores: newScores,
        winner: win,
        history: newHistory
      };

      setGames(prev => [...prev, game]);

      setCurrentGame(false);
      setSelected([]);
      setScores({});
      setHistory([]);
      setTurns(1);
      setInputValue("");

      return;
    }

    const next = selected.find(p => p.id !== activePlayer)?.id;
    setActivePlayer(next);
  };

  const nextTurn = () => setTurns(turns + 1);

  const avatar = (p) => (
    <div style={{ display: 'inline-block' }}>
      {p.photo && <img src={p.photo} alt="" width={40} height={40} style={{ borderRadius: '50%' }} />}
    </div>
  );

  const stats = (p) => {
    const played = games.filter(g => g.players?.find(x => x.id === p.id));
    const wins = played.filter(g => g.winner && g.winner.id === p.id);
    const percentage = played.length ? Math.round((wins.length / played.length) * 100) : 0;
    return { played: played.length, wins: wins.length, percentage };
  };

  const ranking = [...players]
    .map(p => ({ name: p.name, wins: stats(p).wins }))
    .sort((a, b) => b.wins - a.wins);

  const bestOpponent = (p) => {
    const opponents = players.filter(o => o.id !== p.id);
    let best = null;

    opponents.forEach(o => {
      const matches = games.filter(g =>
        g.players.find(x => x.id === p.id) &&
        g.players.find(x => x.id === o.id)
      );

      const wins = matches.filter(g => g.winner && g.winner.id === p.id).length;
      const perc = matches.length ? wins / matches.length : 0;

      if (!best || perc > best.perc) {
        best = { name: o.name, perc };
      }
    });

    return best;
  };

  return (
    <div style={{ padding: 20, background: '#f1f5f9' }}>

      <h1>🎱 Carambole John & David Steppe</h1>

      {!currentGame && (
        <div>

          <h3>Spelers</h3>
          {players.map(p => {
            const s = stats(p);
            const best = bestOpponent(p);

            return (
              <div key={p.id} style={{ marginBottom: 10 }}>
                {avatar(p)} {p.name}
                | 🎯 {s.played}
                | 🏆 {s.wins}
                | 📊 {s.percentage}%
                {best && <div>🔥 Beste tegen: {best.name} ({Math.round(best.perc * 100)}%)</div>}

                {/* GRAFIEK */}
                <ResponsiveContainer width="100%" height={100}>
                  <LineChart data={games.map((g, i) => ({
                    name: i + 1,
                    win: g.winner?.id === p.id ? 1 : 0
                  }))}>
                    <XAxis dataKey="name" hide />
                    <YAxis hide domain={[0,1]} />
                    <Tooltip />
                    <Line type="monotone" dataKey="win" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            );
          })}

          <h3>Ranking</h3>
          {ranking.map((r, i) => (
            <div key={i}>#{i + 1} {r.name} ({r.wins})</div>
          ))}

          <h3>Speler toevoegen</h3>
          <input value={newPlayer} onChange={e => setNewPlayer(e.target.value)} />
          <select value={ballColor} onChange={e => setBallColor(e.target.value)}>
            <option value="white">Wit</option>
            <option value="yellow">Geel</option>
          </select>
          <input type="file" onChange={handlePhoto} />
          <button onClick={addPlayer}>Toevoegen</button>

          <h3>Selecteer spelers</h3>
          {players.map(p => (
            <div key={p.id}>
              <button onClick={() => setSelected(prev => prev.find(x => x.id === p.id) ? prev.filter(x => x.id !== p.id) : [...prev, p])}>
                {p.name}
              </button>

              {selected.find(x => x.id === p.id) && (
                <input type="number" placeholder="target" value={targets[p.id] || ''} onChange={e => setTargets({ ...targets, [p.id]: Number(e.target.value) })} />
              )}
            </div>
          ))}

          {selected.length === 2 && <button onClick={startGame}>Start match</button>}
        </div>
      )}

      {currentGame && (
        <div>
          <div style={{ display: 'flex' }}>
            {selected.map(p => (
              <div key={p.id} style={{ flex: 1, textAlign: 'center', background: activePlayer === p.id ? '#22c55e' : '#e2e8f0' }}>
                <div>{p.name}</div>
                <div style={{ fontSize: 40 }}>{scores[p.id]}</div>
              </div>
            ))}
          </div>

          <div style={{ textAlign: 'center', fontSize: 36 }}>{inputValue || 0}</div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)' }}>
            {[1,2,3,4,5,6,7,8,9].map(n => (
              <button key={n} onClick={() => addDigit(n.toString())} style={{ height: 80, fontSize: 32 }}>{n}</button>
            ))}
            <button onClick={clearInput}>C</button>
            <button onClick={() => addDigit('0')}>0</button>
            <button onClick={submitScore}>OK</button>
          </div>

          <button onClick={nextTurn}>Beurt</button>
        </div>
      )}

    </div>
  );
}
