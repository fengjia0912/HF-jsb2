class AnalyticsManager {
    constructor() {
        this.charts = {};
        this.init();
    }

    init() {
        this.waitForChartJS().then(() => {
            this.initCharts();
            console.log('图表初始化完成');
        }).catch(error => {
            console.error('图表初始化失败:', error);
        });
    }

    waitForChartJS() {
        return new Promise((resolve, reject) => {
            if (typeof Chart !== 'undefined') {
                resolve();
                return;
            }
            
            let attempts = 0;
            const maxAttempts = 30; // 3秒超时
            const interval = setInterval(() => {
                attempts++;
                if (typeof Chart !== 'undefined') {
                    clearInterval(interval);
                    resolve();
                } else if (attempts >= maxAttempts) {
                    clearInterval(interval);
                    reject(new Error('Chart.js加载超时'));
                }
            }, 100);
        });
    }

    initCharts() {
        try {
            this.initTaskChart();
            this.initAnalyticsCharts();
            console.log('所有图表初始化成功');
        } catch (error) {
            console.error('图表初始化失败:', error);
            this.showChartErrorMessages();
        }
    }

    initTaskChart() {
        const ctx = document.getElementById('taskChart');
        if (!ctx) return;

        try {
            this.charts.taskChart = new Chart(ctx, {
                type: 'doughnut',
                data: {
                    labels: ['紧急且重要', '重要不紧急', '紧急不重要', '不紧急不重要'],
                    datasets: [{
                        data: [0, 0, 0, 0],
                        backgroundColor: [
                            'rgba(255, 77, 77, 0.8)',
                            'rgba(255, 159, 28, 0.8)',
                            'rgba(46, 196, 182, 0.8)',
                            'rgba(203, 243, 240, 0.8)'
                        ],
                        borderColor: [
                            'rgba(255, 77, 77, 1)',
                            'rgba(255, 159, 28, 1)',
                            'rgba(46, 196, 182, 1)',
                            'rgba(203, 243, 240, 1)'
                        ],
                        borderWidth: 1
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: {
                            position: 'bottom',
                        },
                        tooltip: {
                            callbacks: {
                                label: (context) => {
                                    const label = context.label || '';
                                    const value = context.raw || 0;
                                    const total = context.dataset.data.reduce((a, b) => a + b, 0);
                                    const percentage = total > 0 ? Math.round((value / total) * 100) : 0;
                                    return `${label}: ${value} (${percentage}%)`;
                                }
                            }
                        }
                    },
                    cutout: '70%'
                }
            });
        } catch (error) {
            console.error('任务图表初始化失败:', error);
            this.showChartError('taskChart');
        }
    }

    initAnalyticsCharts() {
        this.initTaskDistributionChart();
        this.initCompletionChart();
        this.initPriorityChart();
    }

    initTaskDistributionChart() {
        const ctx = document.getElementById('taskDistributionChart');
        if (!ctx) return;

        try {
            this.charts.taskDistributionChart = new Chart(ctx, {
                type: 'bar',
                data: {
                    labels: ['紧急且重要', '重要不紧急', '紧急不重要', '不紧急不重要'],
                    datasets: [{
                        label: '任务数量',
                        data: [0, 0, 0, 0],
                        backgroundColor: [
                            'rgba(255, 77, 77, 0.8)',
                            'rgba(255, 159, 28, 0.8)',
                            'rgba(46, 196, 182, 0.8)',
                            'rgba(203, 243, 240, 0.8)'
                        ],
                        borderColor: [
                            'rgba(255, 77, 77, 1)',
                            'rgba(255, 159, 28, 1)',
                            'rgba(46, 196, 182, 1)',
                            'rgba(203, 243, 240, 1)'
                        ],
                        borderWidth: 1
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    scales: {
                        y: {
                            beginAtZero: true,
                            ticks: {
                                stepSize: 1
                            }
                        }
                    }
                }
            });
        } catch (error) {
            console.error('任务分布图表初始化失败:', error);
            this.showChartError('taskDistributionChart');
        }
    }

    initCompletionChart() {
        const ctx = document.getElementById('completionChart');
        if (!ctx) return;

        try {
            this.charts.completionChart = new Chart(ctx, {
                type: 'pie',
                data: {
                    labels: ['已完成', '未完成'],
                    datasets: [{
                        data: [0, 0],
                        backgroundColor: [
                            'rgba(40, 167, 69, 0.8)',
                            'rgba(220, 53, 69, 0.8)'
                        ],
                        borderColor: [
                            'rgba(40, 167, 69, 1)',
                            'rgba(220, 53, 69, 1)'
                        ],
                        borderWidth: 1
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: {
                            position: 'bottom',
                        }
                    }
                }
            });
        } catch (error) {
            console.error('完成情况图表初始化失败:', error);
            this.showChartError('completionChart');
        }
    }

    initPriorityChart() {
        const ctx = document.getElementById('priorityChart');
        if (!ctx) return;

        try {
            this.charts.priorityChart = new Chart(ctx, {
                type: 'doughnut',
                data: {
                    labels: ['紧急重要', '重要', '紧急', '普通'],
                    datasets: [{
                        data: [0, 0, 0, 0],
                        backgroundColor: [
                            'rgba(255, 77, 77, 0.8)',
                            'rgba(255, 159, 28, 0.8)',
                            'rgba(46, 196, 182, 0.8)',
                            'rgba(203, 243, 240, 0.8)'
                        ],
                        borderColor: [
                            'rgba(255, 77, 77, 1)',
                            'rgba(255, 159, 28, 1)',
                            'rgba(46, 196, 182, 1)',
                            'rgba(203, 243, 240, 1)'
                        ],
                        borderWidth: 1
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: {
                            position: 'bottom',
                        }
                    },
                    cutout: '70%'
                }
            });
        } catch (error) {
            console.error('优先级图表初始化失败:', error);
            this.showChartError('priorityChart');
        }
    }

    updateAllCharts() {
        this.updateTaskChart();
        this.updateAnalyticsCharts();
    }

    updateTaskChart() {
        const chart = this.charts.taskChart;
        if (!chart) return;

        try {
            const tasks = taskManager.getTasks();
            const quadrantData = [0, 0, 0, 0];
            
            tasks.forEach(task => {
                if (task.quadrant >= 1 && task.quadrant <= 4) {
                    quadrantData[task.quadrant - 1]++;
                }
            });

            chart.data.datasets[0].data = quadrantData;
            chart.update('none'); // 使用 'none' 避免动画影响性能
        } catch (error) {
            console.error('更新任务图表失败:', error);
        }
    }

    updateAnalyticsCharts() {
        this.updateTaskDistributionChart();
        this.updateCompletionChart();
        this.updatePriorityChart();
        this.updateAnalyticsNumbers();
    }

    updateTaskDistributionChart() {
        const chart = this.charts.taskDistributionChart;
        if (!chart) return;

        try {
            const tasks = taskManager.getTasks();
            const quadrantData = [0, 0, 0, 0];
            
            tasks.forEach(task => {
                if (task.quadrant >= 1 && task.quadrant <= 4) {
                    quadrantData[task.quadrant - 1]++;
                }
            });

            chart.data.datasets[0].data = quadrantData;
            chart.update('none');
        } catch (error) {
            console.error('更新任务分布图表失败:', error);
        }
    }

    updateCompletionChart() {
        const chart = this.charts.completionChart;
        if (!chart) return;

        try {
            const tasks = taskManager.getTasks();
            const completedTasks = tasks.filter(t => t.completed).length;
            const uncompletedTasks = tasks.length - completedTasks;

            chart.data.datasets[0].data = [completedTasks, uncompletedTasks];
            chart.update('none');
        } catch (error) {
            console.error('更新完成情况图表失败:', error);
        }
    }

    updatePriorityChart() {
        const chart = this.charts.priorityChart;
        if (!chart) return;

        try {
            const tasks = taskManager.getTasks();
            const priorityData = [0, 0, 0, 0];
            
            tasks.forEach(task => {
                if (task.priority >= 1 && task.priority <= 4) {
                    priorityData[task.priority - 1]++;
                }
            });

            chart.data.datasets[0].data = priorityData;
            chart.update('none');
        } catch (error) {
            console.error('更新优先级图表失败:', error);
        }
    }

    updateAnalyticsNumbers() {
        const tasks = taskManager.getTasks();
        const totalTasks = tasks.length;
        const completedTasks = tasks.filter(t => t.completed).length;
        const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
        
        const urgentTasks = tasks.filter(t => t.priority === 1);
        const urgentCompleted = urgentTasks.filter(t => t.completed).length;
        const urgentCompletionRate = urgentTasks.length > 0 ? Math.round((urgentCompleted / urgentTasks.length) * 100) : 0;

        // 更新数字显示
        this.updateElement('completionRateBig', `${completionRate}%`);
        this.updateElement('urgentCompletion', `${urgentCompletionRate}%`);

        // 更新趋势指示器（简化版）
        this.updateTrendIndicators(completionRate, urgentCompletionRate);
    }

    updateElement(id, value) {
        const element = document.getElementById(id);
        if (element) {
            element.textContent = value;
        }
    }

    updateTrendIndicators(completionRate, urgentCompletionRate) {
        // 这里可以添加更复杂的趋势分析逻辑
        // 目前使用简单的固定文本
        const completionTrend = document.querySelector('#completionRateBig + div .trend-neutral');
        const urgentTrend = document.querySelector('#urgentCompletion + div .trend-neutral');
        
        if (completionTrend) {
            completionTrend.textContent = '→ 与昨日持平';
        }
        if (urgentTrend) {
            urgentTrend.textContent = '→ 与昨日持平';
        }
    }

    showChartErrorMessages() {
        const chartContainers = document.querySelectorAll('.chart-container');
        chartContainers.forEach(container => {
            if (!container.querySelector('p')) {
                container.innerHTML = '<p style="text-align: center; color: #666; padding: 20px;">图表加载失败</p>';
            }
        });
    }

    showChartError(chartId) {
        const container = document.getElementById(chartId)?.parentElement;
        if (container && !container.querySelector('p')) {
            container.innerHTML = '<p style="text-align: center; color: #666; padding: 20px;">图表初始化失败</p>';
        }
    }

    // 公开方法供其他模块使用
    refresh() {
        this.updateAllCharts();
    }

    // 销毁图表（用于清理内存）
    destroyCharts() {
        Object.values(this.charts).forEach(chart => {
            if (chart && typeof chart.destroy === 'function') {
                chart.destroy();
            }
        });
        this.charts = {};
    }

    // 重新初始化图表
    reinitializeCharts() {
        this.destroyCharts();
        this.initCharts();
    }
}

// 创建全局实例
const analyticsManager = new AnalyticsManager();
console.log('数据分析管理器加载完成');
