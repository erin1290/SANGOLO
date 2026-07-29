import sqlite3, datetime, sys

conn = sqlite3.connect(r'C:\Users\FTAB TECH\.local\share\mimocode\mimocode.db')
c = conn.cursor()

# Recent user-facing sessions (July 20+)
c.execute("""
    SELECT s.id, s.title, s.time_created
    FROM session s
    WHERE s.directory LIKE '%SANGOLO%'
      AND s.title NOT LIKE '%checkpoint-writer%'
      AND s.time_created > 1784700000000
    ORDER BY s.time_created DESC
""")
print("=== Recent user sessions (July 20+) ===")
for row in c.fetchall():
    ts = datetime.datetime.fromtimestamp(row[2]/1000).strftime("%Y-%m-%d %H:%M")
    print(f"  {row[0]} | {ts} | {row[1][:80]}")

# Search for user mandate patterns
print("\n=== User mandate patterns ===")
c.execute("""
    SELECT m.session_id, substr(json_extract(m.data, '$.content'), 1, 250) as preview
    FROM message m
    WHERE json_extract(m.data, '$.role') = 'user'
      AND (json_extract(m.data, '$.content') LIKE '%ne me pose%'
        OR json_extract(m.data, '$.content') LIKE '%pas de question%'
        OR json_extract(m.data, '$.content') LIKE '%attend que je%')
    ORDER BY m.time_created DESC
    LIMIT 10
""")
for row in c.fetchall():
    print(f"  {row[0]}: {row[1][:200]}")

# Search for "toujours" patterns (recurring issues)
print("\n=== Recurring issues (toujours) ===")
c.execute("""
    SELECT m.session_id, substr(json_extract(m.data, '$.content'), 1, 250) as preview
    FROM message m
    WHERE json_extract(m.data, '$.role') = 'user'
      AND json_extract(m.data, '$.content') LIKE '%toujours%'
    ORDER BY m.time_created DESC
    LIMIT 10
""")
for row in c.fetchall():
    print(f"  {row[0]}: {row[1][:200]}")

# Search for "traduire" / "langue" patterns
print("\n=== Language/translation mandates ===")
c.execute("""
    SELECT m.session_id, substr(json_extract(m.data, '$.content'), 1, 250) as preview
    FROM message m
    WHERE json_extract(m.data, '$.role') = 'user'
      AND (json_extract(m.data, '$.content') LIKE '%langue%'
        OR json_extract(m.data, '$.content') LIKE '%traduire%'
        OR json_extract(m.data, '$.content') LIKE '%traduction%'
        OR json_extract(m.data, '$.content') LIKE '%anglais%')
    ORDER BY m.time_created DESC
    LIMIT 10
""")
for row in c.fetchall():
    print(f"  {row[0]}: {row[1][:200]}")

# Search for "lance" patterns (launch directives)
print("\n=== Launch directives ===")
c.execute("""
    SELECT m.session_id, substr(json_extract(m.data, '$.content'), 1, 250) as preview
    FROM message m
    WHERE json_extract(m.data, '$.role') = 'user'
      AND json_extract(m.data, '$.content') LIKE '%lance%'
    ORDER BY m.time_created DESC
    LIMIT 5
""")
for row in c.fetchall():
    print(f"  {row[0]}: {row[1][:200]}")

conn.close()
