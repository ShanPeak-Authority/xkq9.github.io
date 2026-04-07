// 检测元素是否需要滚动条
export function checkScrollbar(element) {
    if (!element) return false;

    const hasScrollbar = element.scrollWidth > element.clientWidth;

    if (hasScrollbar) {
        element.classList.add('has-scrollbar');
    } else {
        element.classList.remove('has-scrollbar');
    }

    return hasScrollbar;
}

// 初始化滚动条检测
export function setupScrollbarDetection() {
    const subTabsContainers = document.querySelectorAll('.sub-tabs-container');

    // 初始检测
    subTabsContainers.forEach(container => {
        checkScrollbar(container);
    });

    // 监听窗口大小变化
    let resizeTimer;
    window.addEventListener('resize', () => {
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(() => {
            subTabsContainers.forEach(container => {
                checkScrollbar(container);
            });
        }, 250);
    });

    // 监听内容变化（如果内容是动态加载的）
    const observer = new MutationObserver(() => {
        subTabsContainers.forEach(container => {
            checkScrollbar(container);
        });
    });

    subTabsContainers.forEach(container => {
        observer.observe(container, {
            childList: true,
            subtree: true
        });
    });
}