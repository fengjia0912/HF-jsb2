// Supabase配置
const SUPABASE_CONFIG = {
    url: 'https://txukpcoeliodbkgfnpgk.supabase.co',
    anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR4dWtwY29lbGlvZGJrZ2ZucGdrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM0NDAzNzEsImV4cCI6MjA3OTAxNjM3MX0.9gL9t8on0jnoXZdRTMcWw42n_W5FOiXn-rxtjmhTmtQ'
};

// 应用配置
const APP_CONFIG = {
    inactivityTimeout: 15 * 60 * 1000, // 15分钟
    logPageSize: 10,
    maxImageSize: 5 * 1024 * 1024, // 5MB
    supportedImageTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
};

// 颜色配置
const COLOR_CONFIG = {
    primary: '#4361ee',
    secondary: '#3f37c9',
    success: '#4cc9f0',
    danger: '#f72585',
    warning: '#f8961e',
    info: '#4895ef',
    urgent: '#ff4d4d',
    important: '#ff9f1c',
    normal: '#2ec4b6',
    low: '#cbf3f0'
};

console.log('配置加载完成');
