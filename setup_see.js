// Wait for the DOM to be fully loaded before running script
document.addEventListener('DOMContentLoaded', () => {

    console.log("setup_see.js loaded and DOM ready."); // Confirm script loading

    // --- Get DOM Elements ---
    const setupForm = $('setup-form'); // Using the $ helper from common_utils.js
    const timeInput = $('time-limit');
    const questionsInput = $('num-questions');
    const scienceCheckbox = $('subject-science');
    const socialCheckbox = $('subject-social');
    const subjectCheckboxes = document.querySelectorAll('input[name="subject"]'); // Get all subject checkboxes

    // Error message containers
    const timeError = $('time-error');
    const questionsError = $('questions-error');
    const subjectError = $('subject-error');

    // Error Popup elements
    const errorPopup = $('error-popup');
    const popupMessage = $('popup-message');
    const closePopupButton = $('close-popup-btn');

    // --- Constants for Validation ---
    const MIN_TIME = 1;
    const MAX_TIME = 180;
    const MIN_QUESTIONS = 10;
    const MAX_QUESTIONS = 100;

    // --- Input Validation & Error Display Functions ---

    /**
     * Clears all error messages and removes error styling from inputs.
     */
    function clearAllErrors() {
        // Clear text content
        timeError.textContent = '';
        questionsError.textContent = '';
        subjectError.textContent = '';

        // Remove error class styling
        timeInput.classList.remove('input-error');
        questionsInput.classList.remove('input-error');
        // Find the fieldset for subjects to potentially style later if needed
        const fieldset = scienceCheckbox.closest('fieldset');
        if (fieldset) {
            fieldset.classList.remove('input-error'); // Example if we wanted to style the fieldset border
        }
    }

    /**
     * Displays an error message below a specific input field and adds error styling.
     * @param {HTMLElement} inputElement - The input field with the error.
     * @param {HTMLElement} errorElement - The div where the error message should appear.
     * @param {string} message - The error message text.
     */
    function displayInputError(inputElement, errorElement, message) {
        errorElement.textContent = message;
        if (inputElement) { // Check if inputElement is provided (might not be for subject checkbox group)
             inputElement.classList.add('input-error');
        } else {
             // Handle checkbox group error display (e.g., style the fieldset)
             const fieldset = subjectCheckboxes[0]?.closest('fieldset');
             if (fieldset) fieldset.classList.add('input-error');
        }
    }

    /**
     * Shows the generic error pop-up modal.
     * @param {string} message - The message to display in the pop-up.
     */
    function showGenericErrorPopup(message = "Please review the settings and correct any errors.") {
        popupMessage.textContent = message;
        errorPopup.style.display = 'block';
    }

    /**
     * Hides the generic error pop-up modal.
     */
    function hideGenericErrorPopup() {
        errorPopup.style.display = 'none';
    }

    // --- Event Listeners ---

    // Add listener for the form submission
    if (setupForm) {
        setupForm.addEventListener('submit', (event) => {
            event.preventDefault(); // Stop the form from submitting the traditional way
            console.log("Setup form submitted."); // Log submission attempt

            clearAllErrors(); // Clear previous errors first
            let isValid = true; // Assume valid initially

            // 1. Validate Time Limit
            const timeValue = timeInput.value.trim();
            let timeLimit = NaN;
            if (timeValue === '') {
                displayInputError(timeInput, timeError, `Please enter time (${MIN_TIME}-${MAX_TIME} min).`);
                isValid = false;
            } else if (!/^\d+$/.test(timeValue)) { // Check for non-digits
                displayInputError(timeInput, timeError, 'Please enter whole numbers only.');
                isValid = false;
            } else {
                timeLimit = parseInt(timeValue, 10);
                if (timeLimit < MIN_TIME || timeLimit > MAX_TIME) {
                    displayInputError(timeInput, timeError, `Time must be between ${MIN_TIME} and ${MAX_TIME} minutes.`);
                    isValid = false;
                }
            }

            // 2. Validate Number of Questions
            const questionsValue = questionsInput.value.trim();
            let numQuestions = NaN;
             if (questionsValue === '') {
                displayInputError(questionsInput, questionsError, `Enter question count (${MIN_QUESTIONS}-${MAX_QUESTIONS}).`);
                isValid = false;
            } else if (!/^\d+$/.test(questionsValue)) { // Check for non-digits
                displayInputError(questionsInput, questionsError, 'Please enter whole numbers only.');
                isValid = false;
            } else {
                numQuestions = parseInt(questionsValue, 10);
                if (numQuestions < MIN_QUESTIONS || numQuestions > MAX_QUESTIONS) {
                    displayInputError(questionsInput, questionsError, `Number of questions must be between ${MIN_QUESTIONS} and ${MAX_QUESTIONS}.`);
                    isValid = false;
                }
            }

            // 3. Validate Subject Selection
            const selectedSubjects = Array.from(subjectCheckboxes)
                                         .filter(checkbox => checkbox.checked)
                                         .map(checkbox => checkbox.value);

            if (selectedSubjects.length === 0) {
                // Display error message near the checkboxes (null for inputElement as it applies to the group)
                displayInputError(null, subjectError, 'Please select at least one subject.');
                isValid = false;
            }

            // --- Process Validated Data ---

            if (isValid) {
                console.log("Form validation passed.");
                // Create the settings object
                const quizSettings = {
                    timeLimit: timeLimit,
                    numQuestions: numQuestions,
                    subjects: selectedSubjects,
                    examType: 'SEE' // Hardcode for now
                };

                console.log("Quiz Settings Prepared:", quizSettings);

                // Attempt to save settings to localStorage using the function from common_utils.js
                const saved = saveToLocalStorage(STORAGE_KEYS.QUIZ_SETTINGS, quizSettings);

                if (saved) {
                    console.log("Settings saved successfully. Redirecting to quiz page...");
                    // Redirect to the quiz page
                    window.location.href = 'quiz_see.html';
                } else {
                    // Handle saving error (e.g., localStorage full or disabled)
                    console.error("Failed to save settings to localStorage.");
                    showGenericErrorPopup("Error: Could not save your quiz settings. Please try again or ensure localStorage is enabled.");
                }

            } else {
                console.log("Form validation failed.");
                // If any validation failed, show the generic popup
                showGenericErrorPopup();
            }
        });
    } else {
         console.error("Setup form element not found!");
    }

    // Add listeners to clear errors on input/change for better UX
    timeInput?.addEventListener('input', () => {
        timeError.textContent = '';
        timeInput.classList.remove('input-error');
    });
    questionsInput?.addEventListener('input', () => {
        questionsError.textContent = '';
        questionsInput.classList.remove('input-error');
    });
    subjectCheckboxes.forEach(checkbox => {
        checkbox.addEventListener('change', () => {
            subjectError.textContent = '';
             const fieldset = checkbox.closest('fieldset');
             if (fieldset) fieldset.classList.remove('input-error');
        });
    });

    // Add listener for the popup close button
    if (closePopupButton) {
        closePopupButton.addEventListener('click', hideGenericErrorPopup);
    }

    // Optional: Clear previous quiz settings when landing on the setup page?
    // This prevents accidentally starting a new quiz with very old settings if something went wrong before.
    // removeFromLocalStorage(STORAGE_KEYS.QUIZ_SETTINGS); // Uncomment if desired

}); // End of DOMContentLoaded
