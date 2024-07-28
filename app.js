const socket = io();

const spriteContainer = document.getElementById('sprite-container');
const chatBox = document.getElementById('chat-box');
const sendButton = document.getElementById('send');

const sprites = {};
const userPositions = {};
const pressedKeys = {};

let facingDirection = 0;
let speechBubble = null;

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

function createSpeechBubble(userid, text) {
    const avatar = sprites[userid];
    if (!avatar) return; 

    if (speechBubble && speechBubble.parentElement === avatar) {
        avatar.removeChild(speechBubble);
        speechBubble = null;
    }

    speechBubble = document.createElement('div');
    speechBubble.className = 'speech-bubble';
    avatar.appendChild(speechBubble);

    speechBubble.textContent = text;

    requestAnimationFrame(() => {
        speechBubble.classList.add('show');
    });
}

// Move user sprite with arrow keys
function moveAvatar() {
    const mapWidth = 206;
    const mapHeight = 129;
    const avatarDimension = 16;
    
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

            if (newX >= -8 && newX <= mapWidth - avatarDimension &&
                newY >= 0 && newY <= mapHeight - avatarDimension
            ) {
                userPositions[id] = { x: newX, y: newY, spriteRow: currentPosition.spriteRow };
                updateSpriteElement(id, currentPosition.spriteRow, spriteCol, newX, newY);
                // Notify server of the new position
                socket.emit('moveAvatar', { dx, dy, spriteCol });
            }
        }
    }
}

setInterval(moveAvatar, 225);

function sendMessage() {
    const message = chatBox.value;
    if (message.trim() !== '') {
        socket.emit('sendMessage', { text: message, userid: socket.id });
        chatBox.value = '';
    }
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

socket.on('displaySpeechBubble', ({ userid, text }) => {
    createSpeechBubble(userid, text);
});

document.addEventListener('keydown', (e) => {
    pressedKeys[e.key] = true;

    if (e.key === 'Enter') {
        sendMessage();
    }
});

document.addEventListener('keyup', (e) => {
    delete pressedKeys[e.key];
});

sendButton.addEventListener('click', sendMessage);

moveAvatar();