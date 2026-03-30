// navigation.js 底部导航切换模块
// category.js   活动：分类和子分类切换模块
// search.js     搜索模块
// sort.js       表格：排序模块
import { initializeNavigation } from './navigation.js';
import { initializeCategory } from './category.js';
import { initializeSearch } from './search.js';
import { initializeSort } from './sort.js';

// 在 main.js 的 DOMContentLoaded 事件监听器中，于其他初始化函数之后添加
document.addEventListener('DOMContentLoaded', function () {
    console.log('小氪奇9群福利中心初始化...');

    // 初始化各功能模块
    initializeNavigation();
    initializeCategory();
    initializeSearch();
    initializeSort();

    // 游戏项点击跳转功能
    initializeGameItemClick();

    // 设置默认显示公告区域
    const defaultContent = document.getElementById('noticeContent');
    if (defaultContent) {
        defaultContent.style.display = 'block';
    }

    // 根据时间动态更新问候语
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
        // 更新页面上的文本内容
        greetingElement.textContent = greeting;
    }
});

// 游戏列表点击跳转
function initializeGameItemClick() {
    // 事件委托：监听整个"活动"内容区域的点击事件
    const recommendContent = document.getElementById('recommendContent');
    if (!recommendContent) {
        console.error('未找到"活动"内容区域，游戏点击功能初始化失败。');
        return;
    }

    recommendContent.addEventListener('click', function (event) {
        // 1. 找到被点击的游戏项元素
        const gameItem = event.target.closest('.game-item');
        if (!gameItem) {
            return;
        }

        // 2. 检查 data-searchable 属性
        const searchableValue = gameItem.getAttribute('data-searchable');
        if (searchableValue === 'NoActivity') {
            console.log('此游戏暂无活动，不进行跳转。');
            return;
        }

        // 3. 从游戏项的图片中提取路径并构建目标HTML文件路径
        const gameImg = gameItem.querySelector('.game-img');
        if (!gameImg || !gameImg.src) {
            console.error('未找到游戏图片，无法生成跳转链接。');
            return;
        }

        // 获取图片的完整路径
        const imgSrc = gameImg.src;
        // 将.png/.gif扩展名替换为.html
        const targetHtmlPath = imgSrc.replace(/\.(png|gif)$/i, '.html');

        if (imgSrc === targetHtmlPath) {
            console.error('图片路径不包含.png/.gif扩展名，无法生成跳转链接。', imgSrc);
            return;
        }

        // 4. 构建并跳转到目标URL
        console.log(`即将跳转到: ${targetHtmlPath}`);
        window.location.href = targetHtmlPath;
    });
}