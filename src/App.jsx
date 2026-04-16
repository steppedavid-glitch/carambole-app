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
  const [currentGame, setCurrentGame] = useState(false);
  const [activePlayer, setActivePlayer] = useState(null);
  const [inputValue, setInputValue] = useState("");

  useEffect(() => localStorage.setItem("players", JSON.stringify(players)), [players]);
  useEffect(() => localStorage.setItem("games", JSON.stringify(games)), [games]);

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
    setCurrentGame(true);
    setActivePlayer(selected[0].id);
  };

  const submitScore = () => {
    const val = Number(inputValue || 0);

    const newScores = {
      ...scores,
      [activePlayer]: scores[activePlayer] + val
    };

    setScores(newScores);
    setInputValue("");

    const win = selected.find(p => targets[p.id] && newScores[p.id] >= targets[p.id]);

    if (win) {
      setGames(prev => [...prev, {
        players: selected,
        scores: newScores,
        winner: win
      }]);

      setCurrentGame(false);
      setSelected([]);
      setScores({});
      return;
    }

    const next = selected.find(p => p.id !== activePlayer)?.id;
    setActivePlayer(next);
  };

  const stats = (p) => {
    const played = games.filter(g => g.players?.find(x => x.id === p.id));
    const wins = played.filter(g => g.winner && g.winner.id === p.id);
    const percentage = played.length ? Math.round((wins.length / played.length) * 100) : 0;
    return { played: played.length, wins: wins.length, percentage };
  };

  const ranking = [...players]
    .map(p => ({ name: p.name, wins: stats(p).wins }))
    .sort((a, b) => b.wins - a.wins);

  return (
    <div style={{ padding: 20, background: '#f1f5f9' }}>

      <div style={{textAlign:'center',marginBottom:20}}>
        <div style={{
          display:'inline-block',
          padding:'12px 24px',
          borderRadius:16,
          background:'linear-gradient(90deg,#2563eb,#22c55e)',
          color:'white',
          fontSize:26,
          fontWeight:'800',
          boxShadow:'0 0 20px rgba(37,99,235,0.5)'
        }}>
          🎱 Carambole Pro John Steppe
        </div>
      </div>

      {!currentGame && (
        <div>

          <h3>Spelers</h3>
          {players.map(p => {
            const s = stats(p);
            return (
              <div key={p.id}>
                {p.photo && <img src={p.photo} width={40} style={{borderRadius:'50%'}} />} {p.name}
                | 🏆 {s.wins} | 📊 {s.percentage}%
              </div>
            );
          })}

          <h3>Ranking</h3>
          {ranking.map((r, i) => (
            <div key={i}>#{i+1} {r.name} ({r.wins})</div>
          ))}

          <h3>Speler toevoegen</h3>
          <input value={newPlayer} onChange={e => setNewPlayer(e.target.value)} />
          <button onClick={addPlayer}>Toevoegen</button>

          <h3>Selecteer spelers</h3>
          {players.map(p => {
            const isSelected = selected.find(x => x.id === p.id);
            return (
              <div key={p.id} style={{marginBottom:10}}>
                <button
                  onClick={() => setSelected(prev =>
                    prev.find(x => x.id === p.id)
                      ? prev.filter(x => x.id !== p.id)
                      : [...prev, p]
                  )}
                  style={{
                    display:'flex',
                    alignItems:'center',
                    gap:10,
                    width:'100%',
                    padding:10,
                    borderRadius:12,
                    background:isSelected?'#22c55e':'white'
                  }}
                >
                  {p.photo && <img src={p.photo} width={40} style={{borderRadius:'50%'}} />}
                  {p.name}
                </button>

                {isSelected && (
                  <input
                    type="number"
                    placeholder="target"
                    value={targets[p.id] || ''}
                    onChange={e => setTargets({ ...targets, [p.id]: Number(e.target.value) })}
                  />
                )}
              </div>
            );
          })}

          {selected.length === 2 && <button onClick={startGame}>Start match</button>}
        </div>
      )}

      {currentGame && (
        <div>
          <div style={{display:'flex',gap:10}}>
            {selected.map(p => (
              <div key={p.id} style={{
                flex:1,
                padding:15,
                textAlign:'center',
                background: activePlayer===p.id?'#22c55e':'#e2e8f0',
                borderRadius:12
              }}>
                {p.photo && <img src={p.photo} width={50} style={{borderRadius:'50%'}} />}
                <div>{p.name}</div>
                <div style={{fontSize:40}}>{scores[p.id]}</div>
              </div>
            ))}
          </div>

          <div style={{textAlign:'center',fontSize:36}}>{inputValue || 0}</div>

          <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:10}}>
            {[1,2,3,4,5,6,7,8,9].map(n => (
              <button key={n} onClick={() => setInputValue(v=>v+n)} style={{height:80,fontSize:32}}>{n}</button>
            ))}
            <button onClick={()=>setInputValue('')}>C</button>
            <button onClick={()=>setInputValue(v=>v+'0')}>0</button>
            <button onClick={submitScore}>OK</button>
          </div>
        </div>
      )}

    </div>
  );
}
