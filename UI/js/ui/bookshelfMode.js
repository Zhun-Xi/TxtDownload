// 渲染书架模式UI
function renderBookshelfUI() {
    let bookshelfContainer = document.getElementById('bookshelfContainer');
    if (!bookshelfContainer) {
        bookshelfContainer = document.createElement('div');
        bookshelfContainer.id = 'bookshelfContainer';
        bookshelfContainer.className = 'bookshelf-container'; // 为书架容器添加样式类
        bookshelfContainer.innerHTML = `
            <h3 class="section-title">我的书架</h3>
            <div class="books-grid" id="bookshelfGrid">
                <!-- 书架内容将在这里填充 -->
                <p>书架是空的，快去添加你喜欢的书吧！</p>
            </div>
        `;
        document.getElementById('contentArea').parentNode.insertBefore(bookshelfContainer, document.getElementById('contentArea').nextSibling);
    }
    bookshelfContainer.style.display = 'block';
    // 未来可以在这里添加从本地存储加载书架数据的逻辑
}

// 导出函数到全局作用域
window.renderBookshelfUI = renderBookshelfUI;