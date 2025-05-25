SELECT c.*
    FROM categories c
    JOIN post_categories pc ON c.id = pc.category_id
    WHERE pc.post_id = 456; -- Replace 456 with the post's ID