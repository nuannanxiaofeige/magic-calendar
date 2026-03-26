#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
检查油价调整预测信息
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
print("查找油价调整详细信息")
print("=" * 70)

# 查找包含"调整"的所有文字
for div in soup.find_all(['div', 'p', 'span'], string=lambda x: x and '调整' in x):
    text = div.get_text(strip=True) if hasattr(div, 'get_text') else str(div).strip()
    print(f"找到：{text[:200]}")
    if div.parent:
        print(f"  父元素：{div.parent.name}, class: {div.parent.get('class', [])}")
        # 打印父元素的所有子节点
        siblings = list(div.parent.children)
        if len(siblings) > 1:
            print(f"  兄弟节点内容:")
            for sib in siblings:
                if hasattr(sib, 'get_text'):
                    sib_text = sib.get_text(strip=True)
                    if sib_text and len(sib_text) < 300:
                        print(f"    - {sib_text}")

print("\n" + "=" * 70)
print("访问国内油价页面")
print("=" * 70)

# 访问国内油价页面
china_url = 'http://oil.lb2b.com/neidi/'
response = requests.get(china_url, headers=headers, timeout=10)
response.encoding = 'utf-8'
soup = BeautifulSoup(response.text, 'html.parser')

# 查找所有包含数字和"元"的文字
for div in soup.find_all(['div', 'p', 'span']):
    text = div.get_text(strip=True) if hasattr(div, 'get_text') else ''
    if text and ('元' in text or '调整' in text or '预测' in text or '涨' in text or '跌' in text):
        if len(text) < 300:
            print(f"{div.name}: {text}")
