// --- Global Variables & Constants ---
// (Keep existing variable declarations for DOM elements: setupForm, timeInput, etc.)
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
const closePopupButton = document.querySelector('#error-popup .close-button'); // Get close button for popup

// Quiz Page Elements
const timerDisplay = document.getElementById('timer');
const quizContent = document.getElementById('quiz-content');
const submitQuizButton = document.getElementById('submit-quiz');

// Results Page Elements
const scoreDisplay = document.getElementById('score');
const totalQuestionsDisplay = document.getElementById('total-questions');
const timeTakenDisplay = document.getElementById('time-taken');
const timeoutMessageDisplay = document.getElementById('timeout-message');
const showDetailsButton = document.getElementById('show-details');
const detailedResultsContainer = document.getElementById('detailed-results');
const tryAgainButton = document.querySelector('.results-buttons a[href="setup_see.html"]'); // Specific selector for clarity
const goHomeButton = document.querySelector('.results-buttons a[href="index.html"]'); // Specific selector for clarity


let quizTimer; // Interval ID for the quiz timer
let quizEndTime; // Timestamp when the timer should end
let quizSettings = {}; // Stores { timeLimit, numQuestions, subjects, examType }
let userAnswers = {}; // Stores { questionIndex: 'selectedOption' }
let quizQuestions = []; // Array holding the actual questions for the current quiz instance
let startTime; // Timestamp when the quiz starts
let timeRanOut = false; // Flag if timer reaches zero

// Constants for min/max values - easier to manage
const MIN_TIME = 1;
const MAX_TIME = 180;
const MIN_QUESTIONS = 10;
const MAX_QUESTIONS = 100;

// --- Utility Functions ---

function showPopupError(message) {
    if (!errorPopup || !popupMessage) return; // Element check
    popupMessage.textContent = message;
    errorPopup.style.display = 'block';
    // Auto-hide after a delay
    setTimeout(() => {
        if (errorPopup) errorPopup.style.display = 'none';
    }, 2500); // Show for 2.5 seconds
}

// Function to hide the popup manually (e.g., via close button)
function hidePopupError() {
     if (errorPopup) errorPopup.style.display = 'none';
}

function clearErrors() {
    if (timeError) timeError.textContent = '';
    if (questionsError) questionsError.textContent = '';
    if (subjectError) subjectError.textContent = '';
    // Also remove any visual indication like red borders if added
    if (timeInput) timeInput.classList.remove('input-error');
    if (questionsInput) questionsInput.classList.remove('input-error');
    // Checkbox group doesn't typically get a border, but error text is cleared.
}

// Add a class to highlight input errors (requires CSS for .input-error)
function markInputError(element, errorElement, message) {
    if (element) element.classList.add('input-error');
    if (errorElement) errorElement.textContent = message;
}

// localStorage functions (no change needed, assuming they work)
function saveSettings(settings) {
    try {
        localStorage.setItem('quizSettings_see', JSON.stringify(settings)); // Use specific key
    } catch (e) {
        console.error("Error saving settings to localStorage:", e);
        // Optionally show a user-facing error
    }
}

function loadSettings() {
    try {
        const settingsString = localStorage.getItem('quizSettings_see');
        return settingsString ? JSON.parse(settingsString) : null;
    } catch (e) {
        console.error("Error loading settings from localStorage:", e);
        return null;
    }
}

function saveResults(results) {
     try {
        localStorage.setItem('quizResults_see', JSON.stringify(results)); // Use specific key
    } catch (e) {
        console.error("Error saving results to localStorage:", e);
    }
}

function loadResults() {
     try {
        const resultsString = localStorage.getItem('quizResults_see');
        return resultsString ? JSON.parse(resultsString) : null;
    } catch (e) {
        console.error("Error loading results from localStorage:", e);
        return null;
    }
}

// --- Setup Page Logic ---

function handleSetupFormSubmit(event) {
    event.preventDefault();
    clearErrors();

    const timeLimitStr = timeInput.value.trim();
    const numQuestionsStr = questionsInput.value.trim();
    const selectedSubjects = Array.from(document.querySelectorAll('input[name="subject"]:checked')).map(cb => cb.value);

    let isValid = true;
    let timeLimit = NaN;
    let numQuestions = NaN;

    // Validate Time Limit
    if (timeLimitStr === '') {
         markInputError(timeInput, timeError, `Please enter time (${MIN_TIME}-${MAX_TIME} min).`);
         isValid = false;
    } else if (!/^\d+$/.test(timeLimitStr)) { // Check if it's only digits
        markInputError(timeInput, timeError, 'Please enter whole numbers only.');
        isValid = false;
    } else {
        timeLimit = parseInt(timeLimitStr, 10);
        if (timeLimit < MIN_TIME || timeLimit > MAX_TIME) {
            markInputError(timeInput, timeError, `Limit: ${MIN_TIME}-${MAX_TIME} minutes.`);
            isValid = false;
        }
    }

    // Validate Number of Questions
    if (numQuestionsStr === '') {
         markInputError(questionsInput, questionsError, `Enter question count (${MIN_QUESTIONS}-${MAX_QUESTIONS}).`);
         isValid = false;
    } else if (!/^\d+$/.test(numQuestionsStr)) { // Check if it's only digits
        markInputError(questionsInput, questionsError, 'Please enter whole numbers only.');
         isValid = false;
    } else {
        numQuestions = parseInt(numQuestionsStr, 10);
        if (numQuestions < MIN_QUESTIONS || numQuestions > MAX_QUESTIONS) {
            markInputError(questionsInput, questionsError, `Limit: ${MIN_QUESTIONS}-${MAX_QUESTIONS} questions.`);
            isValid = false;
        }
    }

    // Validate Subject Selection
    if (selectedSubjects.length === 0) {
        // Mark the fieldset or just show the text error
        subjectError.textContent = 'Please select at least one subject.';
        isValid = false;
    }

    // Show generic pop-up if any validation failed
    if (!isValid) {
        showPopupError('Please review the setup options and correct errors.');
        return;
    }

    // If validation passes:
    console.log('Setup Valid:', { timeLimit, numQuestions, selectedSubjects });

    // Store settings
    quizSettings = {
        timeLimit: timeLimit,
        numQuestions: numQuestions,
        subjects: selectedSubjects,
        examType: 'SEE'
    };
    saveSettings(quizSettings);

    // Navigate to the quiz page
    window.location.href = 'quiz_see.html';
}

// --- Quiz Page Logic ---

function startQuizTimer(durationMinutes) {
    const durationSeconds = durationMinutes * 60;
    quizEndTime = Date.now() + durationSeconds * 1000; // Calculate end time
    startTime = Date.now(); // Record start time accurately
    timeRanOut = false;

    function updateTimer() {
        const now = Date.now();
        const secondsRemaining = Math.max(0, Math.round((quizEndTime - now) / 1000)); // Ensure non-negative

        const minutes = Math.floor(secondsRemaining / 60);
        const seconds = secondsRemaining % 60;

        if (timerDisplay) {
            timerDisplay.textContent = `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
        }

        if (secondsRemaining <= 0) {
            clearInterval(quizTimer);
            timeRanOut = true;
            console.log("Time's up!");
            if (!document.hidden) { // Prevent submitting if tab is not active (optional)
                submitQuiz(); // Auto-submit when time runs out
            }
        }
    }

    updateTimer(); // Show initial time immediately
    quizTimer = setInterval(updateTimer, 1000); // Update every second
}

// Function to shuffle an array (Fisher-Yates algorithm)
function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]]; // Swap elements
    }
}

function selectQuestions(settings) {
    const { numQuestions, subjects } = settings;
    // Filter available questions by selected subjects
    let availableQuestions = seeQuestions.filter(q => subjects.includes(q.subject));

    // Shuffle the entire pool of available questions first
    shuffleArray(availableQuestions);

    let selectedQuestions = [];
    const availableCount = availableQuestions.length;
    const targetNumQuestions = Math.min(numQuestions, availableCount); // Don't request more than available

     // Adjust numQuestions if fewer are available than the minimum required
     if (availableCount < MIN_QUESTIONS && availableCount > 0) {
         console.warn(`Warning: Only ${availableCount} questions available for selected subjects. Adjusting quiz size.`);
         settings.numQuestions = availableCount; // Update setting for consistency
     } else if (availableCount === 0) {
         console.error("No questions available for the selected subjects!");
         return []; // Return empty if no questions match
     }


    if (subjects.length === 1) {
        // Take the first 'targetNumQuestions' from the shuffled list
        selectedQuestions = availableQuestions.slice(0, targetNumQuestions);
    } else if (subjects.length === 2) { // Specifically handle the SEE case (Social, Science)
        const scienceAvailable = availableQuestions.filter(q => q.subject === 'Science');
        const socialAvailable = availableQuestions.filter(q => q.subject === 'Social');

        let scienceCount = Math.floor(targetNumQuestions / 2);
        let socialCount = Math.floor(targetNumQuestions / 2);

        // Handle odd number - give extra to Science as requested
        if (targetNumQuestions % 2 !== 0) {
            scienceCount++;
        }

        // Adjust counts if not enough questions in one subject
        if (scienceAvailable.length < scienceCount) {
            socialCount += (scienceCount - scienceAvailable.length); // Give remainder to social
            scienceCount = scienceAvailable.length; // Take all available science
        }
        if (socialAvailable.length < socialCount) {
             scienceCount += (socialCount - socialAvailable.length); // Give remainder back to science
             socialCount = socialAvailable.length; // Take all available social
        }

         // Ensure total doesn't exceed targetNumQuestions after adjustments
         scienceCount = Math.min(scienceCount, scienceAvailable.length);
         socialCount = Math.min(socialCount, socialAvailable.length);


        // Select the questions
        selectedQuestions = [
            ...scienceAvailable.slice(0, scienceCount),
            ...socialAvailable.slice(0, socialCount)
        ];

         // Final shuffle to mix the subjects again
         shuffleArray(selectedQuestions);
    }

     // Trim if adjustments led to slightly more than target (shouldn't happen with current logic, but safety check)
     selectedQuestions = selectedQuestions.slice(0, targetNumQuestions);


    console.log(`Selected ${selectedQuestions.length} questions.`);
    return selectedQuestions;
}


function renderQuestions(questionsToRender) {
    if (!quizContent) return;
    quizContent.innerHTML = ''; // Clear loading message

    // Group questions by subject for rendering sections
    const questionsBySubject = questionsToRender.reduce((acc, question, index) => {
        const subject = question.subject;
        if (!acc[subject]) {
            acc[subject] = [];
        }
        // Store the question itself and its overall index in the quizQuestions array
        acc[subject].push({ ...question, quizIndex: index });
        return acc;
    }, {});

    let questionCounter = 0; // Overall question number

    // Iterate through subjects found in the selected questions
    Object.keys(questionsBySubject).forEach(subject => {
        // Create a container for this subject's questions (the "curved box" effect is on the main #quiz-content card)
         const subjectSection = document.createElement('div');
         subjectSection.classList.add('subject-section', `subject-${subject.toLowerCase()}`); // e.g., subject-science

         const subjectHeader = document.createElement('h3');
         subjectHeader.classList.add('question-subject-header');
         subjectHeader.textContent = `${subject} Questions`;
         subjectSection.appendChild(subjectHeader);

        // Render each question within this subject's section
        questionsBySubject[subject].forEach(questionData => {
            questionCounter++;
            const questionBlock = document.createElement('div');
            questionBlock.classList.add('quiz-question-block');
            // Use the quizIndex we stored earlier
            questionBlock.dataset.index = questionData.quizIndex;

            const questionText = document.createElement('p');
            questionText.classList.add('question-text');
            // Use the overall counter for numbering
            questionText.innerHTML = `<strong>${questionCounter}.</strong> ${questionData.question}`; // Use innerHTML for potential formatting like bold
            questionBlock.appendChild(questionText);

            const optionsList = document.createElement('ul');
            optionsList.classList.add('options-list');

            // Shuffle options for each question (optional, but good practice)
            const shuffledOptions = [...questionData.options];
            shuffleArray(shuffledOptions);

            shuffledOptions.forEach(option => {
                const optionItem = document.createElement('li');
                // Use quizIndex and a sanitized option text for a unique ID
                const safeOptionIdPart = option.replace(/[^a-zA-Z0-9]/g, ''); // Remove special chars for ID
                const radioId = `q${questionData.quizIndex}_opt_${safeOptionIdPart}`;

                const radioInput = document.createElement('input');
                radioInput.type = 'radio';
                radioInput.name = `question_${questionData.quizIndex}`; // Group options for the same question
                radioInput.value = option; // The actual answer text is the value
                radioInput.id = radioId;
                radioInput.addEventListener('change', handleAnswerSelection);

                const radioLabel = document.createElement('label');
                radioLabel.htmlFor = radioId;
                radioLabel.textContent = option;

                optionItem.appendChild(radioInput);
                optionItem.appendChild(radioLabel);
                optionsList.appendChild(optionItem);
            });

            questionBlock.appendChild(optionsList);
            subjectSection.appendChild(questionBlock);
        });

        quizContent.appendChild(subjectSection); // Add this subject's section to the main content area
    });
     // Ensure the submit button is visible after loading questions
     if(submitQuizButton) submitQuizButton.style.display = 'inline-block'; // Or 'block' depending on layout
}

function handleAnswerSelection(event) {
    const selectedRadio = event.target;
    // Find the parent question block to get the index
    const questionBlock = selectedRadio.closest('.quiz-question-block');
    if (questionBlock && questionBlock.dataset.index !== undefined) {
        const questionIndex = parseInt(questionBlock.dataset.index, 10);
        userAnswers[questionIndex] = selectedRadio.value;
        // console.log(`Answered Q${questionIndex}: ${selectedRadio.value}`); // Optional: Debug log
    } else {
        console.error("Could not find question index for selected answer.");
    }
}

function submitQuiz() {
    // Prevent multiple submissions if called rapidly (e.g., time out + click)
    if (submitQuiz.submitted) return;
    submitQuiz.submitted = true; // Set a flag

    clearInterval(quizTimer); // Stop the timer

    // Calculate time taken only if the quiz wasn't ended by timeout previously
    const endTime = Date.now();
    const timeTakenMs = timeRanOut ? (quizSettings.timeLimit * 60 * 1000) : (endTime - startTime); // Use full time if timeout

    // Calculate Score
    let score = 0;
    quizQuestions.forEach((question, index) => {
        // Check if an answer exists for this index and if it matches the correct answer
        if (userAnswers[index] && userAnswers[index] === question.answer) {
            score++;
        }
    });

    console.log(`Quiz Submitted. Score: ${score}/${quizQuestions.length}. Time Ran Out: ${timeRanOut}`);

    // Prepare results data
    const resultsData = {
        score: score,
        totalQuestions: quizQuestions.length, // Use the actual number of questions shown
        timeTaken: timeTakenMs,
        userAnswers: userAnswers,
        quizQuestions: quizQuestions.map(({ subject, question, options, answer }) => ({ subject, question, options, answer })), // Send clean question data
        timeRanOut: timeRanOut,
        settings: quizSettings // Include original settings for context
    };

    // Save results
    saveResults(resultsData);

    // Redirect to results page
    window.location.href = 'results_see.html';
}
submitQuiz.submitted = false; // Initialize submission flag


// --- Results Page Logic ---

function displayResults() {
    const results = loadResults();
    if (!results || !scoreDisplay || !totalQuestionsDisplay || !timeTakenDisplay) {
        console.error("Could not load results or essential results elements not found.");
        if (detailedResultsContainer) { // Show error in details section if possible
            detailedResultsContainer.innerHTML = '<p class="error-message">Error loading quiz results. Please try setting up a new quiz.</p>';
            detailedResultsContainer.style.display = 'block';
        }
        // Hide summary elements if they exist but data is bad
         if (scoreDisplay) scoreDisplay.textContent = 'N/A';
         if (totalQuestionsDisplay) totalQuestionsDisplay.textContent = 'N/A';
         if (timeTakenDisplay) timeTakenDisplay.textContent = 'N/A';
         if (showDetailsButton) showDetailsButton.style.display = 'none'; // Hide details button
        return;
    }

    const { score, totalQuestions, timeTaken, timeRanOut: didTimeRunOut, settings } = results;

    // Display Summary
    scoreDisplay.textContent = score;
    totalQuestionsDisplay.textContent = totalQuestions;

    if (didTimeRunOut) {
        timeTakenDisplay.textContent = `Finished (Time Limit: ${settings.timeLimit} min)`;
        if (timeoutMessageDisplay) timeoutMessageDisplay.style.display = 'block';
    } else {
        const minutes = Math.floor(timeTaken / 60000);
        const seconds = Math.floor((timeTaken % 60000) / 1000);
        timeTakenDisplay.textContent = `${minutes} min ${seconds < 10 ? '0' : ''}${seconds} sec`;
         if (timeoutMessageDisplay) timeoutMessageDisplay.style.display = 'none';
    }

    // Event listener for the "See Full Details" button
    if (showDetailsButton && detailedResultsContainer) {
         showDetailsButton.addEventListener('click', () => {
             renderDetailedResults(results); // Pass full results data
             detailedResultsContainer.style.display = 'block'; // Show details section
                  showDetailsButton.style.display = 'none'; // Hide the button itself
         });
    } else if (detailedResultsContainer && !showDetailsButton) {
         // If button is missing, maybe render details immediately or log warning
         console.warn("Show details button not found. Details won't be expandable on click.");
         // renderDetailedResults(results); // Uncomment to show details by default if button is missing
         // detailedResultsContainer.style.display = 'block';
    }
} // End of displayResults function


function renderDetailedResults(results) {
    // Check if container exists and results are valid
    if (!detailedResultsContainer || !results || !results.quizQuestions) {
        console.error("Detailed results container or results data missing.");
        if(detailedResultsContainer) detailedResultsContainer.innerHTML = '<p class="error-message">Could not display detailed results.</p>';
        return;
    }

    const { quizQuestions: questions, userAnswers: answers, timeRanOut: didTimeRunOut } = results;
    detailedResultsContainer.innerHTML = ''; // Clear previous content

    // Group questions by subject for rendering sections, similar to quiz page
    const questionsBySubject = questions.reduce((acc, question, index) => {
        const subject = question.subject;
        if (!acc[subject]) {
            acc[subject] = [];
        }
        // Include the index from the original quizQuestions array
        acc[subject].push({ ...question, quizIndex: index });
        return acc;
    }, {});

    let questionCounter = 0; // Overall question number

    Object.keys(questionsBySubject).forEach(subject => {
        const subjectSection = document.createElement('div');
        subjectSection.classList.add('subject-section', `subject-${subject.toLowerCase()}-review`);

        const subjectHeader = document.createElement('h3');
        subjectHeader.classList.add('question-subject-header');
        subjectHeader.textContent = `${subject} Review`;
        subjectSection.appendChild(subjectHeader);

        questionsBySubject[subject].forEach(questionData => {
            questionCounter++;
            const index = questionData.quizIndex; // Get the index for this question
            const questionBlock = document.createElement('div');
            questionBlock.classList.add('quiz-question-block'); // Reuse styling

            const questionText = document.createElement('p');
            questionText.classList.add('question-text');
            questionText.innerHTML = `<strong>${questionCounter}.</strong> ${questionData.question}`;
            questionBlock.appendChild(questionText);

            const userAnswer = answers[index]; // User's recorded answer for this index
            const correctAnswer = questionData.answer;
            const isCorrect = userAnswer === correctAnswer;
            const isSkipped = userAnswer === undefined || userAnswer === null;

            const optionsList = document.createElement('ul');
            optionsList.classList.add('options-list', 'results-options'); // Add specific class for results styling

            questionData.options.forEach(option => {
                const optionItem = document.createElement('li');
                optionItem.textContent = option; // Display the option text

                // Apply classes based on correctness and user selection
                if (option === correctAnswer) {
                    optionItem.classList.add('correct-option'); // Green tick (via CSS ::after)
                }

                if (!isSkipped && userAnswer === option) { // If the user selected this option
                    if (!isCorrect) {
                        optionItem.classList.add('incorrect-option'); // Red cross (via CSS ::after)
                        optionItem.classList.add('selected-wrong'); // Optional background highlight
                    }
                    // No extra class needed if they selected the correct one ('correct-option' handles it)
                }

                optionsList.appendChild(optionItem);
            });

            questionBlock.appendChild(optionsList);

            // Add message for skipped questions
            if (isSkipped) {
                const skippedMsg = document.createElement('p');
                skippedMsg.classList.add('skipped-question'); // General skipped style
                if (didTimeRunOut) {
                    skippedMsg.textContent = 'Skipped (Time Out)';
                    skippedMsg.classList.add('timeout-header'); // More prominent style for timeout
                } else {
                    skippedMsg.textContent = 'Skipped';
                }
                questionBlock.appendChild(skippedMsg);
            }

            subjectSection.appendChild(questionBlock);
        });
        detailedResultsContainer.appendChild(subjectSection);
    });
} // End of renderDetailedResults function


// --- Page Load Logic / Event Listener Setup ---

document.addEventListener('DOMContentLoaded', () => {
    const path = window.location.pathname;
    const pageName = path.substring(path.lastIndexOf('/') + 1); // Get filename

    console.log(`Loading page: ${pageName}`); // Debug: Confirm page load

    if (pageName === 'setup_see.html' && setupForm) {
        console.log("Attaching setup form listener");
        setupForm.addEventListener('submit', handleSetupFormSubmit);

        // Add listeners to clear errors on input change (optional UX improvement)
        timeInput?.addEventListener('input', () => { if (timeError) timeError.textContent = ''; timeInput.classList.remove('input-error'); });
        questionsInput?.addEventListener('input', () => { if (questionsError) questionsError.textContent = ''; questionsInput.classList.remove('input-error'); });
        document.querySelectorAll('input[name="subject"]').forEach(cb => {
            cb.addEventListener('change', () => { if (subjectError) subjectError.textContent = ''; });
        });

         // Add listener for the popup close button
         if(closePopupButton) {
             closePopupButton.addEventListener('click', hidePopupError);
         }

    } else if (pageName === 'quiz_see.html' && quizContent) {
        console.log("Initializing quiz page");
        quizSettings = loadSettings();
        if (!quizSettings) {
            console.error("Quiz settings not found in localStorage. Redirecting to setup.");
            alert("Error: Quiz configuration not found. Please set up the quiz again."); // User feedback
            window.location.href = 'setup_see.html';
            return; // Stop execution
        }

        quizQuestions = selectQuestions(quizSettings);

        // Handle case where no questions could be selected
        if (quizQuestions.length === 0) {
             console.error("No questions were selected based on settings. Redirecting.");
             alert("Error: No questions available for the selected criteria. Please adjust settings.");
             window.location.href = 'setup_see.html';
             return;
        }

        // Update total questions in settings if adjusted due to availability
        if(quizQuestions.length !== quizSettings.numQuestions) {
             console.warn(`Adjusted quiz size to ${quizQuestions.length} due to question availability.`);
             quizSettings.numQuestions = quizQuestions.length;
             saveSettings(quizSettings); // Save the adjusted settings
        }


        renderQuestions(quizQuestions);
        startQuizTimer(quizSettings.timeLimit);
        if (submitQuizButton) {
            submitQuizButton.addEventListener('click', () => submitQuiz()); // Use arrow function to ensure `this` isn't rebound if needed later
        } else {
             console.error("Submit button not found!");
        }

         // Initialize userAnswers object for this quiz instance
         userAnswers = {};
         submitQuiz.submitted = false; // Reset submission flag on page load


    } else if (pageName === 'results_see.html' && detailedResultsContainer) {
        console.log("Initializing results page");
        displayResults();
    } else if (pageName === 'index.html' || pageName === '' || path === '/') { // Handle root path and empty page name too
         console.log("Index page loaded");
         // Optional: Clean up old quiz data from localStorage (uncomment if needed)
         // localStorage.removeItem('quizSettings_see');
         // localStorage.removeItem('quizResults_see');
    } else {
        console.log("Loaded a page with no specific JS initialization needed or page not recognized:", pageName);
    }
}); // End of DOMContentLoaded listener
