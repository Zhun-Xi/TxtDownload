@echo off
chcp 65001 >nul
title 小说爬虫服务启动
echo 正在启动小说爬虫服务...
echo.

cd /d "%~dp0"

:: 检查Python是否安装
python --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [错误] 未检测到Python环境，请安装Python 3.6+
    echo 按任意键退出...
    pause >nul
    exit /b
)

:: 检查并安装依赖项
echo 检查必要的依赖项...
if exist requirements.txt (
    echo 正在安装依赖项...
    pip install -r requirements.txt
    if %errorlevel% neq 0 (
        echo [警告] 部分依赖项安装失败，程序可能无法正常运行
        echo 按任意键继续...
        pause >nul
    )
) else (
    echo [警告] 未找到requirements.txt文件，将尝试安装基本依赖
    pip install flask flask-cors asyncio aiohttp requests lxml beautifulsoup4 selenium webdriver-manager
)

echo 所有依赖已就绪
echo.
echo 正在启动服务...
echo 服务启动后将自动打开浏览器
echo 请勿关闭此窗口，关闭窗口将停止服务
echo.

:: 启动服务器并在5秒后打开浏览器
start "" cmd /c "timeout /t 5 >nul && start http://localhost:1234"

:: 启动Flask应用
python main\ServiceProvider.py