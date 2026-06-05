from pathlib import Path

ROOT = Path(__file__).parent
OUT = ROOT / "generated-implementation-prompts"
OUT.mkdir(exist_ok=True)

required = [
    "design-system.json",
    "content-model.json",
    "master-prompt.md",
    "page-prompts.md",
    "tech-stack.md",
    "architecture.md",
    "coding-rules.md",
    "master-implementation-prompt.md",
    "page-implementation-prompts.md",
]

missing = [name for name in required if not (ROOT / name).exists()]
if missing:
    raise SystemExit("Missing required files: " + ", ".join(missing))

common_names = [
    "design-system.json",
    "content-model.json",
    "master-prompt.md",
    "tech-stack.md",
    "architecture.md",
    "coding-rules.md",
    "master-implementation-prompt.md",
]
common = "\n\n".join((ROOT / name).read_text(encoding="utf-8") for name in common_names)
pages = (ROOT / "page-implementation-prompts.md").read_text(encoding="utf-8")

headings = [
    "## STEP 0 — KHỞI TẠO DỰ ÁN",
    "## STEP 1 — TRANG CHỦ `/`",
    "## STEP 2 — DANH SÁCH SẢN PHẨM `/products`",
    "## STEP 3 — CHI TIẾT SẢN PHẨM `/products/[slug]`",
    "## STEP 4 — TRANG CUSTOM `/custom`",
    "## STEP 5 — VỀ SUGONG `/about`",
    "## STEP 6 — KIỂM TRA VÀ TỐI ƯU",
]

for index, heading in enumerate(headings):
    start = pages.index(heading)
    end = pages.find("\n## STEP", start + len(heading))
    section = pages[start:] if end == -1 else pages[start:end]
    output = f"{common}\n\n# CURRENT IMPLEMENTATION TASK\n{section}\n"
    filename = f"step-{index}.md"
    (OUT / filename).write_text(output, encoding="utf-8")
    print("Created:", OUT / filename)
