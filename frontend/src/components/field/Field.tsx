// Field.jsx
import "./Field.css";

const testPlayers = [
  { id: 1, name: "GK", x: 50, y: 88 },
  { id: 2, name: "LB", x: 18, y: 68 },
  { id: 3, name: "CB", x: 38, y: 68 },
  { id: 4, name: "CB", x: 62, y: 68 },
  { id: 5, name: "RB", x: 82, y: 68 },
  { id: 6, name: "CM", x: 30, y: 48 },
  { id: 7, name: "CM", x: 50, y: 44 },
  { id: 8, name: "CM", x: 70, y: 48 },
  { id: 9, name: "LW", x: 25, y: 24 },
  { id: 10, name: "ST", x: 50, y: 18 },
  { id: 11, name: "RW", x: 75, y: 24 },
];

export default function Field({ players = testPlayers }) {
  return (
    <div className="football-field">
      <div className="center-line" />
      <div className="center-circle" />
      <div className="box top-box" />
      <div className="box bottom-box" />

      {players.map((player) => (
        <div
          key={player.id}
          className="field-player"
          style={{
            left: `${player.x}%`,
            top: `${player.y}%`,
          }}
        >
          <div className="player-dot">{player.name}</div>
        </div>
      ))}
    </div>
  );
}