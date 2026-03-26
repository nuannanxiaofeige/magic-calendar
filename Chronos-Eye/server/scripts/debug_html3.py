#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
调试脚本 3 - 检查 price-main 内部结构
"""

import requests
import re
from bs4 import BeautifulSoup

url = 'http://oil.lb2b.com/qinghai/'
headers = {
    'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
}

response = requests.get(url, headers=headers, timeout=10)
response.encoding = 'utf-8'
soup = BeautifulSoup(response.text, 'html.parser')

print("=" * 60)
print("检查 price-main 内部 HTML 结构")
print("=" * 60)

price_cards = soup.find_all('div', class_='price-card')

for i, card in enumerate(price_cards):
    print(f"\n--- 卡片 {i+1} ---")
    oil_name_elem = card.find('div', class_='oil-name')
    price_main_elem = card.find('div', class_='price-main')

    if oil_name_elem:
        print(f"oil-name: {oil_name_elem.get_text(strip=True)}")

    if price_main_elem:
        print(f"price-main 文本：{price_main_elem.get_text(strip=True)}")
        print(f"price-main HTML: {price_main_elem}")

        # 尝试查找 price-value
        price_value_elem = price_main_elem.find('div', class_='price-value')
        if price_value_elem:
            print(f"price-value: {price_value_elem.get_text(strip=True)}")
        else:
            print("price-value 未找到，尝试用正则提取")
            # 用正则从 price-main 中提取价格数字
            match = re.search(r'([\d]+\.?[\d]*)', price_main_elem.get_text(strip=True))
            if match:
                print(f"正则提取价格：{match.group(1)}")
