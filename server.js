const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const path = require("path");

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});

const clientPath = path.join(__dirname, "multiplayer-client/dist");
app.use(express.static(clientPath));

app.get("*", (req, res) => {
    res.sendFile(path.join(clientPath, "index.html"));
});

const rooms = {};

function checkWinner(board) {
    const winningCombinations = [
        [0, 1, 2], [3, 4, 5], [6, 7, 8], // שורות
        [0, 3, 6], [1, 4, 7], [2, 5, 8], // עמודות
        [0, 4, 8], [2, 4, 6] // אלכסונים
    ];

    for (const [a, b, c] of winningCombinations) {
        if (board[a] && board[a] === board[b] && board[a] === board[c]) {
            return board[a]; // מחזיר את הזוכה (X או O)
        }
    }

    return board.includes(null) ? null : "draw"; // אם הלוח מלא ואין מנצח, זה תיקו
}

io.on("connection", (socket) => {
    console.log(`🔗 Player connected: ${socket.id}`);

    socket.on("joinRoom", (roomName) => {
        socket.join(roomName);
        console.log(`👥 Player ${socket.id} joined room: ${roomName}`);

        if (!rooms[roomName]) {
            rooms[roomName] = { board: Array(9).fill(null), players: [], turn: "X", winner: null };
        }

        if (rooms[roomName].players.length < 2) {
            const playerSymbol = rooms[roomName].players.length === 0 ? "X" : "O";
            rooms[roomName].players.push({ id: socket.id, symbol: playerSymbol });
            socket.emit("assignPlayer", playerSymbol);
        }

        io.to(roomName).emit("boardUpdate", rooms[roomName]);
    });

    socket.on("makeMove", ({ roomName, index, player }) => {
        const game = rooms[roomName];
        if (game && game.board[index] === null && game.turn === player && !game.winner) {
            game.board[index] = player;
            game.turn = game.turn === "X" ? "O" : "X";

            const winner = checkWinner(game.board);
            if (winner) {
                game.winner = winner;
            }

            io.to(roomName).emit("boardUpdate", game);
        }
    });

    socket.on("restartGame", (roomName) => {
        if (rooms[roomName]) {
            rooms[roomName].board = Array(9).fill(null);
            rooms[roomName].turn = "X";
            rooms[roomName].winner = null;
            io.to(roomName).emit("boardUpdate", rooms[roomName]);
        }
    });

    socket.on("disconnect", () => {
        console.log(`❌ Player disconnected: ${socket.id}`);
        for (const roomName in rooms) {
            rooms[roomName].players = rooms[roomName].players.filter(p => p.id !== socket.id);
            if (rooms[roomName].players.length === 0) {
                delete rooms[roomName]; // ניקוי חדר ריק
            }
            io.to(roomName).emit("boardUpdate", rooms[roomName]);
        }
    });
});

server.listen(3000, () => {
    console.log("🚀 Server is running on port 3000");
});
