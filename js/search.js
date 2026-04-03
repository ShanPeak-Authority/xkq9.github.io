let searchHistory = JSON.parse(localStorage.getItem('gameSearchHistory')) || [];

// 计算并设置底部内边距的函数
function setSearchBottomPadding() {
    const categoryContainer = document.querySelector('.category-container');
    if (!categoryContainer) return;

    // 根据窗口宽度决定底边距大小
    const isMobile = window.innerWidth <= 768;
    const paddingValue = isMobile ? '49px' : '61px';

    // 直接设置内联样式
    categoryContainer.style.paddingBottom = paddingValue;
}

// 移除底部内边距的函数
function removeSearchBottomPadding() {
    const categoryContainer = document.querySelector('.category-container');
    if (categoryContainer) {
        categoryContainer.style.paddingBottom = '';
    }
}

// 窗口大小变化时重新计算底边距
function handleWindowResize() {
    const searchHeader = document.getElementById('searchResultsHeader');
    if (searchHeader && searchHeader.style.display === 'flex') {
        setSearchBottomPadding();
    }
}

export function initializeSearch() {
    const searchInput = document.getElementById('searchInput');
    const searchButton = document.getElementById('searchButton');
    const searchBox = document.getElementById('searchBox');
    const suggestions = document.getElementById('searchSuggestions');
    if (!searchInput || !searchButton || !searchBox || !suggestions) return;

    updateSearchHistoryDisplay();

    searchInput.addEventListener('focus', () => {
        suggestions.classList.add('active');
        searchBox.classList.add('focused');
    });

    searchInput.addEventListener('blur', () => setTimeout(() => {
        if (!suggestions.contains(document.activeElement)) suggestions.classList.remove('active');
        searchBox.classList.remove('focused');
    }, 200));

    searchButton.addEventListener('click', performSearch);
    searchInput.addEventListener('keypress', (e) => e.key === 'Enter' && performSearch());

    document.getElementById('clearSearch')?.addEventListener('click', clearSearch);
    document.getElementById('clearHistory')?.addEventListener('click', clearSearchHistory);

    suggestions.addEventListener('click', (e) => {
        const suggestionItem = e.target.closest('.search-suggestion-game');
        if (suggestionItem) {
            searchInput.value = suggestionItem.dataset.search;
            performSearch();
        } else if (e.target.classList.contains('search-history-item')) {
            searchInput.value = e.target.textContent;
            performSearch();
        }
    });

    // 添加窗口大小变化监听
    window.addEventListener('resize', handleWindowResize);
}

export function performSearch() {
    const searchInput = document.getElementById('searchInput');
    const keyword = searchInput?.value.trim() || '';
    if (!keyword) {
        return;
    }

    const allGameItems = document.querySelectorAll('#recommendContent .game-item:not(.no-results)');
    const keywordLower = keyword.toLowerCase();
    let hasGlobalMatch = false;
    let firstMatchCategory = null;

    allGameItems.forEach(item => {
        if (item.dataset.searchable?.toLowerCase().includes(keywordLower)) {
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
    updateSearchHistoryDisplay();
    switchToActivityTab(firstMatchCategory || window.categoryModule?.activeCategory || 'Guan-Fu');

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
            const isMatch = item.dataset.searchable?.toLowerCase().includes(keywordLower);
            if (isMatch) {
                panelMatchCount++;
                globalMatchCount++;
                highlightText(item, keyword);
            } else {
                item.classList.add('hidden');
            }
        });

        noResults && (noResults.style.display = panelMatchCount === 0 ? 'block' : 'none');
    });

    document.getElementById('searchKeyword') && (document.getElementById('searchKeyword').textContent = keyword);
    document.getElementById('resultsCount') && (document.getElementById('resultsCount').textContent = globalMatchCount);
    document.getElementById('searchResultsHeader') && (document.getElementById('searchResultsHeader').style.display = 'flex');

    // 为分类内容容器添加动态计算的底部边距
    setSearchBottomPadding();

    const searchSuggestions = document.getElementById('searchSuggestions');
    searchSuggestions && searchSuggestions.classList.remove('active');

    const activePanel = document.querySelector('.category-panel.active');
    activePanel && setTimeout(() => window.categoryModule?.applySubFilter(activePanel), 10);
}

function switchToActivityTab(targetCategory = 'Guan-Fu') {
    const contentAreas = {
        'notice': document.getElementById('noticeContent'),
        'recommend': document.getElementById('recommendContent'),
        'exchange': document.getElementById('exchangeContent'),
        'mine': document.getElementById('mineContent')
    };
    const navItems = document.querySelectorAll('.nav-bottom-item');

    Object.values(contentAreas).forEach(area => area && (area.style.display = 'none'));
    contentAreas['recommend'] && (contentAreas['recommend'].style.display = 'block');

    navItems.forEach(nav => nav.classList.remove('active'));
    const activityNavItem = document.querySelector('.nav-bottom-item[data-target="recommend"]');
    activityNavItem && activityNavItem.classList.add('active');
    window.scrollTo(0, 0);

    const targetCategoryItem = document.querySelector(`.category-item[data-category="${targetCategory}"]`);
    if (targetCategoryItem) {
        targetCategoryItem.click();
    } else {
        const defaultCategoryItem = document.querySelector('.category-item[data-category="Guan-Fu"]');
        defaultCategoryItem && defaultCategoryItem.click();
    }
}

function showNoResultAlert(keyword) {
    const modal = document.getElementById('noResultModal');
    const keywordSpan = document.getElementById('noResultKeyword');
    const confirmBtn = document.getElementById('noResultConfirm');

    if (!modal || !keywordSpan || !confirmBtn) {
        alert(`没有找到与"${keyword}"相关的游戏，请尝试其他关键词。`);
        return;
    }

    keywordSpan.textContent = keyword;
    modal.style.display = 'flex';

    const closeModal = () => {
        modal.style.display = 'none';
        document.getElementById('searchInput') && (document.getElementById('searchInput').value = '');
        document.getElementById('searchSuggestions') && document.getElementById('searchSuggestions').classList.remove('active');
    };

    confirmBtn.replaceWith(confirmBtn.cloneNode(true));
    document.getElementById('noResultConfirm').addEventListener('click', closeModal);
    modal.onclick = (event) => event.target === modal && closeModal();
}

export function clearSearch() {
    const searchInput = document.getElementById('searchInput');
    searchInput && (searchInput.value = '');

    document.getElementById('searchResultsHeader') && (document.getElementById('searchResultsHeader').style.display = 'none');

    // 移除分类内容容器的底部边距
    removeSearchBottomPadding();

    document.querySelectorAll('.category-panel').forEach(panel => {
        panel.querySelectorAll('.game-item:not(.no-results)').forEach(item => {
            item.classList.remove('hidden');
            removeTextHighlight(item);
        });
        const noResults = panel.querySelector('.no-results');
        const visibleCount = panel.querySelectorAll('.game-item:not(.hidden):not(.no-results)').length;
        noResults && (noResults.style.display = (!window.categoryModule?.activeSubFilter && visibleCount === 0) ? 'block' : 'none');
    });

    document.getElementById('searchSuggestions') && document.getElementById('searchSuggestions').classList.remove('active');

    const activePanel = document.querySelector('.category-panel.active');
    activePanel && window.categoryModule?.applySubFilter(activePanel);
}

function addToSearchHistory(keyword) {
    searchHistory = searchHistory.filter(item => item !== keyword);
    searchHistory.unshift(keyword);
    searchHistory.length > 5 && (searchHistory = searchHistory.slice(0, 5));
    localStorage.setItem('gameSearchHistory', JSON.stringify(searchHistory));
}

function updateSearchHistoryDisplay() {
    const historyItems = document.getElementById('historyItems');
    if (!historyItems) return;

    if (searchHistory.length === 0) {
        historyItems.innerHTML = '<div style="color:#b0b2bf;font-size:14px;">暂无搜索历史</div>';
        return;
    }

    historyItems.innerHTML = '';
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
    historyItems && (historyItems.innerHTML = '<div style="color:#b0b2bf;font-size:14px;">暂无搜索历史</div>');
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