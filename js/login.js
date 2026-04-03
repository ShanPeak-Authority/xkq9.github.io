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
        // 监听QQ号输入变化，实时更新头像预览
        qqInput.addEventListener('input', updateAvatarPreview);
        qqInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                handleLogin();
            }
        });

        // 从localStorage恢复上次登录的QQ号
        if (currentUserQQ) {
            qqInput.value = currentUserQQ;
            updateAvatarPreview();
        }
    }

    // 页面加载时检查登录状态
    checkLoginStatus();
}

// 更新头像预览
function updateAvatarPreview() {
    const qqInput = document.getElementById('qqInput');
    const avatarPreview = document.getElementById('avatarPreview');
    const errorMessage = document.getElementById('qqError');

    if (!avatarPreview || !qqInput) return;

    const qq = qqInput.value.trim();

    if (qq && /^\d{5,12}$/.test(qq)) {
        // 清空可能的错误信息
        if (errorMessage) {
            errorMessage.textContent = '';
        }

        // 更新预览头像
        const avatarUrl = `https://q1.qlogo.cn/g?b=qq&nk=${qq}&s=3`;
        avatarPreview.src = avatarUrl;
        avatarPreview.style.display = 'block';
        avatarPreview.onerror = function () {
            // 头像加载失败时，使用默认头像
            this.src = '/res/default-avatar.png';
            this.onerror = null;
        };
    } else {
        // QQ号无效时隐藏预览
        avatarPreview.style.display = 'none';
    }
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
        name: '获取中...',  // 初始显示"获取中..."，等头像加载结果确定
        qq: qq,
        copper: 0,
        gold: 0,
        diamond: 0,
        isTempUser: true
    };

    // 先显示基本数据
    showUserData(guestUser);

    // 尝试获取QQ昵称
    fetchQQNickname(qq).then(nickname => {
        if (nickname) {
            // 更新用户名为获取到的昵称
            document.getElementById('userName').textContent = nickname;
        } else {
            // 如果头像加载失败，用户名会显示为"未注册用户"
        }
    });
}

// 尝试获取QQ昵称
async function fetchQQNickname(qq) {
    // 注意：由于跨域限制，这里可能需要使用代理或后端接口
    // 这是一个示例接口，实际使用时可能需要替换
    try {
        // 方法1：尝试通过头像接口获取（某些接口可能会返回昵称）
        // 方法2：如果有后端代理，可以通过后端调用QQ接口
        // 这里我们先不实现具体逻辑，由头像加载失败事件处理
        return null;
    } catch (error) {
        console.error('获取QQ昵称失败:', error);
        return null;
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
            name: '获取中...',  // 初始显示"获取中..."
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

    // 如果是临时用户，尝试获取昵称
    if (user.isTempUser) {
        fetchQQNickname(qq).then(nickname => {
            if (nickname) {
                // 更新用户名为获取到的昵称
                document.getElementById('userName').textContent = nickname;
            }
        });
    }
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
    const avatarPreview = document.getElementById('avatarPreview');

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

        // 清除头像预览
        if (avatarPreview) {
            avatarPreview.src = '';
            avatarPreview.style.display = 'none';
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
            // 使用QQ官方头像接口
            const avatarUrl = `https://q1.qlogo.cn/g?b=qq&nk=${user.qq}&s=3`;
            avatarElement.src = avatarUrl;
            avatarElement.alt = `${user.name}的头像`;

            // 头像加载失败时的处理
            avatarElement.onerror = function () {
                // 如果头像加载失败，使用默认头像
                this.src = '/res/default-avatar.png';
                this.onerror = null; // 防止循环错误

                // 如果这是临时用户（不在表格中），将用户名改为"未注册用户"
                if (user.isTempUser && document.getElementById('userName').textContent === '获取中...') {
                    document.getElementById('userName').textContent = '未注册用户';
                }
            };

            // 头像加载成功时的处理
            avatarElement.onload = function () {
                // 如果是临时用户且当前显示"获取中..."，检查是否可以获取昵称
                if (user.isTempUser && document.getElementById('userName').textContent === '获取中...') {
                    // 头像加载成功，但可能没有昵称信息
                    // 这里可以尝试通过其他方式获取昵称，如果获取不到，保持为QQ号
                    // 暂时将QQ号作为昵称显示
                    document.getElementById('userName').textContent = `用户${user.qq}`;
                }
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