// Fix: Add Firebase imports for v8 SDK to make the 'firebase' object available.
import firebase from 'firebase/app';
import 'firebase/auth';
import 'firebase/database';

// IMPORTANT: Replace with your actual Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyASxfEAmNX036kXzLMx4vCgZ2SShjZtVOc",
  authDomain: "athlos-fitness.firebaseapp.com",
  databaseURL: "https://athlos-fitness-default-rtdb.firebaseio.com",
  projectId: "athlos-fitness",
  storageBucket: "athlos-fitness.firebasestorage.app",
  messagingSenderId: "441672999167",
  appId: "1:441672999167:web:b5149212b1e3af78e22cca",
  measurementId: "G-84677WGNDS"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const database = firebase.database();

const App = {
    state: {
        currentPage: 'splash-screen',
        previousPage: null,
        currentUser: null,
        userProfile: null,
        timerInterval: null,
        currentExercise: null,
    },
    elements: {},
    init() {
        this.cacheDOMElements();
        this.bindEvents();
        this.initFirebaseAuth();

        setTimeout(() => {
            this.navigateTo('focus-areas-screen');
        }, 2000);
    },

    cacheDOMElements() {
        this.elements.pages = document.querySelectorAll('.page');
        this.elements.navButtons = document.querySelectorAll('.nav-btn');
        this.elements.logoutBtn = document.getElementById('logout-btn');
        this.elements.authModal = document.getElementById('auth-modal');
        this.elements.authForm = document.getElementById('auth-form');
        this.elements.authTitle = document.getElementById('auth-title');
        this.elements.authSubmitBtn = document.getElementById('auth-submit-btn');
        this.elements.authModeLink = document.getElementById('auth-mode-link');
        this.elements.toggleAuthText = document.getElementById('toggle-auth-mode');
        this.elements.authError = document.getElementById('auth-error');
        this.elements.exerciseTriggers = document.querySelectorAll('.exercise-trigger');
        this.elements.backButtons = document.querySelectorAll('.back-btn');
        this.elements.levelCards = document.querySelectorAll('.level-card');
        
        // Exercise Player elements
        this.elements.exercisePlayer = document.getElementById('exercise-player-screen');
        this.elements.exerciseVideo = document.getElementById('exercise-video');
        this.elements.exerciseName = document.getElementById('exercise-name');
        this.elements.timerDisplay = document.getElementById('timer-display');
        this.elements.doneBtn = document.getElementById('done-btn');

        // Tracker elements
        this.elements.startingWeight = document.getElementById('starting-weight');
        this.elements.currentWeight = document.getElementById('current-weight');
        this.elements.weightLoss = document.getElementById('weight-loss');
        
        // Plan elements
        this.elements.planDayCards = document.querySelectorAll('#plan-screen .day-card');
    },

    bindEvents() {
        this.elements.navButtons.forEach(btn => {
            btn.addEventListener('click', () => this.navigateTo(btn.dataset.targetPage));
        });
        
        this.elements.logoutBtn.addEventListener('click', () => this.signOut());
        
        this.elements.authForm.addEventListener('submit', (e) => this.handleAuth(e));
        
        this.elements.authModeLink.addEventListener('click', () => this.toggleAuthMode());

        this.elements.exerciseTriggers.forEach(trigger => {
            trigger.addEventListener('click', () => this.startExercise(trigger));
        });

        this.elements.backButtons.forEach(btn => {
            btn.addEventListener('click', () => this.goBack(btn));
        });
        
        this.elements.doneBtn.addEventListener('click', () => this.finishExercise());

        this.elements.levelCards.forEach(card => {
            card.addEventListener('click', () => this.navigateTo(card.dataset.targetPage));
        });
    },

    navigateTo(pageId) {
        const targetPage = document.getElementById(pageId);
        if (!targetPage) return;

        // Auth guard
        if (targetPage.dataset.requiresAuth && !this.state.currentUser) {
            this.elements.authModal.classList.remove('hidden');
            return;
        }
        
        this.elements.authModal.classList.add('hidden');

        if (this.state.currentPage !== pageId) {
            this.state.previousPage = this.state.currentPage;
            this.state.currentPage = pageId;
        }

        this.elements.pages.forEach(page => page.classList.remove('active'));
        targetPage.classList.add('active');

        this.updateActiveNav(pageId);
    },
    
    goBack(btn) {
        const targetPage = btn.dataset.targetPage || this.state.previousPage || 'focus-areas-screen';
        this.navigateTo(targetPage);
    },

    updateActiveNav(pageId) {
        this.elements.navButtons.forEach(btn => {
            if (btn.dataset.targetPage === pageId) {
                btn.classList.add('active');
            } else {
                btn.classList.remove('active');
            }
        });
    },

    initFirebaseAuth() {
        auth.onAuthStateChanged(user => {
            if (user) {
                this.state.currentUser = user;
                this.elements.logoutBtn.classList.remove('hidden');
                this.elements.authModal.classList.add('hidden');
                this.loadUserProfile(user);
            } else {
                this.state.currentUser = null;
                this.state.userProfile = null;
                this.elements.logoutBtn.classList.add('hidden');
                this.clearUserData();
            }
        });
    },
    
    toggleAuthMode() {
        const isLogin = this.elements.authTitle.textContent === 'Login';
        if (isLogin) {
            this.elements.authTitle.textContent = 'Register';
            this.elements.authSubmitBtn.textContent = 'Register';
            this.elements.toggleAuthText.innerHTML = 'Already have an account? <span id="auth-mode-link">Login</span>';
        } else {
            this.elements.authTitle.textContent = 'Login';
            this.elements.authSubmitBtn.textContent = 'Login';
            this.elements.toggleAuthText.innerHTML = `Don't have an account? <span id="auth-mode-link">Register</span>`;
        }
        // Re-bind the click event to the new span
        document.getElementById('auth-mode-link').addEventListener('click', () => this.toggleAuthMode());
    },

    handleAuth(e) {
        e.preventDefault();
        const email = this.elements.authForm.email.value;
        const password = this.elements.authForm.password.value;
        const isLogin = this.elements.authTitle.textContent === 'Login';

        if (isLogin) {
            this.loginUser(email, password);
        } else {
            this.registerUser(email, password);
        }
    },
    
    loginUser(email, password) {
        auth.signInWithEmailAndPassword(email, password)
            .catch(error => {
                this.elements.authError.textContent = error.message;
            });
    },
    
    registerUser(email, password) {
        const startingWeight = prompt("Please enter your starting weight (in lbs):");
        if (!startingWeight || isNaN(parseFloat(startingWeight))) {
            alert("Invalid weight. Please try registering again.");
            return;
        }

        auth.createUserWithEmailAndPassword(email, password)
            .then(userCredential => {
                const user = userCredential.user;
                const weight = parseFloat(startingWeight);
                database.ref('users/' + user.uid).set({
                    startingWeight: weight,
                    currentWeight: weight,
                    checkIns: {}
                });
            })
            .catch(error => {
                this.elements.authError.textContent = error.message;
            });
    },

    signOut() {
        auth.signOut().then(() => {
            this.navigateTo('focus-areas-screen');
        });
    },
    
    loadUserProfile(user) {
        database.ref('users/' + user.uid).on('value', (snapshot) => {
            const data = snapshot.val();
            if (data) {
                this.state.userProfile = data;
                this.updateTrackerUI();
                this.updatePlanUI();
            }
        });
    },
    
    clearUserData() {
        this.elements.startingWeight.textContent = '...';
        this.elements.currentWeight.textContent = '...';
        this.elements.weightLoss.textContent = '...';
        this.elements.planDayCards.forEach(card => card.classList.remove('completed'));
    },
    
    updateTrackerUI() {
        if (!this.state.userProfile) return;
        const { startingWeight, currentWeight } = this.state.userProfile;
        const loss = startingWeight - currentWeight;

        this.elements.startingWeight.textContent = startingWeight.toFixed(1);
        this.elements.currentWeight.textContent = currentWeight.toFixed(1);
        this.elements.weightLoss.textContent = loss.toFixed(1);
    },

    updatePlanUI() {
        if (!this.state.userProfile || !this.state.userProfile.checkIns) return;
        const checkIns = this.state.userProfile.checkIns;
        this.elements.planDayCards.forEach(card => {
            const day = card.dataset.day;
            if (day && checkIns['day' + day]) {
                card.classList.add('completed');
            } else {
                card.classList.remove('completed');
            }
        });
    },

    startExercise(element) {
        const { name, video, reps, duration, day } = element.dataset;

        this.state.currentExercise = { name, video, reps, duration, day };
        
        this.elements.exerciseName.textContent = name;
        this.elements.exerciseVideo.src = video;
        this.elements.exerciseVideo.play();
        
        let totalSeconds;
        if (duration) {
            totalSeconds = parseInt(duration, 10);
        } else if (reps) {
            totalSeconds = parseInt(reps, 10) * 2.5; // 2.5s per rep
        } else {
            totalSeconds = 30; // Default
        }

        this.navigateTo('exercise-player-screen');
        this.startTimer(totalSeconds);
    },

    startTimer(duration) {
        clearInterval(this.state.timerInterval);
        let timer = duration;
        this.updateTimerDisplay(timer);

        this.state.timerInterval = setInterval(() => {
            timer--;
            this.updateTimerDisplay(timer);
            if (timer <= 0) {
                clearInterval(this.state.timerInterval);
                // Maybe play a sound or give visual feedback
            }
        }, 1000);
    },
    
    updateTimerDisplay(seconds) {
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = seconds % 60;
        this.elements.timerDisplay.textContent = 
            `${String(minutes).padStart(2, '0')}:${String(remainingSeconds).padStart(2, '0')}`;
    },

    finishExercise() {
        clearInterval(this.state.timerInterval);
        this.elements.exerciseVideo.pause();

        const { day } = this.state.currentExercise;
        if (day && this.state.currentUser) {
            this.completePlanDay(day);
        }
        
        this.goBack(this.elements.doneBtn);
        this.state.currentExercise = null;
    },

    completePlanDay(day) {
        const userId = this.state.currentUser.uid;
        const dayKey = 'day' + day;
        const userRef = database.ref('users/' + userId);
        
        userRef.child('checkIns').child(dayKey).once('value', snapshot => {
            if (!snapshot.exists()) {
                // Only update weight if it's the first time completing this day
                const newCurrentWeight = (this.state.userProfile.currentWeight || 0) - 0.2;
                userRef.update({
                    currentWeight: newCurrentWeight
                });
            }
            // Mark as completed regardless
            userRef.child('checkIns').update({ [dayKey]: true });
        });
    },
};

document.addEventListener('DOMContentLoaded', () => App.init());