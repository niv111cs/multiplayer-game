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
    const [message, setMessage] = useState("");

    useEffect(() => {
        socket.on("boardUpdate", (newBoard) => {
            setBoard(newBoard.board);
            setTurn(newBoard.turn);
            setWinner(newBoard.winner);

            // Update messages based on game state
            if (newBoard.winner === "draw") {
                setMessage("⚖ The game ended in a draw!");
            } else if (newBoard.winner) {
                setMessage(`🏆 The winner is: ${newBoard.winner}`);
            } else {
                setMessage(`🎲 Current turn: ${newBoard.turn}`);
            }
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
        setMessage("♻ The game has been restarted!");
    };

    return (
        <div>
            <h2>🎮 Tic-Tac-Toe Multiplayer</h2>

            {!joined ? (
                <div>
                    <input type="text" value={room} onChange={(e) => setRoom(e.target.value)} placeholder="Enter room name..." />
                    <button onClick={joinRoom}>Join Room</button>
                </div>
            ) : (
                <div>
                    <h3>📌 Room: {room} | You are playing as: {player}</h3>
                    <h4 style={{ color: winner ? "green" : "black" }}>{message}</h4>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 100px)", gap: "5px" }}>
                        {board.map((cell, index) => (
                            <div key={index} onClick={() => makeMove(index)} style={{ 
                                width: "100px", 
                                height: "100px", 
                                fontSize: "2em", 
                                backgroundColor: turn === player && cell === null ? "#bbb" : "#ddd", 
                                display: "flex", 
                                alignItems: "center", 
                                justifyContent: "center", 
                                border: "2px solid black",
                                cursor: cell === null && turn === player ? "pointer" : "default"
                            }}>
                                {cell}
                            </div>
                        ))}
                    </div>
                    {winner && <button onClick={restartGame} style={{ marginTop: "10px", padding: "10px", fontSize: "1.2em" }}>🔄 Restart</button>}
                </div>
            )}
        </div>
    );
}

export default Game;
