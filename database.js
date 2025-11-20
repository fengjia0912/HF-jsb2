class DatabaseManager {
    constructor() {
        this.supabase = null;
        this.initialized = false;
        this.init();
    }

    init() {
        try {
            if (typeof supabase !== 'undefined' && SUPABASE_CONFIG.url && SUPABASE_CONFIG.anonKey) {
                this.supabase = supabase.createClient(SUPABASE_CONFIG.url, SUPABASE_CONFIG.anonKey);
                this.initialized = true;
                console.log('Supabase数据库初始化成功');
                
                // 测试连接
                this.testConnection();
            } else {
                console.warn('Supabase配置不完整，使用本地存储模式');
                this.fallbackToLocalStorage();
            }
        } catch (error) {
            console.error('数据库初始化失败:', error);
            this.fallbackToLocalStorage();
        }
    }

    async testConnection() {
        if (!this.initialized) return;
        
        try {
            const { data, error } = await this.supabase
                .from('tasks')
                .select('count')
                .limit(1);
                
            if (error) throw error;
            console.log('数据库连接测试成功');
        } catch (error) {
            console.error('数据库连接测试失败:', error);
            this.fallbackToLocalStorage();
        }
    }

    fallbackToLocalStorage() {
        console.log('切换到本地存储模式');
        this.supabase = null;
        this.initialized = false;
    }

    // 任务相关操作
    async getTasks() {
        if (!this.initialized) {
            return this.getLocalData('tasks') || [];
        }

        try {
            const { data, error } = await this.supabase
                .from('tasks')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) throw error;
            
            // 转换数据格式
            const tasks = (data || []).map(item => ({
                id: item.id,
                text: item.content,
                priority: item.priority || 1,
                completed: item.completed || false,
                quadrant: item.quadrant || 1,
                category: item.category || Utils.getCategoryByPriority(item.priority || 1),
                createdAt: item.created_at
            }));
            
            return tasks;
        } catch (error) {
            console.error('获取任务失败:', error);
            Utils.showMessage('从服务器加载任务失败，使用本地数据', true);
            return this.getLocalData('tasks') || [];
        }
    }

    async saveTask(task) {
        // 数据验证
        if (!this.validateTask(task)) {
            throw new Error('任务数据验证失败');
        }

        const taskData = this.prepareTaskData(task);

        if (!this.initialized) {
            return this.saveTaskToLocalStorage(taskData);
        }

        try {
            let result;
            if (task.id) {
                result = await this.supabase
                    .from('tasks')
                    .update(taskData)
                    .eq('id', task.id)
                    .select();
            } else {
                result = await this.supabase
                    .from('tasks')
                    .insert([taskData])
                    .select();
            }

            if (result.error) throw result.error;
            
            const savedData = result.data[0];
            const savedTask = {
                id: savedData.id,
                text: savedData.content,
                priority: savedData.priority,
                completed: savedData.completed,
                quadrant: savedData.quadrant,
                category: savedData.category,
                createdAt: savedData.created_at
            };
            
            return savedTask;
        } catch (error) {
            console.error('保存任务失败:', error);
            Utils.showMessage('同步到服务器失败，保存到本地', true);
            return this.saveTaskToLocalStorage(taskData);
        }
    }

    async deleteTask(taskId) {
        if (!this.initialized) {
            return this.deleteTaskFromLocalStorage(taskId);
        }

        try {
            const { error } = await this.supabase
                .from('tasks')
                .delete()
                .eq('id', taskId);

            if (error) throw error;
            return true;
        } catch (error) {
            console.error('删除任务失败:', error);
            Utils.showMessage('从服务器删除失败，从本地删除', true);
            return this.deleteTaskFromLocalStorage(taskId);
        }
    }

    // 图片相关操作
    async getImages() {
        if (!this.initialized) {
            return this.getLocalData('images') || [];
        }

        try {
            const { data, error } = await this.supabase
                .from('images')
                .select('*')
                .order('uploaded_at', { ascending: false });

            if (error) throw error;
            
            const images = (data || []).map(item => ({
                id: item.id,
                name: item.name,
                data: item.data,
                description: item.description,
                category: item.category || 'all',
                folder: item.folder || 'default',
                size: item.size || 0,
                uploadedAt: item.uploaded_at
            }));
            
            return images;
        } catch (error) {
            console.error('获取图片失败:', error);
            Utils.showMessage('从服务器加载图片失败，使用本地数据', true);
            return this.getLocalData('images') || [];
        }
    }

    async saveImage(image) {
        if (!this.validateImage(image)) {
            throw new Error('图片数据验证失败');
        }

        const imageData = this.prepareImageData(image);

        if (!this.initialized) {
            return this.saveImageToLocalStorage(imageData);
        }

        try {
            let result;
            if (image.id) {
                result = await this.supabase
                    .from('images')
                    .update(imageData)
                    .eq('id', image.id)
                    .select();
            } else {
                result = await this.supabase
                    .from('images')
                    .insert([imageData])
                    .select();
            }

            if (result.error) throw result.error;
            
            const savedData = result.data[0];
            const savedImage = {
                id: savedData.id,
                name: savedData.name,
                data: savedData.data,
                description: savedData.description,
                category: savedData.category,
                folder: savedData.folder,
                size: savedData.size,
                uploadedAt: savedData.uploaded_at
            };
            
            return savedImage;
        } catch (error) {
            console.error('保存图片失败:', error);
            Utils.showMessage('同步图片到服务器失败，保存到本地', true);
            return this.saveImageToLocalStorage(imageData);
        }
    }

    async deleteImage(imageId) {
        if (!this.initialized) {
            return this.deleteImageFromLocalStorage(imageId);
        }

        try {
            const { error } = await this.supabase
                .from('images')
                .delete()
                .eq('id', imageId);

            if (error) throw error;
            return true;
        } catch (error) {
            console.error('删除图片失败:', error);
            Utils.showMessage('从服务器删除图片失败，从本地删除', true);
            return this.deleteImageFromLocalStorage(imageId);
        }
    }

    // 日志相关操作
    async getLogs() {
        if (!this.initialized) {
            return this.getLocalData('operation_logs') || [];
        }

        try {
            const { data, error } = await this.supabase
                .from('operation_logs')
                .select('*')
                .order('timestamp', { ascending: false });

            if (error) throw error;
            return data || [];
        } catch (error) {
            console.error('获取日志失败:', error);
            Utils.showMessage('从服务器加载日志失败，使用本地数据', true);
            return this.getLocalData('operation_logs') || [];
        }
    }

    async saveLog(log) {
        const logData = {
            timestamp: log.timestamp || new Date().toISOString(),
            type: log.type,
            content: log.content,
            operator: log.operator || '管理员'
        };

        if (!this.initialized) {
            return this.saveLogToLocalStorage(logData);
        }

        try {
            const { error } = await this.supabase
                .from('operation_logs')
                .insert([logData]);

            if (error) throw error;
            return true;
        } catch (error) {
            console.error('保存日志失败:', error);
            return this.saveLogToLocalStorage(logData);
        }
    }

    // 数据验证方法
    validateTask(task) {
        return task && 
               typeof task.text === 'string' && 
               task.text.trim().length > 0 &&
               Number.isInteger(task.priority) && 
               task.priority >= 1 && 
               task.priority <= 4;
    }

    validateImage(image) {
        return image && 
               typeof image.name === 'string' && 
               image.name.trim().length > 0 &&
               typeof image.data === 'string' && 
               image.data.startsWith('data:image');
    }

    // 数据准备方法
    prepareTaskData(task) {
        return {
            content: task.text.trim(),
            priority: task.priority,
            completed: task.completed || false,
            quadrant: task.quadrant || 1,
            category: task.category || Utils.getCategoryByPriority(task.priority),
            created_at: task.createdAt || new Date().toISOString()
        };
    }

    prepareImageData(image) {
        return {
            name: image.name.trim(),
            data: image.data,
            description: image.description || '',
            category: image.category || 'all',
            folder: image.folder || 'default',
            size: image.size || 0,
            uploaded_at: image.uploadedAt || new Date().toISOString()
        };
    }

    // 本地存储回退方法
    getLocalData(key) {
        try {
            const data = localStorage.getItem(key);
            return data ? JSON.parse(data) : [];
        } catch (error) {
            console.error('读取本地数据失败:', error);
            return [];
        }
    }

    saveTaskToLocalStorage(task) {
        try {
            const tasks = this.getLocalData('tasks');
            if (task.id) {
                const index = tasks.findIndex(t => t.id === task.id);
                if (index !== -1) {
                    tasks[index] = { ...tasks[index], ...task };
                } else {
                    tasks.push({ ...task, id: task.id || Utils.generateId() });
                }
            } else {
                tasks.push({ ...task, id: Utils.generateId() });
            }
            localStorage.setItem('tasks', JSON.stringify(tasks));
            return task;
        } catch (error) {
            console.error('保存任务到本地失败:', error);
            throw error;
        }
    }

    deleteTaskFromLocalStorage(taskId) {
        try {
            const tasks = this.getLocalData('tasks');
            const filteredTasks = tasks.filter(t => t.id !== taskId);
            localStorage.setItem('tasks', JSON.stringify(filteredTasks));
            return true;
        } catch (error) {
            console.error('从本地删除任务失败:', error);
            return false;
        }
    }

    saveImageToLocalStorage(image) {
        try {
            const images = this.getLocalData('images');
            if (image.id) {
                const index = images.findIndex(img => img.id === image.id);
                if (index !== -1) {
                    images[index] = { ...images[index], ...image };
                } else {
                    images.push({ ...image, id: image.id || Utils.generateId() });
                }
            } else {
                images.push({ ...image, id: Utils.generateId() });
            }
            localStorage.setItem('images', JSON.stringify(images));
            return image;
        } catch (error) {
            console.error('保存图片到本地失败:', error);
            throw error;
        }
    }

    deleteImageFromLocalStorage(imageId) {
        try {
            const images = this.getLocalData('images');
            const filteredImages = images.filter(img => img.id !== imageId);
            localStorage.setItem('images', JSON.stringify(filteredImages));
            return true;
        } catch (error) {
            console.error('从本地删除图片失败:', error);
            return false;
        }
    }

    saveLogToLocalStorage(log) {
        try {
            const logs = this.getLocalData('operation_logs');
            logs.push(log);
            // 限制本地日志数量
            if (logs.length > 1000) {
                logs.splice(0, logs.length - 1000);
            }
            localStorage.setItem('operation_logs', JSON.stringify(logs));
            return true;
        } catch (error) {
            console.error('保存日志到本地失败:', error);
            return false;
        }
    }

    // 实时订阅
    subscribeToChanges(callback) {
        if (!this.initialized) {
            console.log('实时订阅不可用，使用本地存储模式');
            return;
        }

        try {
            // 订阅任务变化
            this.supabase
                .channel('tasks-changes')
                .on('postgres_changes', 
                    { event: '*', schema: 'public', table: 'tasks' }, 
                    (payload) => {
                        console.log('任务数据变化:', payload);
                        callback('tasks', payload);
                    }
                )
                .subscribe();

            // 订阅图片变化  
            this.supabase
                .channel('images-changes')
                .on('postgres_changes',
                    { event: '*', schema: 'public', table: 'images' },
                    (payload) => {
                        console.log('图片数据变化:', payload);
                        callback('images', payload);
                    }
                )
                .subscribe();

            console.log('实时订阅已启动');

        } catch (error) {
            console.error('实时订阅失败:', error);
        }
    }

    // 批量操作
    async batchDeleteTasks(taskIds) {
        if (!this.initialized) {
            taskIds.forEach(id => this.deleteTaskFromLocalStorage(id));
            return true;
        }

        try {
            const { error } = await this.supabase
                .from('tasks')
                .delete()
                .in('id', taskIds);

            if (error) throw error;
            return true;
        } catch (error) {
            console.error('批量删除任务失败:', error);
            taskIds.forEach(id => this.deleteTaskFromLocalStorage(id));
            return true;
        }
    }
}

// 创建全局实例
const dbManager = new DatabaseManager();
console.log('数据库管理器加载完成');
