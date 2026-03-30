let searchHistory = JSON.parse(localStorage.getItem('gameSearchHistory')) || [];

export function initializeSearch() {
    const searchInput = document.getElementById('searchInput');
    const searchButton = document.getElementById('searchButton');
    const searchBox = document.getElementById('searchBox');
    const searchSuggestions = document.getElementById('searchSuggestions');
    const clearSearchBtn = document.getElementById('clearSearch');
    const clearHistoryBtn = document.getElementById('clearHistory');
    const historyItems = document.getElementById('historyItems');

    // 确保关键元素存在
    if (!searchInput || !searchButton || !searchBox || !searchSuggestions) {
        console.error('搜索核心元素未找到，初始化失败。');
        return;
    }

    // 初始化搜索历史显示
    updateSearchHistoryDisplay(historyItems);

    // 事件监听
    searchInput.addEventListener('focus', handleSearchFocus);
    searchInput.addEventListener('blur', handleSearchBlur);
    searchInput.addEventListener('input', handleSearchInput);
    searchButton.addEventListener('click', performSearch);
    searchInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') performSearch();
    });

    if (clearSearchBtn) {
        clearSearchBtn.addEventListener('click', clearSearch);
    }

    if (clearHistoryBtn) {
        clearHistoryBtn.addEventListener('click', clearSearchHistory);
    }

    // 搜索建议和历史的点击事件
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

// 执行搜索的核心函数
export function performSearch(targetCategory) {
    const searchInput = document.getElementById('searchInput');
    const keyword = searchInput ? searchInput.value.trim() : '';
    const hasSearch = keyword;

    if (!keyword) {
        clearSearch();
        return;
    }

    // 确定要激活的目标分类：优先使用传入的参数，其次从模块获取，最后使用默认值
    const categoryToActivate = targetCategory || (window.categoryModule && window.categoryModule.getActiveCategory()) || 'theme';
    // 1. 在搜索跳转前，先全局检查是否有任何匹配项
    const allGameItems = document.querySelectorAll('#recommendContent .game-item:not(.no-results)');
    const keywordLower = keyword.toLowerCase();
    let hasGlobalMatch = false;
    let firstMatchCategory = null;

    allGameItems.forEach(item => {
        const searchableText = item.getAttribute('data-searchable');
        if (searchableText && searchableText.toLowerCase().includes(keywordLower)) {
            hasGlobalMatch = true;
            // 记录第一个匹配项的分类，用于后续精准跳转
            if (!firstMatchCategory) {
                firstMatchCategory = item.closest('.category-panel').id.replace('Panel', '');
            }
        }
    });

    // 2. 如果全局无任何匹配，则弹窗提示，不进行任何页面跳转和筛选
    if (!hasGlobalMatch) {
        showNoResultAlert(keyword);
        return;
    }

    // 3. 全局有匹配，继续执行：添加到搜索历史
    addToSearchHistory(keyword);
    updateSearchHistoryDisplay(document.getElementById('historyItems'));

    // 4. 切换到“活动”页面，但不强行跳转到特定分类，保持当前或默认分类
    switchToActivityTab(categoryToActivate);

    // 5. 遍历并筛选所有分类面板
    const allCategoryPanels = document.querySelectorAll('.category-panel');
    let globalMatchCount = 0;

    allCategoryPanels.forEach(panel => {
        const panelGameItems = panel.querySelectorAll('.game-item:not(.no-results)');
        const noResults = panel.querySelector('.no-results');
        let panelMatchCount = 0;

        // 5.1 重置当前面板内所有游戏项的显示和高亮状态
        panelGameItems.forEach(item => {
            item.classList.remove('hidden');
            removeTextHighlight(item);
        });

        // 5.2 根据关键词重新筛选并高亮匹配项
        panelGameItems.forEach(item => {
            const searchableText = item.getAttribute('data-searchable');
            const isMatch = searchableText && searchableText.toLowerCase().includes(keywordLower);

            if (isMatch) {
                panelMatchCount++;
                globalMatchCount++;
                highlightText(item, keyword);
            } else {
                // 不匹配的项立即隐藏
                item.classList.add('hidden');
            }
        });

        // 5.3 更新当前面板的“无结果”提示显示状态
        if (noResults) {
            noResults.style.display = (panelMatchCount === 0) ? 'block' : 'none';
        }
    });

    // 6. 更新全局搜索结果头部信息
    const searchResultsHeader = document.getElementById('searchResultsHeader');
    const searchKeyword = document.getElementById('searchKeyword');
    const resultsCount = document.getElementById('resultsCount');

    if (searchKeyword) searchKeyword.textContent = keyword;
    if (resultsCount) resultsCount.textContent = globalMatchCount;
    if (searchResultsHeader) searchResultsHeader.style.display = 'flex';

    // 7. 隐藏搜索建议框
    const searchSuggestions = document.getElementById('searchSuggestions');
    if (searchSuggestions) searchSuggestions.classList.remove('active');

    // 在全局搜索完成后，强制重新应用当前激活面板的子分类过滤
    if (window.categoryModule && window.categoryModule.applySubFilter) {
        const activePanel = document.querySelector('.category-panel.active');
        if (activePanel) {
            // 短暂延迟，确保DOM更新完成
            setTimeout(() => {
                window.categoryModule.applySubFilter(activePanel);
            }, 10);
        }
    }
}

// 切换到“活动”导航页，并可指定激活的分类
function switchToActivityTab(targetCategory = 'theme') {
    const contentAreas = {
        'notice': document.getElementById('noticeContent'),
        'recommend': document.getElementById('recommendContent'),
        'exchange': document.getElementById('exchangeContent'),
        'mine': document.getElementById('mineContent')
    };
    const navItems = document.querySelectorAll('.nav-bottom-item');

    // 隐藏所有内容区域
    Object.values(contentAreas).forEach(area => {
        if (area) area.style.display = 'none';
    });
    // 显示“活动”内容区域
    if (contentAreas['recommend']) {
        contentAreas['recommend'].style.display = 'block';
    }
    // 更新底部导航激活状态
    navItems.forEach(nav => nav.classList.remove('active'));
    const activityNavItem = document.querySelector('.nav-bottom-item[data-target="recommend"]');
    if (activityNavItem) {
        activityNavItem.classList.add('active');
    }
    // 切换后滚动到顶部
    window.scrollTo(0, 0);

    // 激活指定的分类面板，如果未找到，则激活默认的“主题活动”
    const targetCategoryItem = document.querySelector(`.category-item[data-category="${targetCategory}"]`);
    if (targetCategoryItem) {
        targetCategoryItem.click();
    } else {
        // 回退逻辑：如果传入的分类不存在，则激活默认的“主题活动”
        console.warn(`未找到“${targetCategory}”分类项，将激活默认的“主题活动”。`);
        const themeCategoryItem = document.querySelector('.category-item[data-category="theme"]');
        if (themeCategoryItem) {
            themeCategoryItem.click();
        }
    }
}

// 显示“无搜索结果”弹窗
function showNoResultAlert(keyword) {
    const modal = document.getElementById('noResultModal');
    const keywordSpan = document.getElementById('noResultKeyword');
    const confirmBtn = document.getElementById('noResultConfirm');

    if (!modal || !keywordSpan || !confirmBtn) {
        console.error('弹窗元素未找到，将使用默认alert提示。');
        alert(`没有找到与“${keyword}”相关的游戏，请尝试其他关键词。`);
        return;
    }

    // 设置关键词并显示弹窗
    keywordSpan.textContent = keyword;
    modal.style.display = 'flex';

    // 点击确定按钮，关闭弹窗并清空搜索框
    const closeModal = () => {
        modal.style.display = 'none';
        const searchInput = document.getElementById('searchInput');
        if (searchInput) searchInput.value = '';
        const searchSuggestions = document.getElementById('searchSuggestions');
        if (searchSuggestions) searchSuggestions.classList.remove('active');
    };
    // 绑定事件
    confirmBtn.replaceWith(confirmBtn.cloneNode(true));
    document.getElementById('noResultConfirm').addEventListener('click', closeModal);
    // 点击弹窗背景也可以关闭
    modal.onclick = function (event) {
        if (event.target === modal) {
            closeModal();
        }
    };
}

// 搜索相关的辅助函数
function handleSearchFocus() {
    const searchSuggestions = document.getElementById('searchSuggestions');
    const searchBox = document.getElementById('searchBox');
    if (searchSuggestions) {
        searchSuggestions.classList.add('active');
    }
    if (searchBox) {
        searchBox.classList.add('focused');
    }
}

function handleSearchBlur() {
    setTimeout(() => {
        const searchSuggestions = document.getElementById('searchSuggestions');
        const searchBox = document.getElementById('searchBox');
        if (searchSuggestions && !searchSuggestions.contains(document.activeElement)) {
            searchSuggestions.classList.remove('active');
        }
        if (searchBox) {
            searchBox.classList.remove('focused');
        }
    }, 200);
}

function handleSearchInput() {
    // 可以添加搜索建议的实时更新逻辑
}

function clearSearch() {
    // 在函数内部重新获取当前输入框元素
    const searchInput = document.getElementById('searchInput');
    if (searchInput) searchInput.value = '';

    const searchResultsHeader = document.getElementById('searchResultsHeader');
    if (searchResultsHeader) searchResultsHeader.style.display = 'none';

    // 清除所有分类面板的搜索状态
    const allPanels = document.querySelectorAll('.category-panel');
    allPanels.forEach(panel => {
        const gameItems = panel.querySelectorAll('.game-item:not(.no-results)');
        gameItems.forEach(item => {
            item.classList.remove('hidden');
            removeTextHighlight(item);
        });
        // 重置“无结果”提示的显示状态
        const noResults = panel.querySelector('.no-results');
        if (noResults) {
            // 仅在未激活子分类过滤时显示“无结果”提示
            const hasActiveSubFilter = window.categoryModule && window.categoryModule.getActiveSubFilter();
            const visibleCount = panel.querySelectorAll('.game-item:not(.hidden):not(.no-results)').length;
            noResults.style.display = (!hasActiveSubFilter && visibleCount === 0) ? 'block' : 'none';
        }
    });

    const searchSuggestions = document.getElementById('searchSuggestions');
    if (searchSuggestions) searchSuggestions.classList.remove('active');

    const categoryContent = document.querySelector('.category-content');
    if (categoryContent) {
        categoryContent.style.paddingBottom = '';
    }

    // 在清除所有状态后，重新应用一次子分类过滤，让界面恢复正常浏览状态
    if (window.categoryModule && window.categoryModule.applySubFilter) {
        const activePanel = document.querySelector('.category-panel.active');
        if (activePanel) {
            window.categoryModule.applySubFilter(activePanel);
        }
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
    // 只针对游戏标题和描述进行高亮
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

// 暴露搜索功能给其他模块
window.searchModule = {
    performSearchIfActive: function (targetCategory) {
        const searchInput = document.getElementById('searchInput');
        if (searchInput && searchInput.value.trim()) {
            // 调用 performSearch 并传递目标分类
            performSearch(targetCategory);
        }
    },
    performSearch: performSearch,
    clearSearch: clearSearch
};