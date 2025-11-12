let currentWords = [];
let chain = [];
let usedWords = new Set();
let letterData = {};

function init() {
  createCategories();
  updateAnalysis();
}

function createCategories() {
  const container = document.getElementById("categories");
  const categoryNames = {
    continents: "Continents",
    countries: "Countries",
    worldCities: "Top 500 World Cities (3 repeats)",
    usStates: "US States",
    usCities: "Top 200 US Cities (6 repeats)",
  };

  Object.keys(geographicData).forEach((key) => {
    const btn = document.createElement("button");
    btn.className = "category-btn active";
    btn.innerHTML = `
                    <span>${categoryNames[key]}</span>
                    <span class="count-badge">${geographicData[key].length}</span>
                `;
    btn.onclick = () => {
      btn.classList.toggle("active");
      updateAnalysis();
    };
    container.appendChild(btn);
  });
}

function getSelectedWords() {
  const activeButtons = document.querySelectorAll(".category-btn.active");
  const categories = Array.from(activeButtons).map((btn) => {
    const text = btn.textContent.trim();
    if (text.includes("Continents")) return "continents";
    if (text.includes("Countries")) return "countries";
    if (text.includes("World Cities")) return "worldCities";
    if (text.includes("US States")) return "usStates";
    if (text.includes("US Cities")) return "usCities";
  });
  return categories.flatMap((cat) => geographicData[cat] || []);
}

function analyzeLetters(words) {
  const starts = {};
  const ends = {};
  const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";

  alphabet.split("").forEach((letter) => {
    starts[letter] = [];
    ends[letter] = [];
  });

  words.forEach((word) => {
    const first = word[0].toUpperCase();
    const last = word[word.length - 1].toUpperCase();
    if (starts[first]) starts[first].push(word);
    if (ends[last]) ends[last].push(word);
  });

  return { starts, ends };
}

function updateAnalysis() {
  currentWords = getSelectedWords();
  letterData = analyzeLetters(currentWords);

  renderStrategicZone();
  renderDefensiveZone();
  renderAllLetters();
  renderStats();
  renderMatrix();
  updateSearchResults();
}

function getLetterType(letter) {
  const startCount = letterData.starts[letter].length;
  const endCount = letterData.ends[letter].length;
  const totalWords = currentWords.length;
  
  // Calculate what percentage of total words start with this letter
  const startPercentage = (startCount / totalWords) * 100;
  
  // Strategic: Less than 3% of words start with this letter (hard for opponent)
  if (startPercentage < 3 && endCount > 0) return "strategic";
  
  // Defensive: More than 8% of words start with this letter (many options)
  if (startPercentage > 8) return "defensive";
  
  return "neutral";
}

function renderStrategicZone() {
  const container = document.getElementById("strategic-letters");
  const letters = Object.keys(letterData.ends)
    .filter((letter) => letterData.ends[letter].length > 0)
    .map((letter) => ({
      letter,
      type: getLetterType(letter),
      count: letterData.starts[letter].length,
    }))
    .filter((item) => item.type === "strategic")
    .sort((a, b) => a.count - b.count)
    .slice(0, 10);

  container.innerHTML = letters
    .map(
      (item) => `
                <div class="letter-box strategic" title="Only ${item.count} places start with ${item.letter}">
                    <div class="letter-char">${item.letter}</div>
                    <div class="letter-count">${item.count}</div>
                </div>
            `
    )
    .join("");
}

function renderDefensiveZone() {
  const container = document.getElementById("defensive-letters");
  const letters = Object.keys(letterData.starts)
    .filter((letter) => letterData.starts[letter].length > 0)
    .map((letter) => ({
      letter,
      type: getLetterType(letter),
      count: letterData.starts[letter].length,
    }))
    .filter((item) => item.type === "defensive")
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  container.innerHTML = letters
    .map(
      (item) => `
                <div class="letter-box defensive" title="${item.count} places start with ${item.letter}">
                    <div class="letter-char">${item.letter}</div>
                    <div class="letter-count">${item.count}</div>
                </div>
            `
    )
    .join("");
}

function renderAllLetters() {
  const container = document.getElementById("all-letters");
  const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";

  container.innerHTML = alphabet
    .split("")
    .map((letter) => {
      const startCount = letterData.starts[letter].length;
      const endCount = letterData.ends[letter].length;
      const type = getLetterType(letter);

      return `
                    <div class="letter-box ${type}" 
                         title="Starts: ${startCount} | Ends: ${endCount}"
                         onclick="filterByLetter('${letter}')">
                        <div class="letter-char">${letter}</div>
                        <div class="letter-count" style="font-size: 0.65rem;">
                            ↑${startCount}<br>↓${endCount}
                        </div>
                    </div>
                `;
    })
    .join("");
}

function renderMatrix() {
    const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
    const table = document.getElementById('matrix-table');
    
    // Build a lookup of words by start AND end letter
    const transitions = {};
    currentWords.forEach(word => {
        const start = word[0].toUpperCase();
        const end = word[word.length - 1].toUpperCase();
        const key = `${start}-${end}`;
        if (!transitions[key]) transitions[key] = [];
        transitions[key].push(word);
    });
    
    let html = '<thead><tr><th>Start ↓ / End →</th>';
    alphabet.forEach(letter => {
        html += `<th>${letter}</th>`;
    });
    html += '</tr></thead><tbody>';

    alphabet.forEach(startLetter => {
        const hasWordsStarting = letterData.starts[startLetter].length > 0;
        if (!hasWordsStarting) return;
        
        html += `<tr><th>${startLetter}</th>`;
        alphabet.forEach(endLetter => {
            const key = `${startLetter}-${endLetter}`;
            const words = transitions[key] || [];
            const count = words.length;
            
            let className = '';
            if (count === 0) className = 'low';
            else if (count < 3) className = 'low';
            else if (count < 10) className = 'medium';
            else className = 'high';
            
            const wordList = words.join(', ');
            html += `<td class="${className}" title="${count} places: ${wordList || 'none'}" onclick="showTransition('${startLetter}', '${endLetter}')">${count}</td>`;
        });
        html += '</tr>';
    });

    html += '</tbody>';
    table.innerHTML = html;
}

function showTransition(startLetter, endLetter) {
    const words = currentWords.filter(word => 
        word[0].toUpperCase() === startLetter && 
        word[word.length - 1].toUpperCase() === endLetter
    );
    const container = document.getElementById('search-results');
    
    if (words.length === 0) {
        container.innerHTML = '<p style="text-align: center; color: #999; padding: 20px;">No places found that start with ' + startLetter + ' and end with ' + endLetter + '</p>';
        return;
    }
    
    container.innerHTML = words.map(word => {
        const isUsed = usedWords.has(word.toLowerCase());
        return `<div class="word-tag ${isUsed ? 'used' : ''}" onclick="${isUsed ? '' : `addToChain('${word.replace(/'/g, "\\'")}')`}">${word}</div>`;
    }).join('');
    document.getElementById('chain-search').value = '';
}

function renderStats() {
  const container = document.getElementById("stats");
  const totalWords = currentWords.length;

  const strategicLetters = Object.keys(letterData.ends).filter(
    (l) => getLetterType(l) === "strategic" && letterData.ends[l].length > 0
  ).length;

  const defensiveLetters = Object.keys(letterData.starts).filter(
    (l) => getLetterType(l) === "defensive" && letterData.starts[l].length > 0
  ).length;

  const mostCommonEnd = Object.entries(letterData.ends).sort(
    (a, b) => b[1].length - a[1].length
  )[0];

  const mostCommonStart = Object.entries(letterData.starts).sort(
    (a, b) => b[1].length - a[1].length
  )[0];

  container.innerHTML = `
                <div class="stat-box">
                    <div class="stat-value">${totalWords}</div>
                    <div class="stat-label">Total Places</div>
                </div>
                <div class="stat-box">
                    <div class="stat-value">${strategicLetters}</div>
                    <div class="stat-label">Strategic Letters</div>
                </div>
                <div class="stat-box">
                    <div class="stat-value">${defensiveLetters}</div>
                    <div class="stat-label">Defensive Letters</div>
                </div>
                <div class="stat-box">
                    <div class="stat-value">${mostCommonEnd[0]}</div>
                    <div class="stat-label">Most Common End (${mostCommonEnd[1].length})</div>
                </div>
                <div class="stat-box">
                    <div class="stat-value">${mostCommonStart[0]}</div>
                    <div class="stat-label">Most Common Start (${mostCommonStart[1].length})</div>
                </div>
            `;
}

function updateSearchResults(filter = "") {
  const container = document.getElementById("search-results");
  let words = currentWords;

  if (filter) {
    words = words.filter((w) => w.toLowerCase().includes(filter.toLowerCase()));
  }

  if (chain.length > 0) {
    const lastLetter =
      chain[chain.length - 1][chain[chain.length - 1].length - 1].toUpperCase();
    words = words.filter((w) => w[0].toUpperCase() === lastLetter);
  }

  container.innerHTML = words
    .slice(0, 50)
    .map((word) => {
      const isUsed = usedWords.has(word.toLowerCase());
      return `<div class="word-tag ${isUsed ? "used" : ""}" onclick="${
        isUsed ? "" : `addToChain('${word.replace(/'/g, "\\'")}')`
      }">${word}</div>`;
    })
    .join("");

  if (words.length === 0) {
    container.innerHTML =
      '<p style="text-align: center; color: #999; padding: 20px;">No places found</p>';
  } else if (words.length > 50) {
    container.innerHTML +=
      '<p style="text-align: center; color: #666; padding: 10px; grid-column: 1 / -1;">Showing first 50 of ' +
      words.length +
      " results</p>";
  }
}

function addToChain(word) {
  if (usedWords.has(word.toLowerCase())) {
    return;
  }
  chain.push(word);
  usedWords.add(word.toLowerCase());
  renderChain();
  updateSearchResults();
}

function renderChain() {
  const container = document.getElementById("chain-display");
  if (chain.length === 0) {
    container.innerHTML =
      '<span style="color: #999;">Start typing or click a word below to begin...</span>';
    return;
  }

  container.innerHTML = chain
    .map((word, i) => {
      const nextLetter = word[word.length - 1].toUpperCase();
      const type =
        i === chain.length - 1 ? getLetterType(nextLetter) : "neutral";
      const colorClass =
        type === "strategic"
          ? "background: linear-gradient(135deg, #ff6b6b 0%, #ee5a6f 100%);"
          : type === "defensive"
          ? "background: linear-gradient(135deg, #51cf66 0%, #37b24d 100%);"
          : "background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);";

      return `<div class="chain-word" style="${colorClass}">${word}</div>`;
    })
    .join("");
}

function resetChain() {
  chain = [];
  usedWords.clear();
  renderChain();
  updateSearchResults();
}

function filterByLetter(letter) {
  document.getElementById("chain-search").value = "";
  const words = letterData.starts[letter];
  const container = document.getElementById("search-results");
  container.innerHTML = words
    .map((word) => {
      const isUsed = usedWords.has(word.toLowerCase());
      return `<div class="word-tag ${isUsed ? "used" : ""}" onclick="${
        isUsed ? "" : `addToChain('${word.replace(/'/g, "\\'")}')`
      }">${word}</div>`;
    })
    .join("");
}

document.getElementById("chain-search").addEventListener("input", (e) => {
  updateSearchResults(e.target.value);
});

init();
