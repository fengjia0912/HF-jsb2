class ImageManager {
    constructor() {
        this.images = [];
        this.editingImageId = null;
        this.imageObserver = null;
        this.init();
    }

    async init() {
        await this.loadImages();
        this.setupEventListeners();
        this.initLazyLoading();
        this.setupRealTimeUpdates();
    }

    async loadImages() {
        try {
            this.images = await dbManager.getImages();
            this.renderAllImages();
            Utils.showMessage('图片加载完成', false);
        } catch (error) {
            console.error('加载图片失败:', error);
            Utils.showMessage('加载图片失败', true);
        }
    }

    async uploadImages(files) {
        authManager.checkPermission();

        if (!files || files.length === 0) return;

        let successCount = 0;
        let errorCount = 0;

        for (let i = 0; i < files.length; i++) {
            const file = files[i];
            
            try {
                // 验证文件
                Utils.validateImageFile(file);
                
                // 压缩图片
                const compressedData = await Utils.compressImage(file);
                
                // 创建图片对象
                const newImage = {
                    name: file.name,
                    data: compressedData,
                    description: '',
                    category: 'all',
                    folder: 'default',
                    size: file.size,
                    uploadedAt: new Date().toISOString()
                };

                // 保存到数据库
                const savedImage = await dbManager.saveImage(newImage);
                this.images.push(savedImage);
                this.renderImage(savedImage);
                
                await authManager.logOperation('system', `上传图片：${file.name}`);
                successCount++;
                
            } catch (error) {
                console.error(`上传图片失败 ${file.name}:`, error);
                errorCount++;
            }
        }

        // 显示上传结果
        if (successCount > 0) {
            Utils.showMessage(`成功上传 ${successCount} 张图片`, false);
        }
        if (errorCount > 0) {
            Utils.showMessage(`${errorCount} 张图片上传失败`, true);
        }

        // 清空文件输入
        const fileInput = document.getElementById('fileInput');
        if (fileInput) fileInput.value = '';
    }

    async updateImage(imageId, updates) {
        authManager.checkPermission();

        const imageIndex = this.images.findIndex(img => img.id === imageId);
        if (imageIndex === -1) {
            throw new Error('图片不存在');
        }

        const oldImage = Utils.deepClone(this.images[imageIndex]);
        this.images[imageIndex] = { ...oldImage, ...updates };

        try {
            const savedImage = await dbManager.saveImage(this.images[imageIndex]);
            this.images[imageIndex] = savedImage;
            
            // 记录变更日志
            const changes = this.getImageChanges(oldImage, savedImage);
            if (changes.length > 0) {
                await authManager.logOperation('edit', `编辑图片信息：${changes.join('，')}`);
            }

            this.renderImage(savedImage, true); // 重新渲染
            Utils.showMessage('图片信息更新成功', false);
        } catch (error) {
            console.error('更新图片失败:', error);
            // 恢复原图片
            this.images[imageIndex] = oldImage;
            Utils.showMessage('更新图片失败: ' + error.message, true);
            throw error;
        }
    }

    async deleteImage(imageId) {
        authManager.checkPermission();

        const imageIndex = this.images.findIndex(img => img.id === imageId);
        if (imageIndex === -1) {
            throw new Error('图片不存在');
        }

        const image = this.images[imageIndex];
        
        try {
            await dbManager.deleteImage(imageId);
            
            await authManager.logOperation('delete', `删除图片：${image.name}`);
            
            this.images.splice(imageIndex, 1);
            this.removeImageFromDOM(imageId);
            Utils.showMessage('图片删除成功', false);
        } catch (error) {
            console.error('删除图片失败:', error);
            Utils.showMessage('删除图片失败: ' + error.message, true);
            throw error;
        }
    }

    // 渲染相关方法
    renderAllImages() {
        this.clearImageGrid();
        this.images.forEach(image => this.renderImage(image));
    }

    renderImage(image, updateExisting = false) {
        if (updateExisting) {
            this.removeImageFromDOM(image.id);
        }

        const imagesGrid = document.getElementById('imagesGrid');
        if (!imagesGrid) return;

        const imageCard = this.createImageCard(image);
        imagesGrid.appendChild(imageCard);

        // 观察图片进行懒加载
        this.observeImageForLazyLoading(imageCard);
    }

    createImageCard(image) {
        const imageCard = document.createElement('div');
        imageCard.className = 'image-card';
        imageCard.dataset.id = image.id;
        imageCard.dataset.category = image.category;

        const uploadDate = new Date(image.uploadedAt).toLocaleDateString();
        const sizeText = Utils.formatFileSize(image.size);

        imageCard.innerHTML = `
            <div class="image-container">
                <img data-src="${image.data}" src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='150' viewBox='0 0 200 150'%3E%3Crect width='200' height='150' fill='%23f0f0f0'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' font-family='Arial' font-size='14' fill='%23999'%3E加载中...%3C/text%3E%3C/svg%3E" alt="${Utils.escapeHtml(image.name)}" class="lazy" loading="lazy">
            </div>
            <div class="image-info">
                <div class="image-title">${Utils.escapeHtml(image.name)}</div>
                <div class="image-date">${uploadDate}</div>
                <div class="image-size">${sizeText}</div>
                <div class="image-actions">
                    <button class="image-action view-image-btn">👁️</button>
                    <button class="image-action edit-image-btn">✏️</button>
                    <button class="image-action delete-image-btn">🗑️</button>
                </div>
            </div>
        `;

        this.attachImageEventListeners(imageCard, image);
        return imageCard;
    }

    attachImageEventListeners(imageCard, image) {
        const viewBtn = imageCard.querySelector('.view-image-btn');
        viewBtn.addEventListener('click', () => {
            this.viewImage(image);
        });

        const editBtn = imageCard.querySelector('.edit-image-btn');
        editBtn.addEventListener('click', () => {
            this.openEditImageModal(image.id);
        });

        const deleteBtn = imageCard.querySelector('.delete-image-btn');
        deleteBtn.addEventListener('click', () => {
            if (confirm(`确定要删除图片"${image.name}"吗？`)) {
                this.deleteImage(image.id);
            }
        });
    }

    removeImageFromDOM(imageId) {
        const existingElement = document.querySelector(`.image-card[data-id="${imageId}"]`);
        if (existingElement) {
            existingElement.remove();
        }
    }

    clearImageGrid() {
        const imagesGrid = document.getElementById('imagesGrid');
        if (imagesGrid) {
            imagesGrid.innerHTML = '';
        }
    }

    // 图片查看功能
    viewImage(image) {
        const modalImage = document.getElementById('modalImage');
        const imageModal = document.getElementById('imageModal');
        
        if (modalImage && imageModal) {
            modalImage.src = image.data;
            modalImage.alt = image.name;
            Utils.showModal('imageModal');
        }
    }

    // 图片编辑功能
    openEditImageModal(imageId) {
        authManager.checkPermission();

        const image = this.images.find(img => img.id === imageId);
        if (!image) return;

        this.editingImageId = imageId;
        
        // 设置表单值
        const nameInput = document.getElementById('editImageName');
        const descInput = document.getElementById('editImageDescription');
        const categorySelect = document.getElementById('editImageCategory');
        
        if (nameInput) nameInput.value = image.name;
        if (descInput) descInput.value = image.description || '';
        if (categorySelect) categorySelect.value = image.category || 'all';
        
        Utils.showModal('editImageModal');
    }

    async saveImageEdit() {
        if (this.editingImageId === null) return;

        const nameInput = document.getElementById('editImageName');
        const descInput = document.getElementById('editImageDescription');
        const categorySelect = document.getElementById('editImageCategory');
        
        if (!nameInput || !nameInput.value.trim()) {
            Utils.showMessage('图片名称不能为空', true);
            return;
        }

        const updates = {
            name: nameInput.value.trim(),
            description: descInput ? descInput.value.trim() : '',
            category: categorySelect ? categorySelect.value : 'all'
        };

        try {
            await this.updateImage(this.editingImageId, updates);
            Utils.hideModal('editImageModal');
            this.editingImageId = null;
        } catch (error) {
            // 错误已经在updateImage中处理
        }
    }

    // 搜索功能
    searchImages() {
        const searchInput = document.getElementById('imageSearchInput');
        const searchText = searchInput ? searchInput.value.toLowerCase() : '';
        
        const imageCards = document.querySelectorAll('.image-card');
        imageCards.forEach(card => {
            const imageName = card.querySelector('.image-title').textContent.toLowerCase();
            const imageCategory = card.dataset.category;
            
            const matchesSearch = imageName.includes(searchText);
            const matchesCategory = this.shouldShowImageByCategory(imageCategory);
            
            if (matchesSearch && matchesCategory) {
                card.style.display = 'block';
            } else {
                card.style.display = 'none';
            }
        });
    }

    shouldShowImageByCategory(category) {
        // 这里可以添加分类筛选逻辑
        // 目前显示所有分类的图片
        return true;
    }

    // 懒加载功能
    initLazyLoading() {
        if ('IntersectionObserver' in window) {
            this.imageObserver = new IntersectionObserver((entries, observer) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        const img = entry.target;
                        img.src = img.dataset.src;
                        img.classList.remove('lazy');
                        observer.unobserve(img);
                    }
                });
            }, {
                rootMargin: '50px 0px',
                threshold: 0.01
            });
        }
    }

    observeImageForLazyLoading(imageCard) {
        if (!this.imageObserver) return;
        
        const img = imageCard.querySelector('img.lazy');
        if (img) {
            this.imageObserver.observe(img);
        }
    }

    // 辅助方法
    getImageChanges(oldImage, newImage) {
        const changes = [];
        if (oldImage.name !== newImage.name) {
            changes.push(`名称从"${oldImage.name}"修改为"${newImage.name}"`);
        }
        if (oldImage.description !== newImage.description) {
            changes.push('描述已修改');
        }
        if (oldImage.category !== newImage.category) {
            changes.push(`分类从"${oldImage.category}"修改为"${newImage.category}"`);
        }
        return changes;
    }

    // 事件监听器设置
    setupEventListeners() {
        // 上传按钮
        const uploadBtn = document.getElementById('uploadBtn');
        if (uploadBtn) {
            uploadBtn.addEventListener('click', () => {
                const fileInput = document.getElementById('fileInput');
                if (fileInput) fileInput.click();
            });
        }

        // 文件选择变化
        const fileInput = document.getElementById('fileInput');
        if (fileInput) {
            fileInput.addEventListener('change', (e) => {
                this.uploadImages(e.target.files);
            });
        }

        // 拖放上传
        const uploadArea = document.getElementById('uploadArea');
        if (uploadArea) {
            uploadArea.addEventListener('dragover', (e) => {
                e.preventDefault();
                uploadArea.classList.add('dragover');
            });

            uploadArea.addEventListener('dragleave', (e) => {
                e.preventDefault();
                uploadArea.classList.remove('dragover');
            });

            uploadArea.addEventListener('drop', (e) => {
                e.preventDefault();
                uploadArea.classList.remove('dragover');
                this.uploadImages(e.dataTransfer.files);
            });
        }

        // 搜索功能
        const searchBtn = document.getElementById('imageSearchBtn');
        if (searchBtn) {
            searchBtn.addEventListener('click', () => {
                this.searchImages();
            });
        }

        const searchInput = document.getElementById('imageSearchInput');
        if (searchInput) {
            searchInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    this.searchImages();
                }
            });
            
            // 防抖搜索
            searchInput.addEventListener('input', Utils.debounce(() => {
                this.searchImages();
            }, 300));
        }

        // 图片预览模态框
        const closeImageModal = document.getElementById('closeImageModal');
        if (closeImageModal) {
            closeImageModal.addEventListener('click', () => {
                Utils.hideModal('imageModal');
            });
        }

        // 图片编辑模态框
        this.setupImageEditModalEvents();
    }

    setupImageEditModalEvents() {
        const closeBtn = document.getElementById('closeEditImageModal');
        const cancelBtn = document.getElementById('cancelEditImage');
        const saveBtn = document.getElementById('saveEditImage');
        
        if (closeBtn) {
            closeBtn.addEventListener('click', () => {
                Utils.hideModal('editImageModal');
                this.editingImageId = null;
            });
        }
        
        if (cancelBtn) {
            cancelBtn.addEventListener('click', () => {
                Utils.hideModal('editImageModal');
                this.editingImageId = null;
            });
        }
        
        if (saveBtn) {
            saveBtn.addEventListener('click', () => {
                this.saveImageEdit();
            });
        }
        
        // 回车键保存
        const editModal = document.getElementById('editImageModal');
        if (editModal) {
            editModal.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    this.saveImageEdit();
                }
            });
        }
    }

    // 实时更新
    setupRealTimeUpdates() {
        dbManager.subscribeToChanges((table, payload) => {
            if (table === 'images') {
                this.handleImageUpdate(payload);
            }
        });
    }

    handleImageUpdate(payload) {
        const { eventType, new: newData, old: oldData } = payload;
        
        switch (eventType) {
            case 'INSERT':
                // 新图片添加
                if (newData && !this.images.find(img => img.id === newData.id)) {
                    const image = {
                        id: newData.id,
                        name: newData.name,
                        data: newData.data,
                        description: newData.description,
                        category: newData.category,
                        folder: newData.folder,
                        size: newData.size,
                        uploadedAt: newData.uploaded_at
                    };
                    this.images.push(image);
                    this.renderImage(image);
                }
                break;
                
            case 'UPDATE':
                // 图片更新
                if (newData) {
                    const imageIndex = this.images.findIndex(img => img.id === newData.id);
                    if (imageIndex !== -1) {
                        this.images[imageIndex] = {
                            id: newData.id,
                            name: newData.name,
                            data: newData.data,
                            description: newData.description,
                            category: newData.category,
                            folder: newData.folder,
                            size: newData.size,
                            uploadedAt: newData.uploaded_at
                        };
                        this.renderImage(this.images[imageIndex], true);
                    }
                }
                break;
                
            case 'DELETE':
                // 图片删除
                if (oldData) {
                    this.images = this.images.filter(img => img.id !== oldData.id);
                    this.removeImageFromDOM(oldData.id);
                }
                break;
        }
    }

    // 公开方法供其他模块使用
    getImages() {
        return this.images;
    }

    getImageById(imageId) {
        return this.images.find(img => img.id === imageId);
    }
}

// 创建全局实例
const imageManager = new ImageManager();
console.log('图片管理器加载完成');
