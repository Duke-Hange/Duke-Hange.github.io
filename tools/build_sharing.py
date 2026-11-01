"""Render the static learning links and library pages from learning/catalog.json."""
from pathlib import Path
from html import escape
import json
import re

ROOT = Path(__file__).resolve().parents[1]
ITEMS = json.loads((ROOT / 'learning/catalog.json').read_text(encoding='utf-8'))
for item in ITEMS:
    assert item['category'] in ('papers', 'notes')
    assert (ROOT / 'learning' / item['href']).is_file(), item['href']


def value(item, field, english):
    return escape(item[field + ('_en' if english else '')])


def render(english):
    home = 'en.html' if english else 'index.html'
    library = 'en.html' if english else 'index.html'
    groups = [('papers', 'Paper Recommendations' if english else '文献推荐'),
              ('notes', 'Study Notes' if english else '学习笔记')]
    title = 'Learning & Sharing' if english else '学习分享'
    sidebar = f'<h2>📚 {title}</h2>'
    if english:
        sidebar += '<p class="share-caption">Interactive reading notes and tutorials. Full materials are in Chinese.</p>'
    for category, label in groups:
        selected = [item for item in ITEMS if item['category'] == category]
        sidebar += f'<section class="share-section"><h3>{label}<span class="share-count">{len(selected)}</span></h3><ul class="share-list">'
        for item in selected[:3]:
            sidebar += f'''<li><a class="share-entry" href="learning/{escape(item['href'])}"><span class="share-entry-title">{value(item, 'title', english)}</span><span class="share-entry-summary">{value(item, 'summary', english)}</span><span class="share-entry-meta">{value(item, 'meta', english)}</span></a></li>'''
        sidebar += f'</ul><a class="share-more" href="learning/{library}#{category}">{"View all" if english else "查看全部"} →</a></section>'
    p = ROOT / home
    text = p.read_text(encoding='utf-8')
    block = '<!-- SHARING:START -->\n' + sidebar + '\n<!-- SHARING:END -->'
    if '<!-- SHARING:START -->' in text:
        text = re.sub(r'<!-- SHARING:START -->.*?<!-- SHARING:END -->', lambda _: block, text, flags=re.S)
    else:
        text, n = re.subn(r'(<div class="section-card share-card">).*?(\s*</div>)', lambda m: m[1] + '\n' + block + m[2], text, count=1, flags=re.S)
        assert n == 1
    if 'href="sharing.css"' not in text:
        text = text.replace('</head>', '<link rel="stylesheet" href="sharing.css">\n</head>')
    p.write_text(text, encoding='utf-8')

    cards = []
    for item in ITEMS:
        label = dict(groups)[item['category']]
        search_text = escape(' '.join(str(v) for k, v in item.items() if k not in ('href', 'source')))
        paper = f'<a href="{escape(item["source"])}" target="_blank" rel="noopener noreferrer">{"Original paper" if english else "论文原文"} ↗</a>' if 'source' in item else ''
        cards.append(f'''<article class="library-card" data-category="{item['category']}" data-search="{search_text}">
<p class="category-label">{label}</p><h2><a href="{escape(item['href'])}">{value(item, 'title', english)}</a></h2>
<p class="card-summary">{value(item, 'summary', english)}</p><p class="card-meta">{value(item, 'meta', english)}</p>
<div class="card-actions"><a href="{escape(item['href'])}">{'Read notes' if english else '开始阅读'} →</a>{paper}</div></article>''')
    buttons = ''.join(f'<button type="button" data-filter="{cat}" aria-pressed="{str(cat == "all").lower()}">{label}</button>' for cat, label in [('all', 'All' if english else '全部')] + groups)
    intro = 'Notes on computational modeling, neuroimaging, and artificial intelligence, with visual explanations and interactive exercises.' if english else '整理读过的论文与学过的方法，用图解、计算和交互实验，让理解多走一步。'
    subtitle = 'Full reading materials are currently in Chinese.' if english else '文献推荐从论文出发，学习笔记围绕方法展开。点击标题即可阅读全文。'
    document = f'''<!doctype html>
<html lang="{'en' if english else 'zh-CN'}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>{title} · Hang Yu</title><meta name="description" content="{intro}"><link rel="stylesheet" href="library.css"><script src="library.js" defer></script></head>
<body><div class="library-shell"><nav class="library-top" aria-label="{'Site navigation' if english else '站点导航'}"><a href="../{home}">← {'Hang Yu · Home' if english else '余航 · 个人主页'}</a><a href="{'index.html' if english else 'en.html'}" lang="{'zh-CN' if english else 'en'}">{'中文' if english else 'English'}</a></nav>
<header class="library-intro"><span class="eyebrow">NOTES & IDEAS</span><h1>{title}</h1><p>{intro}</p><p>{subtitle}</p></header>
<div class="library-tools"><div class="filters" role="group" aria-label="{'Category' if english else '内容分类'}">{buttons}</div><label class="library-search" for="library-search">{'Search notes' if english else '搜索内容'}<input id="library-search" type="search" placeholder="{'Title, topic, or keyword' if english else '标题、主题或关键词'}"></label></div>
<p class="library-status" id="library-status" role="status">{len(ITEMS)} {'resources' if english else '篇内容'}</p>
<main class="library-grid">{''.join(cards)}</main><p class="library-empty" id="library-empty" hidden>{'No matching notes. Try another keyword or category.' if english else '没有找到相关内容，试试其他关键词或分类。'}</p>
<footer class="library-footer">Hang Yu · {'Learning through reading, practice, and reflection.' if english else '在阅读、实践与思考中持续学习。'}</footer></div></body></html>'''
    (ROOT / 'learning' / library).write_text(document, encoding='utf-8')


if __name__ == '__main__':
    render(False)
    render(True)
    print(f'Updated both homepages and libraries: {len(ITEMS)} resources.')
