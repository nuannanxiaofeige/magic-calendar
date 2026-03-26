#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
油价网爬虫 - 完整版
用于从 http://oil.lb2b.com/ 抓取所有油价数据
包含：省份油价、国际原油、油价调整历史
"""

import requests
from bs4 import BeautifulSoup
import json
from datetime import datetime

# 目标网站基础 URL
BASE_URL = 'http://oil.lb2b.com'

# 省份代码映射
PROVINCE_MAP = {
    'qinghai': '青海', 'beijing': '北京', 'shanghai': '上海', 'guangdong': '广东',
    'zhejiang': '浙江', 'jiangsu': '江苏', 'sichuan': '四川', 'hubei': '湖北',
    'hunan': '湖南', 'henan': '河南', 'hebei': '河北', 'shanxi': '山西',
    'shaanxi': '陕西', 'shandong': '山东', 'anhui': '安徽', 'jiangxi': '江西',
    'fujian': '福建', 'liaoning': '辽宁', 'heilongjiang': '黑龙江', 'jilin': '吉林',
    'tianjin': '天津', 'chongqing': '重庆', 'yunnan': '云南', 'guizhou': '贵州',
    'gansu': '甘肃', 'hainan': '海南', 'neimenggu': '内蒙古', 'guangxi': '广西',
    'ningxia': '宁夏', 'xinjiang': '新疆', 'xizang': '西藏',
}

REQUEST_HEADERS = {
    'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
    'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8',
}


def fetch_page(url):
    """获取页面内容"""
    try:
        response = requests.get(url, headers=REQUEST_HEADERS, timeout=10)
        response.encoding = 'utf-8'
        return response.text
    except Exception as e:
        print(f"请求失败：{url} - {e}")
        return None


def parse_province_oil_prices(html):
    """
    从省份页面解析油价数据（包含涨幅）
    返回格式：{
        '89': {'price': '8.00', 'change': '+0.87'},
        '92': {'price': '8.53', 'change': '+0.94'},
        ...
    }
    """
    if not html:
        return None

    soup = BeautifulSoup(html, 'html.parser')
    prices = {}

    price_cards = soup.find_all('div', class_='price-card')

    for card in price_cards:
        oil_name_elem = card.find('div', class_='oil-name')
        price_main = card.find('div', class_='price-main')

        if oil_name_elem and price_main:
            oil_name = oil_name_elem.get_text(strip=True)

            price_value_elem = price_main.find('span', class_='price-value')
            price_change_elem = price_main.find('span', class_='price-change')

            price = price_value_elem.get_text(strip=True) if price_value_elem else None
            change = price_change_elem.get_text(strip=True) if price_change_elem else None

            # 提取油品类型
            oil_type = None
            if '92' in oil_name:
                oil_type = '92'
            elif '95' in oil_name:
                oil_type = '95'
            elif '98' in oil_name:
                oil_type = '98'
            elif '0 号' in oil_name or oil_name.startswith('0'):
                oil_type = '0'
            elif '89' in oil_name:
                oil_type = '89'

            if oil_type and price:
                prices[oil_type] = {
                    'price': price,
                    'change': change
                }

    return prices if prices else None


def parse_international_crude(html):
    """
    从首页解析国际原油价格数据
    返回格式：[
        {'name': '布伦特原油', 'price': 99.84, 'change': 3.77, 'change_percent': '+3.92%', ...},
        ...
    ]
    """
    if not html:
        return None

    soup = BeautifulSoup(html, 'html.parser')
    results = []

    # 查找国际原油表格
    # 根据页面结构，查找包含原油名称的表格行
    for div in soup.find_all('div', class_=lambda x: x and 'oil' in str(x).lower()):
        # 尝试从各种可能的容器中提取
        name_elem = div.find(class_=lambda x: x and 'name' in str(x).lower())
        price_elem = div.find(class_=lambda x: x and 'price' in str(x).lower())

        if name_elem:
            name = name_elem.get_text(strip=True)
            if name and any(kw in name for kw in ['原油', '柴油', '燃油', '天然气']):
                results.append({
                    'name': name,
                    'raw_text': div.get_text(strip=True)[:200]
                })

    # 备用方法：从表格中提取
    tables = soup.find_all('table')
    for table in tables:
        rows = table.find_all('tr')
        for row in rows[1:]:  # 跳过表头
            cells = row.find_all(['td', 'th'])
            if len(cells) >= 5:
                name = cells[0].get_text(strip=True)
                if name and any(kw in name for kw in ['原油', '柴油', '燃油', '天然气']):
                    # 解析价格为数值
                    price_str = cells[1].get_text(strip=True) if len(cells) > 1 else None
                    change_str = cells[2].get_text(strip=True) if len(cells) > 2 else None
                    prev_close_str = cells[4].get_text(strip=True) if len(cells) > 4 else None
                    high_str = cells[5].get_text(strip=True) if len(cells) > 5 else None
                    low_str = cells[6].get_text(strip=True) if len(cells) > 6 else None
                    update_time_str = cells[7].get_text(strip=True) if len(cells) > 7 else None

                    item = {
                        'name': name,
                        'price': parse_float_value(price_str),
                        'change': parse_change_value(change_str),
                        'change_percent': cells[3].get_text(strip=True) if len(cells) > 3 else None,
                        'prev_close': parse_float_value(prev_close_str),
                        'high': parse_float_value(high_str),
                        'low': parse_float_value(low_str),
                        'update_time': parse_update_time(update_time_str),
                    }
                    results.append(item)

    return results if results else None


def parse_float_value(value_str):
    """
    解析字符串为浮点数
    支持格式：
    - "99.56" -> 99.56
    - "99.56 美元/桶" -> 99.56
    - "2.919 美元/mmbtu" -> 2.919
    - "1,234.56" -> 1234.56
    """
    if not value_str:
        return None
    try:
        # 去掉单位（美元/桶、美元/mmbtu 等）
        import re
        # 提取数字部分（支持小数和千分位）
        match = re.search(r'[\d,]+\.?\d*', value_str)
        if match:
            return float(match.group().replace(',', ''))
        return None
    except (ValueError, AttributeError):
        return None


def parse_update_time(time_str):
    """
    解析更新时间字符串为 datetime 格式
    支持格式：
    - "2026-03-26 10:00:00"
    - "2026/03/26 10:00"
    - "03-26 10:00"
    """
    if not time_str:
        return None

    # 尝试多种时间格式
    formats = [
        '%Y-%m-%d %H:%M:%S',
        '%Y-%m-%d %H:%M',
        '%Y/%m/%d %H:%M:%S',
        '%Y/%m/%d %H:%M',
        '%m-%d %H:%M',
        '%m/%d %H:%M',
    ]

    for fmt in formats:
        try:
            dt = datetime.strptime(time_str.strip(), fmt)
            # 如果没有年份，使用当前年份
            if dt.year == 1900:
                dt = dt.replace(year=datetime.now().year)
            return dt.strftime('%Y-%m-%d %H:%M:%S')
        except ValueError:
            continue

    return None


def parse_adjustment_history(html):
    """
    从油价调整页面解析历史调整数据
    返回格式：[
        {'date': '2026-03-24', 'gasoline_price': '9905', 'gasoline_change': '+1160',
         'diesel_price': '8835', 'diesel_change': '+1115'},
        ...
    ]
    """
    if not html:
        return None

    soup = BeautifulSoup(html, 'html.parser')
    results = []

    # 查找表格
    table = soup.find('table')
    if not table:
        return None

    rows = table.find_all('tr')

    # 跳过表头（第一行）
    for row in rows[1:]:
        cells = row.find_all(['td', 'th'])
        if len(cells) >= 6:
            try:
                item = {
                    'rank': int(cells[0].get_text(strip=True)),
                    'date': cells[1].get_text(strip=True),
                    'gasoline_price': int(cells[2].get_text(strip=True).replace(',', '')),
                    'gasoline_change_str': cells[3].get_text(strip=True),
                    'diesel_price': int(cells[4].get_text(strip=True).replace(',', '')),
                    'diesel_change_str': cells[5].get_text(strip=True),
                }

                # 解析涨跌金额（从字符串中提取数字）
                import re
                gas_match = re.search(r'[+－-]\s*(\d+)', item['gasoline_change_str'])
                diesel_match = re.search(r'[+－-]\s*(\d+)', item['diesel_change_str'])

                item['gasoline_change'] = int(gas_match.group(1)) if gas_match else 0
                item['diesel_change'] = int(diesel_match.group(1)) if diesel_match else 0

                results.append(item)
            except (ValueError, IndexError) as e:
                continue

    return results if results else None


def parse_change_value(change_str):
    """
    解析涨幅字符串为数值
    "+0.15" -> 0.15
    "-0.10" -> -0.10
    "0.00" -> 0.00
    """
    if not change_str:
        return None
    try:
        # 去掉 "+" 符号和空格
        clean_str = change_str.replace('+', '').strip()
        return float(clean_str)
    except (ValueError, AttributeError):
        return None


def get_province_oil_price(province_code):
    """
    获取指定省份的油价数据（包含涨幅）
    """
    html = fetch_page(f'{BASE_URL}/{province_code}/')
    prices = parse_province_oil_prices(html)

    if prices:
        result = {
            'province': PROVINCE_MAP.get(province_code, province_code),
            'province_code': province_code,
            'update_time': datetime.now().strftime('%Y-%m-%d')
        }
        # 展开油品数据
        for oil_type, data in prices.items():
            result[f'price_{oil_type}'] = data.get('price')
            # 将涨幅字符串转换为数值
            result[f'change_{oil_type}'] = parse_change_value(data.get('change'))

        return result
    return None


def get_all_provinces_oil_price():
    """
    获取所有省份的油价数据
    """
    results = []
    for code in PROVINCE_MAP.keys():
        data = get_province_oil_price(code)
        if data:
            results.append(data)
            print(f"已获取：{data['province']}")
        else:
            print(f"获取失败：{code}")
    return results


def get_international_crude():
    """
    获取国际原油价格数据
    """
    html = fetch_page(BASE_URL)
    return parse_international_crude(html)


def get_adjustment_window_dates(year=2025):
    """
    获取油价调整窗口日期（全年 25 轮）
    返回格式：['2025-01-02', '2025-01-16', ...]
    """
    html = fetch_page(f'{BASE_URL}/tiaozheng/')
    if not html:
        return None

    soup = BeautifulSoup(html, 'html.parser')
    dates = []

    # 查找所有 date-item 元素
    for div in soup.find_all('div', class_='date-item'):
        date_text = div.get_text(strip=True)
        if date_text:
            # 解析 MM 月 DD 日 格式
            match = re.match(r'(\d{2}) 月 (\d{2}) 日', date_text)
            if match:
                month, day = match.groups()
                dates.append(f'{year}-{month}-{day}')

    # 按日期排序
    dates.sort()
    return dates if dates else None


def get_next_adjust_date():
    """
    获取下一次油价调整日期
    从调价窗口日期中找出未来最近的日期
    """
    from datetime import datetime, timedelta

    # 获取 2026 年调价窗口（需要页面有 2026 年数据）
    # 目前页面只有 2025 年的，这里返回一个估算值
    # 实际可以解析页面中的"下一个油价调整日期"

    html = fetch_page(f'{BASE_URL}/tiaozheng/')
    if not html:
        return None

    soup = BeautifulSoup(html, 'html.parser')

    # 查找标题中包含"下一个"的信息
    title = soup.find('title')
    if title:
        title_text = title.get_text(strip=True)
        if '下一个' in title_text:
            print(f'标题包含下一个调整日期：{title_text}')

    # 查找页面中的下一个调整日期提示
    for div in soup.find_all('div', class_=lambda x: x and 'next' in str(x).lower() if x else False):
        text = div.get_text(strip=True)
        if '下次' in text or '下一个' in text:
            return text[:100]

    return None


def get_adjustment_history():
    """
    获取油价调整历史数据
    """
    html = fetch_page(f'{BASE_URL}/tiaozheng/')
    return parse_adjustment_history(html)


if __name__ == '__main__':
    print("=" * 70)
    print("油价网爬虫 - 完整数据测试")
    print("=" * 70)

    # 测试 1：单个省份
    print("\n1. 测试获取单个省份油价:")
    data = get_province_oil_price('qinghai')
    if data:
        print(f"   青海省：92 号={data.get('price_92')}, 涨幅={data.get('change_92')}")

    # 测试 2：所有省份
    print("\n2. 测试获取所有省份油价:")
    provinces = get_all_provinces_oil_price()
    print(f"   成功获取 {len(provinces)} 个省份数据")

    # 测试 3：国际原油
    print("\n3. 测试获取国际原油:")
    international = get_international_crude()
    if international:
        print(f"   获取到 {len(international)} 条国际油价数据")
        for item in international[:3]:
            print(f"   - {item.get('name', 'N/A')}")

    # 测试 4：调整历史
    print("\n4. 测试获取油价调整历史:")
    history = get_adjustment_history()
    if history:
        print(f"   获取到 {len(history)} 条调整记录")
        for item in history[:3]:
            print(f"   - {item['date']}: 汽油{item['gasoline_price']}元/吨，涨跌{item['gasoline_change']}")

    # 测试 5：调价窗口日期
    print("\n5. 测试获取油价调整窗口日期:")
    window_dates = get_adjustment_window_dates(2025)
    if window_dates:
        print(f"   获取到 {len(window_dates)} 个调价窗口日期:")
        print(f"   前 5 个：{window_dates[:5]}")
        print(f"   后 5 个：{window_dates[-5:]}")

    print("\n" + "=" * 70)
    print("测试完成")
    print("=" * 70)
