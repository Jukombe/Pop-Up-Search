document.addEventListener('DOMContentLoaded', function() {
  const searchInput = document.getElementById('searchInput');
  const suggestions = document.getElementById('suggestions');

  searchInput.focus();

  let recentUrls = JSON.parse(localStorage.getItem('recentUrls')) || [];
  let recentSearches = JSON.parse(localStorage.getItem('recentSearches')) || [];

  function renderSuggestions() {
    suggestions.innerHTML = '';
    const query = searchInput.value.toLowerCase();

    // Display recent URLs
    recentUrls.forEach(url => {
      if (url.startsWith(query)) {
        addSuggestion(url);
      }
    });

    // Display recent searches
    recentSearches.forEach(search => {
      if (search.startsWith(query)) {
        addSuggestion(search);
      }
    });
  }

  function addSuggestion(suggestion) {
    const li = document.createElement('li');
    const faviconUrl = `https://www.google.com/s2/favicons?domain=${suggestion}`;

    li.innerHTML = `<img class="icon" src="${faviconUrl}" alt="Icon" /> ${suggestion}`;
    
    li.addEventListener('click', function() {
      openUrl(suggestion);
    });
    
    suggestions.appendChild(li);
  }

  function isValidUrl(url) {
    const validExtensions = /\.(com|net|org|at|tv|de|info|io)$/;
    return validExtensions.test(url);
  }

  function openUrl(query) {
    if (isValidUrl(query)) {
      const fullUrl = query.startsWith('http://') || query.startsWith('https://') ? query : `https://${query}`;
      window.open(fullUrl, '_blank');
    } else {
      // Search Google if not a valid URL
      window.open(`https://www.google.com/search?q=${query}`, '_blank');
    }
    window.close();
  }

  searchInput.addEventListener('input', renderSuggestions);

  searchInput.addEventListener('keypress', function(e) {
    if (e.key === 'Enter') {
      const query = searchInput.value.trim();
      openUrl(query);
      
      if (!recentSearches.includes(query) && query) {
        recentSearches.push(query);
        localStorage.setItem('recentSearches', JSON.stringify(recentSearches));
      }

      window.close();
    }
  });
});
