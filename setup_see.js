document.addEventListener('DOMContentLoaded', () => {

    console.log("setup_see.js adapted for new design - loaded.");

    // --- Get DOM Elements (using new IDs from updated HTML) ---
    const setupForm = $('mcq-setup-form'); // Use new form ID
    const questionCountInput = $('question-count'); // Use new input ID
    const timeLimitInput = $('time-limit'); // Use new input ID
    const subjectCheckboxes = document.querySelectorAll('input[name="subject"]'); // Selector likely unchanged

    // New Popup elements
    const overlay = $('popup-overlay');
    const messagePopup = $('message-popup');
    const popupMessageText = $('popup-message-text');
    let popupTimeout; // Variable to hold timeout for popup

    // --- Constants (Unchanged) ---
    const MIN_TIME = 1;
    const MAX_TIME = 180;
    const MIN_QUESTIONS = 10;
    const MAX_QUESTIONS = 100;

    // --- Popup Function (Adapted from user's inline script) ---
    function showValidationPopup(message, duration = 2500) { // Default duration 2.5s
        console.log("Showing validation popup:", message);
        // Clear any existing timeout to prevent glitches
        clearTimeout(popupTimeout);

        popupMessageText.textContent = message;
        overlay.classList.add('active');
        messagePopup.classList.add('active');

        // Set timeout to hide the popup
        popupTimeout = setTimeout(() => {
            hideValidationPopup();
        }, duration);
    }

    function hideValidationPopup() {
        overlay.classList.remove('active');
        messagePopup.classList.remove('active');
    }

    // --- Event Listeners ---

    if (setupForm) {
        setupForm.addEventListener('submit', (event) => {
            event.preventDefault(); // Prevent default only AFTER checking validity
            console.log("Setup form submission triggered.");

            // --- Validation ---
            // 1. Check Browser Validity First (for required, min, max)
            // If the browser finds these invalid, it should show its own popup,
            // and event.preventDefault() above might stop submission anyway.
            // We add checks mainly for subject and potentially complex logic.

            const qCountInput = questionCountInput.value.trim();
            const tLimitInput = timeLimitInput.value.trim();
            const qCount = parseInt(qCountInput, 10);
            const tLimit = parseInt(tLimitInput, 10);

             const selectedSubjects = Array.from(subjectCheckboxes)
                                         .filter(cb => cb.checked)
                                         .map(cb => cb.value); // Values are 'Science', 'Social'

            // 2. Custom Subject Validation (using our popup)
            if (selectedSubjects.length === 0) {
                 showValidationPopup("Please select at least one subject (Science or Social Studies).");
                 // Don't focus here as it's a checkbox group
                 return; // Stop processing
            }

            // 3. Re-check numeric ranges in case browser validation missed or was bypassed
            //    (or if type="number" allowed invalid chars somehow, though unlikely)
             if (isNaN(qCount) || qCount < MIN_QUESTIONS || qCount > MAX_QUESTIONS) {
                // Use the specific message requested
                showValidationPopup(`Value must be between ${MIN_QUESTIONS} and ${MAX_QUESTIONS}.`);
                questionCountInput.focus(); // Focus the problematic input
                return; // Stop processing
            }
            if (isNaN(tLimit) || tLimit < MIN_TIME || tLimit > MAX_TIME) {
                showValidationPopup(`Please enter a time limit between ${MIN_TIME} and ${MAX_TIME} minutes.`);
                timeLimitInput.focus(); // Focus the problematic input
                return; // Stop processing
            }


            // --- If All Validation Passes ---
            console.log("Form validation passed.");

            const quizSettings = {
                timeLimit: tLimit,
                numQuestions: qCount,
                 // Ensure values are 'Science', 'Social' as expected by quiz_see.js
                subjects: selectedSubjects,
                examType: 'SEE'
            };
            console.log("Quiz Settings Prepared:", quizSettings);

            // Attempt to save settings to localStorage (using common_utils.js)
            const saved = saveToLocalStorage(STORAGE_KEYS.QUIZ_SETTINGS, quizSettings);

            if (saved) {
                console.log("Settings saved successfully. Redirecting to quiz page...");
                // Redirect to OUR quiz page
                window.location.href = 'quiz_see.html';
            } else {
                // Handle saving error
                console.error("Failed to save settings to localStorage.");
                showValidationPopup("Error: Could not save quiz settings. Please ensure browser storage is enabled.");
            }
        });

    } else {
         console.error("Setup form element (#mcq-setup-form) not found!");
    }

    // Add listener to overlay to close popup on click (optional)
    if (overlay) {
        overlay.addEventListener('click', () => {
             clearTimeout(popupTimeout); // Stop timer if overlay is clicked
             hideValidationPopup();
         });
    }

}); // End of DOMContentLoaded
