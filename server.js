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

// מאגר החדרים
const rooms = {};

io.on("connection", (socket) => {
    console.log(`🔗 Player connected: ${socket.id}`);

    socket.on("joinRoom", (roomName) => {
        socket.join(roomName);
        console.log(`👥 Player ${socket.id} joined room: ${roomName}`);

        if (!rooms[roomName]) {
            rooms[roomName] = { board: Array(9).fill(null), players: [], turn: "X" };
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
        if (game && game.board[index] === null && game.turn === player) {
            game.board[index] = player;
            game.turn = game.turn === "X" ? "O" : "X";
            io.to(roomName).emit("boardUpdate", game);
        }
    });

    socket.on("disconnect", () => {
        console.log(`❌ Player disconnected: ${socket.id}`);
        for (const roomName in rooms) {
            rooms[roomName].players = rooms[roomName].players.filter(p => p.id !== socket.id);
            io.to(roomName).emit("boardUpdate", rooms[roomName]);
        }
    });
});

server.listen(3000, () => {
    console.log("🚀 Server is running on port 3000");
});
