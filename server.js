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

    users[socket.id] = { x: 0, y: 0, spriteRow };

    socket.emit('assignSprite', { id: socket.id, spriteRow, xStartPos, yStartPos });

    socket.on('moveUser', (position) => {
        if (users[socket.id]) {
            users[socket.id] = { ...users[socket.id], ...position, spriteRow };
            io.emit("userMoved", { id: socket.id, position, spriteRow });
        }
    });

    socket.on('disconnect', () => {
        console.log('A user disconnected: ', socket.id);
    });
});

server.listen(port, function(error) {
    if (error) {
        console.log("Something went wrong", error);
    } else {
        console.log("Server listening at http://localhost:" + port);
    }
});
