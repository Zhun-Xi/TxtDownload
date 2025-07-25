// 渲染直接下载模式UI
function renderDirectDownloadUI() {
    let downloadForm = document.getElementById('directDownloadForm');
    if (!downloadForm) {
        downloadForm = document.createElement('div');
        downloadForm.id = 'directDownloadForm';
        downloadForm.className = 'direct-download-container';
        downloadForm.innerHTML = `
            <h3 class="section-title">直接下载</h3>
            <div class="download-form">
                <input type="text" id="bookURL" placeholder="输入小说目录页URL">
                <select id="siteSelect" class="site-select"></select>
                <button id="directDownloadBtn">开始下载</button>
            </div>
            <div id="downloadStatus"></div>
        `;
        document.getElementById('contentArea').parentNode.insertBefore(downloadForm, document.getElementById('contentArea').nextSibling);

        document.getElementById('directDownloadBtn').addEventListener('click', handleDirectDownload);
    }

    // 使用缓存的网站数据填充下拉框
    fetchSupportedSites().then(sites => {
        const siteSelect = document.getElementById('siteSelect');
        siteSelect.innerHTML = '<option value="">请选择网站</option>'; // 默认选项
        for (const siteName in sites) {
            const option = document.createElement('option');
            option.value = siteName;
            option.textContent = siteName;
            siteSelect.appendChild(option);
        }
    });

    downloadForm.style.display = 'block';
}

// 处理直接下载按钮点击事件
function handleDirectDownload() {
    const url = document.getElementById('bookURL').value.trim();
    const selectedSite = document.getElementById('siteSelect').value;
    const statusDiv = document.getElementById('downloadStatus');

    if (!selectedSite) {
        statusDiv.innerHTML = `<p style="color: red;">请选择一个网站！</p>`;
        return;
    }

    if (!url) {
        statusDiv.innerHTML = `<p style="color: red;">请输入书籍的URL！</p>`;
        return;
    }

    // 显示文件路径选择对话框
    showFilePathDialog('未知小说', (filePath) => {
        statusDiv.innerHTML = `<p>开始从 ${selectedSite} 下载到: ${filePath}</p>`;
        
        // 向后端发送下载请求，包含文件路径
        downloadBook(selectedSite, url, filePath)
            .then(data => {
                if (data.message) {
                    statusDiv.innerHTML += `<p style="color: green;">${data.message}</p>`;
                } else if (data.error) {
                    statusDiv.innerHTML += `<p style="color: red;">下载失败: ${data.error}</p>`;
                }
            })
            .catch(error => {
                console.error('下载操作失败:', error);
                statusDiv.innerHTML += `<p style="color: red;">下载请求失败，请检查网络和后端服务。</p>`;
            });
    });
}

// 导出函数到全局作用域
window.renderDirectDownloadUI = renderDirectDownloadUI;