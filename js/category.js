let activeCategory = 'theme';
let activeSubFilter = null;

export function initializeCategory() {
    const categoryItems = document.querySelectorAll('.category-item');
    const categoryPanels = document.querySelectorAll('.category-panel');

    categoryItems.forEach(item => {
        item.addEventListener('click', function () {
            activateCategory(this, categoryPanels);
        });
    });

    if (categoryItems.length > 0) {
        activateCategory(categoryItems[0], categoryPanels);
    }

    document.addEventListener('click', function (e) {
        if (e.target.classList.contains('sub-tag')) {
            const subFilter = e.target.getAttribute('data-subfilter');
            const panel = e.target.closest('.category-panel');
            const subTags = panel.querySelectorAll('.sub-tag');

            subTags.forEach(tag => tag.classList.remove('active'));
            e.target.classList.add('active');

            activeSubFilter = subFilter;
            applySubFilter(panel);
        }
    });
}

function activateCategory(clickedItem, allPanels) {
    const category = clickedItem.getAttribute('data-category');

    document.querySelectorAll('.category-item').forEach(cat => cat.classList.remove('active'));
    clickedItem.classList.add('active');
    allPanels.forEach(panel => panel.classList.remove('active'));
    const targetPanel = document.getElementById(category + 'Panel');
    if (targetPanel) targetPanel.classList.add('active');

    activeCategory = category;
    activeSubFilter = null;

    document.querySelectorAll('.sub-tag').forEach(tag => tag.classList.remove('active'));
    if (targetPanel) {
        const firstSubTag = targetPanel.querySelector('.sub-tag');
        if (firstSubTag) {
            firstSubTag.classList.add('active');
            activeSubFilter = firstSubTag.getAttribute('data-subfilter');
        }
    }

    applySubFilter(targetPanel);
}

function applySubFilter(panel) {
    if (!panel) return;
    const gameItems = panel.querySelectorAll('.game-item:not(.no-results)');
    const noResults = panel.querySelector('.no-results');
    const searchInput = document.getElementById('searchInput');
    const hasSearch = searchInput ? searchInput.value.trim() : '';

    let visibleCount = 0;

    gameItems.forEach(item => {
        const itemSubFilter = item.getAttribute('data-subfilter');
        let shouldHide = false;

        const subFilterMismatch = activeSubFilter && itemSubFilter && itemSubFilter !== activeSubFilter;
        let searchMismatch = false;
        if (hasSearch) {
            const searchableText = item.getAttribute('data-searchable');
            const keyword = hasSearch.toLowerCase();
            searchMismatch = !(searchableText && searchableText.toLowerCase().includes(keyword));
        }

        shouldHide = subFilterMismatch || searchMismatch;
        item.classList.toggle('hidden', shouldHide);

        if (!shouldHide) {
            visibleCount++;
        }
    });

    if (noResults) {
        noResults.style.display = (visibleCount === 0) ? 'block' : 'none';
    }
}

window.categoryModule = {
    getActiveCategory: () => activeCategory,
    getActiveSubFilter: () => activeSubFilter,
    applySubFilter: applySubFilter
};