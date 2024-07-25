const socket = io();

const spriteContainer = document.getElementById('sprite-container');
const sprites = {};

function updateSpriteElement(id, row, col, x, y) {
    let sprite = sprites[id];
    if (!sprite) {
        sprite = document.createElement('div');
        sprite.className = 'sprite';
        sprites[id] = sprite;
        spriteContainer.appendChild(sprite);  
    }

    const spriteX = -16 * col;
    const spriteY = -16 * row;
    sprite.style.backgroundPosition = `${spriteX}px ${spriteY}px`;

    sprite.style.position = 'absolute';
    sprite.style.left = `${x}px`;
    sprite.style.top = `${y}px`;
}

// Handle sprite assignment
socket.on('assignSprite', ({ id, spriteRow, xStartPos, yStartPos }) => {
    updateSpriteElement(id, spriteRow, 0, xStartPos, yStartPos);
});

// Handle other users' movement
// TODO: ONLY MOVES BY ONE POSITION. NEED TO GET CURRENT POSITION AND ADD TO IT
socket.on('userMoved', ({ id, position, spriteRow }) => {
    const { x, y } = position;
    updateSpriteElement(id, spriteRow, 0, x, y);
});

// Move user sprite with arrow keys
document.addEventListener('keydown', (e) => {
    const moveSpeed = 5;
    let x = 0;
    let y = 0;

    switch(e.key) {
        case 'ArrowUp':
            y -= moveSpeed;
            break;
        case 'ArrowDown':
            y += moveSpeed;
            break;  
        case 'ArrowLeft':
            x -= moveSpeed;
            break;
        case 'ArrowRight':
            x += moveSpeed;
            break;
    }

    if (x !== 0 || y !== 0) {
        // Update position locally
        const myId = socket.id;
        // TODO: NEED TO CONSIDER SPRITEROW HERE
        updateSpriteElement(myId, 0, 0, x, y);

        // Notify server of the new position
        socket.emit('movePlayer', { x, y });
    }
})