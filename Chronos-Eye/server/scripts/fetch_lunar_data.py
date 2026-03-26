#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
生成 2026-2035 年农历数据
使用 1900-2100 年农历数据表进行准确计算
"""

import json
from datetime import datetime, timedelta

# 1900-2100 年农历数据表
LUNAR_INFO = [
    0x04bd8, 0x04ae0, 0x0a570, 0x054d5, 0x0d260, 0x0d950, 0x16554, 0x056a0, 0x09ad0, 0x055d2,  # 1900-1909
    0x04ae0, 0x0a5b6, 0x0a4d0, 0x0d250, 0x1d255, 0x0b540, 0x0d6a0, 0x0ada2, 0x095b0, 0x14977,  # 1910-1919
    0x04970, 0x0a4b0, 0x0b4b5, 0x06a50, 0x06d40, 0x1ab54, 0x02b60, 0x09570, 0x052f2, 0x04970,  # 1920-1929
    0x06566, 0x0d4a0, 0x0ea50, 0x16a95, 0x05ad0, 0x02b60, 0x186e3, 0x092e0, 0x1c8d7, 0x0c950,  # 1930-1939
    0x0d4a0, 0x1d8a6, 0x0b550, 0x056a0, 0x1a5b4, 0x025d0, 0x092d0, 0x0d2b2, 0x0a950, 0x0b557,  # 1940-1949
    0x06ca0, 0x0b550, 0x15355, 0x04da0, 0x0a5b0, 0x14573, 0x052b0, 0x0a9a8, 0x0e950, 0x06aa0,  # 1950-1959
    0x0aea6, 0x0ab50, 0x04b60, 0x0aae4, 0x0a570, 0x05260, 0x0f263, 0x0d950, 0x05b57, 0x056a0,  # 1960-1969
    0x096d0, 0x04dd5, 0x04ad0, 0x0a4d0, 0x0d4d4, 0x0d250, 0x0d558, 0x0b540, 0x0b6a0, 0x195a6,  # 1970-1979
    0x095b0, 0x049b0, 0x0a974, 0x0a4b0, 0x0b27a, 0x06a50, 0x06d40, 0x0af46, 0x0ab60, 0x09570,  # 1980-1989
    0x04af5, 0x04970, 0x064b0, 0x074a3, 0x0ea50, 0x06b58, 0x05ac0, 0x0ab60, 0x096d5, 0x092e0,  # 1990-1999
    0x0c960, 0x0d954, 0x0d4a0, 0x0da50, 0x07552, 0x056a0, 0x0abb7, 0x025d0, 0x092d0, 0x0cab5,  # 2000-2009
    0x0a950, 0x0b4a0, 0x0baa4, 0x0ad50, 0x055d9, 0x04ba0, 0x0a5b0, 0x15176, 0x052b0, 0x0a930,  # 2010-2019
    0x07954, 0x06aa0, 0x0ad50, 0x05b52, 0x04b60, 0x0a6e6, 0x0a4e0, 0x0d260, 0x0ea65, 0x0d530,  # 2020-2029
    0x05aa0, 0x076a3, 0x096d0, 0x04afb, 0x04ad0, 0x0a4d0, 0x1d0b6, 0x0d250, 0x0d520, 0x0dd45,  # 2030-2039
    0x0b5a0, 0x056d0, 0x055b2, 0x049b0, 0x0a577, 0x0a4b0, 0x0aa50, 0x1b255, 0x06d20, 0x0ada0,  # 2040-2049
    0x14b63, 0x09370, 0x049f8, 0x04970, 0x064b0, 0x168a6, 0x0ea50, 0x06b20, 0x1a6c4, 0x0aae0,  # 2050-2059
    0x092e0, 0x0d2e3, 0x0c960, 0x0d557, 0x0d4a0, 0x0da50, 0x05d55, 0x056a0, 0x0a6d0, 0x055d4,  # 2060-2069
    0x052d0, 0x0a9b8, 0x0a950, 0x0b4a0, 0x0b6a6, 0x0ad50, 0x055a0, 0x0aba4, 0x0a5b0, 0x052b0,  # 2070-2079
    0x0b273, 0x06930, 0x07337, 0x06aa0, 0x0ad50, 0x14b55, 0x04b60, 0x0a570, 0x054e4, 0x0d160,  # 2080-2089
    0x0e968, 0x0d520, 0x0daa0, 0x16aa6, 0x056d0, 0x04ae0, 0x0a9d4, 0x0a2d0, 0x0d150, 0x0f252,  # 2090-2099
    0x0d520, 0x05570, 0x04a60, 0x0d954, 0x0d4a0, 0x0da50, 0x07552, 0x056a0, 0x0abb7, 0x025d0,  # 2100-2109
]

# 天干
TIAN_GAN = ['甲', '乙', '丙', '丁', '戊', '己', '庚', '辛', '壬', '癸']
# 地支
DI_ZHI = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥']
# 生肖
ZODIAC = ['鼠', '牛', '虎', '兔', '龙', '蛇', '马', '羊', '猴', '鸡', '狗', '猪']
# 月份中文
LUNAR_MONTHS = ['正', '二', '三', '四', '五', '六', '七', '八', '九', '十', '冬', '腊']
# 日期中文
LUNAR_DAYS = [
    '初一', '初二', '初三', '初四', '初五', '初六', '初七', '初八', '初九', '初十',
    '十一', '十二', '十三', '十四', '十五', '十六', '十七', '十八', '十九', '二十',
    '廿一', '廿二', '廿三', '廿四', '廿五', '廿六', '廿七', '廿八', '廿九', '三十'
]

# 节气名称
TERM_NAMES = [
    '小寒', '大寒', '立春', '雨水', '惊蛰', '春分',
    '清明', '谷雨', '立夏', '小满', '芒种', '夏至',
    '小暑', '大暑', '立秋', '处暑', '白露', '秋分',
    '寒露', '霜降', '立冬', '小雪', '大雪', '冬至'
]

# 节气日期表（2026-2035 年）
TERM_DATES = {
    2026: {
        1: {'小寒': 5, '大寒': 20},
        2: {'立春': 3, '雨水': 18},
        3: {'惊蛰': 5, '春分': 20},
        4: {'清明': 5, '谷雨': 20},
        5: {'立夏': 5, '小满': 21},
        6: {'芒种': 5, '夏至': 21},
        7: {'小暑': 7, '大暑': 22},
        8: {'立秋': 7, '处暑': 22},
        9: {'白露': 7, '秋分': 22},
        10: {'寒露': 8, '霜降': 23},
        11: {'立冬': 7, '小雪': 22},
        12: {'大雪': 7, '冬至': 21},
    },
    2027: {
        1: {'小寒': 5, '大寒': 20},
        2: {'立春': 4, '雨水': 19},
        3: {'惊蛰': 6, '春分': 21},
        4: {'清明': 5, '谷雨': 20},
        5: {'立夏': 5, '小满': 21},
        6: {'芒种': 6, '夏至': 21},
        7: {'小暑': 7, '大暑': 23},
        8: {'立秋': 7, '处暑': 23},
        9: {'白露': 8, '秋分': 23},
        10: {'寒露': 8, '霜降': 23},
        11: {'立冬': 7, '小雪': 22},
        12: {'大雪': 7, '冬至': 21},
    },
    2028: {
        1: {'小寒': 5, '大寒': 20},
        2: {'立春': 4, '雨水': 19},
        3: {'惊蛰': 5, '春分': 20},
        4: {'清明': 4, '谷雨': 19},
        5: {'立夏': 5, '小满': 20},
        6: {'芒种': 5, '夏至': 20},
        7: {'小暑': 6, '大暑': 22},
        8: {'立秋': 7, '处暑': 22},
        9: {'白露': 7, '秋分': 22},
        10: {'寒露': 8, '霜降': 23},
        11: {'立冬': 7, '小雪': 22},
        12: {'大雪': 7, '冬至': 21},
    },
    2029: {
        1: {'小寒': 5, '大寒': 20},
        2: {'立春': 3, '雨水': 18},
        3: {'惊蛰': 5, '春分': 20},
        4: {'清明': 5, '谷雨': 20},
        5: {'立夏': 5, '小满': 20},
        6: {'芒种': 5, '夏至': 21},
        7: {'小暑': 7, '大暑': 22},
        8: {'立秋': 7, '处暑': 22},
        9: {'白露': 7, '秋分': 22},
        10: {'寒露': 8, '霜降': 23},
        11: {'立冬': 7, '小雪': 22},
        12: {'大雪': 7, '冬至': 21},
    },
    2030: {
        1: {'小寒': 5, '大寒': 20},
        2: {'立春': 4, '雨水': 18},
        3: {'惊蛰': 5, '春分': 20},
        4: {'清明': 5, '谷雨': 20},
        5: {'立夏': 5, '小满': 21},
        6: {'芒种': 5, '夏至': 21},
        7: {'小暑': 7, '大暑': 23},
        8: {'立秋': 7, '处暑': 23},
        9: {'白露': 8, '秋分': 23},
        10: {'寒露': 8, '霜降': 23},
        11: {'立冬': 7, '小雪': 22},
        12: {'大雪': 7, '冬至': 21},
    },
    2031: {
        1: {'小寒': 6, '大寒': 20},
        2: {'立春': 4, '雨水': 19},
        3: {'惊蛰': 6, '春分': 21},
        4: {'清明': 5, '谷雨': 20},
        5: {'立夏': 6, '小满': 21},
        6: {'芒种': 6, '夏至': 22},
        7: {'小暑': 7, '大暑': 23},
        8: {'立秋': 8, '处暑': 23},
        9: {'白露': 8, '秋分': 23},
        10: {'寒露': 9, '霜降': 24},
        11: {'立冬': 8, '小雪': 23},
        12: {'大雪': 7, '冬至': 22},
    },
    2032: {
        1: {'小寒': 5, '大寒': 20},
        2: {'立春': 4, '雨水': 19},
        3: {'惊蛰': 5, '春分': 20},
        4: {'清明': 4, '谷雨': 19},
        5: {'立夏': 5, '小满': 20},
        6: {'芒种': 5, '夏至': 20},
        7: {'小暑': 6, '大暑': 22},
        8: {'立秋': 7, '处暑': 22},
        9: {'白露': 7, '秋分': 22},
        10: {'寒露': 8, '霜降': 23},
        11: {'立冬': 7, '小雪': 22},
        12: {'大雪': 7, '冬至': 21},
    },
    2033: {
        1: {'小寒': 5, '大寒': 20},
        2: {'立春': 3, '雨水': 18},
        3: {'惊蛰': 5, '春分': 20},
        4: {'清明': 5, '谷雨': 19},
        5: {'立夏': 5, '小满': 20},
        6: {'芒种': 5, '夏至': 20},
        7: {'小暑': 6, '大暑': 22},
        8: {'立秋': 7, '处暑': 22},
        9: {'白露': 7, '秋分': 22},
        10: {'寒露': 8, '霜降': 23},
        11: {'立冬': 7, '小雪': 22},
        12: {'大雪': 7, '冬至': 21},
    },
    2034: {
        1: {'小寒': 5, '大寒': 20},
        2: {'立春': 4, '雨水': 18},
        3: {'惊蛰': 5, '春分': 20},
        4: {'清明': 5, '谷雨': 20},
        5: {'立夏': 5, '小满': 21},
        6: {'芒种': 5, '夏至': 21},
        7: {'小暑': 7, '大暑': 23},
        8: {'立秋': 7, '处暑': 23},
        9: {'白露': 8, '秋分': 23},
        10: {'寒露': 8, '霜降': 23},
        11: {'立冬': 7, '小雪': 22},
        12: {'大雪': 7, '冬至': 21},
    },
    2035: {
        1: {'小寒': 6, '大寒': 21},
        2: {'立春': 4, '雨水': 19},
        3: {'惊蛰': 6, '春分': 21},
        4: {'清明': 5, '谷雨': 20},
        5: {'立夏': 6, '小满': 21},
        6: {'芒种': 6, '夏至': 22},
        7: {'小暑': 8, '大暑': 23},
        8: {'立秋': 8, '处暑': 23},
        9: {'白露': 8, '秋分': 23},
        10: {'寒露': 9, '霜降': 24},
        11: {'立冬': 8, '小雪': 23},
        12: {'大雪': 8, '冬至': 22},
    },
}

# 阳历节日
SOLAR_FESTIVALS = {
    '1-1': '元旦',
    '3-8': '妇女节',
    '3-12': '植树节',
    '4-1': '愚人节',
    '5-1': '劳动节',
    '5-4': '青年节',
    '6-1': '儿童节',
    '7-1': '建党节',
    '8-1': '建军节',
    '9-10': '教师节',
    '10-1': '国庆节',
    '12-25': '圣诞节',
}

# 农历节日
LUNAR_FESTIVALS = {
    '1-1': '春节',
    '1-15': '元宵',
    '2-2': '龙抬头',
    '5-5': '端午',
    '7-7': '七夕',
    '7-15': '中元',
    '8-15': '中秋',
    '9-9': '重阳',
    '10-1': '寒衣节',
    '12-8': '腊八',
    '12-23': '小年',
    '12-30': '除夕',
}


def get_lunar_year_days(year):
    info = LUNAR_INFO[year - 1900]
    days = 348  # 基础天数（12 个小月）

    # 计算大月天数
    for i in range(0, 12):
        if info & (0x8000 >> i):
            days += 1

    # 加上闰月天数
    leap_month = get_leap_month(year)
    if leap_month > 0:
        if info & 0x10000:
            days += 30
        else:
            days += 29

    return days


def get_leap_month(year):
    info = LUNAR_INFO[year - 1900]
    return (info >> 4) & 0xF


def get_month_days(year, month):
    if month < 1 or month > 12:
        return 0
    info = LUNAR_INFO[year - 1900]
    if info & (0x8000 >> (month - 1)):
        return 30
    return 29


def get_leap_month_days(year):
    info = LUNAR_INFO[year - 1900]
    leap_month = get_leap_month(year)
    if leap_month == 0:
        return 0
    if info & 0x10000:
        return 30
    return 29


def lunar_to_solar(year, month, day, is_leap=False):
    total_days = 0

    # 加上整年的天数
    for y in range(1900, year):
        total_days += get_lunar_year_days(y)

    # 加上当年整月的天数
    for m in range(1, month):
        total_days += get_month_days(year, m)
        # 如果有闰月且在这个月之前
        leap = get_leap_month(year)
        if leap > 0 and leap <= m:
            total_days += get_leap_month_days(year)

    # 加上闰月天数（如果是闰月）
    if is_leap:
        leap = get_leap_month(year)
        if leap > 0 and leap < month:
            total_days += get_leap_month_days(year)

    # 加上当月天数
    total_days += day - 1

    # 从 1900 年 1 月 31 日（农历 1900 年正月初一）开始计算
    base_date = datetime(1900, 1, 31)
    target_date = base_date + timedelta(days=total_days)

    return target_date.year, target_date.month, target_date.day


def solar_to_lunar(year, month, day):
    # 1900 年 1 月 31 日是农历 1900 年正月初一
    base_date = datetime(1900, 1, 31)
    target_date = datetime(year, month, day)
    total_days = (target_date - base_date).days

    # 计算农历年份
    lunar_year = 1900
    while True:
        year_days = get_lunar_year_days(lunar_year)
        if total_days < year_days:
            break
        total_days -= year_days
        lunar_year += 1

    # 计算农历月份和日期
    lunar_month = 1
    is_leap = False

    while True:
        month_days = get_month_days(lunar_year, lunar_month)
        if total_days < month_days:
            break
        total_days -= month_days
        lunar_month += 1

        # 检查闰月
        leap = get_leap_month(lunar_year)
        if leap > 0 and leap == lunar_month - 1:
            leap_days = get_leap_month_days(lunar_year)
            if total_days < leap_days:
                is_leap = True
                break
            total_days -= leap_days

    lunar_day = total_days + 1

    # 转换为中文表示
    if is_leap:
        month_str = f'闰{LUNAR_MONTHS[lunar_month - 1]}' if 1 <= lunar_month <= 12 else str(lunar_month)
    else:
        month_str = LUNAR_MONTHS[lunar_month - 1] if 1 <= lunar_month <= 12 else str(lunar_month)

    day_str = LUNAR_DAYS[lunar_day - 1] if 1 <= lunar_day <= 30 else f'初{lunar_day}'

    return {
        'lunar_year': lunar_year,
        'lunar_month': lunar_month,
        'lunar_day': lunar_day,
        'is_leap': is_leap,
        'month_str': month_str,
        'day_str': day_str,
    }


def get_term(year, month, day):
    if year in TERM_DATES:
        if month in TERM_DATES[year]:
            for term_name, term_day in TERM_DATES[year][month].items():
                if day == term_day:
                    return term_name
    return ''


def get_solar_festival(month, day):
    key = f'{month}-{day}'
    return SOLAR_FESTIVALS.get(key, '')


def get_lunar_festival(lunar_month, lunar_day):
    key = f'{lunar_month}-{lunar_day}'
    return LUNAR_FESTIVALS.get(key, '')


def get_ganzhi_year(year):
    return TIAN_GAN[(year - 4) % 10] + DI_ZHI[(year - 4) % 12]


def get_zodiac(year):
    """获取生肖"""
    return ZODIAC[(year - 4) % 12]


def generate_data(start_year, end_year):
    all_data = []

    for year in range(start_year, end_year + 1):
        print(f'正在生成 {year} 年数据...')

        start_date = datetime(year, 1, 1)
        end_date = datetime(year, 12, 31)

        current = start_date
        while current <= end_date:
            # 阳历转农历
            lunar = solar_to_lunar(current.year, current.month, current.day)

            # 获取节气
            term = get_term(current.year, current.month, current.day)

            # 获取节日
            solar_festival = get_solar_festival(current.month, current.day)
            lunar_festival = get_lunar_festival(lunar['lunar_month'], lunar['lunar_day'])

            # 除夕特殊处理
            if lunar['lunar_month'] == 12 and lunar['lunar_day'] >= 29:
                next_day = current + timedelta(days=1)
                next_lunar = solar_to_lunar(next_day.year, next_day.month, next_day.day)
                if next_lunar['lunar_month'] == 1 and next_lunar['lunar_day'] == 1:
                    lunar_festival = '除夕'

            # 干支和生肖
            ganzhi_year = get_ganzhi_year(current.year)
            zodiac = get_zodiac(current.year)

            record = {
                'date': current.strftime('%Y-%m-%d'),
                'lunar_year': current.year,
                'lunar_month': lunar['lunar_month'],
                'lunar_day': lunar['lunar_day'],
                'is_leap_month': lunar['is_leap'],
                'lunar_month_str': lunar['month_str'],
                'lunar_day_str': lunar['day_str'],
                'term': term,
                'solar_festival': solar_festival,
                'lunar_festival': lunar_festival,
                'ganzhi_year': ganzhi_year,
                'zodiac': zodiac,
            }

            all_data.append(record)
            current += timedelta(days=1)

    return all_data


def main():
    print('开始生成 2026-2035 年农历数据...')

    all_data = generate_data(2026, 2035)

    output_file = 'lunar_data_2026_2035.json'
    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(all_data, f, ensure_ascii=False, indent=2)

    print(f'\n数据已保存到 {output_file}')
    print(f'总计 {len(all_data)} 条记录')


if __name__ == '__main__':
    main()
