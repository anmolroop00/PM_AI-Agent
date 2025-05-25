const express = require('express');
const fs = require('fs').promises;
const path = require('path');
const { GoogleGenerativeAI } = require('@google/generative-ai');

class AIProjectManager {
  constructor(apiKey) {
    this.genAI = new GoogleGenerativeAI(apiKey);
    this.model = this.genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
    this.projects = new Map();
    this.agents = new Map();
    this.agentAliases = new Map(); // Add alias mapping
    this.setupAgents();
  }

  setupAgents() {
    // Define specialized AI agents with specific system prompts
    const agentConfigs = [
      {
        key: 'project_manager',
        aliases: ['project_manager', 'project manager', 'Project Manager', 'PM', 'pm'],
        config: {
          name: 'Project Manager',
          role: 'project_manager',
          systemPrompt: `You are an expert Project Manager AI. Your job is to:
1. Analyze client requirements thoroughly
2. Break down projects into specific, actionable tasks
3. Identify what type of specialists are needed (use exact keys: project_manager, frontend_specialist, backend_specialist, database_specialist, devops_specialist, tester)
4. Create realistic timelines and dependencies
5. Coordinate between different agents
6. Ensure project completion and quality

IMPORTANT: When assigning tasks, use these exact agent_type values:
- project_manager
- frontend_specialist  
- backend_specialist
- database_specialist
- devops_specialist
- tester

Always respond in JSON format with tasks, agents needed, timeline, and technical requirements.`,
          skills: ['project_planning', 'requirement_analysis', 'coordination', 'quality_assurance']
        }
      },
      {
        key: 'frontend_specialist',
        aliases: ['frontend_specialist', 'frontend specialist', 'Frontend Specialist', 'frontend', 'Frontend', 'ui_developer', 'frontend_developer'],
        config: {
          name: 'Frontend Developer',
          role: 'frontend_specialist',
          systemPrompt: `You are an expert Frontend Developer AI. You specialize in:
- React, Vue, Angular frameworks
- HTML5, CSS3, JavaScript/TypeScript
- UI/UX design principles
- Responsive design
- Performance optimization
- Accessibility standards

Generate actual, production-ready code with proper structure, error handling, and best practices.`,
          skills: ['react', 'vue', 'angular', 'html', 'css', 'javascript', 'typescript', 'ui_ux']
        }
      },
      {
        key: 'backend_specialist',
        aliases: ['backend_specialist', 'backend specialist', 'Backend Specialist', 'backend', 'Backend', 'api_developer', 'backend_developer'],
        config: {
          name: 'Backend Developer',
          role: 'backend_specialist', 
          systemPrompt: `You are an expert Backend Developer AI. You specialize in:
- Node.js, Python, Java, C# development
- RESTful APIs and GraphQL
- Database integration
- Authentication and authorization
- Microservices architecture
- Security best practices

Generate production-ready server code with proper error handling, logging, and scalability considerations.`,
          skills: ['nodejs', 'python', 'java', 'apis', 'databases', 'security', 'microservices']
        }
      },
      {
        key: 'database_specialist',
        aliases: ['database_specialist', 'database specialist', 'Database Specialist', 'database', 'Database', 'db_specialist', 'dba'],
        config: {
          name: 'Database Expert',
          role: 'database_specialist',
          systemPrompt: `You are an expert Database Developer AI. You specialize in:
- SQL databases (PostgreSQL, MySQL, SQL Server)
- NoSQL databases (MongoDB, Redis, Cassandra)
- Database design and normalization
- Query optimization
- Data modeling
- Migration strategies

Generate proper database schemas, queries, and data access patterns.`,
          skills: ['postgresql', 'mysql', 'mongodb', 'redis', 'sql', 'nosql', 'data_modeling']
        }
      },
      {
        key: 'devops_specialist',
        aliases: ['devops_specialist', 'devops specialist', 'DevOps Specialist', 'devops', 'DevOps', 'infrastructure', 'deployment'],
        config: {
          name: 'DevOps Engineer',
          role: 'devops_specialist',
          systemPrompt: `You are an expert DevOps Engineer AI. You specialize in:
- Docker and containerization
- Kubernetes orchestration
- CI/CD pipelines
- Cloud platforms (AWS, Azure, GCP)
- Infrastructure as Code
- Monitoring and logging

Generate deployment scripts, Docker files, and infrastructure configurations.`,
          skills: ['docker', 'kubernetes', 'aws', 'azure', 'cicd', 'terraform', 'monitoring']
        }
      },
      {
        key: 'tester',
        aliases: ['tester', 'Tester', 'qa', 'QA', 'qa_engineer', 'QA Engineer', 'quality_assurance', 'testing'],
        config: {
          name: 'QA Engineer',
          role: 'tester',
          systemPrompt: `You are an expert QA Engineer AI. You specialize in:
- Unit testing and integration testing
- Test automation frameworks
- Performance testing
- Security testing
- Bug detection and reporting
- Test case design

Generate comprehensive test suites and quality reports.`,
          skills: ['unit_testing', 'integration_testing', 'automation', 'performance_testing', 'security_testing']
        }
      }
    ];

    // Set up agents and aliases
    agentConfigs.forEach(({ key, aliases, config }) => {
      this.agents.set(key, config);
      
      // Map all aliases to the main key
      aliases.forEach(alias => {
        this.agentAliases.set(alias.toLowerCase(), key);
      });
    });

    console.log(`✅ Set up ${this.agents.size} agents with ${this.agentAliases.size} aliases`);
  }

  // Method to resolve agent key from various formats
  resolveAgentKey(agentType) {
    if (!agentType) return null;
    
    // Direct match
    if (this.agents.has(agentType)) {
      return agentType;
    }
    
    // Alias match
    const normalizedType = agentType.toLowerCase().trim();
    if (this.agentAliases.has(normalizedType)) {
      return this.agentAliases.get(normalizedType);
    }
    
    // Fallback: try partial matches
    for (const [alias, key] of this.agentAliases.entries()) {
      if (alias.includes(normalizedType) || normalizedType.includes(alias)) {
        return key;
      }
    }
    
    return null;
  }

  async generateContent(prompt, systemPrompt = '') {
    try {
      const fullPrompt = systemPrompt ? `${systemPrompt}\n\n${prompt}` : prompt;
      
      const result = await this.model.generateContent({
        contents: [{
          role: 'user',
          parts: [{ text: fullPrompt }]
        }],
        generationConfig: {
          temperature: 0.3,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 8192,
        }
      });

      return result.response.text();
    } catch (error) {
      console.error('Error generating content:', error);
      throw error;
    }
  }

  async analyzeRequirements(requirements) {
    const pmAgent = this.agents.get('project_manager');
    
    try {
      const availableAgents = Array.from(this.agents.keys()).join(', ');
      
      const prompt = `Analyze these project requirements and create a detailed project plan:

Requirements: ${requirements}

IMPORTANT: Use ONLY these exact agent_type values in your response: ${availableAgents}

Please provide a JSON response with:
1. project_summary
2. required_agents (list of agent types needed from: ${availableAgents})
3. tasks (with id, title, description, agent_type, dependencies, estimated_hours)
4. tech_stack
5. total_estimated_time
6. potential_challenges
7. deliverables

Example task format:
{
  "id": "task_1",
  "title": "Setup Database Schema",
  "description": "Design and implement database schema",
  "agent_type": "database_specialist",
  "dependencies": [],
  "estimated_hours": 4
}

Ensure the JSON is valid and properly formatted. Use ONLY the agent types listed above.`;

      const response = await this.generateContent(prompt, pmAgent.systemPrompt);
      
      // Clean the response to extract JSON
      let jsonStr = response;
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        jsonStr = jsonMatch[0];
      }
      
      // Parse and validate
      const parsed = JSON.parse(jsonStr);
      
      // Validate and fix agent types
      if (parsed.tasks) {
        parsed.tasks = parsed.tasks.map(task => {
          const resolvedAgent = this.resolveAgentKey(task.agent_type);
          if (!resolvedAgent) {
            console.warn(`⚠️  Unknown agent type "${task.agent_type}" in task "${task.title}", defaulting to project_manager`);
            task.agent_type = 'project_manager';
          } else {
            task.agent_type = resolvedAgent;
          }
          return task;
        });
      }
      
      return parsed;
    } catch (error) {
      console.error('Error analyzing requirements:', error);
      throw error;
    }
  }

  async executeTask(task, projectContext) {
    // Resolve agent key
    const agentKey = this.resolveAgentKey(task.agent_type);
    if (!agentKey) {
      console.error(`❌ Cannot resolve agent type: "${task.agent_type}"`);
      console.log('Available agents:', Array.from(this.agents.keys()));
      throw new Error(`Agent type "${task.agent_type}" not found. Available agents: ${Array.from(this.agents.keys()).join(', ')}`);
    }

    const agent = this.agents.get(agentKey);
    if (!agent) {
      throw new Error(`Agent ${agentKey} not found in agents map`);
    }

    try {
      console.log(`🔄 Executing task "${task.title}" with agent "${agent.name}" (${agentKey})`);
      
      const prompt = `Execute this task for the project:

Project Context: ${JSON.stringify(projectContext, null, 2)}

Task Details:
- Title: ${task.title}
- Description: ${task.description}
- Requirements: ${task.requirements || 'See project context'}

Please provide:
1. Complete implementation/solution
2. Code files (if applicable)
3. Documentation
4. Testing instructions
5. Integration notes
6. Next steps or recommendations

Format your response as structured output with clear sections.`;

      const response = await this.generateContent(prompt, agent.systemPrompt);

      return {
        task_id: task.id,
        agent_type: agentKey,
        agent_name: agent.name,
        result: response,
        completion_time: new Date().toISOString(),
        status: 'completed'
      };
    } catch (error) {
      console.error(`❌ Error executing task ${task.id}:`, error);
      return {
        task_id: task.id,
        agent_type: agentKey,
        agent_name: agent?.name || 'Unknown',
        result: `Error: ${error.message}`,
        completion_time: new Date().toISOString(),
        status: 'failed'
      };
    }
  }

  async createProject(requirements) {
    const projectId = Date.now().toString();
    
    console.log('🚀 Starting project analysis with Gemini...');
    const projectPlan = await this.analyzeRequirements(requirements);
    
    const project = {
      id: projectId,
      requirements,
      plan: projectPlan,
      status: 'planned',
      created_at: new Date().toISOString(),
      tasks: projectPlan.tasks || [],
      results: [],
      current_phase: 'planning',
      ai_model: 'gemini-2.0-flash'
    };
    
    this.projects.set(projectId, project);
    console.log(`✅ Project ${projectId} created with ${project.tasks.length} tasks`);
    
    // Log task assignments for verification
    project.tasks.forEach(task => {
      console.log(`   📋 Task: ${task.title} → Agent: ${task.agent_type}`);
    });
    
    return project;
  }

  async executeProject(projectId) {
    const project = this.projects.get(projectId);
    if (!project) {
      throw new Error(`Project ${projectId} not found`);
    }

    console.log(`🔄 Starting execution of project ${projectId} using Gemini AI`);
    project.status = 'in_progress';
    project.current_phase = 'execution';

    const completedTasks = new Set();
    const taskResults = [];

    // Sort tasks to handle dependencies
    const sortedTasks = this.topologicalSort(project.tasks);

    // Execute tasks based on dependencies
    for (const task of sortedTasks) {
      try {
        // Check if dependencies are satisfied
        const canExecute = !task.dependencies || 
          task.dependencies.every(dep => completedTasks.has(dep));

        if (canExecute) {
          const result = await this.executeTask(task, {
            project_summary: project.plan.project_summary,
            tech_stack: project.plan.tech_stack,
            requirements: project.requirements
          });

          taskResults.push(result);
          completedTasks.add(task.id);
          
          console.log(`✅ Completed task: ${task.title}`);
          
          // Add delay to respect rate limits
          await new Promise(resolve => setTimeout(resolve, 1000));
        } else {
          console.log(`⏳ Skipping task "${task.title}" - dependencies not met`);
        }
      } catch (error) {
        console.error(`❌ Failed to execute task "${task.title}":`, error.message);
        
        // Add failed task result
        taskResults.push({
          task_id: task.id,
          agent_type: task.agent_type,
          result: `Failed: ${error.message}`,
          completion_time: new Date().toISOString(),
          status: 'failed'
        });
      }
    }

    // Final integration and delivery
    console.log('🔧 Performing final integration with Gemini...');
    const finalDeliverable = await this.generateFinalDeliverable(project, taskResults);

    project.results = taskResults;
    project.final_deliverable = finalDeliverable;
    project.status = 'completed';
    project.current_phase = 'delivered';
    project.completed_at = new Date().toISOString();

    this.projects.set(projectId, project);
    
    console.log(`🎉 Project ${projectId} completed successfully with Gemini AI!`);
    return project;
  }

  // Simple topological sort for task dependencies
  topologicalSort(tasks) {
    const sorted = [];
    const visited = new Set();
    const visiting = new Set();

    const visit = (task) => {
      if (visiting.has(task.id)) {
        throw new Error(`Circular dependency detected involving task ${task.id}`);
      }
      if (visited.has(task.id)) {
        return;
      }

      visiting.add(task.id);
      
      if (task.dependencies) {
        for (const depId of task.dependencies) {
          const depTask = tasks.find(t => t.id === depId);
          if (depTask) {
            visit(depTask);
          }
        }
      }

      visiting.delete(task.id);
      visited.add(task.id);
      sorted.push(task);
    };

    for (const task of tasks) {
      if (!visited.has(task.id)) {
        visit(task);
      }
    }

    return sorted;
  }

  async generateFinalDeliverable(project, taskResults) {
    const pmAgent = this.agents.get('project_manager');
    
    try {
      const prompt = `Create a final project deliverable by integrating all task results:

Project: ${project.plan.project_summary}
Original Requirements: ${project.requirements}

Task Results:
${taskResults.map(r => `
Task: ${r.task_id}
Agent: ${r.agent_name || r.agent_type}
Status: ${r.status}
Result: ${r.result}
`).join('\n---\n')}

Please provide:
1. Executive Summary
2. Complete Solution Overview
3. Technical Documentation
4. Deployment Instructions
5. User Guide
6. Maintenance Notes
7. Future Recommendations

Format as a comprehensive project delivery document.`;

      const response = await this.generateContent(prompt, pmAgent.systemPrompt);
      return response;
    } catch (error) {
      console.error('Error generating final deliverable:', error);
      return `Error generating final deliverable: ${error.message}`;
    }
  }

  async saveProjectToFile(projectId) {
    const project = this.projects.get(projectId);
    if (!project) {
      throw new Error(`Project ${projectId} not found`);
    }

    const fileName = `project_${projectId}_${Date.now()}.json`;
    const filePath = path.join(__dirname, 'projects', fileName);
    
    // Ensure projects directory exists
    await fs.mkdir(path.join(__dirname, 'projects'), { recursive: true });
    
    await fs.writeFile(filePath, JSON.stringify(project, null, 2));
    console.log(`💾 Project saved to ${filePath}`);
    
    return filePath;
  }

  getProjectStatus(projectId) {
    return this.projects.get(projectId);
  }

  listProjects() {
    return Array.from(this.projects.values());
  }

  // Debug method to list all agents and aliases
  listAgents() {
    console.log('\n🤖 Available Agents:');
    for (const [key, agent] of this.agents.entries()) {
      console.log(`  ${key}: ${agent.name} (${agent.role})`);
    }
    
    console.log('\n🔗 Agent Aliases:');
    for (const [alias, key] of this.agentAliases.entries()) {
      console.log(`  "${alias}" → ${key}`);
    }
  }
}

// Express API Server (unchanged but with better error handling)
class ProjectManagerAPI {
  constructor(projectManager) {
    this.pm = projectManager;
    this.app = express();
    this.app.use(express.json());
    this.setupRoutes();
  }

  setupRoutes() {
    // Health check
    this.app.get('/api/health', (req, res) => {
      res.json({ 
        status: 'healthy', 
        ai_model: 'gemini-2.0-flash',
        agents_count: this.pm.agents.size,
        timestamp: new Date().toISOString()
      });
    });

    // Create new project
    this.app.post('/api/projects', async (req, res) => {
      try {
        const { requirements } = req.body;
        if (!requirements) {
          return res.status(400).json({ error: 'Requirements are required' });
        }

        const project = await this.pm.createProject(requirements);
        res.json({ success: true, project, ai_model: 'gemini-2.0-flash' });
      } catch (error) {
        console.error('API Error creating project:', error);
        res.status(500).json({ error: error.message, stack: error.stack });
      }
    });

    // Execute project
    this.app.post('/api/projects/:id/execute', async (req, res) => {
      try {
        const { id } = req.params;
        const project = await this.pm.executeProject(id);
        res.json({ success: true, project });
      } catch (error) {
        console.error('API Error executing project:', error);
        res.status(500).json({ error: error.message, stack: error.stack });
      }
    });

    // Get project status
    this.app.get('/api/projects/:id', (req, res) => {
      try {
        const { id } = req.params;
        const project = this.pm.getProjectStatus(id);
        if (!project) {
          return res.status(404).json({ error: 'Project not found' });
        }
        res.json({ project });
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    });

    // List all projects
    this.app.get('/api/projects', (req, res) => {
      try {
        const projects = this.pm.listProjects();
        res.json({ projects, ai_model: 'gemini-2.0-flash' });
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    });

    // Save project to file
    this.app.post('/api/projects/:id/save', async (req, res) => {
      try {
        const { id } = req.params;
        const filePath = await this.pm.saveProjectToFile(id);
        res.json({ success: true, filePath });
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    });

    // Get available agents
    this.app.get('/api/agents', (req, res) => {
      const agents = Array.from(this.pm.agents.values());
      const aliases = Array.from(this.pm.agentAliases.entries());
      res.json({ agents, aliases });
    });

    // Debug endpoint
    this.app.get('/api/debug/agents', (req, res) => {
      const agents = Array.from(this.pm.agents.entries()).map(([key, agent]) => ({
        key,
        name: agent.name,
        role: agent.role
      }));
      const aliases = Array.from(this.pm.agentAliases.entries()).map(([alias, key]) => ({
        alias,
        resolves_to: key
      }));
      res.json({ agents, aliases });
    });
  }

  start(port = 3000) {
    this.app.listen(port, () => {
      console.log(`🚀 AI Project Manager API (Gemini-powered) running on port ${port}`);
      console.log(`📖 Available endpoints:`);
      console.log(`  GET    /api/health                 - Health check`);
      console.log(`  POST   /api/projects              - Create new project`);
      console.log(`  POST   /api/projects/:id/execute  - Execute project`);
      console.log(`  GET    /api/projects/:id          - Get project status`);
      console.log(`  GET    /api/projects              - List all projects`);
      console.log(`  POST   /api/projects/:id/save     - Save project to file`);
      console.log(`  GET    /api/agents                - List available agents`);
      console.log(`  GET    /api/debug/agents          - Debug agent resolution`);
    });
  }
}

// CLI Interface (unchanged)
class ProjectManagerCLI {
  constructor(projectManager) {
    this.pm = projectManager;
  }

  async runInteractive() {
    const readline = require('readline');
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });

    console.log('🤖 AI Project Manager CLI (Powered by Gemini)');
    
    // Show available agents
    this.pm.listAgents();
    
    console.log('\nEnter your project requirements:');

    rl.question('Requirements: ', async (requirements) => {
      try {
        console.log('\n📋 Creating project with Gemini AI...');
        const project = await this.pm.createProject(requirements);
        
        console.log('\n✅ Project Plan Created:');
        console.log(`Project ID: ${project.id}`);
        console.log(`AI Model: ${project.ai_model}`);
        console.log(`Summary: ${project.plan.project_summary}`);
        console.log(`Tasks: ${project.tasks.length}`);
        console.log(`Estimated Time: ${project.plan.total_estimated_time}`);

        rl.question('\nExecute project now? (y/n): ', async (answer) => {
          if (answer.toLowerCase() === 'y') {
            console.log('\n🚀 Starting project execution with Gemini...');
            const completedProject = await this.pm.executeProject(project.id);
            
            console.log('\n🎉 Project Completed!');
            console.log('\n📄 Final Deliverable:');
            console.log(completedProject.final_deliverable);
            
            // Save to file
            const filePath = await this.pm.saveProjectToFile(project.id);
            console.log(`\n💾 Project saved to: ${filePath}`);
          }
          
          rl.close();
        });
      } catch (error) {
        console.error('❌ Error:', error.message);
        console.error('Stack:', error.stack);
        rl.close();
      }
    });
  }
}

// Usage Examples and Main Function (unchanged)
async function main() {
  // Initialize with your Gemini API key
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.error('❌ Please set GEMINI_API_KEY environment variable');
    console.error('   Get your API key from: https://makersuite.google.com/app/apikey');
    process.exit(1);
  }

  const projectManager = new AIProjectManager(apiKey);

  // Check command line arguments
  const args = process.argv.slice(2);
  
  if (args[0] === 'api') {
    // Start API server
    const api = new ProjectManagerAPI(projectManager);
    api.start(3000);
  } else if (args[0] === 'cli') {
    // Start CLI interface
    const cli = new ProjectManagerCLI(projectManager);
    await cli.runInteractive();
  } else if (args[0] === 'debug') {
    // Debug mode - show agent information
    projectManager.listAgents();
  } else {
    // Example usage
    console.log('🤖 AI Project Manager - Powered by Google Gemini\n');
    
    try {
      const requirements = `
      Build a real-time chat application with the following features:
      - User authentication with JWT
      - Real-time messaging using WebSocket
      - Group chat functionality
      - File sharing capabilities
      - Message history and search
      - Mobile responsive design
      - Push notifications
      - Admin dashboard for user management
      `;

      console.log('📋 Creating project with Gemini AI...');
      const project = await projectManager.createProject(requirements);
      
      console.log('✅ Project created:', project.id);
      console.log('🤖 AI Model:', project.ai_model);
      console.log('📊 Plan summary:', project.plan.project_summary);
      
      console.log('\n🚀 Executing project with Gemini...');
      const completedProject = await projectManager.executeProject(project.id);
      
      console.log('\n🎉 Project completed!');
      console.log('📄 Saving deliverable...');
      
      const filePath = await projectManager.saveProjectToFile(project.id);
      console.log('💾 Saved to:', filePath);
      
    } catch (error) {
      console.error('❌ Error:', error.message);
      console.error('Stack:', error.stack);
    }
  }
}

// Export for use as module
module.exports = {
  AIProjectManager,
  ProjectManagerAPI,
  ProjectManagerCLI
};

// Run if called directly
if (require.main === module) {
  main().catch(console.error);
}

/* 
CHANGES MADE TO FIX "Agent not found" ERROR:

1. ✅ Added agentAliases Map for flexible agent name resolution
2. ✅ Added resolveAgentKey() method to handle various agent name formats
3. ✅ Modified system prompt to specify exact agent_type values to use
4. ✅ Added validation and auto-correction of agent types in analyzeRequirements()
5. ✅ Enhanced executeTask() with better error handling and agent resolution
6. ✅ Added topological sorting for proper task dependency handling
7. ✅ Added debug methods and endpoints to troubleshoot agent issues
8. ✅ Better error messages with available agent lists
9. ✅ Added logging for task assignments during project creation

DEBUGGING COMMANDS:
- node ai_project_manager.js debug          - Show all agents and aliases
- GET /api/debug/agents                     - API endpoint for agent debugging
- GET /api/agents                          - List agents with aliases
*/