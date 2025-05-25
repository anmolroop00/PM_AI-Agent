// Example: Error handling in a React component
        import React, { useState, useEffect } from 'react';

        function BlogPost({ postId }) {
          const [post, setPost] = useState(null);
          const [error, setError] = useState(null);

          useEffect(() => {
            async function fetchPost() {
              try {
                const response = await fetch(`/api/posts/${postId}`);
                if (!response.ok) {
                  throw new Error(`HTTP error! status: ${response.status}`);
                }
                const data = await response.json();
                setPost(data);
              } catch (e) {
                setError(e.message);
              }
            }

            fetchPost();
          }, [postId]);

          if (error) {
            return <div>Error: {error}</div>;
          }

          if (!post) {
            return <div>Loading...</div>;
          }

          return (
            <div>
              <h1>{post.title}</h1>
              <p>{post.content}</p>
            </div>
          );
        }

        export default BlogPost;