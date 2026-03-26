#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
检查首页所有文本内容
"""

import requests
from bs4 import BeautifulSoup

headers = {
    'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
}

# 访问首页
home_url = 'http://oil.lb2b.com/'
response = requests.get(home_url, headers=headers, timeout=10)
response.encoding = 'utf-8'
soup = BeautifulSoup(response.text, 'html.parser')

# 打印所有文本内容
for text in soup.stripped_strings:
    if text and len(text) < 500:
        print(text)
