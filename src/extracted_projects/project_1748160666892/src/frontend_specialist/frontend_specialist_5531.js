// Example: Updating state immutably
        import React, { useState } from 'react';

        function Counter() {
          const [count, setCount] = useState(0);

          const increment = () => {
            setCount(prevCount => prevCount + 1); // Use functional update
          };

          return (
            <div>
              <p>Count: {count}</p>
              <button onClick={increment}>Increment</button>
            </div>
          );
        }

        export default Counter;