let userData = [];
let isDataLoaded = false;

// 存储当前登录的QQ号
let currentUserQQ = localStorage.getItem('currentUserQQ') || '';

// 从HTML文件加载用户数据
async function loadUserDataFromHTML() {
    try {
        const response = await fetch('/res/userdata/userdata.html');
        if (!response.ok) {
            throw new Error(`HTTP错误: ${response.status}`);
        }

        const htmlText = await response.text();

        // 使用DOMParser解析HTML
        const parser = new DOMParser();
        const doc = parser.parseFromString(htmlText, 'text/html');

        // 提取表格数据
        const rows = doc.querySelectorAll('table tr');
        userData = [];

        // 跳过表头行（第一行）
        for (let i = 1; i < rows.length; i++) {
            const cells = rows[i].querySelectorAll('td');
            if (cells.length >= 5) {
                const user = {
                    name: cells[0].textContent.trim(),
                    qq: cells[1].textContent.trim(),
                    copper: parseCellValue(cells[2].textContent),
                    gold: parseCellValue(cells[3].textContent),
                    diamond: parseCellValue(cells[4].textContent)
                };
                userData.push(user);
            }
        }

        console.log(`成功加载 ${userData.length} 条用户数据`);
        isDataLoaded = true;
        return true;
    } catch (error) {
        console.error('加载用户数据失败:', error);
        // 可以在这里添加备用数据或错误处理
        isDataLoaded = false;
        return false;
    }
}

// 解析单元格值，处理"-"和空值
function parseCellValue(value) {
    const strValue = String(value).trim();
    if (strValue === '' || strValue === '-' || strValue === '0') {
        return 0;
    }

    // 尝试转换为数字
    const numValue = parseFloat(strValue);
    return isNaN(numValue) ? 0 : numValue;
}

// 初始化我的页面
export async function initializeMinePage() {
    const loginBtn = document.getElementById('loginBtn');
    const logoutBtn = document.getElementById('logoutBtn');
    const qqInput = document.getElementById('qqInput');
    const avatarPreview = document.getElementById('avatarPreview');

    // 先加载用户数据
    const loadingElement = document.createElement('div');
    loadingElement.className = 'loading-message';
    loadingElement.textContent = '正在加载用户数据...';
    loadingElement.style.cssText = 'text-align:center;color:#666;padding:20px;';

    const loginContainer = document.getElementById('loginContainer');
    if (loginContainer) {
        loginContainer.style.opacity = '0.5';
        loginContainer.appendChild(loadingElement);
    }

    try {
        await loadUserDataFromHTML();
    } finally {
        if (loginContainer) {
            loginContainer.style.opacity = '1';
            loadingElement.remove();
        }
    }

    if (loginBtn) {
        loginBtn.addEventListener('click', handleLogin);
    }

    if (logoutBtn) {
        logoutBtn.addEventListener('click', handleLogout);
    }

    if (qqInput) {
        // 删除头像预览功能，不再监听输入变化
        qqInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                handleLogin();
            }
        });

        // 从localStorage恢复上次登录的QQ号
        if (currentUserQQ) {
            qqInput.value = currentUserQQ;
        }
    }

    // 页面加载时检查登录状态
    checkLoginStatus();
}

// 检查登录状态
function checkLoginStatus() {
    if (currentUserQQ && isDataLoaded) {
        const user = findUserByQQ(currentUserQQ);
        if (user) {
            showUserData(user);
        } else {
            // 如果用户数据不存在，创建临时用户
            createAndShowGuestUser(currentUserQQ);
        }
    } else {
        showLoginForm();
    }
}

// 创建并显示游客用户
function createAndShowGuestUser(qq) {
    // 创建临时游客用户
    const guestUser = {
        name: `用户${qq}`,  // 直接显示"用户+QQ号"
        qq: qq,
        copper: 0,
        gold: 0,
        diamond: 0,
        isTempUser: true
    };

    // 显示用户数据
    showUserData(guestUser);
}

// 处理登录
async function handleLogin() {
    if (!isDataLoaded) {
        // 如果数据未加载，先尝试加载
        const loaded = await loadUserDataFromHTML();
        if (!loaded) {
            const errorMessage = document.getElementById('qqError');
            if (errorMessage) {
                errorMessage.textContent = '用户数据加载失败，请刷新页面重试';
            }
            return;
        }
    }

    const qqInput = document.getElementById('qqInput');
    const errorMessage = document.getElementById('qqError');
    const qq = qqInput.value.trim();

    // 验证输入
    if (!qq) {
        errorMessage.textContent = '请输入QQ号';
        return;
    }

    if (!/^\d{5,12}$/.test(qq)) {
        errorMessage.textContent = '请输入有效的QQ号（5-12位数字）';
        return;
    }

    errorMessage.textContent = '';

    // 查找用户
    let user = findUserByQQ(qq);

    // 支持游客登录：用户不存在时创建临时游客用户
    if (!user) {
        // 用户不存在，创建临时游客用户
        user = {
            name: `用户${qq}`,
            qq: qq,
            copper: 0,
            gold: 0,
            diamond: 0,
            isTempUser: true
        };
    }

    // 保存登录状态（无论是正式用户还是游客）
    currentUserQQ = qq;
    localStorage.setItem('currentUserQQ', qq);

    // 显示用户数据
    showUserData(user);
}

// 处理退出登录
function handleLogout() {
    // 清除登录状态
    currentUserQQ = '';
    localStorage.removeItem('currentUserQQ');

    // 显示登录表单
    showLoginForm();
}

// 根据QQ号查找用户
function findUserByQQ(qq) {
    return userData.find(user => user.qq === qq) || null;
}

// 显示登录表单
function showLoginForm() {
    const loginContainer = document.getElementById('loginContainer');
    const userContainer = document.getElementById('userContainer');
    const qqInput = document.getElementById('qqInput');
    const errorMessage = document.getElementById('qqError');

    if (loginContainer && userContainer) {
        loginContainer.style.display = 'block';
        userContainer.style.display = 'none';

        // 清空输入框和错误信息
        if (qqInput) {
            qqInput.value = '';
        }

        if (errorMessage) {
            errorMessage.textContent = '';
        }
    }
}

// 显示用户数据
function showUserData(user) {
    const loginContainer = document.getElementById('loginContainer');
    const userContainer = document.getElementById('userContainer');
    const avatarElement = document.getElementById('userAvatar');

    if (loginContainer && userContainer) {
        loginContainer.style.display = 'none';
        userContainer.style.display = 'block';

        // 更新用户信息
        document.getElementById('userName').textContent = user.name;
        document.getElementById('userQQ').textContent = `QQ: ${user.qq}`;
        document.getElementById('copperValue').textContent = formatNumber(user.copper);
        document.getElementById('goldValue').textContent = formatNumber(user.gold);
        document.getElementById('diamondValue').textContent = formatNumber(user.diamond);

        // 设置QQ头像
        if (avatarElement) {
            const avatarUrl = `https://q1.qlogo.cn/g?b=qq&nk=${user.qq}&s=3`;
            avatarElement.src = avatarUrl;
            avatarElement.alt = `${user.name}的头像`;
            avatarElement.onerror = function () {
                this.src = '/res/default-avatar.png';
                this.onerror = null;
            };
        }

        // 设置更新时间
        const now = new Date();
        document.getElementById('lastUpdateTime').textContent =
            `${now.getFullYear()}-${(now.getMonth() + 1).toString().padStart(2, '0')}-${now.getDate().toString().padStart(2, '0')} ${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;

        // 显示排行榜
        showAllRankings(user.qq);

        // 初始化标签页切换功能
        initRankingTabs();
    }
}

// 显示所有排行榜
function showAllRankings(currentUserQQ) {
    showCopperRanking(currentUserQQ);
    showGoldRanking(currentUserQQ);
    showDiamondRanking(currentUserQQ);
}

// 显示铜钱排行榜
function showCopperRanking(currentUserQQ) {
    const rankingContainer = document.getElementById('copperRankingContent');
    if (!rankingContainer) return;

    // 筛选出铜钱大于0的用户
    const qualifiedUsers = userData.filter(user => user.copper > 0);

    if (qualifiedUsers.length === 0) {
        rankingContainer.innerHTML = '<div class="no-ranking-data">暂无铜钱数据</div>';
        return;
    }

    // 按铜钱数量从高到低排序
    qualifiedUsers.sort((a, b) => b.copper - a.copper);

    // 生成排行榜HTML
    let rankingHTML = `<div class="ranking-list">`;

    qualifiedUsers.forEach((user, index) => {
        const rank = index + 1;
        const isCurrentUser = user.qq === currentUserQQ;
        const rankClass = getRankClass(rank);
        const userClass = isCurrentUser ? 'current-user' : '';

        rankingHTML += `
            <div class="ranking-item ${userClass}">
                <div class="rank-badge ${rankClass}">${rank}</div>
                <div class="user-avatar-small">
                    <img src="https://q1.qlogo.cn/g?b=qq&nk=${user.qq}&s=2" alt="${user.name}的头像" onerror="this.src='/res/default-avatar.png'">
                </div>
                <div class="user-info-small">
                    <div class="user-name-small">${user.name}</div>
                    <div class="user-qq-small">QQ: ${user.qq}</div>
                </div>
                <div class="copper-amount ${isCurrentUser ? 'text-bronze' : ''}">
                    ${formatNumber(user.copper)}
                </div>
            </div>
        `;
    });

    rankingHTML += `</div>`;
    rankingContainer.innerHTML = rankingHTML;
}

// 显示黄金排行榜
function showGoldRanking(currentUserQQ) {
    const rankingContainer = document.getElementById('goldRankingContent');
    if (!rankingContainer) return;

    // 筛选出黄金大于0的用户
    const qualifiedUsers = userData.filter(user => user.gold > 0);

    if (qualifiedUsers.length === 0) {
        rankingContainer.innerHTML = '<div class="no-ranking-data">暂无黄金数据</div>';
        return;
    }

    // 按黄金数量从高到低排序
    qualifiedUsers.sort((a, b) => b.gold - a.gold);

    // 生成排行榜HTML
    let rankingHTML = `<div class="ranking-list">`;

    qualifiedUsers.forEach((user, index) => {
        const rank = index + 1;
        const isCurrentUser = user.qq === currentUserQQ;
        const rankClass = getRankClass(rank);
        const userClass = isCurrentUser ? 'current-user' : '';

        rankingHTML += `
            <div class="ranking-item ${userClass}">
                <div class="rank-badge ${rankClass}">${rank}</div>
                <div class="user-avatar-small">
                    <img src="https://q1.qlogo.cn/g?b=qq&nk=${user.qq}&s=2" alt="${user.name}的头像" onerror="this.src='/res/default-avatar.png'">
                </div>
                <div class="user-info-small">
                    <div class="user-name-small">${user.name}</div>
                    <div class="user-qq-small">QQ: ${user.qq}</div>
                </div>
                <div class="gold-amount ${isCurrentUser ? 'text-gold' : ''}">
                    ${formatNumber(user.gold)}
                </div>
            </div>
        `;
    });

    rankingHTML += `</div>`;
    rankingContainer.innerHTML = rankingHTML;
}

// 显示钻石排行榜
function showDiamondRanking(currentUserQQ) {
    const rankingContainer = document.getElementById('diamondRankingContent');
    if (!rankingContainer) return;

    // 筛选出钻石大于0的用户
    const qualifiedUsers = userData.filter(user => user.diamond > 0);

    if (qualifiedUsers.length === 0) {
        rankingContainer.innerHTML = '<div class="no-ranking-data">暂无钻石数据</div>';
        return;
    }

    // 按钻石数量从高到低排序
    qualifiedUsers.sort((a, b) => b.diamond - a.diamond);

    // 生成排行榜HTML
    let rankingHTML = `<div class="ranking-list">`;

    qualifiedUsers.forEach((user, index) => {
        const rank = index + 1;
        const isCurrentUser = user.qq === currentUserQQ;
        const rankClass = getRankClass(rank);
        const userClass = isCurrentUser ? 'current-user' : '';

        rankingHTML += `
            <div class="ranking-item ${userClass}">
                <div class="rank-badge ${rankClass}">${rank}</div>
                <div class="user-avatar-small">
                    <img src="https://q1.qlogo.cn/g?b=qq&nk=${user.qq}&s=2" alt="${user.name}的头像" onerror="this.src='/res/default-avatar.png'">
                </div>
                <div class="user-info-small">
                    <div class="user-name-small">${user.name}</div>
                    <div class="user-qq-small">QQ: ${user.qq}</div>
                </div>
                <div class="diamond-amount ${isCurrentUser ? 'text-diamond' : ''}">
                    ${formatNumber(user.diamond)}
                </div>
            </div>
        `;
    });

    rankingHTML += `</div>`;
    rankingContainer.innerHTML = rankingHTML;
}

// 初始化标签页切换功能
function initRankingTabs() {
    const tabButtons = document.querySelectorAll('.ranking-tab-btn');
    const tabContents = document.querySelectorAll('.ranking-tab-content');

    tabButtons.forEach(button => {
        button.addEventListener('click', () => {
            const tabId = button.getAttribute('data-tab');

            // 移除所有按钮的active类
            tabButtons.forEach(btn => btn.classList.remove('active'));
            // 隐藏所有内容
            tabContents.forEach(content => content.classList.remove('active'));

            // 添加当前按钮的active类
            button.classList.add('active');
            // 显示对应的内容
            const activeContent = document.getElementById(tabId);
            if (activeContent) {
                activeContent.classList.add('active');
            }
        });
    });
}

// 获取排名样式类
function getRankClass(rank) {
    if (rank === 1) return 'rank-1';
    if (rank === 2) return 'rank-2';
    if (rank === 3) return 'rank-3';
    return 'rank-other';
}

// 格式化数字显示（添加万分位分隔符）
function formatNumber(num) {
    // 将数字转换为字符串
    let strNum = num.toString();

    // 分割整数部分和小数部分
    let parts = strNum.split('.');
    let integerPart = parts[0];
    let decimalPart = parts.length > 1 ? '.' + parts[1] : '';

    // 对整数部分添加万分位分隔符
    // 从右向左每4位添加一个逗号
    let formattedInteger = '';
    let count = 0;

    for (let i = integerPart.length - 1; i >= 0; i--) {
        formattedInteger = integerPart[i] + formattedInteger;
        count++;

        // 每4位添加一个逗号，但不要在开头添加
        if (count % 4 === 0 && i > 0) {
            formattedInteger = ',' + formattedInteger;
        }
    }

    // 返回格式化后的数字
    return formattedInteger + decimalPart;
}