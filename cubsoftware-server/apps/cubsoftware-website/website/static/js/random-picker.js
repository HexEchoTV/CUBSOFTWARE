// Random Picker - CUB SOFTWARE
// Quick decision tools: coin flip, dice roll, random number, pick from list

// Stats
let headsCount = 0;
let tailsCount = 0;
let numberHistory = [];

// Coin Flip
function flipCoin() {
    const coin = document.getElementById('coin');
    const result = document.getElementById('coinResult');

    // Add flipping animation
    coin.classList.remove('heads', 'tails');
    coin.classList.add('flipping');

    // Determine result
    const isHeads = Math.random() < 0.5;

    setTimeout(() => {
        coin.classList.remove('flipping');
        coin.classList.add(isHeads ? 'heads' : 'tails');
        result.textContent = isHeads ? 'Heads!' : 'Tails!';

        // Update stats
        if (isHeads) {
            headsCount++;
            document.getElementById('headsCount').textContent = headsCount;
        } else {
            tailsCount++;
            document.getElementById('tailsCount').textContent = tailsCount;
        }
    }, 600);
}

// Dice Roll
function rollDice() {
    const dice = document.getElementById('dice');
    const diceValue = dice.querySelector('.dice-value');
    const result = document.getElementById('diceResult');
    const maxValue = parseInt(document.getElementById('diceType').value);

    // Add rolling animation
    dice.classList.add('rolling');

    // Animate through random numbers
    let animationCount = 0;
    const animationInterval = setInterval(() => {
        diceValue.textContent = Math.floor(Math.random() * maxValue) + 1;
        animationCount++;
        if (animationCount > 10) {
            clearInterval(animationInterval);
        }
    }, 50);

    // Final result
    setTimeout(() => {
        dice.classList.remove('rolling');
        clearInterval(animationInterval);
        const finalValue = Math.floor(Math.random() * maxValue) + 1;
        diceValue.textContent = finalValue;
        result.textContent = `You rolled ${finalValue}!`;
    }, 500);
}

// Random Number Generator
function generateNumber() {
    const display = document.getElementById('numberDisplay');
    const minInput = document.getElementById('minNumber');
    const maxInput = document.getElementById('maxNumber');
    const historyEl = document.getElementById('numberHistory');

    const min = parseInt(minInput.value) || 1;
    const max = parseInt(maxInput.value) || 100;

    if (min > max) {
        showToast('Min must be less than Max');
        return;
    }

    // Animate through numbers
    display.classList.add('animating');
    let animationCount = 0;
    const animationInterval = setInterval(() => {
        display.textContent = Math.floor(Math.random() * (max - min + 1)) + min;
        animationCount++;
        if (animationCount > 15) {
            clearInterval(animationInterval);
        }
    }, 40);

    // Final result
    setTimeout(() => {
        clearInterval(animationInterval);
        display.classList.remove('animating');
        const finalNumber = Math.floor(Math.random() * (max - min + 1)) + min;
        display.textContent = finalNumber;

        // Add to history
        numberHistory.unshift(finalNumber);
        if (numberHistory.length > 5) numberHistory.pop();
        historyEl.textContent = 'Recent: ' + numberHistory.join(', ');
    }, 600);
}

// Pick From List
function pickFromList() {
    const textarea = document.getElementById('listInput');
    const pickedValue = document.getElementById('pickedValue');
    const removeAfterPick = document.getElementById('removeAfterPick').checked;

    const items = textarea.value
        .split('\n')
        .map(item => item.trim())
        .filter(item => item.length > 0);

    if (items.length === 0) {
        showToast('Add some items to the list first!');
        return;
    }

    if (items.length === 1) {
        pickedValue.textContent = items[0];
        pickedValue.classList.add('animating');
        setTimeout(() => pickedValue.classList.remove('animating'), 300);

        if (removeAfterPick) {
            textarea.value = '';
        }
        return;
    }

    // Animate through items
    let animationCount = 0;
    const animationInterval = setInterval(() => {
        const randomItem = items[Math.floor(Math.random() * items.length)];
        pickedValue.textContent = randomItem;
        animationCount++;
        if (animationCount > 15) {
            clearInterval(animationInterval);
        }
    }, 60);

    // Final result
    setTimeout(() => {
        clearInterval(animationInterval);
        const winnerIndex = Math.floor(Math.random() * items.length);
        const winner = items[winnerIndex];
        pickedValue.textContent = winner;
        pickedValue.classList.add('animating');
        setTimeout(() => pickedValue.classList.remove('animating'), 300);

        // Remove winner if option is checked
        if (removeAfterPick) {
            items.splice(winnerIndex, 1);
            textarea.value = items.join('\n');
        }
    }, 900);
}

function clearList() {
    document.getElementById('listInput').value = '';
    document.getElementById('pickedValue').textContent = '?';
}

// Yes or No
function yesOrNo() {
    const display = document.getElementById('yesnoDisplay');
    const isYes = Math.random() < 0.5;

    // Animate
    display.classList.remove('yes', 'no');
    let animationCount = 0;
    const animationInterval = setInterval(() => {
        display.textContent = Math.random() < 0.5 ? 'YES' : 'NO';
        display.classList.toggle('yes');
        display.classList.toggle('no');
        animationCount++;
        if (animationCount > 10) {
            clearInterval(animationInterval);
        }
    }, 80);

    // Final result
    setTimeout(() => {
        clearInterval(animationInterval);
        display.textContent = isYes ? 'YES' : 'NO';
        display.className = 'yesno-display animating ' + (isYes ? 'yes' : 'no');
        setTimeout(() => display.classList.remove('animating'), 300);
    }, 800);
}

// Magic 8 Ball
const magic8Responses = [
    // Positive
    'It is certain',
    'Without a doubt',
    'Yes definitely',
    'You may rely on it',
    'As I see it, yes',
    'Most likely',
    'Outlook good',
    'Yes',
    'Signs point to yes',
    // Neutral
    'Reply hazy, try again',
    'Ask again later',
    'Cannot predict now',
    'Concentrate and ask again',
    // Negative
    "Don't count on it",
    'My reply is no',
    'My sources say no',
    'Outlook not so good',
    'Very doubtful'
];

function shakeMagic8() {
    const ball = document.getElementById('magic8');
    const text = document.getElementById('magic8Text');

    // Shake animation
    ball.classList.add('shaking');
    text.textContent = '...';
    text.classList.remove('reveal');

    // Reveal answer
    setTimeout(() => {
        ball.classList.remove('shaking');
        const response = magic8Responses[Math.floor(Math.random() * magic8Responses.length)];
        text.textContent = response;
        text.classList.add('reveal');
    }, 500);
}

// Toast notification
function showToast(message) {
    const toast = document.getElementById('toast');
    toast.textContent = message;
    toast.classList.add('show');
    setTimeout(() => {
        toast.classList.remove('show');
    }, 3000);
}

// Keyboard shortcuts
document.addEventListener('keydown', (e) => {
    if (document.activeElement.tagName === 'TEXTAREA' ||
        document.activeElement.tagName === 'INPUT') {
        return;
    }

    switch(e.key.toLowerCase()) {
        case 'c':
            flipCoin();
            break;
        case 'd':
            rollDice();
            break;
        case 'n':
            generateNumber();
            break;
        case 'y':
            yesOrNo();
            break;
        case '8':
            shakeMagic8();
            break;
    }
});
