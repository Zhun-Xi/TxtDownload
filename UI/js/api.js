// 获取支持的网站列表
async function fetchSupportedSites() {
    // 如果已经有缓存数据，直接使用
    if (window.supportedSites) {
        return Promise.resolve(window.supportedSites);
    }
    
    // 否则请求新数据
    return fetch('http://127.0.0.1:1234/search/supported')
        .then(response => response.json())
        .then(sites => {
            window.supportedSites = sites; // 缓存数据
            return sites;
        })
        .catch(error => {
            console.error('获取支持的网站列表失败:', error);
            return {};
        });
}

// 搜索书籍
async function searchBook(query) {
    return fetch(`http://127.0.0.1:1234/search/book?book_name=${encodeURIComponent(query)}`)
        .then(response => response.json())
        .catch(error => {
            console.error('搜索请求失败:', error);
            throw error;
        });
}

// 获取章节列表
async function fetchChaptersList(site, catalogUrl) {
    return fetch(`http://127.0.0.1:1234/search/chapters_list?web_name=${encodeURIComponent(site)}&dir_url=${encodeURIComponent(catalogUrl)}`)
        .then(response => response.json())
        .catch(error => {
            console.error('获取章节列表时出错:', error);
            throw error;
        });
}

// 获取章节内容
async function fetchChapterContent(site, chapterUrl) {
    return fetch(`http://127.0.0.1:1234/download/chapter?web_name=${encodeURIComponent(site)}&url=${encodeURIComponent(chapterUrl)}`)
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return response.json();
        })
        .catch(error => {
            console.error('获取章节内容时出错:', error);
            throw error;
        });
}

// 下载书籍
async function downloadBook(webName, dicUrl, filePath) {
    return fetch(`http://127.0.0.1:1234/download/book?web_name=${encodeURIComponent(webName)}&dic_url=${encodeURIComponent(dicUrl)}&file_path=${encodeURIComponent(filePath)}`)
        .then(response => {
            if (!response.ok) {
                throw new Error('下载请求失败');
            }
            return response.json();
        })
        .catch(error => {
            console.error('下载书籍时出错:', error);
            throw error;
        });
}