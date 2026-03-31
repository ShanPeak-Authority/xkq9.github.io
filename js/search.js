let searchHistory = JSON.parse(localStorage.getItem('gameSearchHistory')) || [];

export function initializeSearch() {
    const searchInput = document.getElementById('searchInput');
    const searchButton = document.getElementById('searchButton');
    const searchBox = document.getElementById('searchBox');
    const searchSuggestions = document.getElementById('searchSuggestions');
    const clearSearchBtn = document.getElementById('clearSearch');
    const clearHistoryBtn = document.getElementById('clearHistory');
    const historyItems = document.getElementById('historyItems');

    if (!searchInput || !searchButton || !searchBox || !searchSuggestions) return;

    updateSearchHistoryDisplay(historyItems);

    searchInput.addEventListener('focus', handleSearchFocus);
    searchInput.addEventListener('blur', handleSearchBlur);
    searchInput.addEventListener('input', handleSearchInput);
    searchButton.addEventListener('click', performSearch);
    searchInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') performSearch();
    });

    if (clearSearchBtn) clearSearchBtn.addEventListener('click', clearSearch);
    if (clearHistoryBtn) clearHistoryBtn.addEventListener('click', clearSearchHistory);

    if (searchSuggestions) {
        searchSuggestions.addEventListener('click', (e) => {
            const suggestionItem = e.target.closest('.search-suggestion-game');
            if (suggestionItem) {
                searchInput.value = suggestionItem.getAttribute('data-search');
                performSearch();
            }
            if (e.target.classList.contains('search-history-item')) {
                searchInput.value = e.target.textContent;
                performSearch();
            }
        });
    }
}

export function performSearch(targetCategory) {
    const searchInput = document.getElementById('searchInput');
    const keyword = searchInput ? searchInput.value.trim() : '';
    const hasSearch = keyword;

    if (!keyword) {
        clearSearch();
        return;
    }

    const categoryToActivate = targetCategory || (window.categoryModule && window.categoryModule.getActiveCategory()) || 'theme';
    const allGameItems = document.querySelectorAll('#recommendContent .game-item:not(.no-results)');
    const keywordLower = keyword.toLowerCase();
    let hasGlobalMatch = false;
    let firstMatchCategory = null;

    allGameItems.forEach(item => {
        const searchableText = item.getAttribute('data-searchable');
        if (searchableText && searchableText.toLowerCase().includes(keywordLower)) {
            hasGlobalMatch = true;
            if (!firstMatchCategory) {
                firstMatchCategory = item.closest('.category-panel').id.replace('Panel', '');
            }
        }
    });

    if (!hasGlobalMatch) {
        showNoResultAlert(keyword);
        return;
    }

    addToSearchHistory(keyword);
    updateSearchHistoryDisplay(document.getElementById('historyItems'));
    switchToActivityTab(categoryToActivate);

    const allCategoryPanels = document.querySelectorAll('.category-panel');
    let globalMatchCount = 0;

    allCategoryPanels.forEach(panel => {
        const panelGameItems = panel.querySelectorAll('.game-item:not(.no-results)');
        const noResults = panel.querySelector('.no-results');
        let panelMatchCount = 0;

        panelGameItems.forEach(item => {
            item.classList.remove('hidden');
            removeTextHighlight(item);
        });

        panelGameItems.forEach(item => {
            const searchableText = item.getAttribute('data-searchable');
            const isMatch = searchableText && searchableText.toLowerCase().includes(keywordLower);

            if (isMatch) {
                panelMatchCount++;
                globalMatchCount++;
                highlightText(item, keyword);
            } else {
                item.classList.add('hidden');
            }
        });

        if (noResults) {
            noResults.style.display = (panelMatchCount === 0) ? 'block' : 'none';
        }
    });

    const searchResultsHeader = document.getElementById('searchResultsHeader');
    const searchKeyword = document.getElementById('searchKeyword');
    const resultsCount = document.getElementById('resultsCount');

    if (searchKeyword) searchKeyword.textContent = keyword;
    if (resultsCount) resultsCount.textContent = globalMatchCount;
    if (searchResultsHeader) searchResultsHeader.style.display = 'flex';

    const searchSuggestions = document.getElementById('searchSuggestions');
    if (searchSuggestions) searchSuggestions.classList.remove('active');

    if (window.categoryModule && window.categoryModule.applySubFilter) {
        const activePanel = document.querySelector('.category-panel.active');
        if (activePanel) {
            setTimeout(() => {
                window.categoryModule.applySubFilter(activePanel);
            }, 10);
        }
    }
}

function switchToActivityTab(targetCategory = 'theme') {
    const contentAreas = {
        'notice': document.getElementById('noticeContent'),
        'recommend': document.getElementById('recommendContent'),
        'exchange': document.getElementById('exchangeContent'),
        'mine': document.getElementById('mineContent')
    };
    const navItems = document.querySelectorAll('.nav-bottom-item');

    Object.values(contentAreas).forEach(area => {
        if (area) area.style.display = 'none';
    });
    if (contentAreas['recommend']) {
        contentAreas['recommend'].style.display = 'block';
    }
    navItems.forEach(nav => nav.classList.remove('active'));
    const activityNavItem = document.querySelector('.nav-bottom-item[data-target="recommend"]');
    if (activityNavItem) {
        activityNavItem.classList.add('active');
    }
    window.scrollTo(0, 0);

    const targetCategoryItem = document.querySelector(`.category-item[data-category="${targetCategory}"]`);
    if (targetCategoryItem) {
        targetCategoryItem.click();
    } else {
        const themeCategoryItem = document.querySelector('.category-item[data-category="theme"]');
        if (themeCategoryItem) {
            themeCategoryItem.click();
        }
    }
}

function showNoResultAlert(keyword) {
    const modal = document.getElementById('noResultModal');
    const keywordSpan = document.getElementById('noResultKeyword');
    const confirmBtn = document.getElementById('noResultConfirm');

    if (!modal || !keywordSpan || !confirmBtn) {
        alert(`没有找到与“${keyword}”相关的游戏，请尝试其他关键词。`);
        return;
    }

    keywordSpan.textContent = keyword;
    modal.style.display = 'flex';

    const closeModal = () => {
        modal.style.display = 'none';
        const searchInput = document.getElementById('searchInput');
        if (searchInput) searchInput.value = '';
        const searchSuggestions = document.getElementById('searchSuggestions');
        if (searchSuggestions) searchSuggestions.classList.remove('active');
    };
    
    confirmBtn.replaceWith(confirmBtn.cloneNode(true));
    document.getElementById('noResultConfirm').addEventListener('click', closeModal);
    modal.onclick = function (event) {
        if (event.target === modal) {
            closeModal();
        }
    };
}

function handleSearchFocus() {
    const searchSuggestions = document.getElementById('searchSuggestions');
    const searchBox = document.getElementById('searchBox');
    if (searchSuggestions) searchSuggestions.classList.add('active');
    if (searchBox) searchBox.classList.add('focused');
}

function handleSearchBlur() {
    setTimeout(() => {
        const searchSuggestions = document.getElementById('searchSuggestions');
        const searchBox = document.getElementById('searchBox');
        if (searchSuggestions && !searchSuggestions.contains(document.activeElement)) {
            searchSuggestions.classList.remove('active');
        }
        if (searchBox) searchBox.classList.remove('focused');
    }, 200);
}

function handleSearchInput() {}

function clearSearch() {
    const searchInput = document.getElementById('searchInput');
    if (searchInput) searchInput.value = '';

    const searchResultsHeader = document.getElementById('searchResultsHeader');
    if (searchResultsHeader) searchResultsHeader.style.display = 'none';

    const allPanels = document.querySelectorAll('.category-panel');
    allPanels.forEach(panel => {
        const gameItems = panel.querySelectorAll('.game-item:not(.no-results)');
        gameItems.forEach(item => {
            item.classList.remove('hidden');
            removeTextHighlight(item);
        });
        const noResults = panel.querySelector('.no-results');
        if (noResults) {
            const hasActiveSubFilter = window.categoryModule && window.categoryModule.getActiveSubFilter();
            const visibleCount = panel.querySelectorAll('.game-item:not(.hidden):not(.no-results)').length;
            noResults.style.display = (!hasActiveSubFilter && visibleCount === 0) ? 'block' : 'none';
        }
    });

    const searchSuggestions = document.getElementById('searchSuggestions');
    if (searchSuggestions) searchSuggestions.classList.remove('active');

    const categoryContent = document.querySelector('.category-content');
    if (categoryContent) categoryContent.style.paddingBottom = '';

    if (window.categoryModule && window.categoryModule.applySubFilter) {
        const activePanel = document.querySelector('.category-panel.active');
        if (activePanel) window.categoryModule.applySubFilter(activePanel);
    }
}

function addToSearchHistory(keyword) {
    searchHistory = searchHistory.filter(item => item !== keyword);
    searchHistory.unshift(keyword);
    if (searchHistory.length > 5) searchHistory = searchHistory.slice(0, 5);
    localStorage.setItem('gameSearchHistory', JSON.stringify(searchHistory));
}

function updateSearchHistoryDisplay(historyItems) {
    if (!historyItems) return;
    historyItems.innerHTML = '';

    if (searchHistory.length === 0) {
        historyItems.innerHTML = '<div style="color:#b0b2bf;font-size:14px;">暂无搜索历史</div>';
        return;
    }

    searchHistory.forEach(item => {
        const historyItem = document.createElement('div');
        historyItem.className = 'search-history-item';
        historyItem.textContent = item;
        historyItems.appendChild(historyItem);
    });
}

function clearSearchHistory() {
    searchHistory = [];
    localStorage.removeItem('gameSearchHistory');
    const historyItems = document.getElementById('historyItems');
    if (historyItems) {
        historyItems.innerHTML = '<div style="color:#b0b2bf;font-size:14px;">暂无搜索历史</div>';
    }
}

function highlightText(gameItemElement, keyword) {
    const titleElement = gameItemElement.querySelector('.game-title');
    const descElement = gameItemElement.querySelector('.game-description');

    [titleElement, descElement].forEach(el => {
        if (el && !el.dataset.originalText) {
            el.dataset.originalText = el.innerHTML;
            const regex = new RegExp(`(${keyword})`, 'gi');
            el.innerHTML = el.innerHTML.replace(regex, '<span class="highlight">$1</span>');
        }
    });
}

function removeTextHighlight(gameItemElement) {
    const titleElement = gameItemElement.querySelector('.game-title');
    const descElement = gameItemElement.querySelector('.game-description');

    [titleElement, descElement].forEach(el => {
        if (el && el.dataset.originalText) {
            el.innerHTML = el.dataset.originalText;
            delete el.dataset.originalText;
        }
    });
}

window.searchModule = {
    performSearchIfActive: function (targetCategory) {
        const searchInput = document.getElementById('searchInput');
        if (searchInput && searchInput.value.trim()) {
            performSearch(targetCategory);
        }
    },
    performSearch: performSearch,
    clearSearch: clearSearch
};