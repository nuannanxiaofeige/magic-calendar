#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
调试脚本 2 - 详细检查 price-card 结构
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
print("查找所有 price-card 元素")
print("=" * 60)

price_cards = soup.find_all('div', class_='price-card')
print(f"找到 {len(price_cards)} 个 price-card")

for i, card in enumerate(price_cards):
    print(f"\n--- 卡片 {i+1} ---")
    print(f"Class: {card.get('class', [])}")

    # 查找子元素
    oil_name_elem = card.find('div', class_='oil-name')
    price_value_elem = card.find('div', class_='price-value')
    price_main_elem = card.find('div', class_='price-main')

    if oil_name_elem:
        print(f"oil-name: {oil_name_elem.get_text(strip=True)}")
    if price_value_elem:
        print(f"price-value: {price_value_elem.get_text(strip=True)}")
    if price_main_elem:
        print(f"price-main: {price_main_elem.get_text(strip=True)}")

    # 打印整个卡片的内容
    print(f"完整内容：{card.get_text(strip=True)}")

print("\n" + "=" * 60)
print("手动解析测试")
print("=" * 60)

# 手动提取
prices = {}
for card in price_cards:
    oil_name_elem = card.find('div', class_='oil-name')
    price_elem = card.find('div', class_='price-value')

    if oil_name_elem and price_elem:
        oil_name = oil_name_elem.get_text(strip=True)
        price = price_elem.get_text(strip=True)
        print(f"找到：{oil_name} = {price}")

        if '92' in oil_name:
            prices['92'] = price
        elif '95' in oil_name:
            prices['95'] = price
        elif '98' in oil_name:
            prices['98'] = price
        elif '0 号' in oil_name:
            prices['0'] = price

print(f"\n最终结果：{prices}")
