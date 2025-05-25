import React from 'react';
import { Link } from 'react-router-dom';

function BlogPost({ post }) {
  return (
    <div className="blog-post">
      <h3><Link to={`/post/${post.id}`}>{post.title}</Link></h3>
      <p>{post.content.substring(0, 100)}...</p>
      <p>Category: <Link to={`/category/${post.category}`}>{post.category}</Link></p>
    </div>
  );
}

export default BlogPost;