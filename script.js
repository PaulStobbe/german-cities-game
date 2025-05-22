class GermanCitiesGame {
    constructor() {
        this.cities = [
            { name: 'Berlin', x: 520, y: 280, state: 'Berlin', population: '3.7M', hint: 'Capital city, once divided by a wall' },
            { name: 'München', x: 420, y: 650, state: 'Bayern', population: '1.5M', hint: 'Home of Oktoberfest and BMW' },
            { name: 'Hamburg', x: 380, y: 180, state: 'Hamburg', population: '1.9M', hint: 'Major port city, media capital' },
            { name: 'Köln', x: 260, y: 400, state: 'Nordrhein-Westfalen', population: '1.1M', hint: 'Famous cathedral, oldest city in Germany' },
            { name: 'Frankfurt', x: 340, y: 450, state: 'Hessen', population: '750K', hint: 'Financial center, many skyscrapers' },
            { name: 'Stuttgart', x: 360, y: 580, state: 'Baden-Württemberg', population: '630K', hint: 'Home of Mercedes-Benz and Porsche' },
            { name: 'Dresden', x: 500, y: 380, state: 'Sachsen', population: '560K', hint: 'Beautiful baroque architecture, Elbe river' },
            { name: 'Leipzig', x: 460, y: 350, state: 'Sachsen', population: '590K', hint: 'City of music, Bach worked here' },
            { name: 'Hannover', x: 360, y: 280, state: 'Niedersachsen', population: '540K', hint: 'Major trade fair city' },
            { name: 'Nürnberg', x: 420, y: 550, state: 'Bayern', population: '520K', hint: 'Historic old town, Christmas market' },
            { name: 'Bremen', x: 320, y: 200, state: 'Bremen', population: '570K', hint: 'Hanseatic city, space industry' },
            { name: 'Düsseldorf', x: 240, y: 360, state: 'Nordrhein-Westfalen', population: '620K', hint: 'Fashion and art center, Japanese quarter' },
            { name: 'Dortmund', x: 280, y: 340, state: 'Nordrhein-Westfalen', population: '590K', hint: 'Football city, former steel industry' },
            { name: 'Essen', x: 260, y: 340, state: 'Nordrhein-Westfalen', population: '580K', hint: 'European Capital of Culture 2010' },
            { name: 'Magdeburg', x: 440, y: 300, state: 'Sachsen-Anhalt', population: '240K', hint: 'Otto the Great\'s city, Elbe river' },
            { name: 'Rostock', x: 460, y: 140, state: 'Mecklenburg-Vorpommern', population: '210K', hint: 'Baltic Sea port, university city' }
        ];

        this.gameMode = 'locate';
        this.currentCityIndex = 0;
        this.score = 0;
        this.streak = 0;
        this.bestStreak = parseInt(localStorage.getItem('bestStreak') || '0');
        this.completedCities = new Set();
        this.gameStarted = false;
        
        this.initializeGame();
    }

    initializeGame() {
        this.setupEventListeners();
        this.renderCities();
        this.updateUI();
        this.nextQuestion();
    }

    setupEventListeners() {
        document.getElementById('mode-locate').addEventListener('click', () => this.setGameMode('locate'));
        document.getElementById('mode-name').addEventListener('click', () => this.setGameMode('name'));
        document.getElementById('mode-quiz').addEventListener('click', () => this.setGameMode('quiz'));

        document.getElementById('next-question').addEventListener('click', () => this.nextQuestion());
        document.getElementById('skip-question').addEventListener('click', () => this.skipQuestion());
        document.getElementById('show-all').addEventListener('click', () => this.showAllCities());
        document.getElementById('restart-game').addEventListener('click', () => this.restartGame());

        document.getElementById('germany-map').addEventListener('click', (e) => this.handleMapClick(e));
        
        // Add city marker click handlers
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('city-marker')) {
                this.handleCityMarkerClick(parseInt(e.target.dataset.cityIndex));
            }
        });
    }

    setGameMode(mode) {
        this.gameMode = mode;
        document.querySelectorAll('.mode-btn').forEach(btn => btn.classList.remove('active'));
        document.getElementById(`mode-${mode}`).classList.add('active');
        this.nextQuestion();
    }

    renderCities() {
        const map = document.getElementById('germany-map');
        
        map.querySelectorAll('.city-marker, .city-label').forEach(el => el.remove());

        this.cities.forEach((city, index) => {
            const marker = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
            marker.setAttribute('cx', city.x);
            marker.setAttribute('cy', city.y);
            marker.setAttribute('r', '6');
            marker.setAttribute('fill', '#3498db');
            marker.setAttribute('stroke', '#2c3e50');
            marker.setAttribute('stroke-width', '2');
            marker.classList.add('city-marker');
            marker.dataset.cityIndex = index;
            
            const label = document.createElementNS('http://www.w3.org/2000/svg', 'text');
            label.setAttribute('x', city.x);
            label.setAttribute('y', city.y - 15);
            label.textContent = city.name;
            label.classList.add('city-label');
            label.style.display = 'none';
            
            map.appendChild(marker);
            map.appendChild(label);
        });

        this.renderCityList();
    }

    renderCityList() {
        const citiesGrid = document.getElementById('cities-grid');
        citiesGrid.innerHTML = '';

        this.cities.forEach((city, index) => {
            const cityItem = document.createElement('div');
            cityItem.className = 'city-item';
            cityItem.textContent = `${city.name} (${city.state})`;
            
            if (this.completedCities.has(index)) {
                cityItem.classList.add('completed');
            }
            if (index === this.currentCityIndex) {
                cityItem.classList.add('current');
            }
            
            citiesGrid.appendChild(cityItem);
        });
    }

    handleMapClick(event) {
        if (this.gameMode !== 'locate') return;

        const rect = event.currentTarget.getBoundingClientRect();
        const x = (event.clientX - rect.left) * (800 / rect.width);
        const y = (event.clientY - rect.top) * (1000 / rect.height);

        this.checkLocationAnswer(x, y);
    }

    handleCityMarkerClick(cityIndex) {
        if (this.gameMode === 'name') {
            this.checkNameAnswer(cityIndex);
        } else if (this.gameMode === 'quiz') {
            this.checkQuizAnswer(cityIndex);
        }
    }

    checkLocationAnswer(clickX, clickY) {
        const currentCity = this.cities[this.currentCityIndex];
        const distance = Math.sqrt(Math.pow(clickX - currentCity.x, 2) + Math.pow(clickY - currentCity.y, 2));
        const threshold = 50;

        this.processAnswer(distance <= threshold, currentCity);
    }

    checkNameAnswer(clickedCityIndex) {
        const isCorrect = clickedCityIndex === this.currentCityIndex;
        const currentCity = this.cities[this.currentCityIndex];
        this.processAnswer(isCorrect, currentCity);
    }

    checkQuizAnswer(clickedCityIndex) {
        const isCorrect = clickedCityIndex === this.currentCityIndex;
        const currentCity = this.cities[this.currentCityIndex];
        this.processAnswer(isCorrect, currentCity);
    }

    processAnswer(isCorrect, city) {
        const feedback = document.getElementById('feedback');
        const marker = document.querySelector(`[data-city-index="${this.currentCityIndex}"]`);
        const label = marker.nextElementSibling;

        if (isCorrect) {
            this.score += this.gameMode === 'locate' ? 3 : this.gameMode === 'name' ? 2 : 1;
            this.streak++;
            if (this.streak > this.bestStreak) {
                this.bestStreak = this.streak;
                localStorage.setItem('bestStreak', this.bestStreak.toString());
            }
            this.completedCities.add(this.currentCityIndex);
            
            marker.classList.add('correct');
            label.style.display = 'block';
            
            feedback.textContent = `Correct! ${city.name} is in ${city.state}. Population: ${city.population}`;
            feedback.className = 'feedback correct';
            feedback.style.display = 'block';
            
            setTimeout(() => this.nextQuestion(), 2000);
        } else {
            this.streak = 0;
            marker.classList.add('incorrect');
            
            feedback.textContent = `Not quite right. The correct answer was ${city.name}. Try the next one!`;
            feedback.className = 'feedback incorrect';
            feedback.style.display = 'block';
            
            setTimeout(() => {
                marker.classList.remove('incorrect');
                this.nextQuestion();
            }, 2500);
        }

        this.updateUI();
    }

    nextQuestion() {
        document.getElementById('feedback').style.display = 'none';
        document.getElementById('hint').style.display = 'none';
        
        document.querySelectorAll('.city-marker').forEach(marker => {
            marker.classList.remove('correct', 'incorrect', 'highlighted');
        });

        const availableCities = this.cities.map((_, index) => index)
            .filter(index => !this.completedCities.has(index));
        
        if (availableCities.length === 0) {
            this.gameComplete();
            return;
        }

        this.currentCityIndex = availableCities[Math.floor(Math.random() * availableCities.length)];
        const currentCity = this.cities[this.currentCityIndex];

        const questionElement = document.getElementById('question');
        switch (this.gameMode) {
            case 'locate':
                questionElement.textContent = `📍 Click on ${currentCity.name}`;
                break;
            case 'name':
                questionElement.textContent = `🏙️ What city is highlighted?`;
                this.highlightCity(this.currentCityIndex);
                break;
            case 'quiz':
                this.generateQuizQuestion();
                break;
        }

        this.updateUI();
    }

    highlightCity(cityIndex) {
        const marker = document.querySelector(`[data-city-index="${cityIndex}"]`);
        marker.classList.add('highlighted');
    }

    generateQuizQuestion() {
        const currentCity = this.cities[this.currentCityIndex];
        const questionTypes = [
            {
                question: `Which state is ${currentCity.name} located in?`,
                answer: currentCity.state
            },
            {
                question: `${currentCity.hint}. Which city is this?`,
                answer: currentCity.name
            },
            {
                question: `Which city has a population of approximately ${currentCity.population}?`,
                answer: currentCity.name
            }
        ];
        
        const selectedQuestion = questionTypes[Math.floor(Math.random() * questionTypes.length)];
        const questionElement = document.getElementById('question');
        questionElement.textContent = `❓ ${selectedQuestion.question}`;
        
        // For quiz mode, show hint
        const hint = document.getElementById('hint');
        hint.textContent = `Click on the city you think is the answer!`;
        hint.style.display = 'block';
    }

    skipQuestion() {
        const currentCity = this.cities[this.currentCityIndex];
        const marker = document.querySelector(`[data-city-index="${this.currentCityIndex}"]`);
        const label = marker.nextElementSibling;
        
        marker.classList.add('correct');
        label.style.display = 'block';
        
        const hint = document.getElementById('hint');
        hint.textContent = `${currentCity.name}: ${currentCity.hint}`;
        hint.style.display = 'block';
        
        this.completedCities.add(this.currentCityIndex);
        this.streak = 0;
        
        setTimeout(() => this.nextQuestion(), 3000);
        this.updateUI();
    }

    showAllCities() {
        document.querySelectorAll('.city-marker').forEach((marker, index) => {
            marker.classList.add('correct');
            marker.nextElementSibling.style.display = 'block';
        });
    }

    restartGame() {
        this.score = 0;
        this.streak = 0;
        this.completedCities.clear();
        this.currentCityIndex = 0;
        
        document.querySelectorAll('.city-marker').forEach(marker => {
            marker.classList.remove('correct', 'incorrect', 'highlighted');
            marker.nextElementSibling.style.display = 'none';
        });
        
        document.getElementById('feedback').style.display = 'none';
        document.getElementById('hint').style.display = 'none';
        
        this.updateUI();
        this.nextQuestion();
    }

    gameComplete() {
        const questionElement = document.getElementById('question');
        questionElement.textContent = '🎉 Congratulations! You\'ve completed all cities!';
        
        const feedback = document.getElementById('feedback');
        feedback.textContent = `Final Score: ${this.score} points. Great job learning German geography!`;
        feedback.className = 'feedback correct';
        feedback.style.display = 'block';
        
        // Show all cities
        this.showAllCities();
    }

    updateUI() {
        document.getElementById('score').textContent = this.score;
        document.getElementById('streak').textContent = this.streak;
        document.getElementById('best-streak').textContent = this.bestStreak;
        document.getElementById('progress').textContent = `${this.completedCities.size}/${this.cities.length}`;
        
        this.renderCityList();
    }
}

// Initialize the game when the page loads
document.addEventListener('DOMContentLoaded', () => {
    new GermanCitiesGame();
});