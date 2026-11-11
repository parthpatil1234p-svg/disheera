import os

server_js_path = os.path.join(os.path.dirname(__file__), '..', 'server', 'server.js')
with open(server_js_path, 'r', encoding='utf-8') as f:
    code = f.read()

import_target = "const leaderboardRoutes = require('./routes/leaderboardRoutes');"
import_replacement = "const leaderboardRoutes = require('./routes/leaderboardRoutes');\nconst vivaRoutes = require('./routes/vivaRoutes');"

mount_target = "app.use('/api/leaderboard', leaderboardRoutes);"
mount_replacement = "app.use('/api/leaderboard', leaderboardRoutes);\n\n// Code-Grounded Voice Viva Proctoring Engine (Anti-Cheat Moat)\napp.use('/api/viva', vivaRoutes);"

if import_target in code and mount_target in code:
    code = code.replace(import_target, import_replacement, 1)
    code = code.replace(mount_target, mount_replacement, 1)
    with open(server_js_path, 'w', encoding='utf-8') as f:
        f.write(code)
    print("SUCCESS: vivaRoutes mounted in server.js")
else:
    print("TARGET NOT FOUND")
