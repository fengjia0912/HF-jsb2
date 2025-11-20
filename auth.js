class AuthManager {
    constructor() {
        this.isLoggedIn = false;
        this.userPassword = null;
        this.sessionTimer = null;
        this.init();
    }

    init() {
        // 从localStorage加载密码
        this.userPassword = localStorage.getItem('userPassword') || '6858';
        this.checkLoginStatus();
        this.setupEventListeners();
    }

    checkLoginStatus() {
        // 每次都需要登录（为了安全）
        this.isLoggedIn = false;
        this.showLoginScreen();
    }

    showLoginScreen() {
        const appContainer = document.getElementById('appContainer');
        const loginContainer = document.getElementById('loginContainer');
        
        if (appContainer) appContainer.style.display = 'none';
        if (loginContainer) loginContainer.style.display = 'flex';
        
        const passwordInput = document.getElementById('password');
        if (passwordInput) passwordInput.value = '';
    }

    showAppScreen() {
        const appContainer = document.getElementById('appContainer');
        const loginContainer = document.getElementById('loginContainer');
        
        if (appContainer) appContainer.style.display = 'block';
        if (loginContainer) loginContainer.style.display = 'none';
        
        // 启动会话超时管理
        this.setupSessionTimeout();
    }

    async login(password) {
        if (password === this.userPassword) {
            this.isLoggedIn = true;
            this.showAppScreen();
            
            try {
                await this.logOperation('system', '用户登录系统');
                Utils.showMessage('登录成功', false);
            } catch (error) {
                console.error('记录登录日志失败:', error);
            }
            
            return true;
        } else {
            Utils.showMessage('密码错误，请重新输入', true);
            return false;
        }
    }

    async logout() {
        this.isLoggedIn = false;
        
        try {
            await this.logOperation('system', '用户退出系统');
        } catch (error) {
            console.error('记录退出日志失败:', error);
        }
        
        this.showLoginScreen();
        this.clearSessionTimer();
        
        Utils.showMessage('已退出登录', false);
    }

    async changePassword(currentPassword, newPassword, confirmPassword) {
        // 验证当前密码
        if (currentPassword !== this.userPassword) {
            throw new Error('当前密码不正确');
        }

        // 验证新密码和确认密码
        if (newPassword !== confirmPassword) {
            throw new Error('新密码和确认密码不匹配');
        }

        // 验证密码强度
        if (newPassword.length < 4) {
            throw new Error('密码长度不能少于4位');
        }

        // 更新密码
        this.userPassword = newPassword;
        localStorage.setItem('userPassword', newPassword);
        
        // 记录操作日志
        await this.logOperation('system', '用户修改了登录密码');
        
        Utils.showMessage('密码修改成功，请使用新密码登录', false);
    }

    async logOperation(type, content) {
        if (!this.isLoggedIn) return;

        try {
            await dbManager.saveLog({
                type: type,
                content: content,
                operator: '管理员'
            });
        } catch (error) {
            console.error('记录操作日志失败:', error);
            // 不抛出错误，避免影响主要功能
        }
    }

    // 会话超时管理
    setupSessionTimeout() {
        this.resetSessionTimer();
        
        // 添加用户活动监听
        const events = ['mousemove', 'keypress', 'click', 'scroll', 'touchstart'];
        events.forEach(event => {
            document.addEventListener(event, () => this.resetSessionTimer());
        });
    }

    resetSessionTimer() {
        this.clearSessionTimer();
        
        this.sessionTimer = setTimeout(() => {
            if (this.isLoggedIn) {
                Utils.showMessage('会话已超时，请重新登录', true);
                this.logout();
            }
        }, APP_CONFIG.inactivityTimeout);
    }

    clearSessionTimer() {
        if (this.sessionTimer) {
            clearTimeout(this.sessionTimer);
            this.sessionTimer = null;
        }
    }

    // 事件监听器设置
    setupEventListeners() {
        // 登录表单提交
        const loginForm = document.getElementById('loginForm');
        if (loginForm) {
            loginForm.addEventListener('submit', (e) => {
                e.preventDefault();
                const password = document.getElementById('password').value;
                this.login(password);
            });
        }

        // 修改密码按钮
        const changePasswordBtn = document.getElementById('changePasswordBtn');
        if (changePasswordBtn) {
            changePasswordBtn.addEventListener('click', () => {
                Utils.showModal('changePasswordModal');
            });
        }

        // 退出登录按钮
        const logoutBtn = document.getElementById('logoutBtn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', () => {
                this.logout();
            });
        }

        // 修改密码模态框事件
        this.setupPasswordModalEvents();
        
        // ESC键退出登录
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.isLoggedIn) {
                // 如果任何模态框是打开的，先关闭它
                const openModal = document.querySelector('.modal.show');
                if (openModal) {
                    Utils.hideModal(openModal.id);
                } else {
                    this.logout();
                }
            }
        });
    }

    setupPasswordModalEvents() {
        // 关闭修改密码模态框
        const closeBtn = document.getElementById('closeChangePasswordModal');
        const cancelBtn = document.getElementById('cancelChangePassword');
        
        if (closeBtn) {
            closeBtn.addEventListener('click', () => {
                Utils.hideModal('changePasswordModal');
                this.clearPasswordForm();
            });
        }
        
        if (cancelBtn) {
            cancelBtn.addEventListener('click', () => {
                Utils.hideModal('changePasswordModal');
                this.clearPasswordForm();
            });
        }

        // 保存新密码
        const saveBtn = document.getElementById('saveNewPassword');
        if (saveBtn) {
            saveBtn.addEventListener('click', async () => {
                await this.handlePasswordChange();
            });
        }

        // 回车键保存密码
        const passwordForm = document.querySelector('#changePasswordModal');
        if (passwordForm) {
            passwordForm.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    this.handlePasswordChange();
                }
            });
        }
    }

    async handlePasswordChange() {
        const currentPassword = document.getElementById('currentPassword').value;
        const newPassword = document.getElementById('newPassword').value;
        const confirmPassword = document.getElementById('confirmPassword').value;

        try {
            await this.changePassword(currentPassword, newPassword, confirmPassword);
            Utils.hideModal('changePasswordModal');
            this.clearPasswordForm();
            this.logout(); // 修改密码后强制重新登录
        } catch (error) {
            Utils.showMessage(error.message, true);
        }
    }

    clearPasswordForm() {
        const currentPassword = document.getElementById('currentPassword');
        const newPassword = document.getElementById('newPassword');
        const confirmPassword = document.getElementById('confirmPassword');
        
        if (currentPassword) currentPassword.value = '';
        if (newPassword) newPassword.value = '';
        if (confirmPassword) confirmPassword.value = '';
    }

    // 获取认证状态
    getAuthStatus() {
        return this.isLoggedIn;
    }

    // 验证操作权限
    checkPermission() {
        if (!this.isLoggedIn) {
            throw new Error('未登录，请先登录');
        }
        return true;
    }
}

// 创建全局实例
const authManager = new AuthManager();
console.log('认证管理器加载完成');
