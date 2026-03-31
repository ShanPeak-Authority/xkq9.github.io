// navigation.js 底部导航切换模块
// category.js   活动：分类和子分类切换模块
// search.js     搜索模块
// sort.js       表格：排序模块
import { initializeNavigation } from './navigation.js';
import { initializeCategory } from './category.js';
import { initializeSearch } from './search.js';
import { initializeSort } from './sort.js';

document.addEventListener('DOMContentLoaded', function () {
    initializeNavigation();
    initializeCategory();
    initializeSearch();
    initializeSort();
    initializeGameItemClick();

    const defaultContent = document.getElementById('recommendContent');
    if (defaultContent) {
        defaultContent.style.display = 'block';
    }

    const greetingElement = document.querySelector('#noticeContent .section-title');
    if (greetingElement) {
        const hour = new Date().getHours();
        let greeting = '夜深了，该休息了~';
        if (hour >= 4 && hour < 6) {
            greeting = 'Hi，今天起得真早！';
        } else if (hour >= 6 && hour < 11) {
            greeting = 'Hi，早上好！';
        } else if (hour >= 11 && hour < 14) {
            greeting = 'Hi，中午好！';
        } else if (hour >= 14 && hour < 17) {
            greeting = 'Hi，下午好！';
        } else if (hour >= 17 && hour < 23) {
            greeting = 'Hi，晚上好！';
        }
        greetingElement.textContent = greeting;
    }
});

function initializeGameItemClick() {
    const recommendContent = document.getElementById('recommendContent');
    if (!recommendContent) return;

    recommendContent.addEventListener('click', function (event) {
        const gameItem = event.target.closest('.game-item');
        if (!gameItem) return;

        const searchableValue = gameItem.getAttribute('data-searchable');
        if (searchableValue === 'NoActivity') return;

        const gameImg = gameItem.querySelector('.game-img');
        if (!gameImg || !gameImg.src) return;

        const imgSrc = gameImg.src;
        const targetHtmlPath = imgSrc.replace(/\.(png|gif)$/i, '.html');

        if (imgSrc === targetHtmlPath) return;

        window.location.href = targetHtmlPath;
    });
}