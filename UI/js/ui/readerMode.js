// 保存阅读器状态到localStorage
function saveReaderState() {
    const state = {
        site: document.getElementById('readerSiteSelect').value,
        catalogUrl: document.getElementById('readerCatalogUrl').value,
        chapters: window.chapters || [],
        currentChapterIndex: window.currentChapterIndex || -1,
        hasLoadedChapters: window.chapters && window.chapters.length > 0,
        chapterTitle: document.getElementById('chapterTitle').textContent,
        chapterContent: document.getElementById('chapterContent').innerHTML
    };
    localStorage.setItem('readerState', JSON.stringify(state));
}

// 从localStorage加载阅读器状态
function loadReaderState() {
    const stateJson = localStorage.getItem('readerState');
    if (!stateJson) return null;
    
    try {
        return JSON.parse(stateJson);
    } catch (e) {
        console.error('解析阅读器状态失败:', e);
        return null;
    }
}

// 渲染阅读器模式UI
function renderReaderUI() {
    let readerContainer = document.getElementById('readerContainer');
    if (!readerContainer) {
        readerContainer = document.createElement('div');
        readerContainer.id = 'readerContainer';
        readerContainer.className = 'reader-container';
        document.querySelector('.main-content').appendChild(readerContainer);
    }

    readerContainer.style.display = 'block';
    readerContainer.innerHTML = `
        <div class="reader-input-form centered" style="display: flex;">
            <h3>小说阅读器</h3>
            <select id="readerSiteSelect" class="site-select"></select>
            <input type="text" id="readerCatalogUrl" placeholder="输入小说目录URL">
            <button id="fetchChaptersBtn">获取章节</button>
        </div>
        <button id="showReaderFormBtn" class="show-reader-form-btn" style="display: none;">打开阅读器</button>
        <div class="reader-content-area">
            <div class="chapters-list-container" style="display: none;">
                <h4>章节列表</h4>
                <ul id="chaptersList"></ul>
            </div>
            <div class="chapter-content-container" style="display: none;">
                <h4 id="chapterTitle"></h4>
                <div id="chapterContent"></div>
                <div class="reader-nav">
                    <button id="prevChapterBtn">上一章</button>
                    <button id="nextChapterBtn">下一章</button>
                </div>
            </div>
        </div>
    `;
    
    // 显示阅读器表单按钮的点击事件（现在默认不显示按钮，但保留逻辑以备后用）
    document.getElementById('showReaderFormBtn').addEventListener('click', function() {
        const readerInputForm = document.querySelector('.reader-input-form');
        readerInputForm.style.display = 'flex';
        this.style.display = 'none'; // 隐藏按钮
        
        // 如果表单已经被移动过（不是居中状态），需要调整内容区域的margin-top
        if (readerInputForm.classList.contains('moved')) {
            document.querySelector('.reader-content-area').style.marginTop = '70px';
        }
    });
    
    // 初始状态下，确保内容区域有足够的上边距
    document.querySelector('.reader-content-area').style.marginTop = '20px';

    // 加载保存的状态
    const savedState = loadReaderState();
    window.currentChapterIndex = -1;
    window.chapters = [];

    fetchSupportedSites()
        .then(sites => {
            const siteSelect = document.getElementById('readerSiteSelect');
            siteSelect.innerHTML = '<option value="">请选择网站</option>'; 
            for (const siteName in sites) {
                const option = document.createElement('option');
                option.value = siteName;
                option.textContent = siteName;
                siteSelect.appendChild(option);
            }
            
            // 如果有保存的状态，恢复选择的网站
            if (savedState && savedState.site) {
                siteSelect.value = savedState.site;
            }
        })
        .catch(error => console.error('获取支持的网站列表失败:', error));
        
    // 如果有保存的状态，恢复目录URL
    if (savedState && savedState.catalogUrl) {
        document.getElementById('readerCatalogUrl').value = savedState.catalogUrl;
    }

    document.getElementById('fetchChaptersBtn').addEventListener('click', fetchChapters);
    
    // 如果有保存的状态且有章节列表，自动恢复章节列表和当前阅读的章节
    if (savedState && savedState.hasLoadedChapters && savedState.chapters && savedState.chapters.length > 0) {
        // 恢复章节列表和当前章节
        window.chapters = savedState.chapters;
        window.currentChapterIndex = savedState.currentChapterIndex;
        
        // 隐藏输入表单，显示按钮
        const readerInputForm = document.querySelector('.reader-input-form');
        readerInputForm.style.display = 'none';
        document.getElementById('showReaderFormBtn').style.display = 'block';
        
        // 渲染章节列表
        const chaptersListEl = document.getElementById('chaptersList');
        chaptersListEl.innerHTML = '';
        window.chapters.forEach((chapter, index) => {
            const li = document.createElement('li');
            li.setAttribute('data-index', index);
            li.innerHTML = `<a href="#" data-url="${chapter.url}">${chapter.title}</a>`;
            if (index === window.currentChapterIndex) {
                li.classList.add('active-chapter');
            }
            chaptersListEl.appendChild(li);
        });
        
        // 显示章节列表和内容区域
        const chaptersListContainer = document.querySelector('.chapters-list-container');
        const chapterContentContainer = document.querySelector('.chapter-content-container');
        
        chaptersListContainer.style.display = 'block';
        chapterContentContainer.style.display = 'block';
        
        // 恢复章节标题和内容
        if (savedState.chapterTitle) {
            document.getElementById('chapterTitle').textContent = savedState.chapterTitle;
        }
        
        if (savedState.chapterContent) {
            document.getElementById('chapterContent').innerHTML = savedState.chapterContent;
        }
        
        // 移动输入表单到章节列表上方
        readerInputForm.classList.remove('centered');
        readerInputForm.classList.add('moved');
        
        // 添加可见类
        chaptersListContainer.classList.add('visible');
        chapterContentContainer.classList.add('visible');
        
        // 更新导航按钮状态
        updateReaderNav();
    }

    const chaptersList = document.getElementById('chaptersList');

    chaptersList.addEventListener('click', (e) => {
        e.preventDefault();
        if (e.target.tagName === 'A') {
            const chapterUrl = e.target.getAttribute('data-url');
            const chapterTitle = e.target.textContent;
            const site = document.getElementById('readerSiteSelect').value;
            window.currentChapterIndex = parseInt(e.target.parentElement.getAttribute('data-index'));
            
            const activeChapter = chaptersList.querySelector('.active-chapter');
            if (activeChapter) {
                activeChapter.classList.remove('active-chapter');
            }
            e.target.parentElement.classList.add('active-chapter');

            fetchChapterContent(site, chapterUrl)
                .then(data => {
                    if (data.error) {
                        throw new Error(data.error);
                    }
                    document.getElementById('chapterTitle').textContent = chapterTitle;
                    document.getElementById('chapterContent').innerHTML = data.content.split('\n').map(p => `<p>${p}</p>`).join('');
                    updateReaderNav();
                    
                    // 将章节内容容器滚动到顶部
                    const chapterContentContainer = document.querySelector('.chapter-content-container');
                    if (chapterContentContainer) {
                        chapterContentContainer.scrollTop = 0;
                    }
                    
                    // 保存当前状态
                    saveReaderState();
                })
                .catch(error => {
                    document.getElementById('chapterContent').innerHTML = `<p class="error-message">章节内容加载失败: ${error.message}</p>`;
                    console.error('获取章节内容时出错:', error);
                });
        }
    });

    document.getElementById('prevChapterBtn').addEventListener('click', () => {
        if (window.currentChapterIndex > 0) {
            window.currentChapterIndex--;
            playChapter(window.currentChapterIndex);
        }
    });

    document.getElementById('nextChapterBtn').addEventListener('click', () => {
        if (window.currentChapterIndex < window.chapters.length - 1) {
            window.currentChapterIndex++;
            playChapter(window.currentChapterIndex);
        }
    });
}

function playChapter(index) {
    const chapterItem = document.getElementById('chaptersList').querySelector(`li[data-index='${index}'] a`);
    if (chapterItem) {
        chapterItem.click();
        // 将章节内容容器滚动到顶部
        const chapterContentContainer = document.querySelector('.chapter-content-container');
        if (chapterContentContainer) {
            chapterContentContainer.scrollTop = 0;
        }
        // 保存当前状态
        saveReaderState();
    }
}

function updateReaderNav() {
    document.getElementById('prevChapterBtn').disabled = window.currentChapterIndex <= 0;
    document.getElementById('nextChapterBtn').disabled = window.currentChapterIndex >= window.chapters.length - 1;
}

function fetchChapters() {
    const site = document.getElementById('readerSiteSelect').value;
    const catalogUrl = document.getElementById('readerCatalogUrl').value.trim();
    if (!catalogUrl || !site) {
        alert('请选择网站并输入目录URL！');
        return;
    }
    
    const chaptersListEl = document.getElementById('chaptersList');
    chaptersListEl.innerHTML = '<div class="loader-small"></div>';

    // 隐藏输入表单，显示按钮（只有在获取章节数据后才隐藏）
    const readerInputForm = document.querySelector('.reader-input-form');
    readerInputForm.style.display = 'none';
    document.getElementById('showReaderFormBtn').style.display = 'block';

    fetchChaptersList(site, catalogUrl)
        .then(data => {
            if (data.error) {
                throw new Error(data.error);
            }
            window.chapters = data.chapters;
            window.currentChapterIndex = -1; // 重置当前章节索引
            chaptersListEl.innerHTML = '';
            window.chapters.forEach((chapter, index) => {
                const li = document.createElement('li');
                li.setAttribute('data-index', index);
                li.innerHTML = `<a href="#" data-url="${chapter.url}">${chapter.title}</a>`;
                chaptersListEl.appendChild(li);
            });
            
            // 显示章节列表和内容区域
            const chaptersListContainer = document.querySelector('.chapters-list-container');
            const chapterContentContainer = document.querySelector('.chapter-content-container');
            
            // 先显示章节列表和内容区域
            chaptersListContainer.style.display = 'block';
            chapterContentContainer.style.display = 'block';
            
            // 使用setTimeout添加可见类，确保过渡动画生效
            setTimeout(() => {
                // 移动输入表单到章节列表上方（为下次显示做准备）
                readerInputForm.classList.remove('centered');
                readerInputForm.classList.add('moved');
                
                chaptersListContainer.classList.add('visible');
                chapterContentContainer.classList.add('visible');
                
                // 保存当前状态
                saveReaderState();
            }, 50);
        })
        .catch(error => {
            chaptersListEl.innerHTML = `<p class="error-message">章节列表加载失败: ${error.message}</p>`;
            console.error('获取章节列表时出错:', error);
            
            // 显示输入表单
            readerInputForm.style.display = 'block';
            document.getElementById('showReaderFormBtn').style.display = 'none';
        });
}

// 导出函数到全局作用域
window.renderReaderUI = renderReaderUI;