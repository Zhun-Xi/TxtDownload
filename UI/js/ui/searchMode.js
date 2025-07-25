// 渲染网站来源标签
function renderTabs() {
    const tabsContainer = document.getElementById('tabsContainer');
    tabsContainer.innerHTML = '';
    const sites = Object.keys(window.allResults || {});
    sites.forEach(site => {
        const tab = document.createElement('button');
        tab.className = 'tab-btn';
        if (site === window.activeSite) {
            tab.classList.add('active');
        }
        tab.textContent = site;
        tab.onclick = () => {
            window.activeSite = site;
            renderTabs();
            displayPage(1);
        };
        tabsContainer.appendChild(tab);
    });
}

// 显示特定页码的结果
function displayPage(page) {
    window.currentPage = page;
    const siteResults = window.allResults[window.activeSite] || [];
    const startIndex = (page - 1) * window.resultsPerPage;
    const endIndex = startIndex + window.resultsPerPage;
    const pageResults = siteResults.slice(startIndex, endIndex);
    
    displayResults(pageResults);
    renderPagination();
}

// 渲染分页控件
function renderPagination() {
    const paginationContainer = document.getElementById('paginationContainer');
    
    // 如果分页容器不存在，则创建一个
    if (!paginationContainer) {
        console.log('分页容器不存在，创建新的分页容器');
        const newPaginationContainer = document.createElement('div');
        newPaginationContainer.id = 'paginationContainer';
        newPaginationContainer.className = 'pagination-container';
        // 设置样式确保居中显示
        newPaginationContainer.style.display = 'flex';
        newPaginationContainer.style.justifyContent = 'center';
        newPaginationContainer.style.width = '100%';
        newPaginationContainer.style.marginTop = '30px';
        newPaginationContainer.style.position = 'relative';
        document.querySelector('.main-content').appendChild(newPaginationContainer);
        return renderPagination(); // 递归调用以使用新创建的容器
    }
    
    // 确保分页容器样式正确
    paginationContainer.style.display = 'flex';
    paginationContainer.style.justifyContent = 'center';
    paginationContainer.style.width = '100%';
    paginationContainer.style.marginTop = '30px';
    paginationContainer.style.position = 'relative';
    
    
    const siteResults = window.allResults[window.activeSite] || [];
    const totalPages = Math.ceil(siteResults.length / window.resultsPerPage);
    
    if (totalPages <= 1) {
        paginationContainer.innerHTML = '';
        return;
    }
    
    let paginationHTML = '<ul class="pagination">';
    
    // 上一页按钮
    paginationHTML += `
        <li class="${window.currentPage === 1 ? 'disabled' : ''}">
            <a href="#" onclick="return handlePagination(${window.currentPage - 1})">
                <i class="fas fa-chevron-left"></i>
            </a>
        </li>
    `;
    
    // 页码按钮
    for (let i = 1; i <= totalPages; i++) {
        paginationHTML += `
            <li class="${i === window.currentPage ? 'active' : ''}">
                <a href="#" onclick="return handlePagination(${i})">${i}</a>
            </li>
        `;
    }
    
    // 下一页按钮
    paginationHTML += `
        <li class="${window.currentPage === totalPages ? 'disabled' : ''}">
            <a href="#" onclick="return handlePagination(${window.currentPage + 1})">
                <i class="fas fa-chevron-right"></i>
            </a>
        </li>
    `;
    
    paginationHTML += '</ul>';
    paginationContainer.innerHTML = paginationHTML;
}

// 分页处理函数
function handlePagination(page) {
    const siteResults = window.allResults[window.activeSite] || [];
    if (page < 1 || page > Math.ceil(siteResults.length / window.resultsPerPage)) {
        return false;
    }
    displayPage(page);
    return false; // 阻止默认链接行为
}

// 显示结果卡片
function displayResults(results) {
    const resultsContainer = document.getElementById('resultsContainer');
    resultsContainer.innerHTML = '';
    
    // 添加调试信息
    console.log('显示结果:', results);
    console.log('结果容器:', resultsContainer);
    
    if (!results || results.length === 0) {
        resultsContainer.innerHTML = `
            <div class="no-results">
                <i class="fas fa-book-open"></i>
                <p>当前来源没有找到相关书籍</p>
            </div>
        `;
        return;
    }
    
    // 创建结果卡片
    results.forEach(book => {
        const bookCard = document.createElement('div');
        bookCard.className = 'result-card'; // 修改为result-card类名

        const coverImage = book.coverUrl 
            ? `<img src="${book.coverUrl}" alt="${book.title}" class="book-cover">`
            : '<div class="book-cover-placeholder"><i class="fas fa-book"></i></div>';

        bookCard.innerHTML = `
            <div class="book-info">
                <h4 class="book-title">${book.title}</h4>
                <p class="book-author">作者：${book.author}</p>
                <p class="book-source">来源：${book.site}</p>
                <a href="${book.detailUrl}" target="_blank" class="btn-view-details">查看详情</a>
                <div class="book-actions">
                    <button class="btn-download"><i class="fas fa-download"></i> 下载</button>
                    <button class="btn-read"><i class="fas fa-book-reader"></i> 阅读</button>
                </div>
            </div>
            ${coverImage}
        `;
        
        resultsContainer.appendChild(bookCard);
        console.log('添加了结果卡片:', book.title);

        const downloadButton = bookCard.querySelector('.btn-download');
        downloadButton.addEventListener('click', () => handleBookDownload(book, downloadButton));
        
        const readButton = bookCard.querySelector('.btn-read');
        readButton.addEventListener('click', () => handleBookRead(book, readButton));
    });
    
    // 确保结果容器可见
    resultsContainer.style.visibility = 'visible';
    resultsContainer.style.display = 'grid';
}

// 处理书籍下载
function handleBookDownload(book, button) {
    // 显示文件路径选择对话框
    showFilePathDialog(book.title, (filePath) => {
        button.innerHTML = '<i class="fas fa-spinner fa-spin"></i> 下载中...';
        button.disabled = true;

        // 直接传递参数，不进行编码，因为downloadBook函数内部会进行编码
        downloadBook(book.source, book.detailUrl, filePath)
            .then(data => {
                if (data.message) {
                    button.innerHTML = '<i class="fas fa-check"></i> 下载成功';
                    button.classList.add('success');
                } else {
                    throw new Error(data.error || '下载失败');
                }
            })
            .catch(error => {
                console.error('下载书籍时出错:', error);
                button.innerHTML = '<i class="fas fa-times"></i> 下载失败';
                button.classList.add('error');
            })
            .finally(() => {
                setTimeout(() => {
                    button.innerHTML = '<i class="fas fa-download"></i> 下载';
                    button.disabled = false;
                    button.classList.remove('success', 'error');
                }, 3000);
            });
    });
}

// 处理书籍阅读
function handleBookRead(book, button) {
    button.innerHTML = '<i class="fas fa-spinner fa-spin"></i> 跳转中...';
    button.disabled = true;
    
    // 切换到阅读器模式
    switchMode('reader');
    
    // 等待阅读器UI渲染完成
    setTimeout(() => {
        // 自动填充网站选择框
        const siteSelect = document.getElementById('readerSiteSelect');
        for (let i = 0; i < siteSelect.options.length; i++) {
            if (siteSelect.options[i].value === book.site) {
                siteSelect.selectedIndex = i;
                break;
            }
        }
        
        // 自动填充小说目录URL
        const catalogUrlInput = document.getElementById('readerCatalogUrl');
        catalogUrlInput.value = book.detailUrl;
        
        // 自动点击获取章节按钮
        const fetchChaptersBtn = document.getElementById('fetchChaptersBtn');
        fetchChaptersBtn.click();
        
        // 恢复按钮状态
        button.innerHTML = '<i class="fas fa-book-reader"></i> 阅读';
        button.disabled = false;
    }, 500); // 给UI渲染留出时间
}

// 执行搜索
function performSearch() {
    const searchInput = document.getElementById('searchInput');
    const searchWrapper = document.querySelector('.search-wrapper');
    const contentArea = document.getElementById('contentArea');
    const loader = document.getElementById('loader');
    const searchResultsSection = document.getElementById('searchResults');

    const query = searchInput.value.trim();
    if (!query) {
        alert('请输入搜索内容！');
        return;
    }
    
    // 显示加载指示器
    loader.style.display = 'flex';
    contentArea.style.display = 'none';
    searchResultsSection.classList.remove('visible');
    
    // 确保分页容器存在
    let paginationContainer = document.getElementById('paginationContainer');
    if (!paginationContainer) {
        paginationContainer = document.createElement('div');
        paginationContainer.id = 'paginationContainer';
        paginationContainer.className = 'pagination-container';
        // 设置样式确保居中显示
        paginationContainer.style.display = 'flex';
        paginationContainer.style.justifyContent = 'center';
        paginationContainer.style.width = '100%';
        paginationContainer.style.marginTop = '30px';
        document.querySelector('.main-content').appendChild(paginationContainer);
    }
    
    // 发送搜索请求到后端
    searchBook(query)
        .then(data => {
            // 处理搜索结果
            window.allResults = processResults(data);
            window.currentResults = window.allResults; // 添加currentResults全局变量
            const sites = Object.keys(window.allResults);
            
            if (sites.length === 0) {
                // 没有结果
                document.getElementById('resultsContainer').innerHTML = `
                    <div class="no-results">
                        <i class="fas fa-book-open"></i>
                        <p>没有找到相关书籍</p>
                    </div>
                `;
                // 清空分页
                if (paginationContainer) {
                    paginationContainer.innerHTML = '';
                }
            } else {
                // 设置活动站点为第一个有结果的站点
                window.activeSite = sites[0];
                renderTabs(); 
                displayPage(1);
            }
            
            // 隐藏加载指示器，显示结果区域
            loader.style.display = 'none';
            contentArea.style.display = 'block';
            contentArea.style.opacity = '1';
            contentArea.style.visibility = 'visible';
            searchResultsSection.classList.add('visible');
            searchResultsSection.style.visibility = 'visible';
            document.getElementById('resultsContainer').style.visibility = 'visible'; // 确保搜索结果容器可见
            
            // 确保分页容器可见并且样式正确
            if (paginationContainer) {
                paginationContainer.style.display = 'flex';
                paginationContainer.style.justifyContent = 'center';
                paginationContainer.style.width = '100%';
                paginationContainer.style.marginTop = '30px';
            }
            
            // 移动搜索框到顶部
            searchWrapper.classList.add('moved');
        })
        .catch(error => {
            console.error('搜索请求失败:', error);
            loader.style.display = 'none';
            document.getElementById('resultsContainer').innerHTML = `
                <div class="error-message">
                    <i class="fas fa-exclamation-circle"></i>
                    <p>搜索请求失败，请检查网络连接和后端服务</p>
                </div>
            `;
            contentArea.style.display = 'block';
        });
}

// 渲染搜索模式UI
function renderSearchUI() {
    // 显示搜索结果区域
    const searchResults = document.getElementById('searchResults');
    const contentArea = document.getElementById('contentArea');
    
    if (searchResults) searchResults.style.display = 'block';
    if (contentArea) contentArea.style.display = 'block';
    
    // 确保搜索框可见
    const searchWrapper = document.querySelector('.search-wrapper');
    if (searchWrapper) searchWrapper.style.display = 'flex';
    
    // 创建分页容器（如果不存在）
    let paginationContainer = document.getElementById('paginationContainer');
    if (!paginationContainer) {
        paginationContainer = document.createElement('div');
        paginationContainer.id = 'paginationContainer';
        paginationContainer.className = 'pagination-container';
        // 设置样式确保居中显示
        paginationContainer.style.display = 'flex';
        paginationContainer.style.justifyContent = 'center';
        paginationContainer.style.width = '100%';
        paginationContainer.style.marginTop = '30px';
        const mainContent = document.querySelector('.main-content');
        if (mainContent) {
            mainContent.appendChild(paginationContainer);
            console.log('创建了新的分页容器');
        } else {
            console.error('找不到.main-content元素，无法添加分页容器');
        }
    }
    
    if (paginationContainer) {
        paginationContainer.style.display = 'block';
        console.log('分页容器已设置为可见');
    }
}

// 导出函数到全局作用域，以便HTML中的事件处理程序可以访问
window.renderTabs = renderTabs;
window.displayPage = displayPage;
window.handlePagination = handlePagination;
window.displayResults = displayResults;
window.performSearch = performSearch;
window.renderSearchUI = renderSearchUI;