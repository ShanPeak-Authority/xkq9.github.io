export function initializeNavigation() {
    const contentAreas = {
        'notice': document.getElementById('noticeContent'),
        'recommend': document.getElementById('recommendContent'),
        'exchange': document.getElementById('exchangeContent'),
        'mine': document.getElementById('mineContent')
    };

    const navItems = document.querySelectorAll('.nav-bottom-item');

    const showContent = (target) => {
        // 隐藏所有内容区域
        Object.values(contentAreas).forEach(area => {
            if (area) area.style.display = 'none';
        });
        // 显示目标内容区域
        if (contentAreas[target]) {
            contentAreas[target].style.display = 'block';
        }
        // 切换后立即滚动到顶部
        window.scrollTo(0, 0);
    };

    navItems.forEach(item => {
        item.addEventListener('click', function () {
            const target = this.getAttribute('data-target');
            // 更新导航激活状态
            navItems.forEach(nav => nav.classList.remove('active'));
            this.classList.add('active');
            // 显示对应内容
            showContent(target);
        });
    });
}