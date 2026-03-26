#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
检查首页油价调整信息
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

print("=" * 70)
print("查找所有包含油价调整信息的区域")
print("=" * 70)

# 查找包含"油价调整"链接的整个区域
for a in soup.find_all('a', href=lambda x: x and 'adjust' in x):
    print(f"链接：{a.get('href')}")
    print(f"文本：{a.get_text(strip=True)}")
    parent = a.parent
    while parent:
        print(f"父元素：{parent.name}, class: {parent.get('class', [])}")
        print(f"父元素内容：{parent.get_text(strip=True)[:500]}")
        parent = parent.parent

# 查找所有 news 相关的 div
print("\n" + "=" * 70)
print("查找新闻区域")
print("=" * 70)

for div in soup.find_all('div', class_=lambda x: x and 'news' in str(x)):
    print(f"Class: {div.get('class', [])}")
    print(f"内容：{div.get_text(strip=True)[:300]}")
    print("---")

# 查找所有包含 h5 标题的区域
print("\n" + "=" * 70)
print("查找 h5 标题")
print("=" * 70)

for h5 in soup.find_all('h5'):
    text = h5.get_text(strip=True)
    print(f"标题：{text}")
    parent = h5.parent
    if parent:
        print(f"父元素 class: {parent.get('class', [])}")
        # 查找父元素下的所有内容
        for div in parent.find_all(['div', 'p', 'strong']):
            div_text = div.get_text(strip=True)
            if div_text and len(div_text) < 300:
                print(f"  - {div_text}")
