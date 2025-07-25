// 页面加载完成后执行初始化
document.addEventListener('DOMContentLoaded', () => {
    // 初始化全局变量
    window.resultsPerPage = 10; // 每页显示的结果数量
    window.currentPage = 1; // 当前页码
    window.allResults = {}; // 所有搜索结果
    window.activeSite = ''; // 当前活动的站点
    
    // 获取DOM元素
    const searchButton = document.getElementById('searchButton');
    const searchInput = document.getElementById('searchInput');
    const searchModeBtn = document.getElementById('search-mode');
    const downloadModeBtn = document.getElementById('download-mode');
    const bookshelfModeBtn = document.getElementById('bookshelf-mode');
    const readerModeBtn = document.getElementById('reader-mode');

    // 模式切换事件监听
    searchModeBtn.addEventListener('click', (e) => {
        e.preventDefault();
        switchMode('search');
    });

    downloadModeBtn.addEventListener('click', (e) => {
        e.preventDefault();
        switchMode('download');
    });

    bookshelfModeBtn.addEventListener('click', (e) => {
        e.preventDefault();
        switchMode('bookshelf');
    });

    readerModeBtn.addEventListener('click', (e) => {
        e.preventDefault();
        switchMode('reader');
    });

    // 搜索事件监听
    searchButton.addEventListener('click', performSearch);
    searchInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            performSearch();
        }
    });
    
    // 初始状态设置
    const contentArea = document.getElementById('contentArea');
    const searchResults = document.getElementById('searchResults');
    
    if (contentArea) contentArea.classList.remove('visible');
    if (searchResults) searchResults.classList.remove('visible');
    
    // 默认显示搜索模式
    switchMode('search');
});