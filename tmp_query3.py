import sqlite3, json

conn = sqlite3.connect(r'C:\Users\FTAB TECH\.local\share\mimocode\mimocode.db')
c = conn.cursor()

# Check for "ne me pose plus de questions" mandate
print("=== 'Don't ask questions' mandate ===")
c.execute("""
    SELECT p.session_id, json_extract(p.data, '$.text') as text
    FROM part p
    JOIN message m ON m.id = p.message_id
    WHERE json_extract(m.data, '$.role') = 'user'
      AND json_extract(p.data, '$.type') = 'text'
      AND (json_extract(p.data, '$.text') LIKE '%question%'
        OR json_extract(p.data, '$.text') LIKE '%me demande%'
        OR json_extract(p.data, '$.text') LIKE '%explique ce que je veux%')
    ORDER BY m.time_created DESC
    LIMIT 15
""")
for row in c.fetchall():
    print(f"  [{row[0]}] {row[1][:300]}")

# Check for "il faut" or "must" mandates
print("\n=== 'Must/Il faut' mandates ===")
c.execute("""
    SELECT p.session_id, json_extract(p.data, '$.text') as text
    FROM part p
    JOIN message m ON m.id = p.message_id
    WHERE json_extract(m.data, '$.role') = 'user'
      AND json_extract(p.data, '$.type') = 'text'
      AND (json_extract(p.data, '$.text') LIKE '%il faut%'
        OR json_extract(p.data, '$.text') LIKE '%must%'
        OR json_extract(p.data, '$.text') LIKE '%obligatoire%'
        OR json_extract(p.data, '$.text') LIKE '%toujours%doit%')
    ORDER BY m.time_created DESC
    LIMIT 10
""")
for row in c.fetchall():
    print(f"  [{row[0]}] {row[1][:300]}")

# Check for "permission" / "permission restriction" issues
print("\n=== Permission restriction issues ===")
c.execute("""
    SELECT p.session_id, json_extract(p.data, '$.text') as text
    FROM part p
    JOIN message m ON m.id = p.message_id
    WHERE json_extract(m.data, '$.role') = 'user'
      AND json_extract(p.data, '$.type') = 'text'
      AND (json_extract(p.data, '$.text') LIKE '%permission%'
        OR json_extract(p.data, '$.text') LIKE '%autorisation%'
        OR json_extract(p.data, '$.text') LIKE '%bloc%')
    ORDER BY m.time_created DESC
    LIMIT 10
""")
for row in c.fetchall():
    print(f"  [{row[0]}] {row[1][:300]}")

# Check for "fais ca toi meme" (execute yourself) mandates - broader search
print("\n=== Execute yourself mandates (broad) ===")
c.execute("""
    SELECT p.session_id, json_extract(p.data, '$.text') as text
    FROM part p
    JOIN message m ON m.id = p.message_id
    WHERE json_extract(m.data, '$.role') = 'user'
      AND json_extract(p.data, '$.type') = 'text'
      AND (json_extract(p.data, '$.text') LIKE '%toi meme%'
        OR json_extract(p.data, '$.text') LIKE '%toi-meme%'
        OR json_extract(p.data, '$.text') LIKE '%lance ca%'
        OR json_extract(p.data, '$.text') LIKE '%commande toi%'
        OR json_extract(p.data, '$.text') LIKE '%fais le toi%'
        OR json_extract(p.data, '$.text') LIKE '%fais ca toi%')
    ORDER BY m.time_created DESC
    LIMIT 15
""")
for row in c.fetchall():
    print(f"  [{row[0]}] {row[1][:300]}")

# Check for "premier" (priority) mandates
print("\n=== Priority mandates ===")
c.execute("""
    SELECT p.session_id, json_extract(p.data, '$.text') as text
    FROM part p
    JOIN message m ON m.id = p.message_id
    WHERE json_extract(m.data, '$.role') = 'user'
      AND json_extract(p.data, '$.type') = 'text'
      AND (json_extract(p.data, '$.text') LIKE '%priorite%'
        OR json_extract(p.data, '$.text') LIKE '%dabord%'
        OR json_extract(p.data, '$.text') LIKE '%en premier%')
    ORDER BY m.time_created DESC
    LIMIT 10
""")
for row in c.fetchall():
    print(f"  [{row[0]}] {row[1][:300]}")

conn.close()
