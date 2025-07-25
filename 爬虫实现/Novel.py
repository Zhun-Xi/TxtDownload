import os
import time
import random
import re
from abc import ABC, abstractmethod

import requests
import lxml
from lxml import etree
from lxml import html
from bs4 import BeautifulSoup
from urllib.parse import urljoin
from urllib.parse import quote

from webdriver_manager.microsoft import EdgeChromiumDriverManager
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.common import exceptions
from selenium.webdriver.edge.service import Service
from selenium.webdriver.support.relative_locator import locate_with, with_tag_name


class Novel(ABC):
    '''
        一个类实现对一个网站信息的获取
        一个实例应只对应一本书

        对于网站信息的获取、书籍信息的单一信息获取应使用类方法
        对于一键式的整本书的获取应使用实例方法

        类属性：  必须重写
            name: 网站名
            link: 网站链接
        实例属性中的: 必须提供
            Website: 网站链接
            Web_name: 网站名
    '''

    name = ''
    link = ''


    # 初始化
    def __init__(self, dic_url='', book_name='', writer='', web_site='', web_name=''):
        self.Website = web_site        # 子类实现的网站
        self.Web_name = web_name

        self.detail_url = None        # 详细页的url（如果有）
        self.dic_url = dic_url        # 正在爬的书的目录的第一页的url
        self.book_name = book_name    # 正在爬的书的书名
        self.writer = writer          # 正在爬的书的作者

        self.chapters_list:dict = {}   # 正在爬的书的章节字典{'章节名': 'url'}
        self.title_content:dict = {}   # 章节和对应内容的字典{'章节名':'章节内容'}
        self.all_chapter_content = ''  # 正在爬的书的全部章节内容

        os.environ['WDM_DIR'] = './web_driver'     # 设置驱动存储目录
        os.environ['WDM_HTTPCLIENT'] = 'requests'  # 使用requests库下载
        os.environ['WDM_CHROMEDRIVER_URL'] = 'https://npm.taobao.org/mirrors/edgedriver'  # 淘宝镜像
    
    # 设置书籍信息
    def SetBookInfo(self, dic_url=None, book_name=None, writer=None):
        if not dic_url is None: self.dic_url = dic_url
        if not book_name is None: self.book_name = book_name
        if not writer is None: self.writer = writer


    # 获取整本书籍，若不提供数据默认爬取现在的书。提供继爬功能,默认继爬。
    def GetBook(self, dic_url=None, book_name=None, writer=None, is_new=False, save_path=None):   # save_path为完整的路径
        # 若爬的书有变更，更新数据
        if not dic_url is None: self.dic_url = dic_url
        if not book_name is None: self.book_name = book_name
        if not writer is None: self.writer = writer

        # 获取章节列表
        if self.dic_url: self.chapters_list = self.__class__.GetChaptersList(self.dic_url)    # 已经有url，直接爬
        elif self.book_name:     # 没url就通过书名获取
            self.dic_url = self.__class__.GetBookUrlFromBookName(self.book_name, self.writer)[0][-1]  # 爬搜出的第一本
            if self.dic_url : self.chapters_list = self.__class__.GetChaptersList(self.dic_url)
            elif not self.dic_url: print("未找到该书")
        else: 
            print("请输入url或书名")
            return

        print(f'正在获取作者和书名')

        # 更新成正确的现在的书名和作者名
        writer = self.__class__.GetBookWirter(self.dic_url)
        book_name = self.__class__.GetBookName(self.dic_url)
        self.writer = writer
        self.book_name = book_name

        self.ClearChapterContent()

        if save_path is None : save_path = os.path.join('.', f'{book_name}_{writer}.txt')
        else:
            if not os.path.exists(os.path.dirname(save_path)): os.makedirs(os.path.dirname(save_path))

        # 获取并保存章节内容
        if not is_new:
            saved_chapters = self.__class__.SavedChapter(save_path)
            if saved_chapters in [1, 2] : saved_chapters = []

        start_crawling = False if saved_chapters else True
        last_saved_chapter = saved_chapters[-1] if saved_chapters else None

        for title, url in self.chapters_list.items():
            # 检测并跳过已保存的章节
            if not start_crawling:
                if title == last_saved_chapter : 
                    start_crawling = True
                    print(f'即将从 {last_saved_chapter} 之后开始爬')
                    with open(save_path, 'r', encoding='utf-8') as f : self.all_chapter_content = f.read()
                continue

            content = self.__class__.GetChapterContent(url).strip().replace('\n\n', '\n')
            self.title_content[title] = content
            self.all_chapter_content += '\n\n\n\n' + title + '\n\n' +content.replace('\n', '\n\n')

            data = f'书名： {self.book_name}' + '\n' + f'作者： {self.writer}' + '\n\n' + self.all_chapter_content
            self.__class__.SaveData(save_path=save_path, data=data)
            print(f"已获取 {title}")

    # 从用户提供的书名获取url，ai不用实现这里
    @classmethod
    def GetBookUrlFromBookName(cls, book_name, writer='') -> list[list]:
        '''
            :return: list[list[书名, 作者, 封面url, 详细页url]]
        '''
        pass

    # 获取书名
    @classmethod
    def GetBookName(cls, dic_url) -> str:
        pass
    
    # 获取作者
    @classmethod
    def GetBookWirter(cls, dic_url) -> str:
        pass

    # 获取章节列表
    @classmethod
    @abstractmethod
    def GetChaptersList(cls, dic_url) -> dict:
        '''
        章节字典结构：
        {
            '章节1': '章节1的url',
            '章节2': '章节2的url',
            ...
        }
        '''
        pass

    # 获取章节内容
    @classmethod
    @abstractmethod
    def GetChapterContent(cls, url) -> str:
        pass

    def ClearChapterContent(self):
        self.chapter_content = ''
    
    # 保存数据
    @classmethod
    def SaveData(cls, save_path=None, data=None):
        if save_path is None : save_path = os.path.join('.', f'{self.book_name}_{self.writer}.txt')

        if os.path.exists(save_path):
            if os.path.isfile(save_path): file_path = save_path
            else: file_path = os.path.join(save_path, f'{self.book_name}.txt')
        else : 
            os.makedirs(os.path.dirname(save_path), exist_ok=True)
            file_path = save_path

        with open(file_path, 'w', encoding='utf-8') as f:
            f.write(data)

    # 检测已保存的章节(返回已保存的最后章节)
    @classmethod
    def SavedChapter(cls, file_path) -> str:   # file_path应为一个完整文件路径
        try:
            with open(file_path, 'r', encoding='utf-8') as f: content = f.read()
            titles = re.findall(r'\n\n\n\n+(.*?)\n\n', content, re.MULTILINE)
            return titles
        except FileNotFoundError:  # 文件不存在
            return 1
        except PermissionError:    # 无权限访问
            return 2

    # 具有一定反反爬机制的获取url
    @classmethod
    def GetUrl(cls, url, timeout=5, other_headers={}, repeat=5,**kwargs):

        headers = {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
            }

        for i in range(repeat):
            try:
                
                headers.update(other_headers)

                time.sleep(random.uniform(0.5, 1.5)) # 随机延迟
                res = requests.get(url, headers=headers, timeout=timeout, **kwargs)
                res.raise_for_status()  # 如果请求失败则抛出异常

                if res.encoding.lower() == 'iso-8859-1':
                    # 优先检查HTML meta标签中的编码声明
                    content_type = res.headers.get('Content-Type', '').lower()
                    if 'charset=' in content_type:
                        res.encoding = content_type.split('charset=')[1].split(';')[0].strip()
                    else:
                        # 使用更智能的编码检测
                        res.encoding = res.apparent_encoding

                return res.text
            except requests.exceptions.RequestException as e:
                print(f"获取URL {url} 时出错: {e}，正在进行第 {i+1} 次重试...")
                time.sleep(i * 2) # 增加重试的等待时间
            except Exception as e:
                print(f"发送未知错误: {e}，正在进行第 {i+1} 次重试...")
                time.sleep(i * 2) # 增加重试的等待时间
        return None

