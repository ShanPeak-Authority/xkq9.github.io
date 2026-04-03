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
            name: `用户${qq}`,  // 直接显示"用户+QQ号"
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
        // 如果userdata里有用户名称则显示用户名称，无用户名称则显示"用户+登录的QQ号"
        // 注意：临时用户的name已经是"用户+QQ号"，正式用户使用表格中的name
        document.getElementById('userName').textContent = user.name;
        document.getElementById('userQQ').textContent = `QQ：${user.qq}`;
        document.getElementById('copperValue').textContent = formatNumber(user.copper);
        document.getElementById('goldValue').textContent = formatNumber(user.gold);
        document.getElementById('diamondValue').textContent = formatNumber(user.diamond);

        // 设置QQ头像（仅在登录成功后展示）
        if (avatarElement) {
            // 使用QQ官方头像接口
            const avatarUrl = `https://q1.qlogo.cn/g?b=qq&nk=${user.qq}&s=3`;
            avatarElement.src = avatarUrl;
            avatarElement.alt = `${user.name}的头像`;
            avatarElement.onerror = function () {
                // 如果头像加载失败，使用默认头像
                this.src = '/res/default-avatar.png';
                this.onerror = null; // 防止循环错误
            };
        }

        // 设置更新时间
        const now = new Date();
        document.getElementById('lastUpdateTime').textContent =
            `${now.getFullYear()}-${(now.getMonth() + 1).toString().padStart(2, '0')}-${now.getDate().toString().padStart(2, '0')} ${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;

        // 创建排行榜区域
        createRankingSection(userContainer);
    }
}

// 格式化数字显示（添加万分位）
function formatNumber(num) {
    return num.toString().replace(/\B(?=(\d{4})+(?!\d))/g, ',');
}

// 在用户数据区域下创建排行榜模块
function createRankingSection(userContainer) {
    // 检查是否已存在排行榜，如果存在则先移除（防止重复添加）
    const existingRanking = document.getElementById('rankingContainer');
    if (existingRanking) {
        existingRanking.remove();
    }

    // 创建排行榜主容器
    const rankingContainer = document.createElement('div');
    rankingContainer.id = 'rankingContainer';
    rankingContainer.className = 'ranking-container';

    // 创建排行榜标题
    const rankingTitle = document.createElement('div');
    rankingTitle.className = 'ranking-title';
    rankingTitle.textContent = '排行榜';
    rankingContainer.appendChild(rankingTitle);

    // 创建切换按钮容器
    const rankingTabs = document.createElement('div');
    rankingTabs.className = 'ranking-tabs';
    rankingContainer.appendChild(rankingTabs);

    // 定义货币类型
    const currencyTypes = [
        { type: 'copper', name: '铜钱', colorClass: 'bronze' },
        { type: 'gold', name: '黄金', colorClass: 'gold' },
        { type: 'diamond', name: '钻石', colorClass: 'diamond' }
    ];

    // 创建切换按钮
    currencyTypes.forEach((currency, index) => {
        const tab = document.createElement('div');
        tab.className = `ranking-tab ${index === 0 ? 'active' : ''}`; // 默认激活第一个
        tab.dataset.type = currency.type;
        tab.dataset.colorClass = currency.colorClass;
        tab.textContent = currency.name;
        rankingTabs.appendChild(tab);
    });

    // 创建排行榜表格容器
    const rankingTableContainer = document.createElement('div');
    rankingTableContainer.className = 'ranking-table-container';
    rankingContainer.appendChild(rankingTableContainer);

    // 将排行榜容器添加到用户信息卡片之后
    const userCard = userContainer.querySelector('.user-card');
    if (userCard) {
        userCard.parentNode.insertBefore(rankingContainer, userCard.nextSibling);
    } else {
        // 如果找不到user-card，则添加到用户容器末尾
        userContainer.appendChild(rankingContainer);
    }

    // 初始化默认显示铜钱排行榜
    updateRankingTable('copper', 'bronze');

    // 为切换按钮添加点击事件
    rankingTabs.addEventListener('click', (event) => {
        const clickedTab = event.target.closest('.ranking-tab');
        if (!clickedTab) return;

        // 更新按钮激活状态
        document.querySelectorAll('.ranking-tab').forEach(tab => tab.classList.remove('active'));
        clickedTab.classList.add('active');

        // 更新排行榜表格
        const type = clickedTab.dataset.type;
        const colorClass = clickedTab.dataset.colorClass;
        updateRankingTable(type, colorClass);
    });
}

// 更新排行榜表格内容
function updateRankingTable(type, colorClass) {
    const rankingTableContainer = document.querySelector('.ranking-table-container');
    if (!rankingTableContainer) return;

    // 清空现有表格
    rankingTableContainer.innerHTML = '';

    // 根据类型生成对应排行榜数据
    const rankedUsers = [...userData]
        .filter(user => user[type] > 0) // 只包含有该货币数量的用户
        .sort((a, b) => b[type] - a[type]) // 降序排列
        .slice(0, 10); // 取前10名

    if (rankedUsers.length === 0) {
        const noData = document.createElement('div');
        noData.className = 'no-ranking-data';
        noData.textContent = '暂无数据';
        rankingTableContainer.appendChild(noData);
        return;
    }

    // 创建表格
    const table = document.createElement('table');
    rankingTableContainer.appendChild(table);

    // 创建表头
    const thead = document.createElement('thead');
    table.appendChild(thead);
    const headerRow = document.createElement('tr');
    thead.appendChild(headerRow);

    const headers = ['排名', '用户', 'QQ', '数量'];
    headers.forEach(headerText => {
        const th = document.createElement('th');
        th.textContent = headerText;
        headerRow.appendChild(th);
    });

    // 创建表体
    const tbody = document.createElement('tbody');
    table.appendChild(tbody);

    // 填充数据行
    rankedUsers.forEach((user, index) => {
        const row = document.createElement('tr');
        tbody.appendChild(row);

        // 排名
        const rankCell = document.createElement('td');
        rankCell.textContent = `#${index + 1}`;
        // 为前三名添加特殊样式
        if (index < 3) {
            rankCell.className = `rank-${index + 1}`;
        }
        row.appendChild(rankCell);

        // 用户名称
        const nameCell = document.createElement('td');
        nameCell.textContent = user.name;
        row.appendChild(nameCell);

        // QQ号
        const qqCell = document.createElement('td');
        qqCell.textContent = user.qq;
        row.appendChild(qqCell);

        // 货币数量
        const valueCell = document.createElement('td');
        valueCell.textContent = formatNumber(user[type]);
        valueCell.className = `text-${colorClass}`; // 使用对应的颜色
        row.appendChild(valueCell);
    });
}