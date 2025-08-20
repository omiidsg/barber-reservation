import requests
from bs4 import BeautifulSoup
import re
import json

def extract_electro_background():
    """استخراج کدهای بک‌گراند سایت الکترو"""
    
    url = "https://electrotm.org/"
    
    try:
        # دریافت HTML صفحه
        headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        }
        
        response = requests.get(url, headers=headers)
        response.raise_for_status()
        
        soup = BeautifulSoup(response.content, 'html.parser')
        
        # استخراج تمام CSS
        css_links = []
        for link in soup.find_all('link', rel='stylesheet'):
            if link.get('href'):
                css_links.append(link['href'])
        
        # استخراج تمام JavaScript
        js_scripts = []
        for script in soup.find_all('script', src=True):
            js_scripts.append(script['src'])
        
        # استخراج inline CSS
        inline_styles = []
        for style in soup.find_all('style'):
            inline_styles.append(style.get_text())
        
        # استخراج inline JavaScript
        inline_scripts = []
        for script in soup.find_all('script'):
            if script.get_text().strip():
                inline_scripts.append(script.get_text())
        
        # استخراج المان‌های بک‌گراند
        background_elements = []
        for element in soup.find_all(['div', 'canvas', 'svg']):
            if element.get('class'):
                classes = ' '.join(element.get('class'))
                if any(keyword in classes.lower() for keyword in ['background', 'bg', 'canvas', 'gradient', 'particle', 'animation']):
                    background_elements.append({
                        'tag': element.name,
                        'classes': classes,
                        'id': element.get('id', ''),
                        'style': element.get('style', ''),
                        'html': str(element)[:500]  # 500 کاراکتر اول
                    })
        
        # ذخیره نتایج
        results = {
            'css_links': css_links,
            'js_scripts': js_scripts,
            'inline_styles': inline_styles,
            'inline_scripts': inline_scripts,
            'background_elements': background_elements,
            'full_html': str(soup)
        }
        
        # ذخیره در فایل
        with open('electro_code_analysis.json', 'w', encoding='utf-8') as f:
            json.dump(results, f, ensure_ascii=False, indent=2)
        
        print("✅ کدهای سایت الکترو استخراج شد!")
        print(f"📁 نتایج در فایل: electro_code_analysis.json")
        
        return results
        
    except Exception as e:
        print(f"❌ خطا در استخراج کد: {e}")
        return None

if __name__ == "__main__":
    extract_electro_background() 