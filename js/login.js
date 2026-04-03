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

    if (loginContainer && userContainer) {
        loginContainer.style.display = 'none';
        userContainer.style.display = 'block';

        // 更新用户信息
        document.getElementById('userName').textContent = user.name;
        document.getElementById('userQQ').textContent = `QQ: ${user.qq}`;
        document.getElementById('copperValue').textContent = user.copper.toLocaleString();
        document.getElementById('goldValue').textContent = user.gold.toLocaleString();
        document.getElementById('diamondValue').textContent = user.diamond.toLocaleString();

        // 设置头像（如果没有头像，使用默认头像）
        const avatarImg = document.getElementById('userAvatar');
        if (avatarImg) {
            const avatarUrl = `/res/avatars/${user.qq}.png`;
            // 先尝试加载用户头像
            fetch(avatarUrl, { method: 'HEAD' })
                .then(response => {
                    if (response.ok) {
                        avatarImg.src = avatarUrl;
                    } else {
                        // 如果头像不存在，使用默认QQ头像
                        avatarImg.src = '/res/QQ.png';
                    }
                })
                .catch(() => {
                    // 如果加载失败，使用默认QQ头像
                    avatarImg.src = '/res/QQ.png';
                });
        }

        // 设置数据更新时间
        const now = new Date();
        const updateTimeElement = document.getElementById('updateTime');
        if (updateTimeElement) {
            updateTimeElement.textContent = `数据更新时间: ${now.getFullYear()}-${(now.getMonth() + 1).toString().padStart(2, '0')}-${now.getDate().toString().padStart(2, '0')} ${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
        }

        // 修复：新增排行榜数据加载和渲染
        renderRankings(userData, user.qq); // 传入已加载的全部用户数据和当前用户的QQ
        setupRankingTabSwitcher(); // 设置排行榜标签页的切换功能
    }
}

/**
 * 渲染所有排行榜（铜钱、黄金、钻石）
 * @param {Array} allUsers 所有用户数据数组
 * @param {string} currentQQ 当前登录用户的QQ号
 */
function renderRankings(allUsers, currentQQ) {
    if (!Array.isArray(allUsers) || allUsers.length === 0) {
        console.warn('无用户数据，无法渲染排行榜');
        // 在排行榜区域显示"暂无数据"
        ['copperRanking', 'goldRanking', 'diamondRanking'].forEach(type => {
            const listEl = document.getElementById(`${type}List`);
            if (listEl) {
                listEl.innerHTML = `
                    <div class="no-ranking-data">
                        <p>暂无排名数据</p>
                        <p style="font-size: 12px; margin-top: 5px;">请等待管理员更新用户数据</p>
                    </div>
                `;
            }
        });
        return;
    }

    // 1. 铜钱排行榜 (降序)
    const copperRanked = [...allUsers].sort((a, b) => b.copper - a.copper);
    renderSingleRanking('copperRankingList', copperRanked, 'copper', currentQQ);

    // 2. 黄金排行榜 (降序)
    const goldRanked = [...allUsers].sort((a, b) => b.gold - a.gold);
    renderSingleRanking('goldRankingList', goldRanked, 'gold', currentQQ);

    // 3. 钻石排行榜 (降序)
    const diamondRanked = [...allUsers].sort((a, b) => b.diamond - a.diamond);
    renderSingleRanking('diamondRankingList', diamondRanked, 'diamond', currentQQ);
}

/**
 * 渲染单个排行榜列表
 * @param {string} listElementId 列表容器的ID
 * @param {Array} sortedUsers 已排序的用户数组
 * @param {string} currencyType 货币类型 ('copper', 'gold', 'diamond')
 * @param {string} currentQQ 当前登录用户的QQ号
 */
function renderSingleRanking(listElementId, sortedUsers, currencyType, currentQQ) {
    const listEl = document.getElementById(listElementId);
    if (!listEl) return;

    // 清空现有内容
    listEl.innerHTML = '';

    // 取前20名
    const topN = sortedUsers.slice(0, 20);

    if (topN.length === 0) {
        listEl.innerHTML = `
            <div class="no-ranking-data">
                <p>暂无排名数据</p>
            </div>
        `;
        return;
    }

    // 获取当前用户在排行榜中的排名
    const currentUserIndex = sortedUsers.findIndex(user => user.qq === currentQQ);
    const currentUserRank = currentUserIndex >= 0 ? currentUserIndex + 1 : null;

    // 如果当前用户不在前20名，但存在排名，则添加当前用户条目
    const displayUsers = [...topN];
    if (currentUserRank && currentUserRank > 20) {
        const currentUser = sortedUsers[currentUserIndex];
        displayUsers.push({
            ...currentUser,
            isCurrentUser: true,
            rank: currentUserRank
        });
    }

    // 生成列表项
    displayUsers.forEach((user, index) => {
        const rank = index < 20 ? index + 1 : user.rank;
        const isCurrentUser = user.qq === currentQQ;

        const listItem = document.createElement('div');
        listItem.className = `ranking-item ${isCurrentUser ? 'current-user' : ''}`;

        // 排名徽章
        const rankBadge = document.createElement('div');
        rankBadge.className = 'rank-badge';
        if (rank <= 3) {
            rankBadge.classList.add(`rank-${rank}`);
        } else {
            rankBadge.classList.add('rank-other');
        }
        rankBadge.textContent = rank;

        // 用户头像容器
        const avatarContainer = document.createElement('div');
        avatarContainer.className = 'user-avatar-small';

        const avatarImg = document.createElement('img');
        const avatarUrl = `/res/avatars/${user.qq}.png`;
        // 设置头像图片，如果加载失败则使用默认头像
        avatarImg.src = avatarUrl;
        avatarImg.onerror = function () {
            this.src = '/res/QQ.png';
        };
        avatarImg.alt = '用户头像';
        avatarContainer.appendChild(avatarImg);

        // 用户信息
        const userInfo = document.createElement('div');
        userInfo.className = 'user-info-small';

        const userName = document.createElement('div');
        userName.className = 'user-name-small';
        userName.textContent = user.name;

        const userQQ = document.createElement('div');
        userQQ.className = 'user-qq-small';
        userQQ.textContent = `QQ: ${user.qq}`;

        userInfo.appendChild(userName);
        userInfo.appendChild(userQQ);

        // 资产数量
        const amountDiv = document.createElement('div');
        amountDiv.className = `${currencyType}-amount`;
        amountDiv.textContent = user[currencyType].toLocaleString();

        // 组装列表项
        listItem.appendChild(rankBadge);
        listItem.appendChild(avatarContainer);
        listItem.appendChild(userInfo);
        listItem.appendChild(amountDiv);

        listEl.appendChild(listItem);
    });
}

/**
 * 设置排行榜标签页切换功能
 */
function setupRankingTabSwitcher() {
    const tabButtons = document.querySelectorAll('.ranking-tab-btn');
    const tabContents = document.querySelectorAll('.ranking-tab-content');

    // 如果当前没有活跃的标签页，默认激活第一个
    const hasActiveTab = Array.from(tabContents).some(content => content.classList.contains('active'));
    if (!hasActiveTab && tabContents.length > 0) {
        tabContents[0].classList.add('active');
        if (tabButtons.length > 0) {
            tabButtons[0].classList.add('active');
        }
    }

    tabButtons.forEach(button => {
        button.addEventListener('click', () => {
            const targetTab = button.getAttribute('data-tab');

            // 1. 更新按钮激活状态
            tabButtons.forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');

            // 2. 显示对应的内容区域
            tabContents.forEach(content => {
                content.classList.remove('active');
                if (content.id === targetTab) {
                    content.classList.add('active');
                }
            });
        });
    });
}