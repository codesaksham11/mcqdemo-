// --- Constants for Local Storage Keys ---
// Using specific keys helps avoid conflicts if more features are added later.
const STORAGE_KEYS = {
    QUIZ_SETTINGS: 'quizSettings_see',
    QUIZ_RESULTS: 'quizResults_see'
};

// --- Utility Functions ---

/**
 * Shuffles array elements in place using the Fisher-Yates (Knuth) algorithm.
 * @param {Array} array The array to shuffle.
 */
function shuffleArray(array) {
    if (!Array.isArray(array)) {
        console.error("shuffleArray: Input is not an array.");
        return;
    }
    for (let i = array.length - 1; i > 0; i--) {
        // Pick a random index from 0 to i
        const j = Math.floor(Math.random() * (i + 1));
        // Swap elements array[i] and array[j]
        [array[i], array[j]] = [array[j], array[i]];
    }
    // No return value needed as the array is shuffled in place.
}


/**
 * Saves data to localStorage under a specific key.
 * Handles potential JSON stringification errors.
 * @param {string} key The localStorage key to use (use constants from STORAGE_KEYS).
 * @param {*} data The data to save (should be serializable to JSON).
 * @returns {boolean} True if save was successful, false otherwise.
 */
function saveToLocalStorage(key, data) {
    try {
        const dataString = JSON.stringify(data);
        localStorage.setItem(key, dataString);
        console.log(`Data saved to localStorage under key: ${key}`); // Debug log
        return true;
    } catch (error) {
        console.error(`Error saving data to localStorage (key: ${key}):`, error);
        // Optionally display a user-friendly error message here if critical
        // alert("An error occurred while trying to save your progress. Please try again.");
        return false;
    }
}


/**
 * Loads data from localStorage for a specific key.
 * Handles potential JSON parsing errors or missing items.
 * @param {string} key The localStorage key to use (use constants from STORAGE_KEYS).
 * @returns {*} The parsed data, or null if not found or an error occurred.
 */
function loadFromLocalStorage(key) {
    try {
        const dataString = localStorage.getItem(key);
        if (dataString === null) {
            // console.log(`No data found in localStorage for key: ${key}`); // Normal case, not an error
            return null; // Item not found is not an error here
        }
        const parsedData = JSON.parse(dataString);
        console.log(`Data loaded from localStorage for key: ${key}`); // Debug log
        return parsedData;
    } catch (error) {
        console.error(`Error loading or parsing data from localStorage (key: ${key}):`, error);
        // If parsing fails, the stored data might be corrupt. Consider removing it.
        // localStorage.removeItem(key);
        return null; // Return null on error
    }
}


/**
 * Removes an item from localStorage.
 * @param {string} key The localStorage key to remove.
 */
function removeFromLocalStorage(key) {
    try {
        localStorage.removeItem(key);
        console.log(`Data removed from localStorage for key: ${key}`); // Debug log
    } catch (error) {
        console.error(`Error removing data from localStorage (key: ${key}):`, error);
    }
}


/**
 * Formats milliseconds into a MM:SS string.
 * @param {number} ms Milliseconds duration.
 * @returns {string} Formatted time string (e.g., "05:30").
 */
function formatTimeMMSS(ms) {
    if (typeof ms !== 'number' || isNaN(ms) || ms < 0) {
        return "--:--"; // Return placeholder for invalid input
    }
    const totalSeconds = Math.round(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    // Pad with leading zero if needed
    const paddedSeconds = seconds < 10 ? `0${seconds}` : seconds;
    const paddedMinutes = minutes < 10 ? `0${minutes}` : minutes; // Optional padding for minutes too
    return `${paddedMinutes}:${paddedSeconds}`;
}

/**
 * Formats milliseconds into a "X min Y sec" string.
 * @param {number} ms Milliseconds duration.
 * @returns {string} Formatted time string (e.g., "5 min 30 sec").
 */
function formatTimeVerbose(ms) {
     if (typeof ms !== 'number' || isNaN(ms) || ms < 0) {
        return "N/A"; // Return placeholder for invalid input
    }
    const totalSeconds = Math.round(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;

    let result = "";
    if (minutes > 0) {
        result += `${minutes} min `;
    }
    result += `${seconds} sec`;
    return result.trim(); // Trim in case minutes is 0
}


// --- DOM Helper (Optional but can be useful) ---

/**
 * Simple helper to get an element by ID.
 * @param {string} id The element ID.
 * @returns {HTMLElement|null} The element or null if not found.
 */
function $(id) {
    return document.getElementById(id);
}

// You can add more common functions here as needed (e.g., showing/hiding elements, creating elements, etc.)

console.log("common_utils.js loaded"); // Add a log to confirm loading in browser console
