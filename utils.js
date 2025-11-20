// 工具函数类
class Utils {
    // 显示消息
    static showMessage(text, isError = false) {
        const message = document.getElementById('message');
        if (!message) {
            console.log('消息:', text);
            return;
        }
        
        message.textContent = text;
        message.className = isError ? 'error' : 'success';
        message.style.display = 'block';
        
        setTimeout(() => {
            message.style.display = 'none';
        }, 3000);
    }

    // 显示模态框
    static showModal(modalId) {
        const modal = document.getElementById(modalId);
        if (!modal) return;
        
        modal.style.display = 'flex';
        setTimeout(() => {
            modal.classList.add('show');
        }, 10);
    }

    // 隐藏模态框
    static hideModal(modalId) {
        const modal = document.getElementById(modalId);
        if (!modal) return;
        
        modal.classList.remove('show');
        setTimeout(() => {
            modal.style.display = 'none';
        }, 300);
    }

    // 格式化文件大小
    static formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    // 获取日期范围
    static getDateRange(filterType) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        let startDate, endDate;
        
        switch (filterType) {
            case 'today':
                startDate = new Date(today);
                endDate = new Date(today);
                endDate.setHours(23, 59, 59, 999);
                break;
            case 'yesterday':
                startDate = new Date(today);
                startDate.setDate(today.getDate() - 1);
                endDate = new Date(startDate);
                endDate.setHours(23, 59, 59, 999);
                break;
            case 'last7days':
                startDate = new Date(today);
                startDate.setDate(today.getDate() - 6);
                endDate = new Date(today);
                endDate.setHours(23, 59, 59, 999);
                break;
            case 'last15days':
                startDate = new Date(today);
                startDate.setDate(today.getDate() - 14);
                endDate = new Date(today);
                endDate.setHours(23, 59, 59, 999);
                break;
            case 'last30days':
                startDate = new Date(today);
                startDate.setDate(today.getDate() - 29);
                endDate = new Date(today);
                endDate.setHours(23, 59, 59, 999);
                break;
            case 'thismonth':
                startDate = new Date(today.getFullYear(), today.getMonth(), 1);
                endDate = new Date(today.getFullYear(), today.getMonth() + 1, 0);
                endDate.setHours(23, 59, 59, 999);
                break;
            case 'lastmonth':
                startDate = new Date(today.getFullYear(), today.getMonth() - 1, 1);
                endDate = new Date(today.getFullYear(), today.getMonth(), 0);
                endDate.setHours(23, 59, 59, 999);
                break;
            case 'thisyear':
                startDate = new Date(today.getFullYear(), 0, 1);
                endDate = new Date(today.getFullYear(), 11, 31);
                endDate.setHours(23, 59, 59, 999);
                break;
            case 'lastyear':
                startDate = new Date(today.getFullYear() - 1, 0, 1);
                endDate = new Date(today.getFullYear() - 1, 11, 31);
                endDate.setHours(23, 59, 59, 999);
                break;
            default:
                return { startDate: null, endDate: null };
        }
        
        return { startDate, endDate };
    }

    // 防抖函数
    static debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }

    // 生成唯一ID
    static generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    }

    // 验证图片文件
    static validateImageFile(file) {
        if (!APP_CONFIG.supportedImageTypes.includes(file.type)) {
            throw new Error('不支持的图片格式');
        }
        
        if (file.size > APP_CONFIG.maxImageSize) {
            throw new Error('图片大小不能超过5MB');
        }
        
        return true;
    }

    // 图片压缩
    static compressImage(file, maxWidth = 800, quality = 0.8) {
        return new Promise((resolve, reject) => {
            const img = new Image();
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            
            img.onload = function() {
                let width = img.width;
                let height = img.height;
                
                // 计算压缩后的尺寸
                if (width > maxWidth) {
                    height = (height * maxWidth) / width;
                    width = maxWidth;
                }
                
                canvas.width = width;
                canvas.height = height;
                
                // 绘制图片到canvas
                ctx.drawImage(img, 0, 0, width, height);
                
                try {
                    // 转换为WebP格式，如果不支持则使用JPEG
                    const supportsWebP = document.createElement('canvas').toDataURL('image/webp').indexOf('data:image/webp') === 0;
                    const format = supportsWebP ? 'image/webp' : 'image/jpeg';
                    const dataUrl = canvas.toDataURL(format, quality);
                    resolve(dataUrl);
                } catch (e) {
                    // 如果转换失败，使用原始文件
                    const reader = new FileReader();
                    reader.onload = function(e) {
                        resolve(e.target.result);
                    };
                    reader.readAsDataURL(file);
                }
            };
            
            img.onerror = function() {
                reject(new Error('图片加载失败'));
            };
            
            img.src = URL.createObjectURL(file);
        });
    }

    // 获取象限名称
    static getQuadrantName(quadrant) {
        const names = {
            1: '紧急且重要',
            2: '重要不紧急',
            3: '紧急不重要',
            4: '不紧急不重要'
        };
        return names[quadrant] || '';
    }

    // 根据优先级获取分类
    static getCategoryByPriority(priority) {
        const categories = {
            1: "紧急处理",
            2: "战略规划",
            3: "日常应急",
            4: "常规事务"
        };
        return categories[priority] || "其他";
    }

    // 安全HTML转义
    static escapeHtml(unsafe) {
        return unsafe
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }

    // 深度克隆对象
    static deepClone(obj) {
        return JSON.parse(JSON.stringify(obj));
    }

    // 数组去重
    static uniqueArray(arr, key = null) {
        if (key) {
            const seen = new Set();
            return arr.filter(item => {
                const value = item[key];
                if (seen.has(value)) {
                    return false;
                }
                seen.add(value);
                return true;
            });
        }
        return [...new Set(arr)];
    }
}

console.log('工具函数加载完成');
