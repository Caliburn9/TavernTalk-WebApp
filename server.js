const http = require("http");
const fs = require("fs");
const path = require("path");
const socketIo = require("socket.io");
const port = 3000;

const users = {} // Store player positions

function serveFile(res, filePath, contentType) {
    fs.readFile(filePath, function(error, data) {
        if (error) {
            res.writeHead(404);
            res.write("Error: Page not found for serveFile");
        } else {
            res.writeHead(200, { "Content-Type" : contentType });
            res.write(data);
        }
        res.end();
    });
}

const server = http.createServer(function(req, res) {
    // Serve index.html as the default page
    if (req.url === "/" || req.url === "/index.html") {
        serveFile(res, path.join(__dirname, "index.html"), "text/html");
    // Handle other requests (styles.css, app.js, etc.)
    } else if (req.url === "/styles.css") {
        serveFile(res, path.join(__dirname, "styles.css"), "text/css");
    } else if (req.url === "/app.js") {
        serveFile(res, path.join(__dirname, "app.js"), "text/javascript");
    } else if (req.url === "/socket.io/socket.io.js") {
        serveFile(res, path.join(__dirname, "node_modules/socket.io/client-dist/socket.io.js"), "text/javascript");
    } else if (req.url.startsWith("/art/")) {
        serveFile(res, path.join(__dirname, req.url), "image/png");
    } else if (req.url.startsWith("/fonts/")) {
        serveFile(res, path.join(__dirname, req.url), "font/ttf");
    } else {
        res.writeHead(404);
        res.write("Error: Page not found");
        res.end();
    }
});

const io = socketIo(server);

io.on('connection', (socket) => {
    console.log('A user connected: ', socket.id);

    // Assign a random sprite to the user
    const spriteRow = Math.floor(Math.random() * 4);
    const xStartPos = 96;
    const yStartPos = 64;

    users[socket.id] = { x: xStartPos, y: yStartPos, spriteRow };

    socket.emit('assignSprite', { id: socket.id, spriteRow, xStartPos, yStartPos });
    for (id in users) {
        if (id !== socket.id) {
            socket.emit("avatarMoved", { id, position: users[id], spriteRow: users[id].spriteRow });
        }
    }

    socket.broadcast.emit('avatarMoved', { id: socket.id, position: { x: xStartPos, y: yStartPos }, spriteRow });

    socket.on('moveAvatar', ({ dx, dy, spriteCol }) => {
        if (users[socket.id]) {
            users[socket.id].x += dx;
            users[socket.id].y += dy;
            const position = { x: users[socket.id].x, y: users[socket.id].y };
            io.emit("avatarMoved", { id: socket.id, position, spriteRow: users[socket.id].spriteRow, spriteCol });
        }
    });

    socket.on('disconnect', () => {
        console.log('A user disconnected: ', socket.id);
        io.emit('avatarDisconnected', { id: socket.id });
        delete users[socket.id];
    });

    socket.on('sendMessage', ({ text, userid }) => {
        socket.broadcast.emit('displaySpeechBubble', ({ userid, text }));
        io.emit('displaySpeechBubble', { userid, text });
    });
});

server.listen(port, function(error) {
    if (error) {
        console.log("Something went wrong", error);
    } else {
        console.log("Server listening at http://localhost:" + port);
    }
});
