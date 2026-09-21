with open('src/App.tsx', 'r', encoding='utf-8') as f:
    lines = f.readlines()

out = []
for i, line in enumerate(lines):
    # the extra </div> was added after id="proxy-card-action-btn" ... </button>
    if 'id="proxy-card-action-btn"' in line:
        pass
    if 'id="linkergames-action-btn"' in line:
        pass
