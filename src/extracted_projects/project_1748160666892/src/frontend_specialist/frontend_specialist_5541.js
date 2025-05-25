// Example: React Router configuration
        import React from 'react';
        import { BrowserRouter as Router, Route, Switch, Link } from 'react-router-dom';

        function Home() {
          return <h2>Home</h2>;
        }

        function About() {
          return <h2>About</h2>;
        }

        function NotFound() {
          return <h2>404 Not Found</h2>;
        }

        function App() {
          return (
            <Router>
              <div>
                <nav>
                  <ul>
                    <li>
                      <Link to="/">Home</Link>
                    </li>
                    <li>
                      <Link to="/about">About</Link>
                    </li>
                  </ul>
                </nav>

                <Switch>
                  <Route exact path="/" component={Home} />
                  <Route path="/about" component={About} />
                  <Route path="*" component={NotFound} /> {/* Catch-all route for 404 */}
                </Switch>
              </div>
            </Router>
          );
        }

        export default App;