from Novel import *

class WodeShuCheng(Novel):
    name = "我的书城网"
    link = "https://www.wodeshucheng.net/"
    

    def __init__(self, dic_url='', book_name='', writer=''):
        super().__init__(dic_url, book_name, writer, web_site="https://www.wodeshucheng.net/", web_name="我的书城网")
    
    # 从书名获取url
    @classmethod
    def GetBookUrlFromBookName(cls, book_name, writer='') -> list[list]:
        book_list = []
        headers = {
        "authority": "www.sososhu.com",
        "method": "GET",
        "path": f"/?q={book_name+'+'+writer}&site=5scw&Submit=%E6%90%9C%E7%B4%A2",
        "scheme": "https",
        "accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7",
        "accept-encoding": "gzip, deflate, br, zstd",
        "accept-language": "zh-CN,zh;q=0.9,en;q=0.8,en-GB;q=0.7,en-US;q=0.6",
        "cache-control": "max-age=0",
        "dnt": "1",
        "priority": "u=0, i",
        "referer": "https://www.sososhu.com/",
        "sec-ch-ua": "\"Not)A;Brand\";v=\"8\", \"Chromium\";v=\"138\", \"Microsoft Edge\";v=\"138\"",
        "sec-ch-ua-mobile": "?0",
        "sec-ch-ua-platform": "\"Windows\"",
        "sec-fetch-dest": "document",
        "sec-fetch-mode": "navigate",
        "sec-fetch-site": "cross-site",
        "sec-fetch-user": "?1",
        "sec-gpc": "1",
        "upgrade-insecure-requests": "1",
        "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36 Edg/138.0.0.0"
        }

        params = {"q": book_name+'+'+writer, "site": "5scw", 'Submit':'搜索'}
        res = Novel.GetUrl("https://www.sososhu.com/", params=params)
        tree = etree.fromstring(res, etree.HTMLParser(encoding="utf-8"))
        
        for item in tree.xpath('//div[contains(@class, "block so_list")]//div[contains(@class, "item")]'):
            try:
                # 提取封面URL
                img = item.xpath('.//div[contains(@class, "image")]//img[1]')
                cover_url = img[0].get('src') if img else ""
                
                # 提取详情页URL
                link = item.xpath('.//div[contains(@class, "image")]//a[1]')
                detail_url = link[0].get('href') if link else ""
                
                # 提取书名和作者
                dt = item.xpath('.//dl/dt')[0] if item.xpath('.//dl/dt') else None
                if dt is None:
                    continue
                    
                author_span = dt.xpath('.//span[1]')
                author = author_span[0].text.strip() if author_span else ""
                
                title_a = dt.xpath('.//a[1]')
                title = title_a[0].text.strip() if title_a else ""
                
                # 添加到结果列表
                if title:  # 只添加有效书籍
                    book_list.append([title, author, cover_url, detail_url])
                    
            except Exception as e:
                print(f"书籍解析错误: {e}")
                continue
        
        return book_list

    @classmethod
    def GetBookName(cls, dic_url) -> str:
        res = Novel.GetUrl(dic_url)
        if res:
            tree = html.fromstring(res)

            # 两种提取方案
            title = tree.xpath(r'//meta[@property="og:novel:book_name"]/@content')
            if not title : title = tree.xpath(r'//div[contains(@class, "detail-box")]//h1/text()')

        return title[0].strip() if title else ''
    
    @classmethod
    def GetBookWirter(cls, dic_url) -> str:
        res = Novel.GetUrl(dic_url)
        if res:
            tree = html.fromstring(res)

            # 两种提取方案
            writer = tree.xpath(r'//meta[@property="og:novel:author"]/@content')
            if not writer : writer = tree.xpath(r'//div[contains(@class, "detail-box")]//div[@class="info"]//p[contains(., "作")]/a/text()')

        return writer[0].strip() if writer else ''

    @classmethod
    def GetChaptersList(cls, dic_url) -> dict:
        chapters = {}
        res = Novel.GetUrl(dic_url)
        if not res:
            return chapters

        tree = html.fromstring(res)

        novel_title = tree.xpath('//title/text()')[0].split('_')[0].strip()
        if not novel_title:
            return chapters

        # 定位章节列表
        chapter_elements = tree.xpath(r'//h2[contains(text(), "正文")]/following-sibling::div[contains(@class, "section-box")]//ul/li/a')
        if not chapter_elements: chapter_elements = tree.xpath(r'//div[contains(@class, "layout-col1")]//h2[contains(text(), "正文")]/following-sibling::div//ul/li/a')

        for element in chapter_elements:
            title = element.text_content().strip()
            url = element.get('href')
            if title and url:
                full_url = urljoin(dic_url, url)
                chapters[title] = full_url
        
        return chapters

    @classmethod
    def GetChapterContent(cls, url) -> str:
        html = Novel.GetUrl(url)
        if not html:
            return ""
        
        selector = etree.HTML(html)
        # 移除广告文本
        for ad in selector.xpath('//div[@id="content"]/p[contains(text(), "kswxsw.com")]'):
            ad.getparent().remove(ad)
        
        content_elements = selector.xpath('//div[@id="content"]/p/text()')
        content = '\n'.join([line.strip() for line in content_elements if line.strip()])
        return content

if __name__ == '__main__':
    # 测试搜索功能
    crawler = WodeShuCheng()

    print(crawler.GetBookUrlFromBookName('斗罗大陆'))
    # crawler.GetBook(dic_url='https://www.wodeshucheng.net/book_94663374/')
    
