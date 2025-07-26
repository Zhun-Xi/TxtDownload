# 小说爬虫项目说明文档

## 项目概述
本项目是一个基于Python的小说爬虫系统，可以从多个网站搜索、下载和阅读小说。系统采用模块化设计，通过继承基类 Novel 来实现对不同网站的爬虫支持，并使用Flask提供Web服务接口。


## 目录结构
"""
├── UI/                   # 前端界面
│   ├── css/              # 样式文件
│   ├── js/               # JavaScript文件
│   └── index.html        # 主页面
├── main/                 # 后端主程序
│   ├── CrawlerManager.py # 爬虫管理器
│   └── ServiceProvider.py # Web服务提供者
├── 爬虫实现/              # 爬虫模块
│   ├── Novel.py          # 爬虫基类
│   ├── Book365.py        # 365小说网爬虫
│   └── 我的书城网.py       # 我的书城网爬虫
├── requirements.txt      # 依赖库清单
└── 启动小说爬虫.bat        # 一键启动脚本
"""


## 系统架构
1.  前端 ：基于HTML、CSS和JavaScript的Web界面，提供搜索、下载、阅读等功能。
2.  后端 ：Flask Web服务，处理前端请求并调用爬虫模块。
3.  爬虫模块 ：基于 Novel 基类的各网站爬虫实现。
4.  爬虫管理器 ：动态加载和管理爬虫模块。


## 依赖项

### Web框架
flask>=2.0.0
flask-cors>=3.0.0

### 异步支持
asyncio>=3.4.3
aiohttp>=3.8.0

### 网页解析
requests>=2.25.0
lxml>=4.6.0
beautifulsoup4>=4.9.0

### 浏览器自动化
selenium>=4.0.0
webdriver-manager>=3.5.0


## 如何添加新的爬虫模块

### Novel基类解析
Novel 类是所有爬虫的基类，它定义了爬虫的基本结构和方法。以下是关键部分的解析：

#### 类属性
 class Novel(ABC):
    name = ''  # 网站名称，必须重写
    link = ''  # 网站链接，必须重写

#### 实例属性
def __init__(self, dic_url='', book_name='', writer='', web_site='', web_name=''):
    self.Website = web_site        # 子类实现的网站
    self.Web_name = web_name       # 网站名称
    self.detail_url = None         # 详细页的url
    self.dic_url = dic_url         # 目录的第一页url
    self.book_name = book_name     # 书名
    self.writer = writer           # 作者
    self.chapters_list = {}        # 章节字典{'章节名': 'url'}
    self.title_content = {}        # 章节内容字典{'章节名':'章节内容'}
    self.all_chapter_content = ''   # 全部章节内容

#### 核心方法
1. 必须实现的抽象方法 ：
@classmethod
@abstractmethod
def GetChaptersList(cls, dic_url) -> dict:
    '''获取章节列表，返回字典 {'章节名': '章节url'}'''
    pass

@classmethod
@abstractmethod
def GetChapterContent(cls, url) -> str:
    '''获取章节内容，返回字符串'''
    pass

2. 应当实现的方法 ：
@classmethod
def GetBookUrlFromBookName(cls, book_name, writer='') -> list[list]:
    '''从书名获取书籍信息，返回列表 [[书名, 作者, 封面url, 详细页url], ...]'''
    pass

@classmethod
def GetBookName(cls, dic_url) -> str:
    '''获取书名'''
    pass

@classmethod
def GetBookWirter(cls, dic_url) -> str:
    '''获取作者'''
    pass

3. 通用工具方法 ：
@classmethod
def GetUrl(cls, url, timeout=5, other_headers={}, repeat=5, **kwargs):
    '''具有反反爬机制的获取url内容方法'''
    # 实现细节...

@classmethod
def SaveData(cls, save_path=None, data=None):
    '''保存数据到文件'''
    # 实现细节...


### 创建新爬虫模块的步骤
1. 1.创建新的Python文件
在 爬虫实现 目录下创建一个新的Python文件，如 新网站.py 。

2. 1.导入基类
from Novel import *

1.定义爬虫类
class 新网站(Novel):
    name = "新网站名称"  # 必须设置，显示在界面上
    link = "https://www.example.com/"  # 必须设置，网站主页链接
    
    def __init__(self, dic_url='', book_name='', writer=''):
        super().__init__(dic_url, book_name, writer, 
                         web_site="https://www.example.com/", 
                         web_name="新网站名称")              


## 系统自动加载机制
CrawlerManager 类会自动扫描 爬虫实现 目录下的所有Python文件，并加载符合条件的爬虫类


## 启动和使用
1. 双击 启动小说爬虫.bat 文件启动服务
2. 在浏览器中访问 http://localhost:1234
3. 使用界面搜索、下载和阅读小说


## 许可证
本项目仅供学习和研究使用，请勿用于商业或非法用途。使用本项目时请遵守相关法律法规和网站的使用条款。
