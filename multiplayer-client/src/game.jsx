import { useEffect, useState } from "react";
import { io } from "socket.io-client";

const socket = io("https://multiplayer-game-5d7t.onrender.com", {
    transports: ["websocket"],
    upgrade: false
});

function Game() {
    const [room, setRoom] = useState("");
    const [joined, setJoined] = useState(false);
    const [board, setBoard] = useState(Array(9).fill(null));
    const [player, setPlayer] = useState(null);
    const [turn, setTurn] = useState("X");
    const [winner, setWinner] = useState(null);

    useEffect(() => {
        socket.on("boardUpdate", (newBoard) => {
            setBoard(newBoard.board);
            setTurn(newBoard.turn);
            setWinner(newBoard.winner);
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
        if (board[index] === null && turn === player && !winner) {
            socket.emit("makeMove", { roomName: room, index, player });
        }
    };

    const restartGame = () => {
        socket.emit("restartGame", room);
    };

    return (
        <div>
            <h2>🎮 משחק איקס עיגול</h2>

            {!joined ? (
                <div>
                    <input type="text" value={room} onChange={(e) => setRoom(e.target.value)} placeholder="הקלד שם חדר..." />
                    <button onClick={joinRoom}>הצטרף לחדר</button>
                </div>
            ) : (
                <div>
                    <h3>📌 אתה בחדר: {room} | אתה משחק בתור: {player}</h3>
                    <h4>🎲 תור נוכחי: {turn}</h4>
                    {winner && <h3>🏆 {winner === "draw" ? "תיקו!" : `המנצח הוא: ${winner}`}</h3>}
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 100px)", gap: "5px" }}>
                        {board.map((cell, index) => (
                            <div key={index} onClick={() => makeMove(index)} style={{ width: "100px", height: "100px", fontSize: "2em", backgroundColor: turn === player && cell === null ? "#bbb" : "#ddd" }}>
                                {cell}
                            </div>
                        ))}
                    </div>
                    {winner && <button onClick={restartGame}>🔄 הפעל מחדש</button>}
                </div>
            )}
        </div>
    );
}

export default Game;
// This is the client-side code for the multiplayer game. The game logic is similar to the server-side code, but it handles the UI and user interactions. The Game component uses the socket.io client to connect to the server and communicate with other players in the same room.