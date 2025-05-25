import React from 'react';
import { useParams } from 'react-router-dom';
import BlogPost from '../components/BlogPost';

const dummyPosts = [
    { id: 1, title: 'First Post', content: 'This is the content of the first post.', category: 'Technology' },
    { id: 2, title: 'Second Post', content: 'This is the content of the second post.', category: 'Travel' },
    { id: 3, title: 'Third Post', content: 'This is the content of the third post.', category: 'Technology' },
  ];

function CategoryPosts() {
  const { category } = useParams();
  const posts = dummyPosts.filter(post => post.category === category);

  return (
    <div>
      <h2>Posts in {category}</h2>
      {posts.map(post => (
        <BlogPost key={post.id} post={post} />
      ))}
    </div>
  );
}

export default CategoryPosts;