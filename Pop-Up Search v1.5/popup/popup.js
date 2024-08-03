document.addEventListener('DOMContentLoaded', function() {
  const searchInput = document.getElementById('searchInput');
  const suggestions = document.getElementById('suggestions');
  const clearHistoryButton = document.getElementById('clearHistoryButton');
  const searchFilter = document.getElementById('searchFilter');
  const toggleThemeButton = document.getElementById('toggleThemeButton');
  const searchHistory = document.getElementById('searchHistory');

  searchInput.focus();

  let recentUrls = getFromLocalStorage('recentUrls', []);
  let recentSearches = getFromLocalStorage('recentSearches', []);
  let darkMode = getFromLocalStorage('darkMode', true);
  let selectedSuggestionIndex = -1;

  console.log('Initial dark mode state:', darkMode);

  applyTheme();

  searchInput.addEventListener('input', debounce(renderSuggestions, 300));
  searchInput.addEventListener('keydown', handleKeyDown);
  searchInput.addEventListener('keypress', function(e) {
    if (e.key === 'Enter') {
      performSearch();
    }
  });

  clearHistoryButton.addEventListener('click', clearHistory);
  toggleThemeButton.addEventListener('click', toggleTheme);

  function getFromLocalStorage(key, defaultValue) {
    try {
      return JSON.parse(localStorage.getItem(key)) || defaultValue;
    } catch (error) {
      console.error(`Error retrieving ${key} from localStorage`, error);
      return defaultValue;
    }
  }

  function saveToLocalStorage(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      console.error(`Error saving ${key} to localStorage`, error);
    }
  }

  function renderSuggestions() {
    suggestions.innerHTML = '';
    const query = searchInput.value.toLowerCase().trim();

    const allSuggestions = [...recentUrls, ...recentSearches.map(s => s.query)];
    const uniqueSuggestions = [...new Set(allSuggestions)];

    uniqueSuggestions.forEach(suggestion => {
      if (suggestion.toLowerCase().startsWith(query)) {
        addSuggestion(suggestion);
      }
    });

    if (query) {
      fetchGoogleSuggestions(query);
    }

    const highlight = recentSearches.find(search => search.query.toLowerCase().startsWith(query));
    if (highlight) {
      const highlightedText = highlight.query.substring(query.length);
      updateInputHighlight(highlightedText);
    } else {
      clearInputHighlight();
    }

    suggestions.classList.toggle('show', suggestions.children.length > 0);
    selectedSuggestionIndex = -1;
  }

  function addSuggestion(suggestion) {
    const li = document.createElement('li');
    li.textContent = suggestion;

    const icon = document.createElement('i');
    icon.className = getIconClass(suggestion);
    icon.classList.add('icon');
    li.prepend(icon);

    li.addEventListener('click', function() {
      openUrlOrSearch(suggestion);
    });
    suggestions.appendChild(li);
  }

  function fetchGoogleSuggestions(query) {
    fetch(`https://suggestqueries.google.com/complete/search?client=firefox&q=${encodeURIComponent(query)}`)
      .then(response => {
        if (!response.ok) {
          throw new Error('Network response was not ok');
        }
        return response.json();
      })
      .then(data => {
        data[1].forEach(suggestion => {
          if (!suggestions.querySelector(`li:contains("${suggestion}")`)) {
            addSuggestion(suggestion);
          }
        });
      })
      .catch(err => console.error('Error fetching search suggestions:', err));
  }

  function getIconClass(suggestion) {
    const domain = suggestion
      .replace(/^https?:\/\/(www\.)?/, '') // Entferne das Protokoll und 'www.'
      .replace(/\.(com|org|net|de|edu|gov|io|tv|co|biz|info)$/, ''); // Entferne gängige TLDs

    const iconMap = {
      'youtube': 'fab fa-youtube',
      'google': 'fab fa-google',
      'facebook': 'fab fa-facebook',
      'twitter': 'fab fa-twitter',
      'chat.openai': 'fas fa-robot',
      'github': 'fab fa-github',
      'linkedin': 'fab fa-linkedin',
      'instagram': 'fab fa-instagram',
      'reddit': 'fab fa-reddit',
      'amazon': 'fab fa-amazon',
      'ebay': 'fab fa-ebay',
      'netflix': 'fab fa-netflix',
      'spotify': 'fab fa-spotify',
      'twitch': 'fab fa-twitch',
      'pinterest': 'fab fa-pinterest',
      'snapchat': 'fab fa-snapchat-ghost',
      'whatsapp': 'fab fa-whatsapp',
      'tiktok': 'fab fa-tiktok',
      'medium': 'fab fa-medium',
      'willhaben': 'fa-solid fa-shop',
      'vimeo': 'fab fa-vimeo',
      'slack': 'fab fa-slack',
      'paypal': 'fab fa-paypal'
    };

    return iconMap[domain] || 'fas fa-search';
  }

  function updateInputHighlight(highlightedText) {
    const inputValue = searchInput.value;
    searchInput.setAttribute('data-highlight', highlightedText);
    searchInput.style.borderColor = '#0078d7';
    searchInput.value = inputValue;
    searchInput.setAttribute('placeholder', inputValue + highlightedText);
  }

  function clearInputHighlight() {
    searchInput.removeAttribute('data-highlight');
    searchInput.style.borderColor = '';
    searchInput.setAttribute('placeholder', searchInput.value);
  }

  function performSearch() {
    const query = searchInput.value.trim();
    const highlight = searchInput.getAttribute('data-highlight');
    const fullQuery = highlight ? query + highlight : query;

    openUrlOrSearch(fullQuery);

    const existingSearch = recentSearches.find(search => search.query === fullQuery);
    if (existingSearch) {
      existingSearch.count++;
    } else {
      recentSearches.push({ query: fullQuery, count: 1 });
    }

    recentSearches.sort((a, b) => b.count - a.count);
    saveToLocalStorage('recentSearches', recentSearches);

    searchInput.value = '';
    renderSuggestions();
    renderSearchHistory();
  }

function openUrlOrSearch(query) {
  let url;

  // Überprüfe, ob die Eingabe eine gültige URL ist
  try {
    url = new URL(query);
  } catch {
    // Falls es keine gültige URL ist, füge das Protokoll hinzu, wenn es fehlt
    if (!/^https?:\/\//i.test(query)) {
      query = 'http://' + query;
    }
    
    // Prüfe auf gängige TLDs, um zu entscheiden, ob es sich um eine URL handelt
    const urlPattern = /\.(com|org|net|de|edu|gov|io|tv|co|biz|info|at|uk|ca|au)$/i;
    if (urlPattern.test(query)) {
      url = new URL(query); // Versuche, die URL erneut zu erstellen
    } else {
      // Je nach Filter führe eine Google-Suche durch
      const filter = searchFilter.value;
      if (filter === 'images') {
        url = `https://www.google.com/search?tbm=isch&q=${encodeURIComponent(query)}`;
      } else if (filter === 'youtube') {
        url = `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`;
      } else {
        url = `https://www.google.com/search?q=${encodeURIComponent(query)}`;
      }
    }
  }

  // Öffne die URL in einem neuen Tab
  window.open(url.toString(), '_blank');
}


  function clearHistory() {
    recentUrls = [];
    recentSearches = [];
    localStorage.removeItem('recentUrls');
    localStorage.removeItem('recentSearches');
    renderSuggestions();
    renderSearchHistory();
  }

  function toggleTheme() {
    darkMode = !darkMode;
    saveToLocalStorage('darkMode', darkMode);
    console.log('Toggling dark mode to:', darkMode);
    applyTheme();
  }

  function applyTheme() {
    document.body.classList.toggle('dark-mode', darkMode);
    console.log('Applied theme:', darkMode ? 'dark' : 'light');
  }

  function handleKeyDown(e) {
    const suggestionItems = Array.from(suggestions.children);

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        if (selectedSuggestionIndex < suggestionItems.length - 1) {
          selectedSuggestionIndex++;
          updateSuggestionSelection();
        }
        break;
      case 'ArrowUp':
        e.preventDefault();
        if (selectedSuggestionIndex > 0) {
          selectedSuggestionIndex--;
          updateSuggestionSelection();
        }
        break;
      case 'Enter':
        if (selectedSuggestionIndex >= 0) {
          e.preventDefault();
          suggestionItems[selectedSuggestionIndex].click();
        }
        break;
      case 'Escape':
        suggestions.classList.remove('show');
        break;
    }
  }

  function updateSuggestionSelection() {
    const suggestionItems = Array.from(suggestions.children);
    suggestionItems.forEach((item, index) => {
      item.classList.toggle('selected', index === selectedSuggestionIndex);
    });

    if (selectedSuggestionIndex >= 0) {
      searchInput.value = suggestionItems[selectedSuggestionIndex].textContent;
    } else {
      searchInput.value = searchInput.getAttribute('placeholder') || '';
    }
  }

  function renderSearchHistory() {
    searchHistory.innerHTML = '';
    recentSearches.forEach(search => {
      const li = document.createElement('li');
      li.textContent = search.query;
      li.addEventListener('click', function() {
        searchInput.value = search.query;
        renderSuggestions();
      });
      searchHistory.appendChild(li);
    });
  }

  function debounce(func, wait) {
    let timeout;
    return function() {
      const later = () => {
        clearTimeout(timeout);
        func.apply(this, arguments);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  }

  renderSuggestions();
  renderSearchHistory();
});
