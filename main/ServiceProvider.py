from flask import Flask, request, jsonify, render_template, send_from_directory
from flask_cors import CORS
from CrawlerManager import CrawlerManager
import asyncio
import aiohttp
import logging
from logging.handlers import RotatingFileHandler
import os

# 获取UI目录的绝对路径
UI_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'UI')

app = Flask(__name__, static_folder=UI_DIR)
CORS(app)
manager = CrawlerManager()


@app.route('/search/supported', methods=['GET'])
def GetSupported():
    '''
        :return: dict  { '网站名': '网站网址', ... }
    '''
    response = {}
    for cls in manager.classes: response[cls.name] = cls.link
    return jsonify(response)

@app.route('/search/book', methods=['GET'])
def SearchBook():
    '''
        :param book_name: 书籍名称
        :param writer: 作者
        :return: list[list]   [ ['网站名','网站网址', [[书名, 作者, 封面url, 详细页url], ... ]] , ... ]
    '''
    book_name = request.args.get('book_name')
    writer = request.args.get('writer', '')

    if not book_name:
        return jsonify({"error": "请提供书籍名称(book_name)"}), 400

    search_results = asyncio.run(manager.SearchBook(book_name, writer))  # 同步执行异步函数
    if not search_results : return jsonify({"error": "所有爬虫搜索失败"}), 503
    
    response = []
    for cls, books in search_results.items():
        response.append([
            cls.name,
            cls.link,
            books
        ])

    return jsonify(response)

@app.route('/search/chapters_list', methods=['GET'])
def GetChaptersList():
    '''
        :param web_name: 网站名
        :param dir_url: 目录url
        :return: dict   { '章节名': '章节url' , ... }
    '''
    web_name = request.args.get('web_name')
    dir_url = request.args.get('dir_url')

    print(web_name, dir_url)

    if not web_name or not dir_url:
        return jsonify({"error": "请提供网站名(web_name)和目录链接(dir_url)"}), 400

    crawler_class = None
    for cls in manager.classes:
        print(cls.name)
        if cls.name == web_name:
            crawler_class = cls
            break

    if not crawler_class:
        return jsonify({"error": "未找到对应的爬虫类"}), 404

    try:
        chapters_dict = crawler_class.GetChaptersList(dir_url)
        # 将字典转换为前端期望的列表格式
        chapters_list = [{'title': title, 'url': url} for title, url in chapters_dict.items()]
        return jsonify({'chapters': chapters_list})
    except Exception as e:
        return jsonify({"error": f"获取章节列表时出错: {str(e)}"}), 500

@app.route('/download/book', methods=['GET'])
def DownloadBook():
    '''
        :param web_name: 网站名
        :param dic_url: 书籍目录链接
        :param path: 保存路径
        :return: str: 书籍内容
    '''
    
    web_name = request.args.get('web_name')
    dic_url = request.args.get('dic_url')
    path = request.args.get('file_path')
    if not path : path = '.'

    print(web_name, dic_url, path)


    if not web_name or not dic_url:
        return jsonify({"error": "请提供网站名(web_name), 书籍目录链接(dic_url)"}), 400

    # 创建一个新的实例下载此书
    crawler_class = None
    for cls in manager.classes:
        if cls.name == web_name:
            crawler_class = cls

    if crawler_class:
        try:
            # 为每个请求创建一个新的实例
            crawler_instance = crawler_class()
            crawler_instance.GetBook(dic_url=dic_url, save_path=path)
            # 由于GetBook是耗时操作，立即返回一个通用成功消息更合理
            book_name = crawler_instance.book_name if crawler_instance.book_name else "未知书籍"
            return jsonify({"message": f"'{book_name}' 已开始下载."}), 200
        except Exception as e:
            return jsonify({"error": f"下载书籍时出错: {str(e)}"}), 500
    else:
        return jsonify({"error": "未找到对应的爬虫实例"}), 404


@app.route('/download/chapter', methods=['GET'])
def DownloadChapter():
    '''
        :param web_name: 网站名
        :param url: 章节链接
        :return: str: 章节内容
    '''
    web_name = request.args.get('web_name')
    chapter_url = request.args.get('url')

    if not web_name or not chapter_url:
        return jsonify({"error": "请提供网站名(web_name)和章节链接(url)"}), 400

    crawler_class = None
    for cls in manager.classes:
        if cls.name == web_name:
            crawler_class = cls
            break

    if not crawler_class:
        return jsonify({"error": "未找到对应的爬虫类"}), 404

    try:
        # 为每个请求创建一个新的实例
        chapter_content = crawler_class.GetChapterContent(url=chapter_url)
        if not chapter_content:
            return jsonify({"error": "下载章节失败"}), 500
        return jsonify({"content": chapter_content})
    except Exception as e:
        return jsonify({"error": f"下载章节时出错: {str(e)}"}), 500

@app.route('/')
def index():
    return send_from_directory(UI_DIR, 'index.html')

@app.route('/<path:path>')
def serve_static(path):
    return send_from_directory(UI_DIR, path)

if __name__ == '__main__':
    app.run(port=1234, debug=True, threaded=True)
