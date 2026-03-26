#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
调试脚本 - 分析网页 HTML 结构
"""

import requests
from bs4 import BeautifulSoup

url = 'http://oil.lb2b.com/qinghai/'
headers = {
    'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
}

response = requests.get(url, headers=headers, timeout=10)
response.encoding = 'utf-8'
soup = BeautifulSoup(response.text, 'html.parser')

print("=" * 60)
print("查找包含 'price' 或 'oil' 的 class")
print("=" * 60)

# 查找所有包含 'price' 或 'oil' 的 class
for tag in soup.find_all(class_=lambda x: x and ('price' in x.lower() or 'oil' in x.lower())):
    print(f"Class: {tag.get('class', [])}")
    print(f"Text: {tag.get_text(strip=True)[:100]}")
    print("---")

print("\n" + "=" * 60)
print("查找所有 div 标签的 class")
print("=" * 60)

# 查找所有有 class 的 div
for div in soup.find_all('div', class_=True):
    classes = div.get('class', [])
    if any(c in str(classes).lower() for c in ['price', 'oil', 'num', 'data']):
        print(f"Class: {classes}")
        print(f"Text: {div.get_text(strip=True)[:150]}")
        print("---")

print("\n" + "=" * 60)
print("查找包含 '号' 字的元素 (92 号、95 号等)")
print("=" * 60)

# 查找包含油价信息的元素
for tag in soup.find_all(string=lambda x: x and ('92 号' in x or '95 号' in x or '98 号' in x or '0 号' in x)):
    print(f"Text: {tag.strip()}")
    if tag.parent:
        print(f"Parent: {tag.parent.name}, Class: {tag.parent.get('class', [])}")
    print("---")

print("\n" + "=" * 60)
print("查找所有表格")
print("=" * 60)

# 查找表格
tables = soup.find_all('table')
print(f"找到 {len(tables)} 个表格")
for i, table in enumerate(tables[:3]):
    print(f"\n表格 {i+1}:")
    print(table.prettify()[:500])
