// Project Code Extractor - Extract and organize generated code from AI Project Manager JSON
const fs = require('fs').promises;
const path = require('path');

class ProjectCodeExtractor {
  constructor() {
    this.outputDir = 'extracted_projects';
  }

  async extractProject(jsonFilePath) {
    try {
      console.log(`📂 Extracting project from: ${jsonFilePath}`);
      
      // Read the project JSON
      const jsonData = await fs.readFile(jsonFilePath, 'utf8');
      const project = JSON.parse(jsonData);
      
      // Create output directory
      const projectDir = path.join(this.outputDir, `project_${project.id}`);
      await fs.mkdir(projectDir, { recursive: true });
      
      console.log(`📁 Created project directory: ${projectDir}`);
      
      // Extract different components
      await this.extractCodeFiles(project, projectDir);
      await this.createProjectStructure(project, projectDir);
      await this.generateReadme(project, projectDir);
      await this.extractDocumentation(project, projectDir);
      await this.createPackageJson(project, projectDir);
      
      console.log(`✅ Project extracted successfully to: ${projectDir}`);
      return projectDir;
      
    } catch (error) {
      console.error('❌ Error extracting project:', error);
      throw error;
    }
  }

  async extractCodeFiles(project, projectDir) {
    const codeDir = path.join(projectDir, 'src');
    await fs.mkdir(codeDir, { recursive: true });
    
    console.log('🔧 Extracting code files...');
    
    for (const result of project.results || []) {
      if (result.status === 'completed') {
        await this.parseAndSaveCode(result, codeDir, project);
      }
    }
  }

  async parseAndSaveCode(result, codeDir, project) {
    const content = result.result;
    const agentType = result.agent_type;
    
    // Create agent-specific directory
    const agentDir = path.join(codeDir, agentType);
    await fs.mkdir(agentDir, { recursive: true });
    
    // Extract code blocks from the AI response
    const codeBlocks = this.extractCodeBlocks(content);
    
    for (const block of codeBlocks) {
      const fileName = this.generateFileName(block, agentType);
      const filePath = path.join(agentDir, fileName);
      
      await fs.writeFile(filePath, block.code);
      console.log(`  📝 Created: ${fileName}`);
    }
    
    // Save the full response as documentation
    const docPath = path.join(agentDir, `${agentType}_notes.md`);
    await fs.writeFile(docPath, `# ${result.agent_name || agentType} Output\n\n${content}`);
  }

  extractCodeBlocks(content) {
    const blocks = [];
    
    // Match code blocks with language specification
    const codeBlockRegex = /```(\w+)?\n([\s\S]*?)```/g;
    let match;
    
    while ((match = codeBlockRegex.exec(content)) !== null) {
      const language = match[1] || 'text';
      const code = match[2].trim();
      
      if (code.length > 10) { // Only save substantial code blocks
        blocks.push({
          language,
          code,
          raw: match[0]
        });
      }
    }
    
    // If no code blocks found, look for file-like content
    if (blocks.length === 0) {
      blocks.push({
        language: 'text',
        code: content,
        raw: content
      });
    }
    
    return blocks;
  }

  generateFileName(block, agentType) {
    const extensions = {
      javascript: '.js',
      js: '.js',
      typescript: '.ts',
      ts: '.ts',
      python: '.py',
      java: '.java',
      html: '.html',
      css: '.css',
      sql: '.sql',
      json: '.json',
      yaml: '.yml',
      yml: '.yml',
      dockerfile: '.dockerfile',
      bash: '.sh',
      shell: '.sh'
    };
    
    const ext = extensions[block.language.toLowerCase()] || '.txt';
    
    // Try to extract filename from content
    const lines = block.code.split('\n');
    for (const line of lines.slice(0, 5)) {
      if (line.includes('filename:') || line.includes('File:')) {
        const match = line.match(/(?:filename:|File:)\s*([^\s]+)/i);
        if (match) return match[1];
      }
    }
    
    // Generate filename based on agent type and language
    const timestamp = Date.now().toString().slice(-4);
    return `${agentType}_${timestamp}${ext}`;
  }

  async createProjectStructure(project, projectDir) {
    console.log('📊 Creating project structure...');
    
    const structure = {
      src: {
        frontend: {},
        backend: {},
        database: {},
        tests: {},
        deployment: {}
      },
      docs: {},
      config: {},
      scripts: {}
    };
    
    // Create directory structure
    await this.createDirectories(projectDir, structure);
    
    // Create structure documentation
    const structureDoc = `# Project Structure\n\n${this.generateStructureDoc(structure)}`;
    await fs.writeFile(path.join(projectDir, 'STRUCTURE.md'), structureDoc);
  }

  async createDirectories(basePath, structure) {
    for (const [key, value] of Object.entries(structure)) {
      const dirPath = path.join(basePath, key);
      await fs.mkdir(dirPath, { recursive: true });
      
      if (typeof value === 'object' && Object.keys(value).length > 0) {
        await this.createDirectories(dirPath, value);
      }
    }
  }

  generateStructureDoc(structure, indent = '') {
    let doc = '';
    for (const key of Object.keys(structure)) {
      doc += `${indent}- **${key}/**\n`;
      if (typeof structure[key] === 'object' && Object.keys(structure[key]).length > 0) {
        doc += this.generateStructureDoc(structure[key], indent + '  ');
      }
    }
    return doc;
  }

  async generateReadme(project, projectDir) {
    console.log('📖 Generating README...');
    
    const readme = `# ${project.plan?.project_summary || 'AI Generated Project'}

## Project Information
- **Project ID**: ${project.id}
- **Created**: ${project.created_at}
- **Status**: ${project.status}
- **AI Model**: ${project.ai_model}

## Requirements
${project.requirements}

## Tech Stack
${Array.isArray(project.plan?.tech_stack) ? 
  project.plan.tech_stack.map(tech => `- ${tech}`).join('\n') : 
  (project.plan?.tech_stack || 'Not specified')}

## Tasks Completed
${project.tasks?.map(task => 
  `- **${task.title}** (${task.agent_type}): ${task.description}`
).join('\n') || 'No tasks listed'}

## Installation & Setup

1. **Install Dependencies**
   \`\`\`bash
   npm install
   \`\`\`

2. **Environment Setup**
   - Copy \`.env.example\` to \`.env\`
   - Fill in your configuration values

3. **Database Setup**
   - Run database migrations
   - Seed initial data

4. **Start Development Server**
   \`\`\`bash
   npm run dev
   \`\`\`

## Project Structure
See [STRUCTURE.md](./STRUCTURE.md) for detailed project structure.

## Documentation
- [API Documentation](./docs/api.md)
- [Database Schema](./docs/database.md)
- [Deployment Guide](./docs/deployment.md)

## Final Deliverable
${project.final_deliverable ? '✅ Available in project JSON' : '❌ Not generated'}

## Generated by
AI Project Manager powered by ${project.ai_model}
Generated on: ${new Date().toISOString()}
`;

    await fs.writeFile(path.join(projectDir, 'README.md'), readme);
  }

  async extractDocumentation(project, projectDir) {
    console.log('📚 Extracting documentation...');
    
    const docsDir = path.join(projectDir, 'docs');
    await fs.mkdir(docsDir, { recursive: true });
    
    // Extract final deliverable
    if (project.final_deliverable) {
      await fs.writeFile(
        path.join(docsDir, 'final_deliverable.md'),
        `# Final Project Deliverable\n\n${project.final_deliverable}`
      );
    }
    
    // Extract project plan
    if (project.plan) {
      await fs.writeFile(
        path.join(docsDir, 'project_plan.json'),
        JSON.stringify(project.plan, null, 2)
      );
    }
    
    // Create API documentation template
    const apiDoc = `# API Documentation

## Endpoints

<!-- Add your API endpoints here -->

## Authentication

<!-- Add authentication details -->

## Examples

<!-- Add usage examples -->
`;
    await fs.writeFile(path.join(docsDir, 'api.md'), apiDoc);
    
    // Create deployment guide
    const deployDoc = `# Deployment Guide

## Prerequisites

## Development Deployment

## Production Deployment

## Environment Variables

## Monitoring

## Troubleshooting
`;
    await fs.writeFile(path.join(docsDir, 'deployment.md'), deployDoc);
  }

  async createPackageJson(project, projectDir) {
    console.log('📦 Creating package.json...');
    
    const packageJson = {
      name: `ai-generated-project-${project.id}`,
      version: "1.0.0",
      description: project.plan?.project_summary || "AI Generated Project",
      main: "src/index.js",
      scripts: {
        "start": "node src/index.js",
        "dev": "nodemon src/index.js",
        "test": "jest",
        "build": "npm run build:frontend && npm run build:backend",
        "build:frontend": "echo 'Add frontend build command'",
        "build:backend": "echo 'Add backend build command'"
      },
      dependencies: {
        "express": "^4.18.2",
        "cors": "^2.8.5",
        "dotenv": "^16.0.3"
      },
      devDependencies: {
        "nodemon": "^2.0.22",
        "jest": "^29.5.0"
      },
      keywords: project.plan?.tech_stack || [],
      author: "AI Project Manager",
      license: "MIT",
      generated: {
        by: "AI Project Manager",
        model: project.ai_model,
        timestamp: new Date().toISOString(),
        project_id: project.id
      }
    };
    
    await fs.writeFile(
      path.join(projectDir, 'package.json'),
      JSON.stringify(packageJson, null, 2)
    );
  }

  async batchExtract(projectsDir) {
    console.log(`🔄 Batch extracting all projects from: ${projectsDir}`);
    
    const files = await fs.readdir(projectsDir);
    const jsonFiles = files.filter(file => file.endsWith('.json'));
    
    const results = [];
    
    for (const file of jsonFiles) {
      try {
        const filePath = path.join(projectsDir, file);
        const outputDir = await this.extractProject(filePath);
        results.push({ file, outputDir, status: 'success' });
      } catch (error) {
        console.error(`❌ Failed to extract ${file}:`, error.message);
        results.push({ file, error: error.message, status: 'failed' });
      }
    }
    
    console.log('\n📊 Batch Extraction Results:');
    results.forEach(result => {
      const status = result.status === 'success' ? '✅' : '❌';
      console.log(`  ${status} ${result.file}`);
    });
    
    return results;
  }
}

// CLI Usage
async function main() {
  const extractor = new ProjectCodeExtractor();
  const args = process.argv.slice(2);
  
  if (args[0] === 'batch') {
    // Extract all projects from projects directory
    const projectsDir = args[1] || './projects';
    await extractor.batchExtract(projectsDir);
  } else if (args[0]) {
    // Extract single project
    await extractor.extractProject(args[0]);
  } else {
    console.log(`
🔧 Project Code Extractor Usage:

Single Project:
  node project_extractor.js path/to/project.json

Batch Extract:
  node project_extractor.js batch [projects_directory]

Examples:
  node project_extractor.js project_1234567890_1703123456.json
  node project_extractor.js batch ./projects
    `);
  }
}

// Export for use as module
module.exports = { ProjectCodeExtractor };

// Run if called directly
if (require.main === module) {
  main().catch(console.error);
}