#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
提取油价调整窗口日期
"""

import requests
from bs4 import BeautifulSoup
import re

headers = {
    'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
}

url = 'http://oil.lb2b.com/tiaozheng/'
response = requests.get(url, headers=headers, timeout=10)
response.encoding = 'utf-8'
soup = BeautifulSoup(response.text, 'html.parser')

print("=" * 70)
print("2025 年油价调整窗口时间表")
print("=" * 70)

# 查找包含窗口日期的区域
for div in soup.find_all('div', class_='card-body'):
    text = div.get_text(strip=True)
    if '窗口时间表' in text or '25 轮调整' in text:
        # 提取日期（格式：MM 月 DD 日）
        dates = re.findall(r'(\d{2}) 月 (\d{2}) 日', text)
        if dates:
            print(f"\n2025 年共 {len(dates)} 轮调整窗口：")
            for i, (month, day) in enumerate(dates, 1):
                print(f"  第{i}轮：2025-{month}-{day}")

print("\n" + "=" * 70)

# 同时获取最新调整信息
print("\n最新油价调整信息：")
for strong in soup.find_all('strong'):
    text = strong.get_text(strip=True)
    if '2026 年' in text and '调整' in text:
        print(f"调整日期：{text}")
        # 查找后续的调价信息
        parent = strong.parent
        if parent:
            next_text = parent.get_text(strip=True)
            if '上调' in next_text or '下调' in next_text:
                print(f"调整内容：{next_text[:300]}")
