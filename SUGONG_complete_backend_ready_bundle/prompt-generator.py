from pathlib import Path
import json

ROOT = Path(__file__).parent
OUTPUT = ROOT / "generated-prompts"
OUTPUT.mkdir(exist_ok=True)

design = json.loads((ROOT / "design-system.json").read_text(encoding="utf-8"))
content = json.loads((ROOT / "content-model.json").read_text(encoding="utf-8"))
master = (ROOT / "master-prompt.md").read_text(encoding="utf-8")
pages_text = (ROOT / "page-prompts.md").read_text(encoding="utf-8")

page_map = {
    "page-1-home": "## PAGE 1 — TRANG CHỦ",
    "page-2-products": "## PAGE 2 — DANH SÁCH SẢN PHẨM",
    "page-3-product-detail": "## PAGE 3 — CHI TIẾT SẢN PHẨM",
    "page-4-custom": "## PAGE 4 — NHẬN CUSTOM",
    "page-5-about-tiktok": "## PAGE 5 — VỀ SUGONG / TIKTOK",
}

def extract_section(text: str, heading: str) -> str:
    start = text.index(heading)
    rest = text[start:]
    next_pos = rest.find("\n## ", len(heading))
    return rest if next_pos == -1 else rest[:next_pos]

def compact_json(data) -> str:
    return json.dumps(data, ensure_ascii=False, indent=2)

for filename, heading in page_map.items():
    page_prompt = extract_section(pages_text, heading)
    final_prompt = f"""{master}

# DESIGN SYSTEM DATA
{compact_json(design)}

# CONTENT DATA
{compact_json(content)}

# PAGE REQUEST
{page_prompt}

# FINAL INSTRUCTION
Hãy dùng chính xác cấu trúc page trên, giữ layout tối giản và đồng nhất với toàn bộ hệ thống SUGONG.
"""
    output_path = OUTPUT / f"{filename}.md"
    output_path.write_text(final_prompt, encoding="utf-8")
    print(f"Created: {output_path}")
