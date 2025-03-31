document.addEventListener('DOMContentLoaded', () => {

    console.log("results_see.js loaded and DOM ready.");

    // --- Get DOM Elements ---
    // Summary elements
    const scoreDisplay = $('score');
    const totalQuestionsDisplay = $('total-questions');
    const timeTakenDisplay = $('time-taken');
    const timeoutMessageDisplay = $('timeout-message');
    const showDetailsButton = $('show-details');

    // Detailed results container
    const detailedResultsContainer = $('detailed-results');
    const detailsLoadingMsg = detailedResultsContainer?.querySelector('.loading-message'); // Find loading msg within details

    // Navigation buttons (optional, could add listeners if needed)
    // const tryAgainButton = document.querySelector('.navigation-card a[href="setup_see.html"]');
    // const goHomeButton = document.querySelector('.navigation-card a[href="index.html"]');

    // --- Initialization ---

    /**
     * Loads results data and displays the summary section.
     */
    function initializeResultsPage() {
        console.log("Initializing results page...");

        // 1. Load Results Data from Local Storage
        const resultsData = loadFromLocalStorage(STORAGE_KEYS.QUIZ_RESULTS);

        // 2. Validate Results Data
        if (!resultsData || typeof resultsData.score === 'undefined' || !resultsData.quizQuestions) {
            console.error("Results data not found or incomplete in localStorage.");
            displayErrorMessage("Error: Could not load quiz results. Please try taking the quiz again.");
            // Hide the 'See Details' button if data is bad
            if (showDetailsButton) showDetailsButton.style.display = 'none';
            return; // Stop execution
        }

        console.log("Results data loaded:", resultsData);

        // 3. Display Summary Information
        displaySummary(resultsData);

        // 4. Setup "See Full Details" Button
        if (showDetailsButton && detailedResultsContainer) {
             // Check if detailed results should be shown immediately (e.g., if button is missing)
             if (window.getComputedStyle(showDetailsButton).display === 'none') {
                 console.log("Details button hidden, rendering details immediately.");
                 renderDetailedResults(resultsData);
                 detailedResultsContainer.style.display = 'block';
             } else {
                 // Add click listener to the button
                 showDetailsButton.addEventListener('click', () => {
                     console.log("See Full Details button clicked.");
                     renderDetailedResults(resultsData); // Pass the loaded data
                     detailedResultsContainer.style.display = 'block'; // Show the details section
                     showDetailsButton.style.display = 'none'; // Hide the button itself
                 });
             }
        } else {
            console.warn("Show details button or detailed results container not found.");
            // If container exists but button doesn't, maybe render details anyway?
            if (detailedResultsContainer && resultsData) {
                 renderDetailedResults(resultsData);
                 detailedResultsContainer.style.display = 'block';
            }
        }

         // Optional: Clear the results from storage now that they are displayed?
         // Or leave them in case the user refreshes. Let's leave them for now.
         // removeFromLocalStorage(STORAGE_KEYS.QUIZ_RESULTS);
    }

    /**
     * Displays an error message on the results page.
     * @param {string} message - The error text to display.
     */
    function displayErrorMessage(message) {
        // Display error in the summary area or details area
        if (scoreDisplay && totalQuestionsDisplay && timeTakenDisplay) {
            scoreDisplay.textContent = "Error";
            totalQuestionsDisplay.textContent = "";
            timeTakenDisplay.textContent = message;
        } else if (detailedResultsContainer) {
            // Fallback to details container if summary elements aren't found
             detailedResultsContainer.innerHTML = `<p class="error-message">${message}</p>`;
             detailedResultsContainer.style.display = 'block'; // Make sure it's visible
        } else {
             // Fallback alert if no display area found
             alert(message);
        }
    }


    /**
     * Populates the summary section (score, time, timeout message).
     * @param {object} resultsData - The loaded results data.
     */
    function displaySummary(resultsData) {
        const { score, totalQuestions, timeTaken, timeRanOut, settings } = resultsData;

        if (scoreDisplay) scoreDisplay.textContent = score;
        if (totalQuestionsDisplay) totalQuestionsDisplay.textContent = totalQuestions;

        if (timeTakenDisplay) {
            if (timeRanOut) {
                // Use the original time limit from settings for context
                timeTakenDisplay.textContent = `Time Limit Reached (${settings?.timeLimit || '?'} min)`;
                if (timeoutMessageDisplay) timeoutMessageDisplay.style.display = 'block';
            } else {
                timeTakenDisplay.textContent = formatTimeVerbose(timeTaken); // Use utility MM min SS sec
                 if (timeoutMessageDisplay) timeoutMessageDisplay.style.display = 'none';
            }
        }
    }


    /**
     * Renders the detailed question-by-question review.
     * @param {object} resultsData - The loaded results data containing questions, answers, etc.
     */
    function renderDetailedResults(resultsData) {
        if (!detailedResultsContainer) {
            console.error("Detailed results container element not found.");
            return;
        }
        // Clear loading message or previous content
        detailedResultsContainer.innerHTML = '';

        const { quizQuestions: questions, userAnswers, timeRanOut: didTimeRunOut } = resultsData;

        if (!questions || !Array.isArray(questions)) {
             detailedResultsContainer.innerHTML = '<p class="error-message">Error: Detailed question data is missing.</p>';
             return;
        }

        console.log(`Rendering details for ${questions.length} questions.`);

        // Group questions by subject for rendering sections
        const questionsBySubject = questions.reduce((acc, question) => {
            const subject = question.subject || 'Uncategorized'; // Handle missing subject
            if (!acc[subject]) acc[subject] = [];
            acc[subject].push(question);
            return acc;
        }, {});

        let overallQuestionNumber = 0;
        const subjectOrder = ['Science', 'Social']; // Define display order

         subjectOrder.forEach(subject => {
             if (questionsBySubject[subject]) {
                 const subjectSection = document.createElement('div');
                 subjectSection.classList.add('subject-section', `subject-${subject.toLowerCase()}-review`);

                 const subjectHeader = document.createElement('h3');
                 subjectHeader.classList.add('question-subject-header');
                 subjectHeader.textContent = `${subject} Review`;
                 subjectSection.appendChild(subjectHeader);


                 questionsBySubject[subject].forEach(questionData => {
                     overallQuestionNumber++;
                     const index = questionData.quizIndex; // Get the original index
                     const questionBlock = document.createElement('div');
                     questionBlock.classList.add('quiz-question-block'); // Reuse styling

                     // Question Text
                     const questionText = document.createElement('p');
                     questionText.classList.add('question-text');
                     questionText.innerHTML = `<strong>${overallQuestionNumber}.</strong> ${questionData.question}`;
                     questionBlock.appendChild(questionText);

                     // Determine user's answer and correctness
                     const userAnswer = userAnswers[index]; // Might be undefined if skipped
                     const correctAnswer = questionData.answer;
                     const isCorrect = userAnswer === correctAnswer;
                     const isSkipped = userAnswer === undefined || userAnswer === null;

                     // Options List
                     const optionsList = document.createElement('ul');
                     optionsList.classList.add('options-list', 'results-options'); // Add specific class

                     // Display options with feedback
                     questionData.options.forEach(option => {
                         const optionItem = document.createElement('li');
                         optionItem.textContent = option;

                         // Apply styling based on answer correctness
                         // 1. Mark the correct answer ALWAYS
                         if (option === correctAnswer) {
                             optionItem.classList.add('correct-option'); // Applies green tick via CSS
                         }

                         // 2. If the user answered THIS option...
                         if (!isSkipped && userAnswer === option) {
                             // ...and it was WRONG...
                             if (!isCorrect) {
                                 optionItem.classList.add('incorrect-option'); // Applies red cross via CSS
                                 optionItem.classList.add('selected-wrong'); // Applies background hint
                             }
                             // If it was correct, 'correct-option' already handles it.
                         }

                         optionsList.appendChild(optionItem);
                     }); // End options loop

                     questionBlock.appendChild(optionsList);

                     // Add Skipped/Timeout message if necessary
                     if (isSkipped) {
                         const skippedMsg = document.createElement('p');
                         skippedMsg.classList.add('skipped-question');
                         if (didTimeRunOut) {
                             skippedMsg.textContent = 'Skipped (Time Out)';
                             skippedMsg.classList.add('timeout-header'); // Make timeout stand out
                         } else {
                             skippedMsg.textContent = 'Skipped';
                         }
                         questionBlock.appendChild(skippedMsg);
                     }

                     subjectSection.appendChild(questionBlock);

                 }); // End loop through questions in subject
                 detailedResultsContainer.appendChild(subjectSection);
             }// End if subject exists
         });// End loop through subjects

    } // End renderDetailedResults

    // --- Start the process ---
    initializeResultsPage();

}); // End of DOMContentLoaded
