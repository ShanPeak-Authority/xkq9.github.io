// navigation.js 底部导航切换模块
// category.js   活动：分类和子分类切换模块
// search.js     搜索模块
// sort.js       表格：排序模块
import { initializeNavigation } from './navigation.js';
import { initializeCategory, activeCategory, activeSubFilter, applySubFilter } from './category.js';
import { initializeSearch } from './search.js';
import { initializeSort } from './sort.js';

document.addEventListener('DOMContentLoaded', () => {
    initializeNavigation();
    initializeCategory();
    initializeSearch();
    initializeSort();

    // 设置默认显示页面
    document.getElementById('recommendContent').style.display = 'block';

    // 设置时间问候语
    const greetings = [
        [23, 4, '夜深了，该休息了~'],
        [4, 6, 'Hi，今天起得真早！'],
        [6, 11, 'Hi，早上好！'],
        [11, 14, 'Hi，中午好！'],
        [14, 17, 'Hi，下午好！'],
        [17, 23, 'Hi，晚上好！']
    ];
    const hour = new Date().getHours();
    const greeting = greetings.find(([start, end]) => hour >= start && hour < end)?.[2] || '欢迎回来！';
    document.querySelector('#noticeContent .section-title').textContent = greeting;

    // 游戏项点击事件
    document.getElementById('recommendContent')?.addEventListener('click', (e) => {
        const gameItem = e.target.closest('.game-item');
        if (!gameItem || gameItem.dataset.searchable === 'NoActivity') return;
        const imgSrc = gameItem.querySelector('.game-img')?.src;
        const targetPath = imgSrc?.replace(/\.(png|gif)$/i, '.html');
        targetPath && imgSrc !== targetPath && (window.location.href = targetPath);
    });
    
    window.categoryModule = { activeCategory, activeSubFilter, applySubFilter };
});