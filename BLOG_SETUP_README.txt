What was added:
- blog.html (lists posts from blog/posts.json)
- post.html (renders a post from blog/posts/{slug}.md)
- blog/posts.json (post index used by blog.html)
- blog/posts/ (markdown posts)
- admin/index.html + admin/config.yml (Netlify CMS)

How to publish from CMS:
1) /admin → Blog Posts → New Blog Posts (creates blog/posts/{slug}.md)
2) /admin → Blog Index → Posts List → Add a new entry with same slug
3) Redeploy (or if using Git repo connected, it auto-builds)
