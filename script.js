
// Stores chart instances
const chartInstances = {
    'end-letter-chart': null,
    'start-letter-chart': null,
    'combined-letter-chart': null
};

// Create checkboxes dynamically
function createCategoryCheckboxes() {
    const container = document.getElementById('category-checkboxes');
    Object.keys(geographicData).forEach(category => {
        const label = document.createElement('label');
        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.name = 'category';
        checkbox.value = category;

        // First two categories checked by default
        if (['continents', 'countries', 'worldCities', 'usStates', 'usCities'].includes(category)) {
            checkbox.checked = true;
        }

        // Get the number of names in the current category
        const nameCount = geographicData[category].length;

        // Add the checkbox and the category name with count
        label.appendChild(checkbox);
        label.appendChild(document.createTextNode(
            `${category.replace(/([A-Z])/g, ' $1')}` // Add space before capital letters
        ));
        label.appendChild(document.createTextNode(` (${nameCount})`)); // Add count next to category name

        container.appendChild(label);
    });

    // Add event listeners to checkboxes
    container.addEventListener('change', updateDistribution);
}

// Function to calculate letter distribution
function calculateLetterDistribution(words, position = 'end') {
    const distribution = {};
    const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const totalWords = words.length;

    words.forEach(word => {
        const letter = position === 'end'
            ? word[word.length - 1].toUpperCase()
            : word[0].toUpperCase();

        if (alphabet.includes(letter)) {
            distribution[letter] = distribution[letter] || { count: 0, words: [] };
            distribution[letter].count++;
            distribution[letter].words.push(word);
        }
    });

    return Object.entries(distribution)
        .map(([letter, { count, words }]) => ({
            letter,
            count,
            percent: ((count / totalWords) * 100).toFixed(2),
            words: words.join(', '), // Join all words for the letter
        }))
        .sort((a, b) => b.count - a.count);
}

// Function to update charts and tables
function updateDistribution() {
    // Get selected categories
    const selectedCategories = Array.from(
        document.querySelectorAll('input[name="category"]:checked')
    ).map(checkbox => checkbox.value);

    // Combine selected geographic names
    const currentWordList = selectedCategories
        .flatMap(category => geographicData[category]);

    // End letter distribution
    const endLetterDistribution = calculateLetterDistribution(currentWordList);
    updateTable('end-letter-body', endLetterDistribution);
    updateChart('end-letter-chart', endLetterDistribution, 'Ending Letters', '#8884d8');
    updateWordTable('end-letter-word-body', endLetterDistribution, 'end');

    // Start letter distribution
    const startLetterDistribution = calculateLetterDistribution(currentWordList, 'start');
    updateTable('start-letter-body', startLetterDistribution);
    updateChart('start-letter-chart', startLetterDistribution, 'Starting Letters', '#82ca9d');
    updateWordTable('start-letter-word-body', startLetterDistribution, 'start');

    // Combined distribution chart
    updateCombinedChart(endLetterDistribution, startLetterDistribution);
}

// Function to update table
function updateTable(tableBodyId, distribution) {
    const tableBody = document.getElementById(tableBodyId);
    tableBody.innerHTML = distribution.map(item => `
                <tr>
                    <td>${item.letter}</td>
                    <td>${item.count}</td>
                    <td>${item.percent}%</td>
                </tr>
            `).join('');
}

// Function to update chart
function updateChart(chartId, distribution, label, color) {
    const ctx = document.getElementById(chartId).getContext('2d');

    // Destroy existing chart if it exists
    if (chartInstances[chartId]) {
        chartInstances[chartId].destroy();
    }

    // Create new chart
    chartInstances[chartId] = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: distribution.map(item => item.letter),
            datasets: [{
                label: label,
                data: distribution.map(item => item.count),
                backgroundColor: color,
            }]
        },
        options: {
            responsive: true,
            scales: {
                y: {
                    beginAtZero: true
                }
            }
        }
    });
}

// Function to update Word Table
function updateWordTable(tableBodyId, distribution) {
    const tableBody = document.getElementById(tableBodyId);
    tableBody.innerHTML = distribution.map(item => `
<tr>
    <td>${item.letter}</td>
    <td>${item.count}</td>
    <td>${item.words}</td> 
</tr>
`).join('');
}

// Initialize DataTables (outside updateWordTable)
$(document).ready(function () {
    $('#end-letter-word-table').DataTable({
        paging: false,
        searching: true,
        info: true,
        order: [[0, 'asc']],
    });
    $('#start-letter-word-table').DataTable({
        paging: false,
        searching: true,
        info: true,
        order: [[0, 'asc']],
    });
});

// Function to update combined chart
function updateCombinedChart(endLetterData, startLetterData) {
    const ctx = document.getElementById('combined-letter-chart').getContext('2d');

    // Destroy existing chart if it exists
    if (chartInstances['combined-letter-chart']) {
        chartInstances['combined-letter-chart'].destroy();
    }

    // Merge data, prioritizing letters from both distributions
    const mergedLetters = [...new Set([
        ...endLetterData.map(d => d.letter),
        ...startLetterData.map(d => d.letter)
    ])].sort();

    const endLetterCounts = mergedLetters.map(letter =>
        endLetterData.find(d => d.letter === letter)?.count || 0
    );

    const startLetterCounts = mergedLetters.map(letter =>
        startLetterData.find(d => d.letter === letter)?.count || 0
    );

    // Create new chart
    chartInstances['combined-letter-chart'] = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: mergedLetters,
            datasets: [
                {
                    label: 'Ending Letters',
                    data: endLetterCounts,
                    backgroundColor: '#8884d8'
                },
                {
                    label: 'Starting Letters',
                    data: startLetterCounts,
                    backgroundColor: '#82ca9d'
                }
            ]
        },
        options: {
            responsive: true,
            scales: {
                y: {
                    beginAtZero: true
                }
            }
        }
    });
}

// Initialize the page
createCategoryCheckboxes();
updateDistribution();
