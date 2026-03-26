#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
检查爬虫返回的完整数据，包含涨幅信息
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

print("=" * 70)
print("检查油价涨幅数据")
print("=" * 70)

# 查找所有价格卡片
price_cards = soup.find_all('div', class_='price-card')

for i, card in enumerate(price_cards):
    print(f"\n--- 卡片 {i+1} ---")

    oil_name_elem = card.find('div', class_='oil-name')
    price_main_elem = card.find('div', class_='price-main')

    if oil_name_elem:
        oil_name = oil_name_elem.get_text(strip=True)
        print(f"油品：{oil_name}")

    if price_main_elem:
        # 获取价格
        price_value_elem = price_main_elem.find('span', class_='price-value')
        price_unit_elem = price_main_elem.find('span', class_='price-unit')
        price_change_elem = price_main_elem.find('span', class_='price-change')

        if price_value_elem:
            print(f"价格：{price_value_elem.get_text(strip=True)}")
        if price_unit_elem:
            print(f"单位：{price_unit_elem.get_text(strip=True)}")
        if price_change_elem:
            print(f"涨幅：{price_change_elem.get_text(strip=True)}")
            print(f"涨幅 class: {price_change_elem.get('class', [])}")

print("\n" + "=" * 70)
print("查找首页或国内油价页面（可能有预测信息）")
print("=" * 70)

# 访问首页
home_url = 'http://oil.lb2b.com/'
response = requests.get(home_url, headers=headers, timeout=10)
response.encoding = 'utf-8'
soup = BeautifulSoup(response.text, 'html.parser')

# 查找所有包含"预测"、"调价"、"涨幅"的文字
for tag in soup.find_all(string=lambda x: x and ('预测' in x or '调价' in x or '涨幅' in x or '下次' in x or '调整' in x)):
    print(f"找到：{tag.strip()}")
    if tag.parent:
        print(f"  父元素：{tag.parent.name}, class: {tag.parent.get('class', [])}")

print("\n" + "=" * 70)
print("查找所有可能包含预测信息的区域")
print("=" * 70)

# 查找所有包含预测信息的 div
for div in soup.find_all('div', class_=lambda x: x and any(kw in str(x) for kw in ['predict', 'forecast', 'news', 'info', 'tips'])):
    text = div.get_text(strip=True)
    if text and len(text) < 200:
        print(f"Class: {div.get('class', [])}")
        print(f"内容：{text[:100]}")
        print("---")
