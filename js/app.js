class NotebookApp {
    constructor() {
        this.currentView = 'quadrant';
        this.isInitialized = false;
        this.init();
    }

    async init() {
        try {
            await this.setupEventListeners();
            this.setupGlobalEventListeners();
            this.initializeDateDisplay();
            this.isInitialized = true;
            console.log('记事本应用初始化完成');
        } catch (error) {
            console.error('应用初始化失败:', error);
            Utils.showMessage('应用初始化失败', true);
        }
    }

    initializeDateDisplay() {
        const now = new Date();
        const options = { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' };
        const dateElement = document.getElementById('currentDate');
        
        if (dateElement) {
            dateElement.textContent = now.toLocaleDateString('zh-CN', options);
        }

        // 设置日期选择器默认值
        const today = new Date().toISOString().split('T')[0];
        const startDate = document.getElementById('startDate');
        const endDate = document.getElementById('endDate');
        
        if (startDate) startDate.value = today;
        if (endDate) endDate.value = today;
    }

    async setupEventListeners() {
        this.setupTabEvents();
        this.setupFilterEvents();
        this.setupModalEvents();
        this.setupSuggestionEvents();
        this.setupQuadrantEvents();
    }

    setupGlobalEventListeners() {
        // 全局键盘快捷键
        document.addEventListener('keydown', (e) => {
            this.handleGlobalKeydown(e);
        });

        // 全局点击事件
        document.addEventListener('click', (e) => {
            this.handleGlobalClick(e);
        });

        // 页面可见性变化
        document.addEventListener('visibilitychange', () => {
            if (!document.hidden) {
                authManager.resetSessionTimer();
            }
        });
    }

    setupTabEvents() {
        const tabs = document.querySelectorAll('.tab');
        tabs.forEach(tab => {
            tab.addEventListener('click', (e) => {
                this.switchView(e.target.dataset.view);
            });
        });
    }

    setupFilterEvents() {
        // 快捷筛选
        const quickFilter = document.getElementById('quickDateFilter');
        if (quickFilter) {
            quickFilter.addEventListener('change', (e) => {
                this.applyQuickFilter(e.target.value);
            });
        }

        // 日期筛选
        const applyFilterBtn = document.getElementById('applyDateFilterBtn');
        const resetFilterBtn = document.getElementById('resetDateFilterBtn');
        
        if (applyFilterBtn) {
            applyFilterBtn.addEventListener('click', () => {
                this.applyDateFilter();
            });
        }
        
        if (resetFilterBtn) {
            resetFilterBtn.addEventListener('click', () => {
                this.resetDateFilter();
            });
        }

        // 日期输入验证
        const startDate = document.getElementById('startDate');
        const endDate = document.getElementById('endDate');
        
        if (startDate) {
            startDate.addEventListener('change', () => {
                this.validateDateRange();
            });
        }
        
        if (endDate) {
            endDate.addEventListener('change', () => {
                this.validateDateRange();
            });
        }
    }

    setupModalEvents() {
        // 编辑任务模态框
        this.setupTaskEditModalEvents();
        
        // 已删除任务模态框
        this.setupDeletedTasksModalEvents();
        
        // 建议编辑模态框
        this.setupSuggestionModalEvents();
        
        // 标签编辑模态框
        this.setupTagModalEvents();
    }

    setupTaskEditModalEvents() {
        const closeBtn = document.getElementById('closeModal');
        const cancelBtn = document.getElementById('cancelEdit');
        const saveBtn = document.getElementById('saveEdit');
        
        if (closeBtn) {
            closeBtn.addEventListener('click', () => {
                this.closeEditModal();
            });
        }
        
        if (cancelBtn) {
            cancelBtn.addEventListener('click', () => {
                this.closeEditModal();
            });
        }
        
        if (saveBtn) {
            saveBtn.addEventListener('click', () => {
                this.saveTaskEdit();
            });
        }
        
        // 回车键保存
        const editModal = document.getElementById('editModal');
        if (editModal) {
            editModal.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    this.saveTaskEdit();
                }
            });
        }
    }

    setupDeletedTasksModalEvents() {
        const closeBtn = document.getElementById('closeDeletedModal');
        const closeBtn2 = document.getElementById('closeDeletedModalBtn');
        const restoreSelectedBtn = document.getElementById('restoreSelectedTasksBtn');
        const clearSearchBtn = document.getElementById('clearDeletedSearchBtn');
        
        if (closeBtn) {
            closeBtn.addEventListener('click', () => {
                this.closeDeletedTasksModal();
            });
        }
        
        if (closeBtn2) {
            closeBtn2.addEventListener('click', () => {
                this.closeDeletedTasksModal();
            });
        }
        
        if (restoreSelectedBtn) {
            restoreSelectedBtn.addEventListener('click', () => {
                this.restoreSelectedTasks();
            });
        }
        
        if (clearSearchBtn) {
            clearSearchBtn.addEventListener('click', () => {
                this.clearDeletedTasksSearch();
            });
        }
        
        // 搜索已删除任务
        const searchInput = document.getElementById('searchDeletedTasks');
        if (searchInput) {
            searchInput.addEventListener('input', Utils.debounce(() => {
                this.filterDeletedTasks();
            }, 300));
        }
    }

    setupSuggestionModalEvents() {
        const closeBtn = document.getElementById('closeEditSuggestionModal');
        const cancelBtn = document.getElementById('cancelEditSuggestion');
        const saveBtn = document.getElementById('saveEditSuggestion');
        
        if (closeBtn) {
            closeBtn.addEventListener('click', () => {
                Utils.hideModal('editSuggestionModal');
            });
        }
        
        if (cancelBtn) {
            cancelBtn.addEventListener('click', () => {
                Utils.hideModal('editSuggestionModal');
            });
        }
        
        if (saveBtn) {
            saveBtn.addEventListener('click', () => {
                this.saveSuggestionEdit();
            });
        }
    }

    setupTagModalEvents() {
        const closeBtn = document.getElementById('closeEditTagModal');
        const cancelBtn = document.getElementById('cancelEditTag');
        const saveBtn = document.getElementById('saveEditTag');
        const addTagBtn = document.getElementById('addTagBtn');
        const addImageTagBtn = document.getElementById('addImageTagBtn');
        
        if (closeBtn) {
            closeBtn.addEventListener('click', () => {
                Utils.hideModal('editTagModal');
            });
        }
        
        if (cancelBtn) {
            cancelBtn.addEventListener('click', () => {
                Utils.hideModal('editTagModal');
            });
        }
        
        if (saveBtn) {
            saveBtn.addEventListener('click', () => {
                this.saveTagEdit();
            });
        }
        
        if (addTagBtn) {
            addTagBtn.addEventListener('click', () => {
                this.openTagModal();
            });
        }
        
        if (addImageTagBtn) {
            addImageTagBtn.addEventListener('click', () => {
                this.openTagModal();
            });
        }
    }

    setupSuggestionEvents() {
        // 主输入框建议
        const mainInput = document.getElementById('newTaskInput');
        if (mainInput) {
            mainInput.addEventListener('input', Utils.debounce((e) => {
                this.showSuggestions(e.target.value, null);
            }, 200));
            
            mainInput.addEventListener('focus', (e) => {
                if (e.target.value) {
                    this.showSuggestions(e.target.value, null);
                }
            });
            
            mainInput.addEventListener('blur', () => {
                setTimeout(() => {
                    this.hideSuggestions(null);
                }, 200);
            });
        }

        // 各象限输入框建议
        document.querySelectorAll('.add-task-input').forEach(input => {
            input.addEventListener('input', Utils.debounce((e) => {
                const quadrant = parseInt(e.target.dataset.quadrant);
                this.showSuggestions(e.target.value, quadrant);
            }, 200));
            
            input.addEventListener('focus', (e) => {
                const quadrant = parseInt(e.target.dataset.quadrant);
                if (e.target.value) {
                    this.showSuggestions(e.target.value, quadrant);
                }
            });
            
            input.addEventListener('blur', (e) => {
                const quadrant = parseInt(e.target.dataset.quadrant);
                setTimeout(() => {
                    this.hideSuggestions(quadrant);
                }, 200);
            });
        });
    }

    setupQuadrantEvents() {
        // 四象限展开/折叠
        document.querySelectorAll('.quadrant-header').forEach(header => {
            header.addEventListener('click', (e) => {
                this.toggleQuadrant(e.currentTarget.dataset.quadrant);
            });
        });
    }

    // 视图切换
    switchView(view) {
        if (this.currentView === view) return;
        
        // 更新标签状态
        document.querySelectorAll('.tab').forEach(tab => {
            tab.classList.remove('active');
            if (tab.dataset.view === view) {
                tab.classList.add('active');
            }
        });
        
        // 隐藏所有视图
        document.getElementById('quadrantView').style.display = 'none';
        document.getElementById('listView').classList.remove('active');
        document.getElementById('foldersView').classList.remove('active');
        document.getElementById('imagesView').classList.remove('active');
        document.getElementById('analyticsView').classList.remove('active');
        document.getElementById('logView').classList.remove('active');
        
        // 显示当前视图
        switch (view) {
            case 'quadrant':
                document.getElementById('quadrantView').style.display = 'grid';
                break;
            case 'list':
                document.getElementById('listView').classList.add('active');
                this.renderListView();
                break;
            case 'folders':
                document.getElementById('foldersView').classList.add('active');
                this.renderFoldersView();
                break;
            case 'images':
                document.getElementById('imagesView').classList.add('active');
                // 图片管理器会自动处理
                break;
            case 'analytics':
                document.getElementById('analyticsView').classList.add('active');
                analyticsManager.refresh();
                break;
            case 'log':
                document.getElementById('logView').classList.add('active');
                this.loadOperationLogs();
                break;
        }
        
        this.currentView = view;
        this.saveViewPreference();
    }

    // 筛选功能
    applyQuickFilter(filterType) {
        const dateRange = Utils.getDateRange(filterType);
        taskManager.applyFilter({
            startDate: dateRange.startDate,
            endDate: dateRange.endDate,
            quickFilter: filterType
        });
        
        // 更新日期输入框
        const startDate = document.getElementById('startDate');
        const endDate = document.getElementById('endDate');
        
        if (startDate && dateRange.startDate) {
            startDate.value = dateRange.startDate.toISOString().split('T')[0];
        }
        if (endDate && dateRange.endDate) {
            endDate.value = dateRange.endDate.toISOString().split('T')[0];
        }
    }

    applyDateFilter() {
        const startDateStr = document.getElementById('startDate').value;
        const endDateStr = document.getElementById('endDate').value;
        
        let startDate = startDateStr ? new Date(startDateStr) : null;
        let endDate = endDateStr ? new Date(endDateStr) : null;
        
        if (endDate) {
            endDate.setHours(23, 59, 59, 999);
        }
        
        taskManager.applyFilter({ startDate, endDate });
    }

    resetDateFilter() {
        const today = new Date().toISOString().split('T')[0];
        document.getElementById('quickDateFilter').value = 'today';
        document.getElementById('startDate').value = today;
        document.getElementById('endDate').value = today;
        
        this.applyQuickFilter('today');
    }

    validateDateRange() {
        const startDate = new Date(document.getElementById('startDate').value);
        const endDate = new Date(document.getElementById('endDate').value);
        
        if (startDate && endDate && startDate > endDate) {
            Utils.showMessage('开始日期不能晚于结束日期', true);
            document.getElementById('endDate').value = document.getElementById('startDate').value;
        }
    }

    // 模态框功能
    openEditModal(taskId) {
        const task = taskManager.getTasks().find(t => t.id === taskId);
        if (!task) return;

        taskManager.editingTaskId = taskId;
        
        // 设置表单值
        const textInput = document.getElementById('editTaskText');
        const categorySelect = document.getElementById('editTaskCategory');
        
        if (textInput) textInput.value = task.text;
        if (categorySelect) categorySelect.value = task.category || 'all';
        
        // 设置优先级选择
        document.querySelectorAll('#editModal .priority-option').forEach(option => {
            option.classList.remove('selected');
            if (parseInt(option.dataset.priority) === task.priority) {
                option.classList.add('selected');
            }
        });
        
        Utils.showModal('editModal');
    }

    closeEditModal() {
        Utils.hideModal('editModal');
        taskManager.editingTaskId = null;
    }

    async saveTaskEdit() {
        if (taskManager.editingTaskId === null) return;

        const textInput = document.getElementById('editTaskText');
        const categorySelect = document.getElementById('editTaskCategory');
        const priorityOption = document.querySelector('#editModal .priority-option.selected');
        
        if (!textInput || !textInput.value.trim()) {
            Utils.showMessage('任务内容不能为空', true);
            return;
        }

        const updates = {
            text: textInput.value.trim(),
            category: categorySelect ? categorySelect.value : 'all'
        };

        if (priorityOption) {
            const newPriority = parseInt(priorityOption.dataset.priority);
            updates.priority = newPriority;
            
            // 更新象限
            if (newPriority === 1) updates.quadrant = 1;
            else if (newPriority === 2) updates.quadrant = 2;
            else if (newPriority === 3) updates.quadrant = 3;
            else updates.quadrant = 4;
        }

        try {
            await taskManager.updateTask(taskManager.editingTaskId, updates);
            this.closeEditModal();
        } catch (error) {
            // 错误已经在updateTask中处理
        }
    }

    // 建议功能
    showSuggestions(text, quadrant) {
        const suggestions = taskManager.getSuggestions(text);
        const containerId = quadrant ? `suggestions${quadrant}` : 'mainSuggestions';
        const container = document.getElementById(containerId);
        
        if (!container) return;
        
        container.innerHTML = '';
        
        if (suggestions.length === 0) {
            container.style.display = 'none';
            return;
        }
        
        suggestions.forEach((suggestion, index) => {
            const item = document.createElement('div');
            item.className = 'suggestion-item';
            item.innerHTML = `
                <span>${Utils.escapeHtml(suggestion)}</span>
                <span class="suggestion-edit" data-index="${index}">✏️</span>
            `;
            
            item.addEventListener('click', (e) => {
                if (!e.target.classList.contains('suggestion-edit')) {
                    const input = container.previousElementSibling;
                    input.value = suggestion;
                    input.focus();
                    this.hideSuggestions(quadrant);
                }
            });
            
            const editBtn = item.querySelector('.suggestion-edit');
            editBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.openSuggestionEditModal(index, suggestion);
            });
            
            container.appendChild(item);
        });
        
        container.style.display = 'block';
    }

    hideSuggestions(quadrant) {
        const containerId = quadrant ? `suggestions${quadrant}` : 'mainSuggestions';
        const container = document.getElementById(containerId);
        if (container) {
            container.style.display = 'none';
        }
    }

    openSuggestionEditModal(index, suggestion) {
        taskManager.editingSuggestionIndex = index;
        document.getElementById('editSuggestionText').value = suggestion;
        Utils.showModal('editSuggestionModal');
    }

    saveSuggestionEdit() {
        const newText = document.getElementById('editSuggestionText').value.trim();
        if (newText && taskManager.editingSuggestionIndex !== -1) {
            taskManager.taskSuggestions[taskManager.editingSuggestionIndex] = newText;
            localStorage.setItem('taskSuggestions', JSON.stringify(taskManager.taskSuggestions));
            Utils.hideModal('editSuggestionModal');
            
            // 更新所有建议列表
            document.querySelectorAll('.add-task-input').forEach(input => {
                const quadrant = parseInt(input.dataset.quadrant);
                this.showSuggestions(input.value, quadrant);
            });
            
            this.showSuggestions(document.getElementById('newTaskInput').value, null);
        }
    }

    // 四象限功能
    toggleQuadrant(quadrant) {
        const container = document.getElementById(`taskContainer${quadrant}`);
        const toggleIcon = document.querySelector(`.quadrant-${quadrant} .toggle-icon`);
        
        if (container && toggleIcon) {
            if (container.style.display === 'none') {
                container.style.display = 'block';
                toggleIcon.textContent = '▼';
            } else {
                container.style.display = 'none';
                toggleIcon.textContent = '▶';
            }
        }
    }

    // 全局事件处理
    handleGlobalKeydown(e) {
        // ESC键处理
        if (e.key === 'Escape') {
            const openModal = document.querySelector('.modal.show');
            if (openModal) {
                Utils.hideModal(openModal.id);
            } else if (authManager.getAuthStatus()) {
                authManager.logout();
            }
        }
        
        // Enter键确认操作
        if (e.key === 'Enter') {
            const activeElement = document.activeElement;
            if (activeElement.classList.contains('modal-btn-primary')) {
                activeElement.click();
            }
        }
    }

    handleGlobalClick(e) {
        // 点击模态框外部关闭
        if (e.target.classList.contains('modal')) {
            Utils.hideModal(e.target.id);
        }
    }

    // 数据持久化
    saveViewPreference() {
        localStorage.setItem('preferredView', this.currentView);
    }

    loadViewPreference() {
        const preferredView = localStorage.getItem('preferredView');
        if (preferredView) {
            this.switchView(preferredView);
        }
    }

    // 应用启动
    start() {
        console.log('记事本应用启动');
        this.loadViewPreference();
        
        // 初始渲染
        if (this.currentView === 'analytics') {
            analyticsManager.refresh();
        }
    }
}

// 应用启动
document.addEventListener('DOMContentLoaded', function() {
    // 等待所有组件初始化完成后启动应用
    setTimeout(() => {
        const app = new NotebookApp();
        app.start();
    }, 100);
});

console.log('主应用逻辑加载完成');
