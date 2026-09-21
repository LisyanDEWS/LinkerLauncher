def check_braces(filename):
    with open(filename, 'r') as f:
        content = f.read()
    
    # Just a simple check for '{' and '}'
    open_b = content.count('{')
    close_b = content.count('}')
    print(f"Open: {open_b}, Close: {close_b}")

check_braces('src/App.tsx')
