#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
调试脚本 4 - 检查 0 号柴油
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
print("检查 0 号柴油卡片")
print("=" * 60)

price_cards = soup.find_all('div', class_='price-card')

for i, card in enumerate(price_cards):
    oil_name_elem = card.find('div', class_='oil-name')
    if oil_name_elem:
        oil_name = oil_name_elem.get_text(strip=True)
        print(f"卡片 {i+1}: oil-name = '{oil_name}'")
        print(f"  包含'0 号': {'0 号' in oil_name}")
        print(f"  包含'0': {'0' in oil_name}")
        print(f"  class: {card.get('class', [])}")
