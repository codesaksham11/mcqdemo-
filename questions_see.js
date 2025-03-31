// SEE Question Bank
// Structure: { subject: 'Subject Name', question: 'Question text?', options: ['Option A', 'Option B', 'Option C', 'Option D'], answer: 'Correct Option Text' }

const seeQuestions = [
    // --- Science Questions (15) ---
    {
        subject: 'Science',
        question: 'What planet is known as the Red Planet?',
        options: ['Earth', 'Mars', 'Jupiter', 'Venus'],
        answer: 'Mars'
    },
    {
        subject: 'Science',
        question: 'What is the chemical symbol for water?',
        options: ['O2', 'H2O', 'CO2', 'NaCl'],
        answer: 'H2O'
    },
    {
        subject: 'Science',
        question: 'What force pulls objects towards the center of the Earth?',
        options: ['Magnetism', 'Friction', 'Gravity', 'Inertia'],
        answer: 'Gravity'
    },
    {
        subject: 'Science',
        question: 'What is the hardest natural substance on Earth?',
        options: ['Gold', 'Iron', 'Diamond', 'Quartz'],
        answer: 'Diamond'
    },
    {
        subject: 'Science',
        question: 'How many bones are in the adult human body?',
        options: ['206', '201', '212', '198'],
        answer: '206'
    },
    {
        subject: 'Science',
        question: 'What gas do plants absorb from the atmosphere for photosynthesis?',
        options: ['Oxygen', 'Nitrogen', 'Carbon Dioxide', 'Hydrogen'],
        answer: 'Carbon Dioxide'
    },
    {
        subject: 'Science',
        question: 'What is the boiling point of water at sea level in Celsius?',
        options: ['90°C', '100°C', '110°C', '0°C'],
        answer: '100°C'
    },
    {
        subject: 'Science',
        question: 'Which part of the plant conducts photosynthesis?',
        options: ['Root', 'Stem', 'Leaf', 'Flower'],
        answer: 'Leaf'
    },
    {
        subject: 'Science',
        question: 'What is the powerhouse of the cell?',
        options: ['Nucleus', 'Ribosome', 'Mitochondrion', 'Cell Membrane'],
        answer: 'Mitochondrion'
    },
    {
        subject: 'Science',
        question: 'Sound travels fastest through which medium?',
        options: ['Air', 'Water', 'Steel', 'Vacuum'],
        answer: 'Steel'
    },
    {
        subject: 'Science',
        question: 'What element does "Fe" represent on the periodic table?',
        options: ['Fluorine', 'Iron', 'Lead', 'Mercury'],
        answer: 'Iron'
    },
    {
        subject: 'Science',
        question: 'What type of energy does the sun primarily emit?',
        options: ['Kinetic', 'Chemical', 'Nuclear', 'Electromagnetic (Light & Heat)'],
        answer: 'Electromagnetic (Light & Heat)'
    },
     {
        subject: 'Science',
        question: 'How many chambers does the human heart have?',
        options: ['One', 'Two', 'Three', 'Four'],
        answer: 'Four'
    },
    {
        subject: 'Science',
        question: 'Which disease is caused by the deficiency of Vitamin C?',
        options: ['Rickets', 'Scurvy', 'Beriberi', 'Night Blindness'],
        answer: 'Scurvy'
    },
    {
        subject: 'Science',
        question: 'What instrument is used to measure atmospheric pressure?',
        options: ['Thermometer', 'Barometer', 'Hygrometer', 'Anemometer'],
        answer: 'Barometer'
    },

    // --- Social Studies Questions (15) ---
    {
        subject: 'Social',
        question: 'What is the capital city of Nepal?',
        options: ['Pokhara', 'Kathmandu', 'Biratnagar', 'Bhaktapur'],
        answer: 'Kathmandu'
    },
    {
        subject: 'Social',
        question: 'Which is the highest mountain peak in the world?',
        options: ['K2', 'Kangchenjunga', 'Mount Everest', 'Makalu'],
        answer: 'Mount Everest'
    },
    {
        subject: 'Social',
        question: 'Gautama Buddha was born in which present-day country?',
        options: ['India', 'China', 'Nepal', 'Thailand'],
        answer: 'Nepal'
    },
    {
        subject: 'Social',
        question: 'Which festival is known as the "Festival of Lights" in Nepal?',
        options: ['Dashain', 'Tihar', 'Holi', 'Buddha Jayanti'],
        answer: 'Tihar'
    },
    {
        subject: 'Social',
        question: 'What is the main religion practiced by the majority in Nepal?',
        options: ['Buddhism', 'Islam', 'Christianity', 'Hinduism'],
        answer: 'Hinduism'
    },
    {
        subject: 'Social',
        question: 'Who was the first king of unified Nepal?',
        options: ['Pratap Malla', 'Prithvi Narayan Shah', 'Ran Bahadur Shah', 'Gyanendra Shah'],
        answer: 'Prithvi Narayan Shah'
    },
    {
        subject: 'Social',
        question: 'In which year did Nepal become a Federal Democratic Republic?',
        options: ['2001', '2006', '2008', '2015'],
        answer: '2008'
    },
    {
        subject: 'Social',
        question: 'What is the longest river in Nepal?',
        options: ['Koshi', 'Gandaki', 'Karnali', 'Bagmati'],
        answer: 'Karnali'
    },
     {
        subject: 'Social',
        question: 'Which national park in Nepal is famous for the one-horned rhinoceros?',
        options: ['Sagarmatha National Park', 'Chitwan National Park', 'Langtang National Park', 'Rara National Park'],
        answer: 'Chitwan National Park'
    },
     {
        subject: 'Social',
        question: 'What ancient trade route passed through parts of Nepal connecting India and Tibet?',
        options: ['Silk Road', 'Incense Route', 'Salt Route', 'Tea Horse Road'],
        answer: 'Salt Route' // Or sometimes considered part of the broader Silk Road network
    },
    {
        subject: 'Social',
        question: 'The Pashupatinath Temple in Kathmandu is primarily dedicated to which Hindu god?',
        options: ['Vishnu', 'Brahma', 'Shiva', 'Ganesh'],
        answer: 'Shiva'
    },
    {
        subject: 'Social',
        question: 'What is the currency of Nepal?',
        options: ['Rupee', 'Taka', 'Kyat', 'Ngultrum'],
        answer: 'Rupee'
    },
    {
        subject: 'Social',
        question: 'Which zone in Nepal is Lumbini, the birthplace of Buddha, located?',
        options: ['Gandaki', 'Bagmati', 'Lumbini', 'Koshi'],
        answer: 'Lumbini'
    },
    {
        subject: 'Social',
        question: 'What type of government system does Nepal currently have?',
        options: ['Absolute Monarchy', 'Constitutional Monarchy', 'Federal Parliamentary Republic', 'Presidential Republic'],
        answer: 'Federal Parliamentary Republic'
    },
    {
        subject: 'Social',
        question: 'Which treaty signed with British India defined parts of Nepal\'s southern border?',
        options: ['Treaty of Versailles', 'Treaty of Sugauli', 'Treaty of Titalia', 'Treaty of Lhasa'],
        answer: 'Treaty of Sugauli'
    }
];
