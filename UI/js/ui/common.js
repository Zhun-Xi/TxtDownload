// 模式切换函数
function switchMode(mode) {
    // 更新侧边栏活动状态
    document.querySelectorAll('.nav-item').forEach(item => item.classList.remove('active'));
    const downloadForm = document.getElementById('directDownloadForm');
    const bookshelfContainer = document.getElementById('bookshelfContainer');
    const readerContainer = document.getElementById('readerContainer');
    const paginationContainer = document.getElementById('paginationContainer');

    // 隐藏所有主内容区域
    document.querySelector('.search-wrapper').style.display = 'none';
    document.querySelector('.content-area').style.display = 'none';
    if (downloadForm) downloadForm.style.display = 'none';
    if (bookshelfContainer) bookshelfContainer.style.display = 'none';
    if (readerContainer) readerContainer.style.display = 'none';
    if (paginationContainer) paginationContainer.style.display = 'none';

    if (mode === 'search') {
        document.getElementById('search-mode').classList.add('active');
        renderSearchUI();
        // 确保分页容器在搜索模式下可见并正确定位
        const paginationContainer = document.getElementById('paginationContainer');
        if (paginationContainer) {
            paginationContainer.style.display = 'flex';
            paginationContainer.style.justifyContent = 'center';
            paginationContainer.style.width = '100%';
            paginationContainer.style.marginTop = '30px';
            paginationContainer.style.position = 'relative';
        }
    } else if (mode === 'download') {
        document.getElementById('download-mode').classList.add('active');
        renderDirectDownloadUI();
    } else if (mode === 'bookshelf') {
        document.getElementById('bookshelf-mode').classList.add('active');
        renderBookshelfUI();
    } else if (mode === 'reader') {
        document.getElementById('reader-mode').classList.add('active');
        renderReaderUI();
    }
}

// 处理API返回的结果
function processResults(results) {
    const processed = {};
    
    results.forEach(siteResult => {
        const siteName = siteResult[0];
        const books = siteResult[2];
        
        if (Array.isArray(books) && books.length > 0) {
            processed[siteName] = books.map(book => {
                const [title, author, coverUrl, detailUrl] = book;
                return {
                    title: title || '未知书名',
                    author: author || '未知作者',
                    site: siteName,
                    coverUrl: coverUrl || '',
                    detailUrl: detailUrl || '',
                    source: siteName
                };
            });
        }
    });
    
    return processed;
}