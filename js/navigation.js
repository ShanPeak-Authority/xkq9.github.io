export function initializeNavigation() {
    const contentAreas = {
        'notice': document.getElementById('noticeContent'),
        'recommend': document.getElementById('recommendContent'),
        'exchange': document.getElementById('exchangeContent'),
        'mine': document.getElementById('mineContent')
    };

    const navItems = document.querySelectorAll('.nav-bottom-item');

    const showContent = (target) => {
        Object.values(contentAreas).forEach(area => {
            if (area) area.style.display = 'none';
        });
        if (contentAreas[target]) {
            contentAreas[target].style.display = 'block';
        }
        window.scrollTo(0, 0);
    };

    navItems.forEach(item => {
        item.addEventListener('click', function () {
            const target = this.getAttribute('data-target');
            navItems.forEach(nav => nav.classList.remove('active'));
            this.classList.add('active');
            showContent(target);
        });
    });
}