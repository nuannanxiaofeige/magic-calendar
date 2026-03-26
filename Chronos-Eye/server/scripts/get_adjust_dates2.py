#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
提取油价调整窗口日期 - 第二版
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

# 直接用正则从整个 HTML 中提取
print("=" * 70)
print("2025 年油价调整窗口时间表")
print("=" * 70)

# 提取窗口日期
dates = re.findall(r'(\d{2}) 月 (\d{2}) 日', response.text)
print(f"\n找到 {len(dates)} 个调整窗口日期:")
for i, (month, day) in enumerate(dates, 1):
    print(f"  第{i}轮：2025-{month}-{day}")

# 提取 2026 年调整信息
print("\n" + "=" * 70)
print("2026 年油价调整记录（从历史表格中）")
print("=" * 70)

soup = BeautifulSoup(response.text, 'html.parser')
table = soup.find('table')
if table:
    rows = table.find_all('tr')
    # 跳过表头
    for row in rows[1:10]:  # 只显示前 10 条
        cells = row.find_all(['td', 'th'])
        if len(cells) >= 2:
            date = cells[1].get_text(strip=True)
            gas_price = cells[2].get_text(strip=True).replace(',', '')
            gas_change = cells[3].get_text(strip=True)
            diesel_price = cells[4].get_text(strip=True).replace(',', '')
            diesel_change = cells[5].get_text(strip=True)
            print(f"  {date}: 汽油{gas_price}元/吨 ({gas_change}), 柴油{diesel_price}元/吨 ({diesel_change})")
