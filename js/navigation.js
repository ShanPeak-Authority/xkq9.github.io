export function initializeNavigation() {
    const areas = ['notice', 'recommend', 'exchange', 'mine'].reduce((obj, id) => {
        obj[id] = document.getElementById(id + 'Content');
        return obj;
    }, {});
    const navItems = document.querySelectorAll('.nav-bottom-item');

    navItems.forEach(item => item.addEventListener('click', function () {
        const target = this.dataset.target;
        navItems.forEach(nav => nav.classList.remove('active'));
        this.classList.add('active');
        Object.values(areas).forEach(el => el && (el.style.display = 'none'));
        areas[target] && (areas[target].style.display = 'block');
        window.scrollTo(0, 0);
    }));
}