class TaskManager {
    constructor() {
        this.tasks = [];
        this.deletedTasks = [];
        this.taskSuggestions = [];
        this.currentPriority = 1;
        this.editingTaskId = null;
        this.currentFilter = {
            startDate: null,
            endDate: null,
            quickFilter: 'today'
        };
        this.init();
    }

    async init() {
        await this.loadTasks();
        this.loadSuggestions();
        this.setupEventListeners();
        this.setupRealTimeUpdates();
    }

    async loadTasks() {
        try {
            this.tasks = await dbManager.getTasks();
            this.renderAllTasks();
            Utils.showMessage('任务加载完成', false);
        } catch (error) {
            console.error('加载任务失败:', error);
            Utils.showMessage('加载任务失败', true);
        }
    }

    async addTask(text, quadrant, priority = null) {
        // 验证权限
        authManager.checkPermission();

        if (!text || !text.trim()) {
            throw new Error('任务内容不能为空');
        }

        const task = {
            text: text.trim(),
            priority: priority || this.currentPriority,
            completed: false,
            quadrant: quadrant,
            category: Utils.getCategoryByPriority(priority || this.currentPriority),
            createdAt: new Date().toISOString()
        };

        try {
            const savedTask = await dbManager.saveTask(task);
            this.tasks.push(savedTask);
            this.renderTask(savedTask);
            this.addSuggestion(text);
            
            await authManager.logOperation('add', 
                `新增任务："${text}"（优先级：${savedTask.priority}，象限：${Utils.getQuadrantName(savedTask.quadrant)}）`);
            
            this.updateStats();
            Utils.showMessage('任务添加成功', false);
            return savedTask;
        } catch (error) {
            console.error('添加任务失败:', error);
            Utils.showMessage('添加任务失败: ' + error.message, true);
            throw error;
        }
    }

    async updateTask(taskId, updates) {
        authManager.checkPermission();

        const taskIndex = this.tasks.findIndex(t => t.id === taskId);
        if (taskIndex === -1) {
            throw new Error('任务不存在');
        }

        const oldTask = Utils.deepClone(this.tasks[taskIndex]);
        this.tasks[taskIndex] = { ...oldTask, ...updates };

        try {
            const savedTask = await dbManager.saveTask(this.tasks[taskIndex]);
            this.tasks[taskIndex] = savedTask;
            
            // 记录变更日志
            const changes = this.getTaskChanges(oldTask, savedTask);
            if (changes.length > 0) {
                await authManager.logOperation('edit', 
                    `编辑任务：${changes.join('，')}（象限：${Utils.getQuadrantName(savedTask.quadrant)}）`);
            }

            this.renderTask(savedTask, true); // 重新渲染
            this.updateStats();
            Utils.showMessage('任务更新成功', false);
        } catch (error) {
            console.error('更新任务失败:', error);
            // 恢复原任务
            this.tasks[taskIndex] = oldTask;
            Utils.showMessage('更新任务失败: ' + error.message, true);
            throw error;
        }
    }

    async deleteTask(taskId) {
        authManager.checkPermission();

        const taskIndex = this.tasks.findIndex(t => t.id === taskId);
        if (taskIndex === -1) {
            throw new Error('任务不存在');
        }

        const task = this.tasks[taskIndex];
        
        try {
            await dbManager.deleteTask(taskId);
            
            // 移到已删除列表
            this.deletedTasks.push({
                ...task,
                deletedAt: new Date().toISOString()
            });
            
            this.tasks.splice(taskIndex, 1);
            
            await authManager.logOperation('delete', 
                `删除任务："${task.text}"（ID: ${taskId}，象限：${Utils.getQuadrantName(task.quadrant)}）`);
            
            this.removeTaskFromDOM(taskId);
            this.updateStats();
            Utils.showMessage('任务删除成功', false);
        } catch (error) {
            console.error('删除任务失败:', error);
            Utils.showMessage('删除任务失败: ' + error.message, true);
            throw error;
        }
    }

    async toggleTaskCompletion(taskId) {
        authManager.checkPermission();

        const task = this.tasks.find(t => t.id === taskId);
        if (!task) return;

        const newCompletedState = !task.completed;
        
        try {
            await this.updateTask(taskId, { completed: newCompletedState });
            
            await authManager.logOperation(
                newCompletedState ? 'complete' : 'incomplete', 
                `标记任务为${newCompletedState ? '已完成' : '未完成'}："${task.text}"（象限：${Utils.getQuadrantName(task.quadrant)}）`
            );
        } catch (error) {
            console.error('切换任务状态失败:', error);
            throw error;
        }
    }

    // 渲染相关方法
    renderAllTasks() {
        this.clearTaskLists();
        
        const filteredTasks = this.getFilteredTasks();
        filteredTasks.forEach(task => this.renderTask(task));
        this.updateStats();
    }

    renderTask(task, updateExisting = false) {
        if (updateExisting) {
            this.removeTaskFromDOM(task.id);
        }

        const quadrantId = `quadrant${task.quadrant}`;
        const quadrantList = document.getElementById(quadrantId);
        if (!quadrantList) return;

        const taskElement = this.createTaskElement(task);
        quadrantList.appendChild(taskElement);

        // 确保任务容器是展开的
        const taskContainer = document.getElementById(`taskContainer${task.quadrant}`);
        if (taskContainer) {
            taskContainer.style.display = 'block';
        }
    }

    createTaskElement(task) {
        const taskItem = document.createElement('li');
        taskItem.className = `task-item ${task.completed ? 'completed' : ''}`;
        taskItem.dataset.id = task.id;
        taskItem.dataset.priority = task.priority;

        const dateString = new Date(task.createdAt).toLocaleDateString('zh-CN');
        
        taskItem.innerHTML = `
            <input type="checkbox" class="task-checkbox" ${task.completed ? 'checked' : ''}>
            <span class="task-priority priority-${task.priority}"></span>
            <span class="task-text">${Utils.escapeHtml(task.text)}</span>
            <span class="task-date">${dateString}</span>
            <div class="task-actions">
                <button class="task-action edit-btn">✏️</button>
                <button class="task-action delete-btn">🗑️</button>
            </div>
        `;

        this.attachTaskEventListeners(taskItem, task);
        return taskItem;
    }

    attachTaskEventListeners(taskElement, task) {
        const checkbox = taskElement.querySelector('.task-checkbox');
        checkbox.addEventListener('change', () => {
            this.toggleTaskCompletion(task.id);
        });

        const editBtn = taskElement.querySelector('.edit-btn');
        editBtn.addEventListener('click', () => {
            this.openEditModal(task.id);
        });

        const deleteBtn = taskElement.querySelector('.delete-btn');
        deleteBtn.addEventListener('click', () => {
            if (confirm(`确定要删除任务"${task.text}"吗？`)) {
                this.deleteTask(task.id);
            }
        });
    }

    removeTaskFromDOM(taskId) {
        const existingElement = document.querySelector(`[data-id="${taskId}"]`);
        if (existingElement) {
            existingElement.remove();
        }
    }

    clearTaskLists() {
        // 清空所有象限的任务列表
        for (let i = 1; i <= 4; i++) {
            const list = document.getElementById(`quadrant${i}`);
            if (list) {
                list.innerHTML = '';
            }
        }
        
        // 清空列表视图
        const listTasks = document.getElementById('listTasks');
        if (listTasks) {
            listTasks.innerHTML = '';
        }
    }

    // 建议功能
    loadSuggestions() {
        try {
            const saved = localStorage.getItem('taskSuggestions');
            this.taskSuggestions = saved ? JSON.parse(saved) : [];
        } catch (error) {
            console.error('加载建议失败:', error);
            this.taskSuggestions = [];
        }
    }

    addSuggestion(text) {
        if (!this.taskSuggestions.includes(text)) {
            this.taskSuggestions.unshift(text);
            // 限制建议数量
            if (this.taskSuggestions.length > 50) {
                this.taskSuggestions.pop();
            }
            // 保存到localStorage
            localStorage.setItem('taskSuggestions', JSON.stringify(this.taskSuggestions));
        }
    }

    getSuggestions(text) {
        if (!text) return [];
        
        const lowerText = text.toLowerCase();
        return this.taskSuggestions
            .filter(suggestion => suggestion.toLowerCase().includes(lowerText))
            .slice(0, 5);
    }

    // 筛选功能
    getFilteredTasks() {
        const { startDate, endDate } = this.currentFilter;
        
        if (!startDate && !endDate) {
            return this.tasks;
        }
        
        return this.tasks.filter(task => {
            const taskDate = new Date(task.createdAt);
            return (!startDate || taskDate >= startDate) &&
                   (!endDate || taskDate <= endDate);
        });
    }

    applyFilter(filter) {
        this.currentFilter = { ...this.currentFilter, ...filter };
        this.renderAllTasks();
        this.updateFilterStatus();
    }

    updateFilterStatus() {
        const statusElement = document.getElementById('filterStatus');
        if (!statusElement) return;

        const { startDate, endDate } = this.currentFilter;
        
        if (!startDate && !endDate) {
            statusElement.textContent = '显示所有任务';
            return;
        }

        const startStr = startDate ? new Date(startDate).toLocaleDateString() : '不限';
        const endStr = endDate ? new Date(endDate).toLocaleDateString() : '不限';
        
        statusElement.textContent = `筛选: ${startStr} 至 ${endStr}`;
    }

    // 统计更新
    updateStats() {
        const filteredTasks = this.getFilteredTasks();
        const totalTasks = filteredTasks.length;
        const completedTasks = filteredTasks.filter(t => t.completed).length;
        const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
        const urgentTasks = filteredTasks.filter(t => t.priority === 1).length;
        
        // 更新DOM元素
        const updateElement = (id, value) => {
            const element = document.getElementById(id);
            if (element) element.textContent = value;
        };
        
        updateElement('totalTasks', totalTasks);
        updateElement('completedTasks', completedTasks);
        updateElement('completionRate', `${completionRate}%`);
        updateElement('urgentTasks', urgentTasks);
        
        // 更新各象限计数
        for (let i = 1; i <= 4; i++) {
            const count = filteredTasks.filter(t => t.quadrant === i).length;
            const countElement = document.querySelector(`.quadrant-${i} .task-count`);
            if (countElement) {
                countElement.textContent = `${count}项`;
            }
        }
    }

    // 辅助方法
    getTaskChanges(oldTask, newTask) {
        const changes = [];
        if (oldTask.text !== newTask.text) {
            changes.push(`内容从"${oldTask.text}"修改为"${newTask.text}"`);
        }
        if (oldTask.priority !== newTask.priority) {
            changes.push(`优先级从${oldTask.priority}修改为${newTask.priority}`);
        }
        if (oldTask.quadrant !== newTask.quadrant) {
            changes.push(`象限从"${Utils.getQuadrantName(oldTask.quadrant)}"修改为"${Utils.getQuadrantName(newTask.quadrant)}"`);
        }
        return changes;
    }

    // 事件监听器设置
    setupEventListeners() {
        // 添加任务按钮
        const addTaskBtn = document.getElementById('addTaskBtn');
        if (addTaskBtn) {
            addTaskBtn.addEventListener('click', () => {
                this.handleAddTask();
            });
        }

        // 各象限添加任务按钮
        document.querySelectorAll('.add-task-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const quadrant = parseInt(e.target.dataset.quadrant);
                this.handleQuadrantAddTask(quadrant);
            });
        });

        // 输入框回车事件
        document.querySelectorAll('.add-task-input').forEach(input => {
            input.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    const quadrant = parseInt(e.target.dataset.quadrant);
                    this.handleQuadrantAddTask(quadrant);
                }
            });
        });

        // 优先级选择器
        document.querySelectorAll('.priority-option').forEach(option => {
            option.addEventListener('click', (e) => {
                document.querySelectorAll('.priority-option').forEach(opt => {
                    opt.classList.remove('selected');
                });
                e.target.classList.add('selected');
                this.currentPriority = parseInt(e.target.dataset.priority);
            });
        });
    }

    async handleAddTask() {
        const input = document.getElementById('newTaskInput');
        const text = input.value.trim();
        
        if (text) {
            try {
                // 根据当前优先级确定象限
                let quadrant;
                if (this.currentPriority === 1) quadrant = 1;
                else if (this.currentPriority === 2) quadrant = 2;
                else if (this.currentPriority === 3) quadrant = 3;
                else quadrant = 4;
                
                await this.addTask(text, quadrant);
                input.value = '';
            } catch (error) {
                // 错误已经在addTask中处理
            }
        } else {
            Utils.showMessage('请输入任务内容', true);
        }
    }

    async handleQuadrantAddTask(quadrant) {
        const input = document.querySelector(`.add-task-input[data-quadrant="${quadrant}"]`);
        const text = input.value.trim();
        
        if (text) {
            try {
                await this.addTask(text, quadrant);
                input.value = '';
            } catch (error) {
                // 错误已经在addTask中处理
            }
        } else {
            Utils.showMessage('请输入任务内容', true);
        }
    }

    // 实时更新
    setupRealTimeUpdates() {
        dbManager.subscribeToChanges((table, payload) => {
            console.log(`实时更新: ${table}`, payload);
            
            if (table === 'tasks') {
                this.handleTaskUpdate(payload);
            }
        });
    }

    handleTaskUpdate(payload) {
        const { eventType, new: newData, old: oldData } = payload;
        
        switch (eventType) {
            case 'INSERT':
                // 新任务添加
                if (newData && !this.tasks.find(t => t.id === newData.id)) {
                    const task = {
                        id: newData.id,
                        text: newData.content,
                        priority: newData.priority,
                        completed: newData.completed,
                        quadrant: newData.quadrant,
                        category: newData.category,
                        createdAt: newData.created_at
                    };
                    this.tasks.push(task);
                    this.renderTask(task);
                    this.updateStats();
                }
                break;
                
            case 'UPDATE':
                // 任务更新
                if (newData) {
                    const taskIndex = this.tasks.findIndex(t => t.id === newData.id);
                    if (taskIndex !== -1) {
                        this.tasks[taskIndex] = {
                            id: newData.id,
                            text: newData.content,
                            priority: newData.priority,
                            completed: newData.completed,
                            quadrant: newData.quadrant,
                            category: newData.category,
                            createdAt: newData.created_at
                        };
                        this.renderTask(this.tasks[taskIndex], true);
                        this.updateStats();
                    }
                }
                break;
                
            case 'DELETE':
                // 任务删除
                if (oldData) {
                    this.tasks = this.tasks.filter(t => t.id !== oldData.id);
                    this.removeTaskFromDOM(oldData.id);
                    this.updateStats();
                }
                break;
        }
    }

    // 公开方法供其他模块使用
    getTasks() {
        return this.tasks;
    }

    getFilteredTasks() {
        return this.getFilteredTasks();
    }
}

// 创建全局实例
const taskManager = new TaskManager();
console.log('任务管理器加载完成');
