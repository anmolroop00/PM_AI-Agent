import React from 'react';
import { useParams } from 'react-router-dom';

const dummyPosts = [
    { id: 1, title: 'First Post', content: 'This is the content of the first post.', category: 'Technology' },
    { id: 2, title: 'Second Post', content: 'This is the content of the second post.', category: 'Travel' },
    { id: 3, title: 'Third Post', content: 'This is the content of the third post.', category: 'Technology' },
  ];

function PostDetails() {
  const { id } = useParams();
  const post = dummyPosts.find(post => post.id === parseInt(id));

  if (!post) {
    return <div>Post not found</div>;
  }

  return (
    <div>
      <h2>{post.title}</h2>
      <p>{post.content}</p>
    </div>
  );
}

export default PostDetails;