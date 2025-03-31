// --- Global Variables & Constants ---
const setupForm = document.getElementById('setup-form');
const timeInput = document.getElementById('time-limit');
const questionsInput = document.getElementById('num-questions');
const scienceCheckbox = document.getElementById('subject-science');
const socialCheckbox = document.getElementById('subject-social');
const timeError = document.getElementById('time-error');
const questionsError = document.getElementById('questions-error');
const subjectError = document.getElementById('subject-error');
const errorPopup = document.getElementById('error-popup');
const popupMessage = document.getElementById('popup-message');

// Quiz Page Elements (will be null if not on quiz page)
const timerDisplay = document.getElementById('timer');
const quizContent = document.getElementById('quiz-content');
const submitQuizButton = document.getElementById('submit-quiz');

// Results Page Elements (will be null if not on results page)
const scoreDisplay = document.getElementById('score');
const totalQuestionsDisplay = document.getElementById('total-questions');
const timeTakenDisplay = document.getElementById('time-taken');
const timeoutMessageDisplay = document.getElementById('timeout-message');
const showDetailsButton = document.getElementById('show-details');
const detailedResultsContainer = document.getElementById('detailed-results');

let quizTimer; // Variable to hold the interval timer for the quiz
let quizSettings = {}; // To store settings like time, numQuestions, subjects
let userAnswers = {}; // To store user's selected answers { questionIndex: 'selectedOption' }
let quizQuestions = []; // Array holding the actual questions for the current quiz
let startTime; // To record when the quiz starts
let timeRanOut = false; // Flag if timer reaches zero


// --- Utility Functions ---

// Function to show pop-up error
function showPopupError(message) {
    popupMessage.textContent = message;
    errorPopup.style.display = 'block';
    // Hide after a delay
    setTimeout(() => {
        if (errorPopup) { // Check if element still exists
             errorPopup.style.display = 'none';
        }
    }, 2500); // Show for 2.5 seconds
}

// Function to clear error messages below inputs
function clearErrors() {
    if (timeError) timeError.textContent = '';
    if (questionsError) questionsError.textContent = '';
    if (subjectError) subjectError.textContent = '';
}

// Function to save settings to localStorage
function saveSettings(settings) {
    localStorage.setItem('quizSettings', JSON.stringify(settings));
}

// Function to load settings from localStorage
function loadSettings() {
    const settingsString = localStorage.getItem('quizSettings');
    return settingsString ? JSON.parse(settingsString) : null;
}

// Function to save results data to localStorage
function saveResults(results) {
    localStorage.setItem('quizResults', JSON.stringify(results));
}

// Function to load results data from localStorage
function loadResults() {
    const resultsString = localStorage.getItem('quizResults');
    return resultsString ? JSON.parse(resultsString) : null;
}

// --- Setup Page Logic ---

function handleSetupFormSubmit(event) {
    event.preventDefault(); // Prevent actual form submission
    clearErrors(); // Clear previous errors

    const timeLimit = parseInt(timeInput.value, 10);
    const numQuestions = parseInt(questionsInput.value, 10);
    const selectedSubjects = Array.from(document.querySelectorAll('input[name="subject"]:checked')).map(cb => cb.value);

    let isValid = true;

    // Validate Time Limit
    if (isNaN(timeLimit) || timeLimit < 1 || timeLimit > 180) {
        timeError.textContent = 'Limit: 1-180 minutes.';
        if (isNaN(timeLimit) && timeInput.value.trim() !== '') { // Check if not a number
             timeError.textContent += ' Please enter numbers only.';
        }
        isValid = false;
    }

    // Validate Number of Questions
    if (isNaN(numQuestions) || numQuestions < 10 || numQuestions > 100) {
        questionsError.textContent = 'Limit: 10-100 questions.';
         if (isNaN(numQuestions) && questionsInput.value.trim() !== '') { // Check if not a number
             questionsError.textContent += ' Please enter numbers only.';
        }
        isValid = false;
    }

    // Validate Subject Selection
    if (selectedSubjects.length === 0) {
        subjectError.textContent = 'Please select at least one subject.';
        isValid = false;
    }

    // Show generic pop-up if any validation failed
    if (!isValid) {
        showPopupError('Please review the setup options and correct any errors.');
        return; // Stop processing
    }

    // If validation passes:
    console.log('Setup Valid:', { timeLimit, numQuestions, selectedSubjects });

    // Store settings
    quizSettings = {
        timeLimit: timeLimit,
        numQuestions: numQuestions,
        subjects: selectedSubjects,
        examType: 'SEE' // Hardcoded for now
    };
    saveSettings(quizSettings);

    // Navigate to the quiz page
    window.location.href = 'quiz_see.html';
}

// --- Quiz Page Logic ---

function startQuizTimer(durationMinutes) {
    let secondsRemaining = durationMinutes * 60;
    startTime = Date.now(); // Record start time
    timeRanOut = false; // Reset timeout flag

    function updateTimerDisplay() {
        const minutes = Math.floor(secondsRemaining / 60);
        const seconds = secondsRemaining % 60;
        if (timerDisplay) {
            timerDisplay.textContent = `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
        }
    }

    updateTimerDisplay(); // Show initial time

    quizTimer = setInterval(() => {
        secondsRemaining--;
        updateTimerDisplay();

        if (secondsRemaining < 0) {
            clearInterval(quizTimer);
            timeRanOut = true;
            console.log("Time's up!");
            // Automatically submit/end the quiz
            submitQuiz();
        }
    }, 1000); // Update every second
}

function selectQuestions(settings) {
    const { numQuestions, subjects } = settings;
    let availableQuestions = seeQuestions.filter(q => subjects.includes(q.subject));

    // Shuffle available questions
    availableQuestions.sort(() => Math.random() - 0.5);

    let selectedQuestions = [];

    if (subjects.length === 1) {
        selectedQuestions = availableQuestions.slice(0, numQuestions);
    } else if (subjects.length === 2) {
        const questionsPerSubject = Math.floor(numQuestions / 2);
        const scienceQuestions = availableQuestions.filter(q => q.subject === 'Science').slice(0, questionsPerSubject);
        const socialQuestions = availableQuestions.filter(q => q.subject === 'Social').slice(0, questionsPerSubject);

        selectedQuestions = [...scienceQuestions, ...socialQuestions];

        // Handle odd number of questions - add one more Science question
        if (numQuestions % 2 !== 0 && selectedQuestions.length < numQuestions) {
            const extraScienceQuestion = availableQuestions.find(q => q.subject === 'Science' && !selectedQuestions.includes(q));
            if (extraScienceQuestion) {
                selectedQuestions.push(extraScienceQuestion);
            } else {
                 // Fallback: add an extra social if no more science available (edge case)
                 const extraSocialQuestion = availableQuestions.find(q => q.subject === 'Social' && !selectedQuestions.includes(q));
                 if (extraSocialQuestion) selectedQuestions.push(extraSocialQuestion);
            }
        }
    }

     // Ensure we don't exceed the requested number if sources were short
     selectedQuestions = selectedQuestions.slice(0, numQuestions);

    // Final shuffle to mix subjects if both were selected
    selectedQuestions.sort(() => Math.random() - 0.5);

    return selectedQuestions;
}


function renderQuestions(questionsToRender) {
    if (!quizContent) return;
    quizContent.innerHTML = ''; // Clear loading message or previous questions

    const questionsBySubject = questionsToRender.reduce((acc, question, index) => {
        if (!acc[question.subject]) {
            acc[question.subject] = [];
        }
        acc[question.subject].push({ ...question, originalIndex: index }); // Keep track of original order/index if needed
        return acc;
    }, {});


    Object.keys(questionsBySubject).forEach(subject => {
         const subjectSection = document.createElement('div');
         subjectSection.classList.add('subject-section'); // Add class for potential styling

         const subjectHeader = document.createElement('h3');
         subjectHeader.classList.add('question-subject-header');
         subjectHeader.textContent = `${subject} Questions`;
         subjectSection.appendChild(subjectHeader);

         questionsBySubject[subject].forEach((questionData) => {
            const questionBlock = document.createElement('div');
            questionBlock.classList.add('quiz-question-block');
            questionBlock.dataset.index = questionData.originalIndex; // Store index

            const questionText = document.createElement('p');
            questionText.classList.add('question-text');
            // Add question number for clarity (e.g., "1. What is...")
            // We need the overall index, not just within the subject
            const displayIndex = questionsToRender.findIndex(q => q === questionData) + 1;
            questionText.textContent = `${displayIndex}. ${questionData.question}`;
            questionBlock.appendChild(questionText);

            const optionsList = document.createElement('ul');
            optionsList.classList.add('options-list');

            questionData.options.forEach(option => {
                const optionItem = document.createElement('li');
                const radioId = `q${questionData.originalIndex}_opt${option.replace(/\s+/g, '')}`; // Unique ID for radio

                const radioInput = document.createElement('input');
                radioInput.type = 'radio';
                radioInput.name = `question_${questionData.originalIndex}`; // Group options for the same question
                radioInput.value = option;
                radioInput.id = radioId;
                radioInput.addEventListener('change', handleAnswerSelection); // Add event listener

                const radioLabel = document.createElement('label');
                radioLabel.htmlFor = radioId;
                radioLabel.textContent = option;

                optionItem.appendChild(radioInput);
                optionItem.appendChild(radioLabel);
                optionsList.appendChild(optionItem);
            });

            questionBlock.appendChild(optionsList);
            subjectSection.appendChild(questionBlock); // Add question to its subject section
        });

         quizContent.appendChild(subjectSection); // Add the whole subject section to the page
    });


}

function handleAnswerSelection(event) {
    const selectedRadio = event.target;
    const questionBlock = selectedRadio.closest('.quiz-question-block');
    const questionIndex = parseInt(questionBlock.dataset.index, 10);
    userAnswers[questionIndex] = selectedRadio.value;
    console.log('User Answers:', userAnswers); // For debugging
}

function submitQuiz() {
    clearInterval(quizTimer); // Stop the timer

    const endTime = Date.now();
    const timeTakenMs = endTime - startTime;

    // Calculate Score
    let score = 0;
    quizQuestions.forEach((question, index) => {
        if (userAnswers[index] && userAnswers[index] === question.answer) {
            score++;
        }
    });

    console.log(`Quiz Submitted. Score: ${score}/${quizQuestions.length}. Time Ran Out: ${timeRanOut}`);

    // Prepare results data
    const resultsData = {
        score: score,
        totalQuestions: quizQuestions.length,
        timeTaken: timeTakenMs, // Store milliseconds for potential future use
        userAnswers: userAnswers, // User's selections
        quizQuestions: quizQuestions, // The actual questions asked
        timeRanOut: timeRanOut,
        settings: quizSettings // Include original settings
    };

    // Save results to localStorage
    saveResults(resultsData);

    // Redirect to results page
    window.location.href = 'results_see.html';
}


// --- Results Page Logic ---

function displayResults() {
    const results = loadResults();
    if (!results || !scoreDisplay) { // Check if results exist and elements are present
        console.error("Could not load results or results elements not found.");
        // Maybe redirect back to index or show an error message
         if (detailedResultsContainer) detailedResultsContainer.innerHTML = '<p>Error loading results.</p>';
        return;
    }

    const { score, totalQuestions, timeTaken, timeRanOut: didTimeRunOut, settings } = results;

    // Display Summary
    scoreDisplay.textContent = score;
    totalQuestionsDisplay.textContent = totalQuestions;

    if (didTimeRunOut) {
        timeTakenDisplay.textContent = `Finished (Time Limit: ${settings.timeLimit} min)`;
        if (timeoutMessageDisplay) timeoutMessageDisplay.style.display = 'block'; // Show "Time ran out!" message
    } else {
        const minutes = Math.floor(timeTaken / 60000);
        const seconds = Math.floor((timeTaken % 60000) / 1000);
        timeTakenDisplay.textContent = `${minutes} min ${seconds} sec`;
         if (timeoutMessageDisplay) timeoutMessageDisplay.style.display = 'none';
    }

    // Add event listener for the "See Full Details" button
    if (showDetailsButton) {
        showDetailsButton.addEventListener('click', () => renderDetailedResults(results));
    } else {
        // If no button, maybe render details immediately? Or log error.
         console.log("Show details button not found, rendering details immediately.");
         renderDetailedResults(results); // Render directly if button is absent
    }


}

function renderDetailedResults(results) {
    if (!detailedResultsContainer || !results) return;

    const { quizQuestions: questions, userAnswers: answers, timeRanOut: didTimeRunOut } = results;
    detailedResultsContainer.innerHTML = ''; // Clear loading/previous details

    const questionsBySubject = questions.reduce((acc, question, index) => {
        const subject = question.subject;
        if (!acc[subject]) {
            acc[subject] = [];
        }
        acc[subject].push({ ...question, originalIndex: index }); // Use original index from results if available
        return acc;
    }, {});


     Object.keys(questionsBySubject).forEach(subject => {
         const subjectSection = document.createElement('div');
         subjectSection.classList.add('subject-section');

         const subjectHeader = document.createElement('h3');
         subjectHeader.classList.add('question-subject-header'); // Reuse class
         subjectHeader.textContent = `${subject} Questions Review`;
         subjectSection.appendChild(subjectHeader);

        questionsBySubject[subject].forEach((questionData) => {
            const index = questionData.originalIndex; // Get the original index
            const questionBlock = document.createElement('div');
            questionBlock.classList.add('quiz-question-block'); // Reuse class

            const questionText = document.createElement('p');
            questionText.classList.add('question-text');
            const displayIndex = questions.findIndex(q => q === questionData) + 1;
            questionText.textContent = `${displayIndex}. ${questionData.question}`;
            questionBlock.appendChild(questionText);

            const userAnswer = answers[index]; // Get the user's answer for this question index
            const correctAnswer = questionData.answer;

            const optionsList = document.createElement('ul');
            optionsList.classList.add('options-list');

            questionData.options.forEach(option => {
                const optionItem = document.createElement('li');
                optionItem.textContent = option;

                // Apply styling based on correctness and user selection
                if (option === correctAnswer) {
                    optionItem.classList.add('correct-option'); // Always mark the correct option
                    if (!userAnswer || userAnswer !== correctAnswer) {
                       // Optionally add a class if it was correct but not selected
                       // optionItem.classList.add('correct-unselected');
                    }
                }
                if (userAnswer && userAnswer === option) {
                    if (option !== correctAnswer) {
                        optionItem.classList.add('incorrect-option'); // Mark user's wrong choice
                        optionItem.classList.add('selected-wrong'); // Add background hint
                    }
                    // If userAnswer === option and option === correctAnswer, the 'correct-option' class handles it
                }

                optionsList.appendChild(optionItem);
            });

            questionBlock.appendChild(optionsList);

            // Add skipped/timeout message if applicable
            if (!userAnswer) {
                const skippedMsg = document.createElement('p');
                skippedMsg.classList.add('skipped-question');
                skippedMsg.textContent = didTimeRunOut ? 'Skipped (Time Out)' : 'Skipped';
                if(didTimeRunOut) skippedMsg.classList.add('timeout-header'); // Make timeout more prominent
                questionBlock.appendChild(skippedMsg);
            }
           subjectSection.appendChild(questionBlock); // Add question to its subject section
        });

         detailedResultsContainer.appendChild(subjectSection); // Add the whole subject section to the details container

     });


    detailedResultsContainer.style.display = 'block'; // Show the container
    if (showDetailsButton) showDetailsButton.style.display = 'none'; // Hide the button after clicking
}


// --- Page Load Logic ---

// Determine which page we are on and run the appropriate setup function
document.addEventListener('DOMContentLoaded', () => {
    const path = window.location.pathname;

    if (path.endsWith('setup_see.html') && setupForm) {
        console.log("Setup page loaded");
        setupForm.addEventListener('submit', handleSetupFormSubmit);
         // Add input type restrictions using JS as fallback/enhancement
        timeInput.addEventListener('input', (e) => { e.target.value = e.target.value.replace(/[^0-9]/g, ''); });
        questionsInput.addEventListener('input', (e) => { e.target.value = e.target.value.replace(/[^0-9]/g, ''); });

    } else if (path.endsWith('quiz_see.html') && quizContent) {
        console.log("Quiz page loaded");
        quizSettings = loadSettings();
        if (!quizSettings) {
            console.error("Settings not found, redirecting to setup.");
            window.location.href = 'setup_see.html'; // Redirect if no settings
            return;
        }
        quizQuestions = selectQuestions(quizSettings);
         if(quizQuestions.length < quizSettings.numQuestions) {
             console.warn(`Warning: Could only select ${quizQuestions.length} questions out of ${quizSettings.numQuestions} requested.`);
             // Optionally inform the user or adjust total questions display later
         }

        console.log("Selected Questions: ", quizQuestions);
        renderQuestions(quizQuestions);
        startQuizTimer(quizSettings.timeLimit);
        if (submitQuizButton) {
            submitQuizButton.addEventListener('click', submitQuiz);
        }

    } else if (path.endsWith('results_see.html') && detailedResultsContainer) {
        console.log("Results page loaded");
        displayResults();
    } else if (path.endsWith('index.html')) {
         console.log("Index page loaded");
         // Any specific JS for index page can go here
 }
})
