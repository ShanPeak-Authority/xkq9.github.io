let activeCategory = 'Guan-Fu';
let activeSubFilter = null;

export function initializeCategory() {
    const categoryItems = document.querySelectorAll('.category-item');
    const categoryPanels = document.querySelectorAll('.category-panel');

    const activateCategory = (clickedItem) => {
        const category = clickedItem.dataset.category;
        const targetPanel = document.getElementById(category + 'Panel');

        categoryItems.forEach(cat => cat.classList.remove('active'));
        clickedItem.classList.add('active');
        categoryPanels.forEach(panel => panel.classList.remove('active'));
        targetPanel?.classList.add('active');

        const contentContainer = document.querySelector('.category-content');
        if (contentContainer) {
            contentContainer.scrollTop = 0;
        }

        activeCategory = category;
        activeSubFilter = targetPanel?.querySelector('.sub-tag.active')?.dataset.subfilter || null;
        applySubFilter(targetPanel);
    };

    categoryItems.forEach(item => item.addEventListener('click', () => activateCategory(item)));
    categoryItems[0]?.click();

    document.addEventListener('click', (e) => {
        if (e.target.classList.contains('sub-tag')) {
            const panel = e.target.closest('.category-panel');
            panel?.querySelectorAll('.sub-tag').forEach(tag => tag.classList.remove('active'));
            e.target.classList.add('active');
            activeSubFilter = e.target.dataset.subfilter;
            applySubFilter(panel);
        }
    });
}

function applySubFilter(panel) {
    if (!panel) return;
    const keyword = document.getElementById('searchInput')?.value.trim().toLowerCase() || '';
    const hasSearch = keyword.length > 0;
    let visibleCount = 0;

    panel.querySelectorAll('.game-item:not(.no-results)').forEach(item => {
        const subMismatch = activeSubFilter && item.dataset.subfilter !== activeSubFilter;
        const searchMismatch = hasSearch && !item.dataset.searchable?.toLowerCase().includes(keyword);
        const shouldHide = subMismatch || searchMismatch;
        item.classList.toggle('hidden', shouldHide);
        if (!shouldHide) visibleCount++;
    });

    const noResults = panel.querySelector('.no-results');
    noResults && (noResults.style.display = visibleCount === 0 ? 'block' : 'none');
}

export { activeCategory, activeSubFilter, applySubFilter };