document.addEventListener('DOMContentLoaded', function() {
  const searchInput = document.getElementById('searchInput');
  const suggestions = document.getElementById('suggestions');
  const searchButton = document.getElementById('searchButton');
  const clearHistoryButton = document.getElementById('clearHistoryButton');
  const searchFilter = document.getElementById('searchFilter');
  const toggleThemeButton = document.getElementById('toggleThemeButton');

  // Sofortige Fokussierung des Eingabefelds
  searchInput.focus();

  let recentUrls = JSON.parse(localStorage.getItem('recentUrls')) || [];
  let recentSearches = JSON.parse(localStorage.getItem('recentSearches')) || [];
  let darkMode = true;
  let debounceTimeout;

  function renderSuggestions() {
    clearSuggestions();
    const query = searchInput.value.toLowerCase();

    recentUrls.forEach(url => {
      if (url.startsWith(query)) {
        addSuggestion(url);
      }
    });

    recentSearches.forEach(search => {
      if (search.startsWith(query)) {
        addSuggestion(search);
      }
    });

    if (query) {
      fetchGoogleSuggestions(query);
    }

    const highlight = recentSearches.find(search => search.startsWith(query));
    if (highlight) {
      const highlightedText = highlight.substring(query.length);
      updateInputHighlight(highlightedText);
    } else {
      clearInputHighlight();
    }

    if (suggestions.children.length > 0) {
      suggestions.classList.add('show');
    } else {
      suggestions.classList.remove('show');
    }
  }

  function addSuggestion(suggestion) {
    const li = document.createElement('li');
    li.textContent = suggestion;
    li.addEventListener('click', function() {
      performSearch(suggestion);
    });
    suggestions.appendChild(li);
  }

  function fetchGoogleSuggestions(query) {
    clearTimeout(debounceTimeout);
    debounceTimeout = setTimeout(() => {
      fetch(`https://suggestqueries.google.com/complete/search?client=firefox&q=${encodeURIComponent(query)}`)
        .then(response => {
          if (!response.ok) {
            throw new Error('Netzwerkantwort war nicht ok');
          }
          return response.json();
        })
        .then(data => {
          data[1].forEach(suggestion => {
            addSuggestion(suggestion);
          });
        })
        .catch(err => console.error('Fehler beim Abrufen von Suchvorschlägen:', err));
    }, 300);
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

  function clearSuggestions() {
    suggestions.innerHTML = '';
  }

  searchInput.addEventListener('input', renderSuggestions);

  searchInput.addEventListener('keypress', function(e) {
    if (e.key === 'Enter') {
      performSearch();
    }
  });

  searchButton.addEventListener('click', performSearch);

  function performSearch(query = null) {
    const inputQuery = searchInput.value.trim();
    const highlight = searchInput.getAttribute('data-highlight');
    const fullQuery = query || (highlight ? inputQuery + highlight : inputQuery);

    let baseUrl;
    switch (searchFilter.value) {
      case 'images':
        baseUrl = `https://www.google.com/search?tbm=isch&q=${fullQuery}`;
        break;
      case 'youtube':
        baseUrl = `https://www.youtube.com/results?search_query=${fullQuery}`;
        break;
      default:
        baseUrl = `https://www.google.com/search?q=${fullQuery}`;
    }

    window.open(baseUrl, '_blank');

    if (!recentSearches.includes(fullQuery) && fullQuery) {
      recentSearches.push(fullQuery);
      if (recentSearches.length > 10) {
        recentSearches.shift();
      }
      localStorage.setItem('recentSearches', JSON.stringify(recentSearches));
    }

    window.close();
  }

  clearHistoryButton.addEventListener('click', function() {
    recentSearches = [];
    localStorage.setItem('recentSearches', JSON.stringify(recentSearches));
    renderSuggestions();
  });

  toggleThemeButton.addEventListener('click', function() {
    darkMode = !darkMode;
    document.body.style.backgroundColor = darkMode ? '#2e2e2e' : '#ffffff';
    document.body.style.color = darkMode ? '#fff' : '#000';
  });
});
