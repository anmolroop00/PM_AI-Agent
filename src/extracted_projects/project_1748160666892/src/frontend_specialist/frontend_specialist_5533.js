// Example: Handling API errors
        async function fetchData() {
          try {
            const response = await fetch('/api/data');
            if (!response.ok) {
              throw new Error(`HTTP error! status: ${response.status}`);
            }
            const data = await response.json();
            return data;
          } catch (error) {
            console.error("Error fetching data:", error);
            throw error; // Re-throw the error to be handled by the component
          }
        }