import os
import re

pattern = re.compile(r'(?<!t\()(?<!t\([\'"])(?<![`\'"])(incident|dashboard|feed|notif|auth|admin|common|auth|my_incidents)\.[a-zA-Z._]+')

def find_raw_keys(directory):
    for root, dirs, files in os.walk(directory):
        if 'node_modules' in dirs:
            dirs.remove('node_modules')
        for file in files:
            if file.endswith('.js'):
                path = os.path.join(root, file)
                with open(path, 'r', encoding='utf-8') as f:
                    try:
                        content = f.read()
                        matches = pattern.finditer(content)
                        for match in matches:
                            # Verify if it's inside a string or comment
                            start = match.start()
                            line_start = content.rfind('\n', 0, start) + 1
                            line = content[line_start:content.find('\n', start)]
                            if 't(' not in line and (match.group(0) in line):
                                 print(f"{path}:{content.count('\\n', 0, start)+1}: {match.group(0)}")
                    except Exception as e:
                        pass

find_raw_keys(r'c:\Users\User\OneDrive\Desktop\cominity_system_management\frontend\src')
