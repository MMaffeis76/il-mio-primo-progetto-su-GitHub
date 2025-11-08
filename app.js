// Game State
let gameState = {
    score: 0,
    streak: 0,
    level: 1,
    correct: 0,
    total: 0,
    currentMode: null,
    currentQuestion: 0,
    totalQuestions: 10,
    questions: [],
    mistakes: [],
    selectedAnswer: null,
    selectedMatchLabel: null // For match mode: stores the currently selected label
};

// Load saved progress from localStorage
function loadProgress() {
    const saved = localStorage.getItem('irregularVerbsProgress');
    if (saved) {
        const progress = JSON.parse(saved);
        gameState.score = progress.score || 0;
        gameState.level = progress.level || 1;
        gameState.correct = progress.correct || 0;
        gameState.total = progress.total || 0;
        updateStats();
    }
}

// Save progress to localStorage
function saveProgress() {
    const progress = {
        score: gameState.score,
        level: gameState.level,
        correct: gameState.correct,
        total: gameState.total
    };
    localStorage.setItem('irregularVerbsProgress', JSON.stringify(progress));
}

// Update stats display
function updateStats() {
    document.getElementById('streak').textContent = gameState.streak;
    document.getElementById('score').textContent = gameState.score;
    document.getElementById('level').textContent = gameState.level;
    document.getElementById('correct').textContent = gameState.correct;
    document.getElementById('total').textContent = gameState.total;
}

// Start exercise
function startExercise(mode) {
    gameState.currentMode = mode;
    gameState.currentQuestion = 0;
    gameState.mistakes = [];

    if (mode === 'practice') {
        showPracticeMode();
        return;
    }

    // Generate questions
    gameState.questions = generateQuestions(mode, gameState.totalQuestions);

    // Hide mode selection, show exercise area
    document.getElementById('modeSelection').style.display = 'none';
    document.getElementById('exerciseArea').style.display = 'block';

    // Show first question
    showQuestion();
}

// Generate random questions
function generateQuestions(mode, count) {
    const questions = [];
    const usedVerbs = new Set();

    while (questions.length < count) {
        const randomIndex = Math.floor(Math.random() * irregularVerbs.length);
        const verb = irregularVerbs[randomIndex];

        if (!usedVerbs.has(verb.base)) {
            usedVerbs.add(verb.base);

            if (mode === 'fill') {
                questions.push(generateFillQuestion(verb));
            } else if (mode === 'multiple') {
                questions.push(generateMultipleChoiceQuestion(verb));
            } else if (mode === 'match') {
                questions.push(generateMatchQuestion(verb));
            }
        }
    }

    return questions;
}

// Generate fill-in-the-blank question
function generateFillQuestion(verb) {
    const types = ['past', 'participle'];
    const type = types[Math.floor(Math.random() * types.length)];

    return {
        type: 'fill',
        verb: verb,
        questionType: type,
        correctAnswer: verb[type]
    };
}

// Generate multiple choice question
function generateMultipleChoiceQuestion(verb) {
    const types = ['past', 'participle'];
    const type = types[Math.floor(Math.random() * types.length)];

    // Get wrong answers from other verbs
    const wrongAnswers = [];
    while (wrongAnswers.length < 3) {
        const randomVerb = irregularVerbs[Math.floor(Math.random() * irregularVerbs.length)];
        const wrongAnswer = randomVerb[type];
        if (wrongAnswer !== verb[type] && !wrongAnswers.includes(wrongAnswer)) {
            wrongAnswers.push(wrongAnswer);
        }
    }

    // Mix correct answer with wrong answers
    const options = [...wrongAnswers, verb[type]];
    shuffleArray(options);

    return {
        type: 'multiple',
        verb: verb,
        questionType: type,
        options: options,
        correctAnswer: verb[type]
    };
}

// Generate match question
function generateMatchQuestion(verb) {
    // Create shuffled forms array
    const forms = [
        { value: verb.base, type: 'base' },
        { value: verb.past, type: 'past' },
        { value: verb.participle, type: 'participle' }
    ];
    shuffleArray(forms);

    return {
        type: 'match',
        verb: verb,
        shuffledForms: forms,
        correctAnswer: { base: verb.base, past: verb.past, participle: verb.participle },
        userMatches: {} // Will store user's matches: { 'base': 'went', 'past': 'gone', etc. }
    };
}

// Shuffle array
function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
}

// Show question
function showQuestion() {
    const question = gameState.questions[gameState.currentQuestion];
    const content = document.getElementById('exerciseContent');
    gameState.selectedAnswer = null;
    gameState.selectedMatchLabel = null;

    // Update progress
    document.getElementById('currentQuestion').textContent = gameState.currentQuestion + 1;
    document.getElementById('totalQuestions').textContent = gameState.totalQuestions;
    const progress = ((gameState.currentQuestion) / gameState.totalQuestions) * 100;
    document.getElementById('progressFill').style.width = progress + '%';

    // Clear feedback
    const feedback = document.getElementById('feedback');
    feedback.className = 'feedback';
    feedback.style.display = 'none';

    // Show submit button, hide next button
    document.getElementById('submitBtn').style.display = 'block';
    document.getElementById('nextBtn').style.display = 'none';

    if (question.type === 'fill') {
        content.innerHTML = `
            <div class="question-text">Completa il verbo:</div>
            <div class="verb-prompt">${question.verb.base}</div>
            <div class="question-text">
                ${question.questionType === 'past' ? 'Past Simple:' : 'Past Participle:'}
            </div>
            <input type="text" class="answer-input" id="answerInput" placeholder="Inserisci la risposta..." autocomplete="off">
        `;

        // Add enter key listener
        document.getElementById('answerInput').addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                checkAnswer();
            }
        });

        // Focus input
        setTimeout(() => document.getElementById('answerInput').focus(), 100);

    } else if (question.type === 'multiple') {
        content.innerHTML = `
            <div class="question-text">Quale è la forma corretta?</div>
            <div class="verb-prompt">${question.verb.base}</div>
            <div class="question-text">
                ${question.questionType === 'past' ? 'Past Simple:' : 'Past Participle:'}
            </div>
            <div class="options-grid" id="optionsGrid">
                ${question.options.map((option, index) => `
                    <button class="option-btn" onclick="selectOption('${option}')">${option}</button>
                `).join('')}
            </div>
        `;

    } else if (question.type === 'match') {
        content.innerHTML = `
            <div class="question-text">Associa le forme del verbo:</div>
            <div class="verb-prompt">${question.verb.italian}</div>
            <div class="match-instructions">Clicca prima su un'etichetta, poi sulla forma corrispondente</div>
            <div class="match-grid">
                <div class="match-column">
                    <h4>Etichette</h4>
                    <div class="match-item match-label" data-type="base" onclick="selectMatchLabel(this, 'base')">Base Form</div>
                    <div class="match-item match-label" data-type="past" onclick="selectMatchLabel(this, 'past')">Past Simple</div>
                    <div class="match-item match-label" data-type="participle" onclick="selectMatchLabel(this, 'participle')">Past Participle</div>
                </div>
                <div class="match-column">
                    <h4>Forme</h4>
                    ${question.shuffledForms.map((form, index) => `
                        <div class="match-item match-value" data-value="${form.value}" data-type="${form.type}" onclick="selectMatchValue(this, '${form.value}', '${form.type}')">${form.value}</div>
                    `).join('')}
                </div>
            </div>
            <div id="matchStatus" class="match-status"></div>
        `;
    }
}

// Select option for multiple choice
function selectOption(option) {
    // Remove previous selection
    document.querySelectorAll('.option-btn').forEach(btn => {
        btn.classList.remove('selected');
    });

    // Select new option
    event.target.classList.add('selected');
    gameState.selectedAnswer = option;
}

// Select match label (left column)
function selectMatchLabel(element, type) {
    // Remove previous selection
    document.querySelectorAll('.match-label').forEach(label => {
        label.classList.remove('selected');
    });

    // Select this label
    element.classList.add('selected');
    gameState.selectedMatchLabel = type;

    // Update status message
    const statusDiv = document.getElementById('matchStatus');
    const labelNames = {
        'base': 'Base Form',
        'past': 'Past Simple',
        'participle': 'Past Participle'
    };
    statusDiv.textContent = `Hai selezionato: ${labelNames[type]}. Ora clicca sulla forma corrispondente.`;
    statusDiv.style.color = '#667eea';
}

// Select match value (right column)
function selectMatchValue(element, value, correctType) {
    const question = gameState.questions[gameState.currentQuestion];
    const statusDiv = document.getElementById('matchStatus');

    // Check if a label is selected
    if (!gameState.selectedMatchLabel) {
        statusDiv.textContent = 'Seleziona prima un\'etichetta dalla colonna sinistra!';
        statusDiv.style.color = '#991b1b';
        return;
    }

    // Check if this value is already matched
    if (element.classList.contains('matched')) {
        statusDiv.textContent = 'Questa forma è già stata abbinata!';
        statusDiv.style.color = '#991b1b';
        return;
    }

    // Store the user's match
    question.userMatches[gameState.selectedMatchLabel] = value;

    // Mark both items as matched
    element.classList.add('matched');
    element.style.pointerEvents = 'none';

    const selectedLabel = document.querySelector(`.match-label[data-type="${gameState.selectedMatchLabel}"]`);
    selectedLabel.classList.remove('selected');
    selectedLabel.classList.add('matched');
    selectedLabel.style.pointerEvents = 'none';

    // Show connection
    statusDiv.textContent = `Abbinamento registrato! (${Object.keys(question.userMatches).length}/3)`;
    statusDiv.style.color = '#10b981';

    // Reset selection
    gameState.selectedMatchLabel = null;

    // Check if all matches are done
    if (Object.keys(question.userMatches).length === 3) {
        statusDiv.textContent = 'Tutti gli abbinamenti completati! Clicca su Verifica per controllare.';
        statusDiv.style.color = '#667eea';
    }
}

// Check answer
function checkAnswer() {
    const question = gameState.questions[gameState.currentQuestion];
    const feedback = document.getElementById('feedback');
    let isCorrect = false;
    let userAnswer = '';

    if (question.type === 'fill') {
        userAnswer = document.getElementById('answerInput').value.trim().toLowerCase();
        const correctAnswers = question.correctAnswer.toLowerCase().split('/');
        isCorrect = correctAnswers.some(ans => ans === userAnswer);

    } else if (question.type === 'multiple') {
        userAnswer = gameState.selectedAnswer;
        if (!userAnswer) {
            feedback.textContent = 'Seleziona una risposta!';
            feedback.className = 'feedback incorrect';
            return;
        }
        isCorrect = userAnswer === question.correctAnswer;

    } else if (question.type === 'match') {
        // Check if all matches are made
        if (Object.keys(question.userMatches).length < 3) {
            feedback.textContent = 'Completa tutti e 3 gli abbinamenti prima di verificare!';
            feedback.className = 'feedback incorrect';
            feedback.style.display = 'block';
            return;
        }

        // Verify all matches are correct
        isCorrect =
            question.userMatches.base === question.correctAnswer.base &&
            question.userMatches.past === question.correctAnswer.past &&
            question.userMatches.participle === question.correctAnswer.participle;

        // Visual feedback for each match
        if (!isCorrect) {
            // Highlight incorrect matches
            Object.keys(question.userMatches).forEach(type => {
                const userValue = question.userMatches[type];
                const correctValue = question.correctAnswer[type];
                const valueElement = document.querySelector(`.match-value[data-value="${userValue}"]`);

                if (userValue !== correctValue) {
                    valueElement.classList.remove('matched');
                    valueElement.classList.add('incorrect');
                } else {
                    valueElement.classList.add('correct');
                }
            });
        } else {
            // All correct - mark everything as correct
            document.querySelectorAll('.match-item.matched').forEach(item => {
                item.classList.add('correct');
            });
        }

        userAnswer = Object.entries(question.userMatches)
            .map(([type, value]) => `${type}: ${value}`)
            .join(', ');
    }

    // Update stats
    gameState.total++;

    if (isCorrect) {
        gameState.correct++;
        gameState.streak++;
        const points = 10 + (gameState.streak * 2);
        gameState.score += points;

        feedback.innerHTML = `✅ Corretto! +${points} punti`;
        feedback.className = 'feedback correct';

        // Check for level up
        if (gameState.score >= gameState.level * 100) {
            gameState.level++;
            showLevelUp();
        }

    } else {
        gameState.streak = 0;

        // Format correct answer based on question type
        let correctAnswerText = '';
        if (question.type === 'match') {
            correctAnswerText = `Base: ${question.correctAnswer.base}, Past: ${question.correctAnswer.past}, Participle: ${question.correctAnswer.participle}`;
        } else {
            correctAnswerText = question.correctAnswer;
        }

        feedback.innerHTML = `❌ Sbagliato! La risposta corretta è: <strong>${correctAnswerText}</strong>`;
        feedback.className = 'feedback incorrect';

        // Save mistake
        gameState.mistakes.push({
            verb: question.verb,
            questionType: question.questionType,
            userAnswer: userAnswer,
            correctAnswer: question.correctAnswer
        });
    }

    updateStats();
    saveProgress();

    // Hide submit button, show next button
    document.getElementById('submitBtn').style.display = 'none';
    document.getElementById('nextBtn').style.display = 'block';

    // Disable inputs
    if (question.type === 'fill') {
        document.getElementById('answerInput').disabled = true;
    } else if (question.type === 'multiple') {
        document.querySelectorAll('.option-btn').forEach(btn => {
            btn.style.pointerEvents = 'none';
            if (btn.textContent === question.correctAnswer) {
                btn.classList.add('selected');
            }
        });
    }
}

// Next question
function nextQuestion() {
    gameState.currentQuestion++;

    if (gameState.currentQuestion < gameState.totalQuestions) {
        showQuestion();
    } else {
        showResults();
    }
}

// Show level up animation
function showLevelUp() {
    const levelUp = document.createElement('div');
    levelUp.style.cssText = `
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        background: linear-gradient(135deg, #667eea, #764ba2);
        color: white;
        padding: 40px 60px;
        border-radius: 20px;
        font-size: 2rem;
        font-weight: bold;
        z-index: 1000;
        box-shadow: 0 10px 40px rgba(0,0,0,0.3);
        animation: slideInUp 0.5s ease;
    `;
    levelUp.innerHTML = `🎉 Livello ${gameState.level}! 🎉`;
    document.body.appendChild(levelUp);

    setTimeout(() => {
        levelUp.remove();
    }, 2000);
}

// Show results
function showResults() {
    document.getElementById('exerciseArea').style.display = 'none';
    document.getElementById('resultsScreen').style.display = 'block';

    const accuracy = Math.round((gameState.correct / gameState.total) * 100);
    const pointsEarned = gameState.score;

    document.getElementById('finalCorrect').textContent =
        `${gameState.questions.filter((q, i) => {
            const question = gameState.questions[i];
            return !gameState.mistakes.some(m => m.verb === question.verb);
        }).length}/${gameState.totalQuestions}`;

    document.getElementById('finalAccuracy').textContent = accuracy + '%';
    document.getElementById('pointsEarned').textContent = '+' + pointsEarned;

    // Set message based on performance
    let message = '';
    if (accuracy >= 90) {
        message = '🌟 Eccellente! Sei un vero maestro dei verbi irregolari!';
    } else if (accuracy >= 70) {
        message = '👍 Ottimo lavoro! Continua così!';
    } else if (accuracy >= 50) {
        message = '💪 Buon tentativo! Con un po\' più di pratica migliorerai!';
    } else {
        message = '📚 Continua a esercitarti! Ogni tentativo ti aiuta a migliorare!';
    }

    document.getElementById('resultsMessage').textContent = message;
}

// Review mistakes
function reviewMistakes() {
    if (gameState.mistakes.length === 0) {
        alert('Non hai fatto errori! Ottimo lavoro! 🎉');
        return;
    }

    let mistakesHTML = '<div style="background: white; padding: 30px; border-radius: 20px; max-width: 600px; margin: 0 auto;">';
    mistakesHTML += '<h3 style="color: #667eea; margin-bottom: 20px;">📝 Rivedi i tuoi errori:</h3>';

    gameState.mistakes.forEach((mistake, index) => {
        mistakesHTML += `
            <div style="background: #f3f4f6; padding: 15px; border-radius: 10px; margin-bottom: 15px;">
                <div style="font-weight: bold; color: #667eea; margin-bottom: 5px;">
                    ${index + 1}. ${mistake.verb.base} (${mistake.verb.italian})
                </div>
                <div style="color: #991b1b;">
                    La tua risposta: <strong>${mistake.userAnswer || 'Non risposto'}</strong>
                </div>
                <div style="color: #065f46;">
                    Risposta corretta: <strong>${mistake.correctAnswer}</strong>
                </div>
            </div>
        `;
    });

    mistakesHTML += '<button onclick="backToMenu()" style="margin-top: 20px; padding: 10px 20px; background: #667eea; color: white; border: none; border-radius: 10px; cursor: pointer;">Torna al Menu</button>';
    mistakesHTML += '</div>';

    document.getElementById('resultsScreen').innerHTML = mistakesHTML;
}

// Back to menu
function backToMenu() {
    document.getElementById('exerciseArea').style.display = 'none';
    document.getElementById('resultsScreen').style.display = 'none';
    document.getElementById('practiceMode').style.display = 'none';
    document.getElementById('modeSelection').style.display = 'block';

    // Reset game state
    gameState.currentQuestion = 0;
    gameState.questions = [];
    gameState.mistakes = [];
    gameState.selectedAnswer = null;

    updateStats();
}

// Show practice mode
function showPracticeMode() {
    document.getElementById('modeSelection').style.display = 'none';
    document.getElementById('practiceMode').style.display = 'block';

    renderVerbsGrid();
}

// Render verbs grid
function renderVerbsGrid(filter = '') {
    const grid = document.getElementById('verbsGrid');
    const filteredVerbs = irregularVerbs.filter(verb =>
        verb.base.toLowerCase().includes(filter.toLowerCase()) ||
        verb.past.toLowerCase().includes(filter.toLowerCase()) ||
        verb.participle.toLowerCase().includes(filter.toLowerCase()) ||
        verb.italian.toLowerCase().includes(filter.toLowerCase())
    );

    grid.innerHTML = filteredVerbs.map(verb => `
        <div class="verb-card">
            <div class="base">${verb.base}</div>
            <div class="forms">
                <span class="form-label">Past Simple:</span>
                <span class="form-value">${verb.past}</span>
            </div>
            <div class="forms">
                <span class="form-label">Past Participle:</span>
                <span class="form-value">${verb.participle}</span>
            </div>
            <div class="italian">${verb.italian}</div>
        </div>
    `).join('');
}

// Filter verbs
function filterVerbs() {
    const filter = document.getElementById('searchInput').value;
    renderVerbsGrid(filter);
}

// Initialize app
document.addEventListener('DOMContentLoaded', function() {
    loadProgress();
    updateStats();
});

// Add keyboard shortcuts
document.addEventListener('keydown', function(e) {
    // ESC to go back to menu
    if (e.key === 'Escape') {
        const exerciseVisible = document.getElementById('exerciseArea').style.display !== 'none';
        const resultsVisible = document.getElementById('resultsScreen').style.display !== 'none';
        const practiceVisible = document.getElementById('practiceMode').style.display !== 'none';

        if (exerciseVisible || resultsVisible || practiceVisible) {
            backToMenu();
        }
    }
});
