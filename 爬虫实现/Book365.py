from Novel import *


class Book365(Novel):
    name = "365小说网"
    link = "http://www.shukuge.com/"

    def __init__(self, dic_url='', book_name='', writer=''):
        super().__init__(dic_url, book_name, writer, web_site="http://www.shukuge.com/", web_name="365小说网")
    
    # 从书名获取url
    @classmethod
    def GetBookUrlFromBookName(cls, book_name, writer='') -> list[list]:
        res = Novel.GetUrl(f"http://www.shukuge.com/Search?wd={quote(book_name+' '+writer)}")

        pattern = r'<div class="listitem clearfix">.*?<a href="(.*?)".*?<img src="(.*?)".*?<h2>(.*?)</h2>.*?<span>作者：(.*?)</span>'
        books = re.findall(pattern, res, re.DOTALL)
        
        result = []
        for book in books:
            book_url, cover_url, title, author = book
            # 确保URL是完整的（添加域名前缀）
            if not book_url.startswith('http'):
                book_url = f'http://www.shukuge.com{book_url}' + 'index.html'
            if not cover_url.startswith('http'):
                cover_url = f'http://www.shukuge.com{cover_url}'
            
            result.append([title.strip(), author.strip(), cover_url, book_url])
        return result

    # 获取书名
    @classmethod
    def GetBookName(cls, dic_url) -> str:
        html = Novel.GetUrl(dic_url)
        if html:
            selector = etree.HTML(html)
            # 根据实际页面结构调整XPath
            title = selector.xpath("//meta[@name='keywords']/@content")
            if title:
                return title[0].split(',')[0]
        return '' # 如果获取失败，返回初始书名

    # 获取作者
    @classmethod
    def GetBookWirter(cls, dic_url) -> str:
        html = Novel.GetUrl(dic_url)
        if html:
            selector = etree.HTML(html)
            # 根据实际页面结构调整XPath
            writer = selector.xpath("substring-after(//div[contains(@class, 'bookd-title')]/dd/text()[1], '作者：')")
            if writer:
                return writer
        return '' # 如果获取失败，返回初始作者

    # 获取章节列表
    @classmethod
    def GetChaptersList(cls, dic_url) -> set[tuple]:
        chapters = {}
        html = Novel.GetUrl(dic_url)
        if not html:
            return chapters

        selector = etree.HTML(html)
        # 注意：这里的XPath表达式需要根据实际网页结构进行调整
        chapter_elements = selector.xpath('//div[@id="list"]/dl/dd/a')

        for element in chapter_elements:
            title = element.text
            url = element.get('href')
            if title and url:
                full_url = urljoin(dic_url, url)
                chapters[title] = full_url
        
        print(f"总共找到 {len(chapters)} 个章节。")
        return chapters

    # 获取章节内容
    @classmethod
    def GetChapterContent(cls, url) -> str:
        html = Novel.GetUrl(url)
        if not html:
            return ""
        
        selector = etree.HTML(html)
        content_elements = selector.xpath('//div[@id="content"]/text()')
        content = '\n'.join([line.strip() for line in content_elements if line.strip()])
        return content
    


if __name__ == '__main__':
    # 小说目录页URL
    # novel_url = 'http://www.365book.net/book/169449/index.html'
    # novel_title = '带着空间养兽夫，恶雌成团宠了'
    # crawler = Book365(dic_url=novel_url, book_name=novel_title)
    print(Book365.GetChapterContent('http://www.shukuge.com/book/169449/53832193.html'))
