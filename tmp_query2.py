import sqlite3, json

conn = sqlite3.connect(r'C:\Users\FTAB TECH\.local\share\mimocode\mimocode.db')
c = conn.cursor()

# User mandates about questions, language, etc.
print("=== User mandate patterns (from part table) ===")
c.execute("""
    SELECT p.session_id, json_extract(p.data, '$.text') as text
    FROM part p
    JOIN message m ON m.id = p.message_id
    WHERE json_extract(m.data, '$.role') = 'user'
      AND json_extract(p.data, '$.type') = 'text'
      AND (json_extract(p.data, '$.text') LIKE '%ne me pose%'
        OR json_extract(p.data, '$.text') LIKE '%pas de question%'
        OR json_extract(p.data, '$.text') LIKE '%attend que je%'
        OR json_extract(p.data, '$.text') LIKE '%tai dit%'
        OR json_extract(p.data, '$.text') LIKE '%t''ai dit%')
    ORDER BY m.time_created DESC
    LIMIT 10
""")
for row in c.fetchall():
    print(f"  [{row[0]}] {row[1][:250]}")

# Recurring "toujours" issues
print("\n=== Recurring issues (toujours) ===")
c.execute("""
    SELECT p.session_id, json_extract(p.data, '$.text') as text
    FROM part p
    JOIN message m ON m.id = p.message_id
    WHERE json_extract(m.data, '$.role') = 'user'
      AND json_extract(p.data, '$.type') = 'text'
      AND json_extract(p.data, '$.text') LIKE '%toujours%'
    ORDER BY m.time_created DESC
    LIMIT 10
""")
for row in c.fetchall():
    print(f"  [{row[0]}] {row[1][:250]}")

# Language/translation mandates
print("\n=== Language/translation mandates ===")
c.execute("""
    SELECT p.session_id, json_extract(p.data, '$.text') as text
    FROM part p
    JOIN message m ON m.id = p.message_id
    WHERE json_extract(m.data, '$.role') = 'user'
      AND json_extract(p.data, '$.type') = 'text'
      AND (json_extract(p.data, '$.text') LIKE '%langue%'
        OR json_extract(p.data, '$.text') LIKE '%traduire%'
        OR json_extract(p.data, '$.text') LIKE '%traduction%'
        OR json_extract(p.data, '$.text') LIKE '%anglais%')
    ORDER BY m.time_created DESC
    LIMIT 10
""")
for row in c.fetchall():
    print(f"  [{row[0]}] {row[1][:250]}")

# "ne pose plus" or "plus de questions"
print("\n=== Don't ask questions mandates ===")
c.execute("""
    SELECT p.session_id, json_extract(p.data, '$.text') as text
    FROM part p
    JOIN message m ON m.id = p.message_id
    WHERE json_extract(m.data, '$.role') = 'user'
      AND json_extract(p.data, '$.type') = 'text'
      AND (json_extract(p.data, '$.text') LIKE '%plus de questions%'
        OR json_extract(p.data, '$.text') LIKE '%plus question%'
        OR json_extract(p.data, '$.text') LIKE '%ne pose%')
    ORDER BY m.time_created DESC
    LIMIT 10
""")
for row in c.fetchall():
    print(f"  [{row[0]}] {row[1][:250]}")

# "execute toi" or "lance ca" directives
print("\n=== Execute directly mandates ===")
c.execute("""
    SELECT p.session_id, json_extract(p.data, '$.text') as text
    FROM part p
    JOIN message m ON m.id = p.message_id
    WHERE json_extract(m.data, '$.role') = 'user'
      AND json_extract(p.data, '$.type') = 'text'
      AND (json_extract(p.data, '$.text') LIKE '%toi meme%'
        OR json_extract(p.data, '$.text') LIKE '%toi-meme%'
        OR json_extract(p.data, '$.text') LIKE '%lance ca%'
        OR json_extract(p.data, '$.text') LIKE '%commande toi%')
    ORDER BY m.time_created DESC
    LIMIT 10
""")
for row in c.fetchall():
    print(f"  [{row[0]}] {row[1][:250]}")

# "whatsapp" mentions
print("\n=== WhatsApp-style mandates ===")
c.execute("""
    SELECT p.session_id, json_extract(p.data, '$.text') as text
    FROM part p
    JOIN message m ON m.id = p.message_id
    WHERE json_extract(m.data, '$.role') = 'user'
      AND json_extract(p.data, '$.type') = 'text'
      AND json_extract(p.data, '$.text') LIKE '%whatsapp%'
    ORDER BY m.time_created DESC
    LIMIT 5
""")
for row in c.fetchall():
    print(f"  [{row[0]}] {row[1][:250]}")

conn.close()
