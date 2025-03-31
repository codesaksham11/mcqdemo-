document.addEventListener('DOMContentLoaded', () => {

    console.log("quiz_see.js loaded and DOM ready.");

    // --- Get DOM Elements ---
    const timerDisplay = $('timer');
    const quizContent = $('quiz-content');
    const submitQuizButton = $('submit-quiz');
    const loadingMessage = document.querySelector('.loading-message'); // Assuming one exists

    // --- Quiz State Variables ---
    let quizSettings = null; // To hold settings loaded from storage
    let quizQuestions = []; // Array of question objects selected for this quiz
    let userAnswers = {};   // Object to store { questionIndex: selectedOptionValue }
    let quizTimerInterval = null; // Holds the interval ID for the timer
    let quizStartTime = null; // Timestamp when the quiz begins
    let quizEndTime = null;   // Timestamp when the timer should end
    let timeRanOut = false;   // Flag if timer hits 0
    let isQuizSubmitted = false; // Flag to prevent double submission

    // --- Initialization ---

    /**
     * Loads settings, selects questions, renders them, and starts the timer.
     */
    function initializeQuiz() {
        console.log("Initializing quiz...");

        // 1. Load Settings from Local Storage
        quizSettings = loadFromLocalStorage(STORAGE_KEYS.QUIZ_SETTINGS);

        if (!quizSettings) {
            console.error("FATAL: Quiz settings not found in localStorage.");
            alert("Error: Could not load quiz settings. Please return to the setup page.");
            // Redirect back to setup if settings are missing
            window.location.href = 'setup_see.html';
            return; // Stop execution
        }

        console.log("Settings loaded:", quizSettings);

        // 2. Check if seeQuestions data is available (loaded from questions_see.js)
        if (typeof seeQuestions === 'undefined' || !Array.isArray(seeQuestions)) {
            console.error("FATAL: Question data (seeQuestions) is not available.");
            alert("Error: Could not load question data. Please try refreshing.");
            // Optionally disable submit button or show error message
            if(loadingMessage) loadingMessage.textContent = "Error loading question data.";
            submitQuizButton.disabled = true;
            return; // Stop execution
        }

        // 3. Select Questions based on settings
        quizQuestions = selectQuizQuestions(quizSettings, seeQuestions);

        if (quizQuestions.length === 0) {
             console.error("No questions selected based on criteria. Available:", seeQuestions.length);
             alert("Error: No questions could be selected for your chosen subjects/settings. Please go back and adjust the setup.");
             window.location.href = 'setup_see.html'; // Redirect back
             return;
        }
         // If fewer questions were selected than requested (due to availability), update the settings object for accuracy in results
         if (quizQuestions.length < quizSettings.numQuestions) {
             console.warn(`Warning: Only ${quizQuestions.length} questions available/selected, less than the ${quizSettings.numQuestions} requested.`);
             quizSettings.numQuestions = quizQuestions.length;
             // Optionally save the updated settings back, though maybe not critical here
             // saveToLocalStorage(STORAGE_KEYS.QUIZ_SETTINGS, quizSettings);
         }

        console.log(`Selected ${quizQuestions.length} questions for the quiz.`);

        // 4. Render Questions to the page
        renderQuizQuestions(quizQuestions);

        // 5. Start the Timer
        startTimer(quizSettings.timeLimit);

        // 6. Enable the Submit Button
        submitQuizButton.disabled = false;

        // 7. Add listener to the Submit Button
        submitQuizButton.addEventListener('click', handleSubmit);

        // Clear loading message
        if (loadingMessage) loadingMessage.style.display = 'none';
    }


    // --- Question Selection Logic ---

    /**
     * Selects and shuffles questions based on loaded settings.
     * @param {object} settings - The quiz settings object {numQuestions, subjects, timeLimit, ...}.
     * @param {Array} allQuestions - The full array of available questions (e.g., seeQuestions).
     * @returns {Array} An array of selected question objects.
     */
    function selectQuizQuestions(settings, allQuestions) {
        const { numQuestions, subjects } = settings;

        // Filter by selected subjects
        let availableQuestions = allQuestions.filter(q => subjects.includes(q.subject));

        // Shuffle the filtered list thoroughly
        shuffleArray(availableQuestions); // Uses function from common_utils.js

        let selected = [];
        const targetNum = Math.min(numQuestions, availableQuestions.length); // Cannot select more than available

        if (subjects.length === 1) {
            // Take the first 'targetNum' questions
            selected = availableQuestions.slice(0, targetNum);
        } else if (subjects.length === 2) { // Handle SEE case (Science, Social)
            const scienceQs = availableQuestions.filter(q => q.subject === 'Science');
            const socialQs = availableQuestions.filter(q => q.subject === 'Social');

            let scienceCount = Math.floor(targetNum / 2);
            let socialCount = targetNum - scienceCount; // Assign remainder to social first

            // Implement the rule: If odd total, Science gets the extra one
            if (targetNum % 2 !== 0) {
                scienceCount = Math.ceil(targetNum / 2);
                socialCount = targetNum - scienceCount;
            }

            // Adjust counts if one subject doesn't have enough questions
            if (scienceQs.length < scienceCount) {
                const deficit = scienceCount - scienceQs.length;
                scienceCount = scienceQs.length; // Take all available science
                socialCount = Math.min(socialCount + deficit, socialQs.length); // Add deficit to social, capped by availability
            }
             if (socialQs.length < socialCount) {
                const deficit = socialCount - socialQs.length;
                socialCount = socialQs.length; // Take all available social
                 // Re-check if science can take the deficit back
                 scienceCount = Math.min(scienceCount + deficit, scienceQs.length);
            }

            // Final check to ensure total doesn't exceed targetNum (shouldn't happen with logic above, but safe)
             const finalScienceCount = Math.min(scienceCount, scienceQs.length);
             const finalSocialCount = Math.min(socialCount, socialQs.length);


            selected = [
                ...scienceQs.slice(0, finalScienceCount),
                ...socialQs.slice(0, finalSocialCount)
            ];

             // Shuffle the final combined list to mix subjects
             shuffleArray(selected);

        } else {
            // Fallback for unexpected number of subjects (e.g., > 2) - just take from shuffled available
            console.warn("Unexpected number of subjects selected. Selecting from overall pool.");
            selected = availableQuestions.slice(0, targetNum);
        }

        // Add a unique quiz index to each selected question for tracking answers
        return selected.map((q, index) => ({ ...q, quizIndex: index }));
    }


    // --- Rendering Logic ---

    /**
     * Renders the selected questions onto the page.
     * @param {Array} questionsToRender - Array of question objects (with quizIndex added).
     */
    function renderQuizQuestions(questionsToRender) {
        if (!quizContent) return;
        quizContent.innerHTML = ''; // Clear previous content (like loading message)

        // Group by subject for sectioned display
        const questionsBySubject = questionsToRender.reduce((acc, question) => {
            const subject = question.subject;
            if (!acc[subject]) acc[subject] = [];
            acc[subject].push(question);
            return acc;
        }, {});

        let overallQuestionNumber = 0;

        // Define the order subjects should appear in (optional, but nice)
        const subjectOrder = ['Science', 'Social']; // Adjust if needed

        subjectOrder.forEach(subject => {
             if (questionsBySubject[subject]) {
                 const subjectSection = document.createElement('div');
                 subjectSection.classList.add('subject-section', `subject-${subject.toLowerCase()}`);

                 const subjectHeader = document.createElement('h3');
                 subjectHeader.classList.add('question-subject-header');
                 subjectHeader.textContent = `${subject} Questions`;
                 subjectSection.appendChild(subjectHeader);

                 questionsBySubject[subject].forEach(questionData => {
                     overallQuestionNumber++;
                     const questionBlock = document.createElement('div');
                     questionBlock.classList.add('quiz-question-block');
                     questionBlock.dataset.index = questionData.quizIndex; // Store the unique quiz index

                     // Question Text (numbered)
                     const questionText = document.createElement('p');
                     questionText.classList.add('question-text');
                     questionText.innerHTML = `<strong>${overallQuestionNumber}.</strong> ${questionData.question}`;
                     questionBlock.appendChild(questionText);

                     // Options List
                     const optionsList = document.createElement('ul');
                     optionsList.classList.add('options-list');

                     // Shuffle options for this question
                     const shuffledOptions = [...questionData.options];
                     shuffleArray(shuffledOptions);

                     shuffledOptions.forEach((option, optionIndex) => {
                         const optionItem = document.createElement('li');
                         const radioId = `q${questionData.quizIndex}_opt${optionIndex}`; // Use index for uniqueness
                         const radioName = `question_${questionData.quizIndex}`;

                         // Radio Button
                         const radioInput = document.createElement('input');
                         radioInput.type = 'radio';
                         radioInput.name = radioName;
                         radioInput.value = option; // Store the actual option text as the value
                         radioInput.id = radioId;
                         radioInput.addEventListener('change', handleAnswerChange); // Add listener

                         // Label
                         const radioLabel = document.createElement('label');
                         radioLabel.htmlFor = radioId;
                         radioLabel.textContent = option;

                         optionItem.appendChild(radioInput);
                         optionItem.appendChild(radioLabel);
                         optionsList.appendChild(optionItem);
                     });

                     questionBlock.appendChild(optionsList);
                     subjectSection.appendChild(questionBlock);
                 }); // End loop through questions in subject

                 quizContent.appendChild(subjectSection);
             } // End if subject exists
        }); // End loop through subject order
    }


    // --- Timer Logic ---

    /**
     * Starts the countdown timer.
     * @param {number} durationMinutes - The quiz duration in minutes.
     */
    function startTimer(durationMinutes) {
        const durationSeconds = durationMinutes * 60;
        quizStartTime = Date.now();
        quizEndTime = quizStartTime + durationSeconds * 1000;
        timeRanOut = false; // Reset flag
        isQuizSubmitted = false; // Reset flag

        function updateDisplay() {
             const now = Date.now();
             const secondsRemaining = Math.max(0, Math.round((quizEndTime - now) / 1000));

             if (timerDisplay) {
                 timerDisplay.textContent = formatTimeMMSS(secondsRemaining * 1000); // Use utility
             }

             if (secondsRemaining <= 0 && !isQuizSubmitted) {
                 console.log("Timer reached zero.");
                 clearInterval(quizTimerInterval);
                 timeRanOut = true;
                 finalizeQuiz(); // End the quiz automatically
             }
        }

        updateDisplay(); // Show initial time
        quizTimerInterval = setInterval(updateDisplay, 1000); // Update every second
    }

    // --- Event Handlers ---

    /**
     * Handles changes to radio button selections.
     * @param {Event} event - The change event object.
     */
    function handleAnswerChange(event) {
        const selectedRadio = event.target;
        const questionBlock = selectedRadio.closest('.quiz-question-block');
        if (questionBlock && questionBlock.dataset.index !== undefined) {
            const questionIndex = parseInt(questionBlock.dataset.index, 10);
            userAnswers[questionIndex] = selectedRadio.value; // Store the selected option value
            // console.log(`Answer recorded for Q${questionIndex}:`, userAnswers[questionIndex]); // Debug log
        } else {
             console.error("Could not determine question index for answer:", selectedRadio);
        }
    }

    /**
     * Handles the click on the "Submit Answers" button.
     */
    function handleSubmit() {
        console.log("Submit button clicked.");
        finalizeQuiz(); // End the quiz manually
    }


    // --- Quiz Finalization Logic ---

    /**
     * Stops the timer, calculates results, saves them, and redirects.
     * Prevents double execution.
     */
    function finalizeQuiz() {
        if (isQuizSubmitted) {
             console.log("Quiz already submitted. Preventing duplicate action.");
            return; // Prevent running twice
        }
        isQuizSubmitted = true; // Set flag immediately
        console.log("Finalizing quiz...");

        // 1. Stop Timer
        clearInterval(quizTimerInterval);
        console.log("Timer stopped.");

        // 2. Calculate Time Taken
        const quizEndTimeActual = Date.now();
        // If time ran out, use the full duration. Otherwise, use actual time elapsed.
        const timeTakenMs = timeRanOut ? (quizSettings.timeLimit * 60 * 1000) : (quizEndTimeActual - quizStartTime);
        console.log(`Time taken: ${timeTakenMs} ms. Time ran out: ${timeRanOut}`);

        // 3. Calculate Score
        let score = 0;
        quizQuestions.forEach(question => {
            const index = question.quizIndex;
            // Check if user provided an answer AND if it matches the correct answer
            if (userAnswers[index] !== undefined && userAnswers[index] === question.answer) {
                score++;
            }
        });
        console.log(`Calculated Score: ${score} / ${quizQuestions.length}`);

        // 4. Prepare Results Data
        // Create a clean version of questions for storage (avoiding circular refs if any DOM elements were somehow attached)
        const questionsForStorage = quizQuestions.map(({ quizIndex, subject, question, options, answer }) => ({
            quizIndex, subject, question, options, answer
        }));

        const resultsData = {
            score: score,
            totalQuestions: quizQuestions.length, // Use actual number shown
            timeTaken: timeTakenMs,
            userAnswers: userAnswers,          // The user's selections { index: value }
            quizQuestions: questionsForStorage, // The questions that were part of this quiz
            timeRanOut: timeRanOut,            // Boolean flag
            settings: quizSettings             // Include original settings for context
        };
        console.log("Results data prepared:", resultsData);

        // 5. Save Results to Local Storage
        const saved = saveToLocalStorage(STORAGE_KEYS.QUIZ_RESULTS, resultsData);

        // 6. Redirect to Results Page (even if save failed, maybe show error there)
        if (!saved) {
            console.error("Failed to save results to localStorage!");
            // Maybe set a flag for the results page to show a warning?
            // Or just proceed and hope the results page handles missing data.
            alert("Warning: Could not save your quiz results properly. Proceeding to results page anyway.");
        } else {
             console.log("Results saved successfully.");
        }
         // --- Important: Clear the settings after successful submission to prevent re-using old settings ---
         removeFromLocalStorage(STORAGE_KEYS.QUIZ_SETTINGS);
         console.log("Quiz settings cleared from storage.");


        console.log("Redirecting to results page...");
        window.location.href = 'results_see.html';
    }

    // --- Start the Quiz ---
    initializeQuiz();

}); // End of DOMContentLoaded
