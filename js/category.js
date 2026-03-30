let activeCategory = 'theme';
let activeSubFilter = null;

export function initializeCategory() {
    const categoryItems = document.querySelectorAll('.category-item');
    const categoryPanels = document.querySelectorAll('.category-panel');

    // 1. 为每个主分类项绑定点击事件
    categoryItems.forEach(item => {
        item.addEventListener('click', function () {
            // 调用激活函数，传入被点击的元素和所有面板
            activateCategory(this, categoryPanels);
        });
    });

    // 初始激活第一个分类
    if (categoryItems.length > 0) {
        activateCategory(categoryItems[0], categoryPanels);
    }

    // 2. 子分类标签点击事件
    document.addEventListener('click', function (e) {
        if (e.target.classList.contains('sub-tag')) {
            const subFilter = e.target.getAttribute('data-subfilter');
            const panel = e.target.closest('.category-panel');
            const subTags = panel.querySelectorAll('.sub-tag');

            subTags.forEach(tag => tag.classList.remove('active'));
            e.target.classList.add('active');

            activeSubFilter = subFilter;
            // 不再调用 performSearchIfActive，仅应用过滤
            applySubFilter(panel);
        }
    });
}

function activateCategory(clickedItem, allPanels) {
    const category = clickedItem.getAttribute('data-category');

    // 更新主分类UI
    document.querySelectorAll('.category-item').forEach(cat => cat.classList.remove('active'));
    clickedItem.classList.add('active');
    allPanels.forEach(panel => panel.classList.remove('active'));
    const targetPanel = document.getElementById(category + 'Panel');
    if (targetPanel) targetPanel.classList.add('active');

    // 更新状态
    activeCategory = category;
    activeSubFilter = null;

    // 重置并激活新面板的第一个子标签
    document.querySelectorAll('.sub-tag').forEach(tag => tag.classList.remove('active'));
    if (targetPanel) {
        const firstSubTag = targetPanel.querySelector('.sub-tag');
        if (firstSubTag) {
            firstSubTag.classList.add('active');
            activeSubFilter = firstSubTag.getAttribute('data-subfilter');
        }
    }

    // 应用过滤（此时applySubFilter会检查当前的搜索输入框，并应用过滤）
    applySubFilter(targetPanel);
}

function applySubFilter(panel) {
    if (!panel) return;
    // 从当前面板获取游戏项
    const gameItems = panel.querySelectorAll('.game-item:not(.no-results)');
    const noResults = panel.querySelector('.no-results');
    const searchInput = document.getElementById('searchInput');
    const hasSearch = searchInput ? searchInput.value.trim() : '';

    let visibleCount = 0;

    gameItems.forEach(item => {
        const itemSubFilter = item.getAttribute('data-subfilter');
        let shouldHide = false;

        // 条件A：子分类不匹配则应隐藏
        const subFilterMismatch = activeSubFilter && itemSubFilter && itemSubFilter !== activeSubFilter;

        // 条件B：如果存在活跃搜索，则检查是否匹配搜索词
        let searchMismatch = false;
        if (hasSearch) {
            const searchableText = item.getAttribute('data-searchable');
            const keyword = hasSearch.toLowerCase();
            searchMismatch = !(searchableText && searchableText.toLowerCase().includes(keyword));
        }

        // 决定是否隐藏：只要满足“子分类不匹配”或“搜索不匹配”中的任何一个，就应隐藏
        shouldHide = subFilterMismatch || searchMismatch;

        item.classList.toggle('hidden', shouldHide);

        // 如果当前项是可见的，则计数+1
        if (!shouldHide) {
            visibleCount++;
        }
    });

    // 显示/隐藏“无结果”提示
    if (noResults) {
        noResults.style.display = (visibleCount === 0) ? 'block' : 'none';
    }
}

// 暴露状态给其他模块
window.categoryModule = {
    getActiveCategory: () => activeCategory,
    getActiveSubFilter: () => activeSubFilter,
    applySubFilter: applySubFilter
};