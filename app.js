const socket = io();

const spriteContainer = document.getElementById('sprite-container');
const sprites = {};
const userPositions = {};
const pressedKeys = {};
let facingDirection = 0;

function updateSpriteElement(id, row, col, x, y) {
    let sprite = sprites[id];
    if (!sprite) {
        sprite = document.createElement('div');
        sprite.className = 'sprite';
        sprites[id] = sprite;
        spriteContainer.appendChild(sprite);  
    }

    const spriteDimension = 16;
    const spriteX = -col * spriteDimension;
    const spriteY = -row * spriteDimension;
    sprite.style.backgroundPosition = `${spriteX}px ${spriteY}px`;

    sprite.style.position = 'absolute';
    sprite.style.left = `${x}px`;
    sprite.style.top = `${y}px`;
}

// Handle sprite assignment
socket.on('assignSprite', ({ id, spriteRow, xStartPos, yStartPos }) => {
    updateSpriteElement(id, spriteRow, 0, xStartPos, yStartPos);
    userPositions[id] = { x: xStartPos, y: yStartPos, spriteRow };
});

// Handle other users' movement
socket.on('avatarMoved', ({ id, position, spriteRow, spriteCol }) => {
    const { x, y } = position;
    updateSpriteElement(id, spriteRow, spriteCol, x, y);
    userPositions[id] = { x, y, spriteRow };
});

socket.on('avatarDisconnected', ({ id }) => {
    const sprite = sprites[id];
    if (sprite) {
        spriteContainer.removeChild(sprite);
        delete sprites[id];
        delete userPositions[id];
    }
});

// Move user sprite with arrow keys
function moveAvatar() {
    const moveSpeed = 5;
    let dx = 0;
    let dy = 0;

    if (pressedKeys['ArrowLeft']) {
        dx = -moveSpeed;
        facingDirection = 2;   
    }
    if (pressedKeys['ArrowRight']) {
        dx = moveSpeed;
        facingDirection = 0;   
    }
    if (pressedKeys['ArrowUp']) {
        dy = -moveSpeed;
    }
    if (pressedKeys['ArrowDown']) {
        dy = moveSpeed;
    }

    let spriteCol = facingDirection;

    if (dx === 0 && dy !== 0) {
        spriteCol = facingDirection;
    }

    if (dx !== 0 || dy !== 0) {
        const id = socket.id;
        const currentPosition = userPositions[id];
        if (currentPosition) {
            const { x, y } = currentPosition;
            const newX = x + dx;
            const newY = y + dy;
            userPositions[id] = { x: newX, y: newY, spriteRow: currentPosition.spriteRow };
            updateSpriteElement(id, currentPosition.spriteRow, spriteCol, newX, newY);
            // Notify server of the new position
            socket.emit('moveAvatar', { dx, dy, spriteCol });
        }
    }
}

setInterval(moveAvatar, 225);

document.addEventListener('keydown', (e) => {
    pressedKeys[e.key] = true;
});

document.addEventListener('keyup', (e) => {
    delete pressedKeys[e.key];
});

moveAvatar();