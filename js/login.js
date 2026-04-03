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
        // 用户不存在，创建临时游客游客用户
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
    }
    // 初始化排行榜
    initRanking();
}

// 格式化数字显示（添加万分位）
function formatNumber(num) {
    return num.toString().replace(/\B(?=(\d{4})+(?!\d))/g, ',');
}

// ============ 新增：排行榜功能 ============
function initRanking() {
    const userContainer = document.getElementById('userContainer');
    if (!userContainer) return;

    // 检查是否已存在排行榜容器，避免重复添加
    let rankingContainer = document.getElementById('rankingContainer');
    if (rankingContainer) {
        rankingContainer.remove();
    }

    // 创建排行榜外层容器
    rankingContainer = document.createElement('div');
    rankingContainer.id = 'rankingContainer';
    rankingContainer.style.cssText = 'margin-top: 30px; width: 100%;';

    // 创建切换按钮容器
    const switchContainer = document.createElement('div');
    switchContainer.style.cssText = 'display: flex; justify-content: center; gap: 10px; margin-bottom: 20px;';

    // 创建切换按钮
    const types = [
        { key: 'copper', name: '铜钱榜', color: '#B87333' },
        { key: 'gold', name: '黄金榜', color: '#D4AF37' },
        { key: 'diamond', name: '钻石榜', color: '#3399FF' }
    ];

    types.forEach((type, index) => {
        const button = document.createElement('button');
        button.type = 'button';
        button.textContent = type.name;
        button.dataset.type = type.key;
        button.style.cssText = `
            padding: 10px 20px;
            border: none;
            border-radius: 20px;
            font-size: 14px;
            font-weight: bold;
            cursor: pointer;
            background-color: #f1f1f1;
            color: #283043;
            transition: all 0.2s ease;
        `;
        // 第一个按钮默认激活
        if (index === 0) {
            button.style.backgroundColor = type.color;
            button.style.color = '#ffffff';
        }
        button.addEventListener('click', (e) => {
            // 切换按钮激活状态
            switchContainer.querySelectorAll('button').forEach(btn => {
                const btnType = btn.dataset.type;
                const matchedType = types.find(t => t.key === btnType);
                btn.style.backgroundColor = '#f1f1f1';
                btn.style.color = '#283043';
            });
            e.target.style.backgroundColor = type.color;
            e.target.style.color = '#ffffff';
            // 渲染对应类型的排行榜
            renderRanking(type.key);
        });
        switchContainer.appendChild(button);
    });

    // 创建表格容器
    const tableWrapper = document.createElement('div');
    tableWrapper.id = 'rankingTableWrapper';
    tableWrapper.style.cssText = `
        background: rgba(22, 120, 255, 0.07);
        border-radius: 10px;
        padding: 20px;
        overflow: hidden;
    `;

    const tableTitle = document.createElement('h3');
    tableTitle.id = 'rankingTableTitle';
    tableTitle.textContent = '铜钱排行榜';
    tableTitle.style.cssText = `
        font-size: 18px;
        font-weight: bold;
        color: #283043;
        margin-bottom: 15px;
        padding-left: 10px;
        border-left: 4px solid #B87333;
    `;

    const tableContainer = document.createElement('div');
    tableContainer.style.cssText = `
        overflow-x: auto;
        width: 100%;
        max-width: 100%;
        border-radius: 5px;
        border: 1px solid #ddd;
    `;

    const table = document.createElement('table');
    table.id = 'rankingTable';
    table.style.cssText = `
        width: 100%;
        border-collapse: collapse;
        min-width: 100%;
    `;
    const thead = document.createElement('thead');
    thead.innerHTML = `
        <tr>
            <th style="padding: 12px 15px; text-align: center; background-color: #f8f9fa; color: #283043; border-bottom: 2px solid #1678ff;">排名</th>
            <th style="padding: 12px 15px; text-align: left; background-color: #f8f9fa; color: #283043; border-bottom: 2px solid #1678ff;">用户</th>
            <th style="padding: 12px 15px; text-align: right; background-color: #f8f9fa; color: #283043; border-bottom: 2px solid #1678ff;">数量</th>
        </tr>
    `;
    table.appendChild(thead);
    const tbody = document.createElement('tbody');
    tbody.id = 'rankingTableBody';
    table.appendChild(tbody);
    tableContainer.appendChild(table);
    tableWrapper.appendChild(tableTitle);
    tableWrapper.appendChild(tableContainer);

    // 组装容器
    rankingContainer.appendChild(switchContainer);
    rankingContainer.appendChild(tableWrapper);

    // 插入到更新时间之前
    const updateTimeElement = document.querySelector('.update-time');
    if (updateTimeElement && updateTimeElement.parentNode) {
        updateTimeElement.parentNode.insertBefore(rankingContainer, updateTimeElement);
    } else {
        // 备用方案：插入到 userContainer 末尾
        userContainer.appendChild(rankingContainer);
    }

    // 初始渲染铜钱榜
    renderRanking('copper');
}

function renderRanking(type = 'copper') {
    if (!userData.length) return;

    const typeConfig = {
        copper: { name: '铜钱', color: '#B87333', unit: '' },
        gold: { name: '黄金', color: '#D4AF37', unit: '' },
        diamond: { name: '钻石', color: '#3399FF', unit: '' }
    };
    const config = typeConfig[type];
    if (!config) return;

    // 更新标题
    const titleElement = document.getElementById('rankingTableTitle');
    if (titleElement) {
        titleElement.textContent = `${config.name}排行榜`;
        titleElement.style.borderLeftColor = config.color;
    }

    // 排序数据
    const sortedData = [...userData]
        .filter(user => user[type] > 0) // 只显示有数量的用户
        .sort((a, b) => b[type] - a[type])
        .slice(0, 10); // 取前10名

    const tbody = document.getElementById('rankingTableBody');
    if (!tbody) return;
    tbody.innerHTML = '';

    if (sortedData.length === 0) {
        const row = document.createElement('tr');
        row.innerHTML = `<td colspan="3" style="padding: 20px; text-align: center; color: #7d7d7d;">暂无数据</td>`;
        tbody.appendChild(row);
        return;
    }

    sortedData.forEach((user, index) => {
        const row = document.createElement('tr');
        // 为前三名设置特殊背景色
        let rankCellStyle = 'font-weight: bold;';
        let bgColor = '';
        if (index === 0) {
            rankCellStyle += ' color: #FFD700;'; // 金牌
            bgColor = '#FFF8E1';
        } else if (index === 1) {
            rankCellStyle += ' color: #C0C0C0;'; // 银牌
            bgColor = '#F5F5F5';
        } else if (index === 2) {
            rankCellStyle += ' color: #CD7F32;'; // 铜牌
            bgColor = '#FEF8E7';
        }

        row.style.backgroundColor = bgColor;
        row.innerHTML = `
            <td style="padding: 12px 15px; text-align: center; border-bottom: 1px solid #eee; ${rankCellStyle}">${index + 1}</td>
            <td style="padding: 12px 15px; text-align: left; border-bottom: 1px solid #eee; color: #283043;">
                ${user.name || `用户${user.qq}`} (${user.qq})
            </td>
            <td style="padding: 12px 15px; text-align: right; border-bottom: 1px solid #eee; font-weight: bold; color: ${config.color};">
                ${formatNumber(user[type])}${config.unit}
            </td>
        `;
        tbody.appendChild(row);
    });
}