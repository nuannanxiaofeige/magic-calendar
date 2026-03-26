#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
油价网爬虫 - 测试脚本
用于从 http://oil.lb2b.com/ 抓取各省份油价数据
"""

import requests
import re
from bs4 import BeautifulSoup

# 目标网站基础 URL
BASE_URL = 'http://oil.lb2b.com'

# 省份列表（用于测试）
TEST_PROVINCES = [
    'qinghai',      # 青海
    'beijing',      # 北京
    'shanghai',     # 上海
    'guangdong',    # 广东
]

def fetch_province_page(province_code):
    """
    获取省份页面内容
    """
    url = f'{BASE_URL}/{province_code}/'
    headers = {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8',
    }

    try:
        response = requests.get(url, headers=headers, timeout=10)
        response.encoding = 'utf-8'
        return response.text
    except Exception as e:
        print(f"请求失败：{province_code} - {e}")
        return None

def parse_oil_prices(html):
    """
    从 HTML 中解析油价数据
    """
    if not html:
        return None

    soup = BeautifulSoup(html, 'html.parser')

    # 方法 1：从价格卡片中提取（price-card 包含 oil-name 和 price-value）
    prices = {}

    # 查找所有价格卡片
    price_cards = soup.find_all('div', class_='price-card')

    for card in price_cards:
        oil_name_elem = card.find('div', class_='oil-name')
        # price-value 是 span 标签，在 price-main 里面
        price_main = card.find('div', class_='price-main')
        price_elem = price_main.find('span', class_='price-value') if price_main else None

        if oil_name_elem and price_elem:
            oil_name = oil_name_elem.get_text(strip=True)
            price = price_elem.get_text(strip=True)

            # 提取油品类型（92、95、98、0）
            if '92' in oil_name:
                prices['92'] = price
            elif '95' in oil_name:
                prices['95'] = price
            elif '98' in oil_name:
                prices['98'] = price
            elif '0 号' in oil_name or '0 号' in oil_name or oil_name.startswith('0'):
                prices['0'] = price

    # 方法 2：从 statistics-card 中提取
    if not prices:
        stat_cards = soup.find_all('div', class_='statistics-card')

        for card in stat_cards:
            oil_name_elem = card.find('div', class_='statistics-oil-name')
            price_elem = card.find('div', class_='statistics-price')

            if oil_name_elem and price_elem:
                oil_name = oil_name_elem.get_text(strip=True)
                price = price_elem.get_text(strip=True)

                if '92' in oil_name:
                    prices['92'] = price
                elif '95' in oil_name:
                    prices['95'] = price
                elif '98' in oil_name:
                    prices['98'] = price
                elif '0 号' in oil_name:
                    prices['0'] = price

    # 方法 3：使用正则表达式从整个 HTML 中提取
    if not prices:
        # 查找 92 号汽油价格
        match92 = re.search(r'92 号汽油.*?([\d]+\.[\d]+)\s*元', html, re.DOTALL)
        if match92:
            prices['92'] = match92.group(1)

        # 查找 95 号汽油价格
        match95 = re.search(r'95 号汽油.*?([\d]+\.[\d]+)\s*元', html, re.DOTALL)
        if match95:
            prices['95'] = match95.group(1)

        # 查找 98 号汽油价格
        match98 = re.search(r'98 号汽油.*?([\d]+\.[\d]+)\s*元', html, re.DOTALL)
        if match98:
            prices['98'] = match98.group(1)

        # 查找 0 号柴油价格
        match0 = re.search(r'0 号柴油.*?([\d]+\.[\d]+)\s*元', html, re.DOTALL)
        if match0:
            prices['0'] = match0.group(1)

    return prices if prices else None

def get_province_name(province_code):
    """
    根据省份代码获取省份中文名
    """
    province_map = {
        'qinghai': '青海',
        'beijing': '北京',
        'shanghai': '上海',
        'guangdong': '广东',
        'zhejiang': '浙江',
        'jiangsu': '江苏',
        'sichuan': '四川',
        'hubei': '湖北',
        'hunan': '湖南',
        'henan': '河南',
        'hebei': '河北',
        'shanxi': '山西',
        'shaanxi': '陕西',
        'shandong': '山东',
        'anhui': '安徽',
        'jiangxi': '江西',
        'fujian': '福建',
        'liaoning': '辽宁',
        'jilin': '吉林',
        'heilongjiang': '黑龙江',
        'tianjin': '天津',
        'chongqing': '重庆',
        'yunnan': '云南',
        'guizhou': '贵州',
        'gansu': '甘肃',
        'hainan': '海南',
        'neimenggu': '内蒙古',
        'guangxi': '广西',
        'ningxia': '宁夏',
        'xinjiang': '新疆',
        'xizang': '西藏',
    }
    return province_map.get(province_code, province_code)

def main():
    """
    主函数 - 测试爬取油价数据
    """
    print("=" * 60)
    print("油价网爬虫 - 测试脚本")
    print("=" * 60)

    for province_code in TEST_PROVINCES:
        province_name = get_province_name(province_code)
        print(f"\n正在抓取：{province_name} ({province_code})")
        print("-" * 40)

        html = fetch_province_page(province_code)

        if not html:
            print(f"  ❌ 无法获取页面内容")
            continue

        prices = parse_oil_prices(html)

        if prices:
            print(f"  ✅ 成功获取油价数据:")
            print(f"     92 号汽油：{prices.get('92', '--')}")
            print(f"     95 号汽油：{prices.get('95', '--')}")
            print(f"     98 号汽油：{prices.get('98', '--')}")
            print(f"     0 号柴油：{prices.get('0', '--')}")
        else:
            print(f"  ❌ 未能解析到油价数据")
            # 打印部分 HTML 用于调试
            if html:
                print(f"     页面长度：{len(html)} 字符")

    print("\n" + "=" * 60)
    print("测试完成")
    print("=" * 60)

if __name__ == '__main__':
    main()
