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
    const detailsLoadingMsg = detailedResultsContainer?.querySelector('.loading-message');

    // --- Initialization ---

    /**
     * Loads results data and displays the summary section.
     */
    function initializeResultsPage() {
        console.log("Initializing results page...");

        // 1. Load Results Data from Local Storage
        console.log(`Attempting to load results data using key: ${STORAGE_KEYS.QUIZ_RESULTS}`);
        const resultsData = loadFromLocalStorage(STORAGE_KEYS.QUIZ_RESULTS); // Function from common_utils.js

        // ***** START OF DEBUG LOGS (Results Page Load) *****
        console.log("--- Results Data Loaded ---");
        if (resultsData) {
            console.log("Raw loaded data object:", resultsData); // Log the whole object retrieved
            console.log("Data type:", typeof resultsData);
            console.log("Checking essential properties:");
            console.log("  resultsData.score:", resultsData.score, `(Type: ${typeof resultsData.score})`);
            console.log("  resultsData.totalQuestions:", resultsData.totalQuestions, `(Type: ${typeof resultsData.totalQuestions})`);
            console.log("  resultsData.timeTaken:", resultsData.timeTaken, `(Type: ${typeof resultsData.timeTaken})`);
            console.log("  resultsData.timeRanOut:", resultsData.timeRanOut, `(Type: ${typeof resultsData.timeRanOut})`);
            console.log("  resultsData.quizQuestions is Array:", Array.isArray(resultsData.quizQuestions));
            if(Array.isArray(resultsData.quizQuestions)) {
                console.log("  Number of questions in data:", resultsData.quizQuestions.length);
            }
            console.log("  resultsData.userAnswers exists:", typeof resultsData.userAnswers === 'object' && resultsData.userAnswers !== null);
        } else {
            console.error("FAILED TO LOAD resultsData from localStorage or data was null.");
        }
        console.log("--------------------------");
         // ***** END OF DEBUG LOGS (Results Page Load) *****

        // 2. Validate Results Data (Robust check)
         if (!resultsData || typeof resultsData.score !== 'number' || !Array.isArray(resultsData.quizQuestions) || typeof resultsData.userAnswers !== 'object') {
            console.error("Validation Failed: resultsData is missing or core properties have wrong types/values.");
            displayErrorMessage("Error: Could not load valid quiz results. The data might be missing or corrupted. Please try taking the quiz again.");
            if (showDetailsButton) {
                showDetailsButton.disabled = true; // Disable button if data is bad
                showDetailsButton.style.cursor = 'not-allowed';
                 console.log("'Show Details' button DISABLED due to bad data.");
            }
            return; // Stop execution
        }

        console.log("Results data validation passed.");

        // 3. Display Summary Information
        displaySummary(resultsData);

        // 4. Setup "See Full Details" Button
        console.log("Setting up 'See Full Details' button...");
        if (showDetailsButton && detailedResultsContainer) {
             console.log("Button ('show-details') and container ('detailed-results') elements FOUND.");

             showDetailsButton.disabled = false; // Explicitly enable the button
             showDetailsButton.style.cursor = 'pointer'; // Ensure cursor looks clickable
             console.log("'Show Details' button explicitly ENABLED.");

             // Add the click listener *once*
             showDetailsButton.addEventListener('click', function handleDetailsClick() { // Named function for potential removal later if needed
                 console.log("'See Full Details' button CLICKED.");
                 try {
                    renderDetailedResults(resultsData); // Pass the loaded data
                    detailedResultsContainer.style.display = 'block'; // Show the details section
                    showDetailsButton.style.display = 'none'; // Hide the button itself
                    console.log("Detailed results rendered and button hidden.");
                 } catch (renderError) {
                     console.error("Error occurred inside renderDetailedResults function:", renderError);
                     detailedResultsContainer.innerHTML = `<p class="error-message">An error occurred while displaying the detailed results. Check console for details.</p>`;
                     detailedResultsContainer.style.display = 'block';
                     showDetailsButton.style.display = 'none'; // Hide button even if rendering fails
                 }
             });
             console.log("Event listener successfully ADDED to 'See Full Details' button.");

        } else {
            // Log exactly which crucial element is missing
            if (!showDetailsButton) console.error("CRITICAL: 'Show details' button element with id='show-details' NOT FOUND!");
            if (!detailedResultsContainer) console.error("CRITICAL: Detailed results container element with id='detailed-results' NOT FOUND!");
             // If button exists but container doesn't, disable button
             if (showDetailsButton) {
                 showDetailsButton.disabled = true;
                 showDetailsButton.style.cursor = 'not-allowed';
                 console.log("'Show Details' button DISABLED because container is missing.");
             }
        }

    } // End initializeResultsPage

    /**
     * Displays an error message on the results page.
     * @param {string} message - The error text to display.
     */
    function displayErrorMessage(message) {
        // Prioritize showing error in the summary section
        if (scoreDisplay && totalQuestionsDisplay && timeTakenDisplay) {
            scoreDisplay.textContent = "Error";
            totalQuestionsDisplay.textContent = ""; // Clear total count
            timeTakenDisplay.textContent = message; // Show message here
            console.log("Error message displayed in summary section.");
        } else if (detailedResultsContainer) {
            // Fallback to details container
             detailedResultsContainer.innerHTML = `<p class="error-message">${message}</p>`;
             detailedResultsContainer.style.display = 'block';
             console.log("Error message displayed in detailed results container.");
        } else {
             // Absolute fallback
             alert(message);
             console.log("Error message displayed via alert.");
        }
    }

    /**
     * Populates the summary section (score, time, timeout message).
     * @param {object} resultsData - The loaded results data.
     */
    function displaySummary(resultsData) {
        // Destructure with defaults in case settings are somehow missing within resultsData
        const { score, totalQuestions, timeTaken, timeRanOut, settings = {} } = resultsData;

        if (scoreDisplay) scoreDisplay.textContent = score;
        if (totalQuestionsDisplay) totalQuestionsDisplay.textContent = totalQuestions;

        if (timeTakenDisplay) {
            if (timeRanOut) {
                timeTakenDisplay.textContent = `Time Limit Reached (${settings.timeLimit || '?'} min)`;
                if (timeoutMessageDisplay) timeoutMessageDisplay.style.display = 'block';
            } else {
                // Use the MM min SS sec format for clarity
                timeTakenDisplay.textContent = formatTimeVerbose(timeTaken);
                 if (timeoutMessageDisplay) timeoutMessageDisplay.style.display = 'none';
            }
        }
        console.log("Summary section displayed.");
    }


    /**
     * Renders the detailed question-by-question review.
     * @param {object} resultsData - The loaded results data containing questions, answers, etc.
     */
    function renderDetailedResults(resultsData) {
        console.log("--- Starting renderDetailedResults ---"); // Log start of function
        if (!detailedResultsContainer) {
            console.error("renderDetailedResults: Detailed results container element not found.");
            return;
        }
        detailedResultsContainer.innerHTML = ''; // Clear previous content or loading message

        const { quizQuestions: questions, userAnswers, timeRanOut: didTimeRunOut } = resultsData;

        if (!questions || !Array.isArray(questions)) {
             console.error("renderDetailedResults: Invalid or missing 'quizQuestions' array in resultsData.");
             detailedResultsContainer.innerHTML = '<p class="error-message">Error: Detailed question data is missing or invalid.</p>';
             return;
        }

        console.log(`renderDetailedResults: Rendering details for ${questions.length} questions.`);

        // Group questions by subject for rendering sections
        const questionsBySubject = questions.reduce((acc, question) => {
            const subject = question.subject || 'Uncategorized'; // Handle missing subject
            if (!acc[subject]) acc[subject] = [];
            acc[subject].push(question); // Push the question object itself
            return acc;
        }, {});

        let overallQuestionNumber = 0;
        const subjectOrder = ['Science', 'Social']; // Define display order

         subjectOrder.forEach(subject => {
             if (questionsBySubject[subject]) {
                console.log(`Rendering subject section: ${subject}`);
                 const subjectSection = document.createElement('div');
                 subjectSection.classList.add('subject-section', `subject-${subject.toLowerCase()}-review`);

                 const subjectHeader = document.createElement('h3');
                 subjectHeader.classList.add('question-subject-header');
                 subjectHeader.textContent = `${subject} Review`;
                 subjectSection.appendChild(subjectHeader);

                 questionsBySubject[subject].forEach(questionData => {
                     overallQuestionNumber++;
                     // Use quizIndex if available, otherwise fall back to overall number (less reliable)
                     const index = questionData.quizIndex !== undefined ? questionData.quizIndex : (overallQuestionNumber - 1);
                     console.log(`Rendering Q${overallQuestionNumber} (Index: ${index})`);

                     const questionBlock = document.createElement('div');
                     questionBlock.classList.add('quiz-question-block');

                     // Question Text
                     const questionText = document.createElement('p');
                     questionText.classList.add('question-text');
                     questionText.innerHTML = `<strong>${overallQuestionNumber}.</strong> ${questionData.question || 'Missing Question Text'}`;
                     questionBlock.appendChild(questionText);

                     // Determine user's answer and correctness
                     const userAnswer = userAnswers ? userAnswers[index] : undefined; // Check if userAnswers exists
                     const correctAnswer = questionData.answer;
                     const isCorrect = userAnswer === correctAnswer;
                     const isSkipped = userAnswer === undefined || userAnswer === null;

                     console.log(`  User Answer: ${userAnswer}, Correct Answer: ${correctAnswer}, Skipped: ${isSkipped}`);

                     // Options List
                     const optionsList = document.createElement('ul');
                     optionsList.classList.add('options-list', 'results-options');

                     // Display options with feedback
                     if (Array.isArray(questionData.options)) {
                         questionData.options.forEach(option => {
                             const optionItem = document.createElement('li');
                             optionItem.textContent = option;

                             // Apply styling based on answer correctness
                             if (option === correctAnswer) {
                                 optionItem.classList.add('correct-option');
                             }
                             if (!isSkipped && userAnswer === option && !isCorrect) {
                                 optionItem.classList.add('incorrect-option');
                                 optionItem.classList.add('selected-wrong');
                             }
                             optionsList.appendChild(optionItem);
                         });
                     } else {
                         console.warn(`  Options missing or not an array for Q${overallQuestionNumber}`);
                         const errorLi = document.createElement('li');
                         errorLi.textContent = "Options could not be displayed.";
                         errorLi.style.color = 'red';
                         optionsList.appendChild(errorLi);
                     }

                     questionBlock.appendChild(optionsList);

                     // Add Skipped/Timeout message if necessary
                     if (isSkipped) {
                         const skippedMsg = document.createElement('p');
                         skippedMsg.classList.add('skipped-question');
                         skippedMsg.textContent = didTimeRunOut ? 'Skipped (Time Out)' : 'Skipped';
                         if (didTimeRunOut) skippedMsg.classList.add('timeout-header');
                         questionBlock.appendChild(skippedMsg);
                         console.log("  Marked as Skipped.");
                     }

                     subjectSection.appendChild(questionBlock);

                 }); // End loop through questions in subject
                 detailedResultsContainer.appendChild(subjectSection);
             }// End if subject exists
         });// End loop through subjects
         console.log("--- Finished renderDetailedResults ---");
    } // End renderDetailedResults

    // --- Start the process ---
    initializeResultsPage();

}); // End of DOMContentLoaded
