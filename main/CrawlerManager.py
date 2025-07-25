import os
import importlib
import inspect
import sys
import asyncio
import aiohttp
import logging
from logging.handlers import RotatingFileHandler

# 将爬虫实现目录添加到系统路径中，以便可以导入其中的模块
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '爬虫实现')))

from Novel import Novel




class CrawlerManager:
    def __init__(self):
        self._setup_logging()

        self.classes = []  # 所有类
        self.searchable_classes = []
        self.searched_books:dict[list] = {}  #　｛类：搜索结果｝
        self.ImportClasses()

    def _setup_logging(self):
        """配置日志系统"""
        self.logger = logging.getLogger('CrawlerManager')
        self.logger.setLevel(logging.DEBUG)
        self.logger.propagate = False  # 防止日志传播到根日志器
        
        # 清除所有现有处理器，避免重复添加
        if self.logger.hasHandlers():
            self.logger.handlers.clear()
        
        # 控制台处理器
        console_handler = logging.StreamHandler()
        console_handler.setLevel(logging.INFO)
        console_formatter = logging.Formatter('%(asctime)s - %(levelname)s - %(message)s')
        console_handler.setFormatter(console_formatter)

        # 文件处理器（自动轮转）
        file_handler = RotatingFileHandler(
            'spider_manager.log',
            maxBytes=10*1024*1024,  # 10MB
            backupCount=5,
            encoding='utf-8'
        )
        file_handler.setLevel(logging.DEBUG)
        file_formatter = logging.Formatter(
            '%(asctime)s - %(name)s - %(levelname)s - %(message)s'
        )
        file_handler.setFormatter(file_formatter)
        

        # 添加处理器
        self.logger.addHandler(console_handler)
        self.logger.addHandler(file_handler)

    async def AsyncSearch(self, cls, book_name, writer):
        """封装同步搜索方法为异步操作"""
        try:
            # 使用线程池执行同步IO操作
            loop = asyncio.get_running_loop()
            return await loop.run_in_executor(
                None, 
                cls.GetBookUrlFromBookName, 
                book_name, 
                writer
            )

        except Exception as e:
            return e  # 返回异常供外层处理

    # 搜索书籍
    async def SearchBook(self, book_name: str, writer:str='') -> dict[list]:
        """
        搜索书籍
        :param book_name: 书名
        :param writer: 作者
        :return: dict[list] { 实例 : [ [书名, 作者, 封面url, 详细页url], ... ] }
        """
        searched_books = {}

        # 创建异步任务列表
        tasks = [
            self.AsyncSearch(cls, book_name, writer)
            for cls in self.searchable_classes
        ]
        
        # 并发执行所有搜索任务
        results = await asyncio.gather(*tasks, return_exceptions=True)

        # 处理结果
        for cls, result in zip(self.searchable_classes, results):
            if isinstance(result, Exception):
                self.logger.error(
                    f"爬虫 {cls.name} 搜索失败",
                    exc_info=result  # 记录完整异常堆栈
                )
            elif result:  # 当有有效结果时
                searched_books[cls] = result
                self.logger.info(
                    f"爬虫 {cls.name} 返回 {len(result)} 条结果"
                )
                
        self.searched_books = searched_books

        return searched_books


    def ImportClasses(self):
        folder_path = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '爬虫实现'))
        for filename in os.listdir(folder_path):
            if filename.endswith('.py') and filename != 'Novel.py' and not filename.startswith('__'):
                module_name = filename[:-3]
                try:
                    module = importlib.import_module(module_name)   # 动态导入模块
                    # 遍历模块中的所有类
                    for name, obj in inspect.getmembers(module, inspect.isclass):
                        if issubclass(obj, Novel) and obj is not Novel:  # 检查类是否是Noval的子类(但不是Noval本身)
                            # 检查是否存在 name 和 link 类属性且非空
                            if not hasattr(obj, 'name') or getattr(obj, 'name', '') == '':
                                self.logger.error(f"跳过类 {name}: name 类属性缺失或为空")
                                continue
                            if not hasattr(obj, 'link') or getattr(obj, 'link', '') == '':
                                self.logger.error(f"跳过类 {name}: link 类属性缺失或为空")
                                continue

                            # 添加到classes字典中
                            self.classes.append(obj)
                            self.logger.info(f"成功实例化 {name} from {filename}")
                            # print(f"成功实例化 {name} from {filename}")

                            # 检查 GetBookUrlFromBookName 是否被重写
                            if 'GetBookUrlFromBookName' in obj.__dict__:
                                self.searchable_classes.append(obj)
                                self.logger.debug(f"{name} 已添加到 searchable_classes")
                                # print(f"  -> {name} 已被添加到 searchable_classes")

                except Exception as e:
                    # 如果导入或实例化过程中出现错误，打印错误信息
                    self.logger.error(f"导入或实例化模块 {module_name} 时出错: {e}")
                    # print(f"导入或实例化模块 {module_name} 时出错: {e}")

async def main():
    """异步测试入口"""
    manager = CrawlerManager()
    print("\n可搜索的爬虫实例:")
    for cls in manager.searchable_classes:
        print(cls.link)

    print("\n正在异步搜索...")
    await manager.SearchBook('斗罗大陆')
    
    print("\n搜索结果:")
    for cls, result in manager.searched_books.items():
        print(f"\n{cls.name} 搜索结果({len(result)}条):")
        for book in result[:3]:  # 显示前3条结果
            print(f"  -> 书名: {book[0]}, 作者: {book[1]}, 封面：{book[2]}, 目录：{book[3]}")

if __name__ == '__main__':
    asyncio.run(main())