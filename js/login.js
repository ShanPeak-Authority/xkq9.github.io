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
            // 如果用户数据不存在，不清除登录状态，创建游客用户显示
            const guestUser = {
                name: '未注册用户',
                qq: currentUserQQ,
                copper: 0,
                gold: 0,
                diamond: 0
            };
            showUserData(guestUser);
            // 注意：localStorage中的登录状态保持不变
        }
    } else {
        showLoginForm();
    }
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
            name: '未注册用户', // 名称固定为"未注册用户"
            qq: qq,            // QQ号为输入的值
            copper: 0,         // 铜钱为0
            gold: 0,           // 黄金为0
            diamond: 0         // 钻石为0
        };
        // 注意：此用户不会被加入userData数组，仅用于本次登录会话
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
        document.getElementById('copperValue').textContent = formatNumber(user.copper);
        document.getElementById('goldValue').textContent = formatNumber(user.gold);
        document.getElementById('diamondValue').textContent = formatNumber(user.diamond);

        // 设置QQ头像
        const avatarElement = document.getElementById('userAvatar');
        if (avatarElement) {
            // 使用QQ官方头像接口，qlogo.cn，支持多种尺寸
            // 参数s表示尺寸：1(40x40), 2(40x40), 3(100x100), 4(140x140), 5(640x640)
            // 这里使用100x100的尺寸
            const avatarUrl = `https://q1.qlogo.cn/g?b=qq&nk=${user.qq}&s=3`;
            avatarElement.src = avatarUrl;
            avatarElement.alt = `${user.name}的头像`;
            avatarElement.onerror = function () {
                // 如果头像加载失败（例如QQ号不存在），使用默认头像
                this.src = '/res/default-avatar.png'; // 需要准备一个默认头像图片
                this.onerror = null; // 防止循环错误
            };
        }

        // 设置更新时间
        const now = new Date();
        document.getElementById('lastUpdateTime').textContent =
            `${now.getFullYear()}-${(now.getMonth() + 1).toString().padStart(2, '0')}-${now.getDate().toString().padStart(2, '0')} ${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
    }
}

// 格式化数字显示（添加千分位）
function formatNumber(num) {
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}