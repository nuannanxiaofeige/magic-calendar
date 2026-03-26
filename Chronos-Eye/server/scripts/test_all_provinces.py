#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
测试获取所有省份油价数据
"""

import sys
sys.path.insert(0, '.')
from oil_price_crawler import get_oil_price, PROVINCE_MAP

print("=" * 70)
print("全国各省份油价数据")
print("=" * 70)
print(f"{'省份':<12} {'92 号':<10} {'95 号':<10} {'98 号':<10} {'0 号':<10}")
print("-" * 70)

results = []
for code in PROVINCE_MAP.keys():
    data = get_oil_price(code)
    if data:
        results.append(data)
        print(f"{data['province']:<12} {data['92']:<10} {data['95']:<10} {data['98']:<10} {data['0']:<10}")

print("-" * 70)
print(f"共获取 {len(results)} 个省份数据")
