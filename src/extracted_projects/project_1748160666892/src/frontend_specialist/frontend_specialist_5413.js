import React from 'react';
import BlogPost from '../components/BlogPost';
import CategoryList from '../components/CategoryList';
import UserProfile from '../components/UserProfile';

const dummyPosts = [
  { id: 1, title: 'First Post', content: 'This is the content of the first post.', category: 'Technology' },
  { id: 2, title: 'Second Post', content: 'This is the content of the second post.', category: 'Travel' },
  { id: 3, title: 'Third Post', content: 'This is the content of the third post.', category: 'Technology' },
];

const dummyCategories = ['Technology', 'Travel', 'Food'];

const dummyUser = { name: 'John Doe', email: 'john.doe@example.com' };

function Home() {
  return (
    <div>
      <UserProfile user={dummyUser} />
      <CategoryList categories={dummyCategories} />
      {dummyPosts.map(post => (
        <BlogPost key={post.id} post={post} />
      ))}
    </div>
  );
}

export default Home;