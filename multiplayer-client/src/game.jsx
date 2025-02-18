import { useEffect, useState } from "react";
import { io } from "socket.io-client";

const socket = io("https://multiplayer-game-5d7t.onrender.com", {
    transports: ["websocket"],
    upgrade: false
});

function Game() {
    const [room, setRoom] = useState(""); // שם החדר
    const [joined, setJoined] = useState(false);
    const [board, setBoard] = useState(Array(9).fill(null)); // מצב הלוח
    const [player, setPlayer] = useState(null); // מי השחקן הנוכחי
    const [turn, setTurn] = useState("X"); // תור השחקן

    useEffect(() => {
        socket.on("boardUpdate", (newBoard) => {
            setBoard(newBoard.board);
            setTurn(newBoard.turn);
        });

        socket.on("assignPlayer", (symbol) => {
            setPlayer(symbol);
        });

        return () => {
            socket.off("boardUpdate");
            socket.off("assignPlayer");
        };
    }, []);

    const joinRoom = () => {
        if (room.trim() !== "") {
            socket.emit("joinRoom", room);
            setJoined(true);
        }
    };

    const makeMove = (index) => {
        if (board[index] === null && turn === player) {
            socket.emit("makeMove", { roomName: room, index, player });
        }
    };

    return (
        <div>
            <h2>🎮 משחק איקס עיגול</h2>

            {!joined ? (
                <div>
                    <input
                        type="text"
                        value={room}
                        onChange={(e) => setRoom(e.target.value)}
                        placeholder="הקלד שם חדר..."
                    />
                    <button onClick={joinRoom}>הצטרף לחדר</button>
                </div>
            ) : (
                <div>
                    <h3>📌 אתה בחדר: {room} | אתה משחק בתור: {player}</h3>
                    <h4>🎲 תור נוכחי: {turn}</h4>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 100px)", gap: "5px" }}>
                        {board.map((cell, index) => (
                            <div
                                key={index}
                                onClick={() => makeMove(index)}
                                style={{
                                    width: "100px",
                                    height: "100px",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    fontSize: "2em",
                                    backgroundColor: "#ddd",
                                    cursor: turn === player && cell === null ? "pointer" : "not-allowed"
                                }}
                            >
                                {cell}
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}

export default Game;
