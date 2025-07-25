// 全局变量
window.currentPage = 1;
window.resultsPerPage = 10;
window.allResults = {};
window.activeSite = '';
window.supportedSites = null;

// 文件路径选择功能
function showFilePathDialog(defaultFileName, callback) {
    // 创建文件路径选择对话框
    const dialog = document.createElement('div');
    dialog.className = 'file-path-dialog-overlay';
    dialog.innerHTML = `
        <div class="file-path-dialog">
            <h3>选择保存位置</h3>
            <div class="path-input-group">
                <label for="savePath">保存路径：</label>
                <input type="text" id="savePath" placeholder="选择保存路径" >
                <button id="browsePathBtn" type="button">浏览</button>
            </div>
            <div class="filename-input-group">
                <label for="fileName">文件名：</label>
                <input type="text" id="fileName" value="${defaultFileName}" placeholder="输入文件名">
                <span class="file-extension">.txt</span>
            </div>
            <div class="dialog-buttons">
                <button id="confirmSave" class="btn-primary">确定</button>
                <button id="cancelSave" class="btn-secondary">取消</button>
            </div>
        </div>
    `;
    
    document.body.appendChild(dialog);
    
    // 获取上次保存的路径
    const lastPath = localStorage.getItem('lastSavePath') || '';
    document.getElementById('savePath').value = lastPath;
    
    // 创建隐藏的文件输入元素用于路径选择
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.webkitdirectory = true; // 选择文件夹
    fileInput.style.display = 'none';
    document.body.appendChild(fileInput);
    
    // 浏览按钮事件
    document.getElementById('browsePathBtn').addEventListener('click', () => {
        fileInput.click();
    });
    
    // 文件夹选择事件
    fileInput.addEventListener('change', (e) => {
        if (e.target.files.length > 0) {
            const file = e.target.files[0];
            const path = file.webkitRelativePath.split('/')[0];
            // 获取文件的完整路径（去掉文件名部分）
            const fullPath = file.path ? file.path.substring(0, file.path.lastIndexOf('\\')) : path;
            document.getElementById('savePath').value = fullPath;
        }
    });
    
    // 确定按钮事件
    document.getElementById('confirmSave').addEventListener('click', () => {
        const savePath = document.getElementById('savePath').value.trim();
        const fileName = document.getElementById('fileName').value.trim();
        
        if (!savePath) {
            alert('请选择保存路径！');
            return;
        }
        
        if (!fileName) {
            alert('请输入文件名！');
            return;
        }
        
        // 保存路径到localStorage
        localStorage.setItem('lastSavePath', savePath);
        
        // 构建完整的文件路径
        // 规范化路径分隔符处理
        let fullPath;
        // 在JavaScript字符串中，'\\' 表示一个反斜杠字符
        if (savePath.endsWith('\\')) {
            // 如果路径已经以反斜杠结尾，直接拼接文件名
            fullPath = `${savePath}${fileName}.txt`;
        } else {
            // 否则添加一个反斜杠再拼接
            fullPath = `${savePath}\\${fileName}.txt`;
        }
        
        // 清理DOM
        document.body.removeChild(dialog);
        document.body.removeChild(fileInput);
        
        // 调用回调函数
        callback(fullPath);
    });
    
    // 取消按钮事件
    document.getElementById('cancelSave').addEventListener('click', () => {
        document.body.removeChild(dialog);
        document.body.removeChild(fileInput);
    });
    
    // 点击遮罩层关闭对话框
    dialog.addEventListener('click', (e) => {
        if (e.target === dialog) {
            document.body.removeChild(dialog);
            document.body.removeChild(fileInput);
        }
    });
}