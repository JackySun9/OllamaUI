# System Prompt Learning Guide

## 🎯 Overview

This guide will help you master system prompts using your Ollama WebUI frontend. System prompts are powerful tools that shape how AI models behave, respond, and interact with users.

## 🚀 Getting Started

### Prerequisites
1. **Set up your environment:**
   ```bash
   # Start the backend
   python api.py
   
   # Start the frontend (in another terminal)
   npm run dev
   ```

2. **Select a model** in the interface before testing system prompts

### What You'll Learn
- **Basic Concepts**: Understanding what system prompts are and how they work
- **Practical Application**: Using different prompt types for various tasks
- **Comparison Techniques**: Systematically testing different approaches
- **Advanced Strategies**: Creating sophisticated, custom prompts

## 📚 Learning Modules

### Module 1: System Prompt Basics
**Goal**: Understand the fundamentals of system prompts

**Exercises**:
1. **Start with no system prompt**
   - Ask: "Explain quantum physics"
   - Note the style and approach

2. **Apply a basic system prompt**
   - Use: "You are a helpful AI assistant"
   - Ask the same question
   - Compare the responses

3. **Try a specific role**
   - Use: "You are a patient teacher explaining complex topics to beginners"
   - Ask the same question again
   - Notice the difference in explanation style

**Key Takeaway**: System prompts dramatically change how AI responds to the same input.

### Module 2: Role-Based Prompts
**Goal**: Explore how different roles affect AI behavior

**Prompt Examples to Test**:

```
🎭 Creative Writer
"You are a creative writing assistant with expertise in storytelling, poetry, and creative expression. Help users develop compelling narratives, interesting characters, and vivid descriptions."

🧮 Math Tutor  
"You are a patient and encouraging math tutor. Break down complex problems into manageable steps. Show your work clearly, explain the reasoning behind each step, and check for understanding."

👨‍💻 Code Reviewer
"You are an experienced software engineer conducting code reviews. Analyze code for correctness, best practices, performance, security, and maintainability. Provide constructive feedback."

🎨 Art Critic
"You are a knowledgeable art critic with expertise in various art movements, techniques, and cultural contexts. Provide insightful analysis of artworks and artistic concepts."
```

**Exercise**: 
- Test each role with the question: "How would you approach creating something beautiful?"
- Compare how each role interprets and responds to this question

### Module 3: Prompt Engineering Techniques

#### 3.1 Specificity
**Bad**: "You are helpful"
**Good**: "You are a senior software engineer specializing in Python web development with 10+ years of experience in Django and FastAPI"

#### 3.2 Behavior Guidelines
**Example**:
```
You are a helpful coding assistant. Follow these guidelines:
- Always ask clarifying questions before providing solutions
- Explain your reasoning step by step
- Provide working code examples
- Include error handling where appropriate
- Suggest testing approaches
```

#### 3.3 Output Format Control
**Example**:
```
Structure all responses as:
1. **Summary**: Brief overview of the topic
2. **Detailed Explanation**: In-depth information
3. **Example**: Practical demonstration
4. **Next Steps**: Suggested follow-up actions
```

#### 3.4 Context and Constraints
**Example**:
```
You are helping a complete beginner learning to code. Use simple language, avoid jargon, and always provide examples. If you must use technical terms, explain them clearly.
```

### Module 4: Comparative Analysis
**Goal**: Learn to systematically compare different prompting approaches

**Exercise**: Use the comparison tool to test these prompts with the same input:

**Prompt A**: 
```
You are a helpful AI assistant.
```

**Prompt B**: 
```
You are a Socratic teacher. Instead of giving direct answers, guide students to discover solutions through thoughtful questions. Ask probing questions that help them think critically and arrive at understanding on their own.
```

**Test Input**: "How does photosynthesis work?"

**Analysis Points**:
- Information delivery method
- Level of detail
- Teaching approach
- User engagement strategy

## 🛠️ Practical Exercises

### Exercise 1: The Tone Test
Create prompts that produce these different tones for the same content:
- **Professional**: Formal, business-like responses
- **Casual**: Friendly, conversational responses  
- **Academic**: Scholarly, detailed responses
- **Humorous**: Light-hearted, entertaining responses

**Test Question**: "Explain how email works"

### Exercise 2: The Expertise Ladder
Create prompts for different expertise levels:
- **Beginner**: Simple explanations, basic concepts
- **Intermediate**: More detail, some technical terms
- **Expert**: Complex analysis, advanced concepts

**Test Question**: "Explain machine learning"

### Exercise 3: The Format Challenge
Create prompts that produce different output formats:
- **Bullet Points**: Structured, scannable lists
- **Narrative**: Story-like explanations
- **Q&A**: Question and answer format
- **Step-by-Step**: Procedural instructions

**Test Question**: "How to bake a cake"

## 🏆 Advanced Challenges

### Challenge 1: The Multi-Role Prompt
Create a system prompt that combines multiple roles:
```
You are a senior software engineer and technical writer who also teaches programming. When answering questions:
- Provide technically accurate information (engineer)
- Explain concepts clearly and engagingly (teacher)  
- Structure responses for easy reading (technical writer)
```

### Challenge 2: The Adaptive Prompt
Create a prompt that adapts to the user's level:
```
You are an adaptive tutor. First, assess the user's knowledge level by asking a clarifying question, then adjust your explanation accordingly. Always confirm understanding before moving to more complex concepts.
```

### Challenge 3: The Constraint Challenge
Create a prompt with specific constraints:
```
You are a creative writing coach who only responds in exactly 3 sentences. The first sentence should inspire, the second should provide practical advice, and the third should encourage action.
```

## 📊 Evaluation Criteria

When testing your prompts, evaluate based on:

### Effectiveness
- Does it achieve the intended behavior?
- Is the AI following the guidelines?
- Does it maintain consistency?

### Clarity
- Are instructions unambiguous?
- Is the role well-defined?
- Are expectations clear?

### Robustness
- Does it work with different types of inputs?
- Does it handle edge cases well?
- Is it resistant to prompt injection?

### Usability
- Is it practical for real-world use?
- Does it enhance user experience?
- Is it maintainable?

## 🔄 Iterative Improvement Process

1. **Start Simple**: Begin with basic role definition
2. **Test Extensively**: Try various inputs and scenarios
3. **Identify Issues**: Note where the prompt fails or is unclear
4. **Refine Gradually**: Make small, targeted improvements
5. **Compare Versions**: Use the comparison tool to validate improvements
6. **Document Learnings**: Keep notes on what works and what doesn't

## 💡 Pro Tips

### Do's
- ✅ Be specific about the role and expertise level
- ✅ Include clear behavioral guidelines
- ✅ Specify output format when needed
- ✅ Test with diverse inputs
- ✅ Iterate based on results

### Don'ts  
- ❌ Don't make prompts unnecessarily complex
- ❌ Don't contradict yourself within the prompt
- ❌ Don't forget to test edge cases
- ❌ Don't assume the AI will infer unstated requirements
- ❌ Don't neglect to specify tone and style when important

## 📈 Measuring Progress

Track your learning progress by:

1. **Prompt Quality**: Can you write clear, effective prompts?
2. **Prediction Accuracy**: Can you predict how a prompt will affect responses?
3. **Problem Solving**: Can you diagnose and fix prompt issues?
4. **Creativity**: Can you design innovative prompting approaches?
5. **Efficiency**: Can you achieve desired behavior with concise prompts?

## 🎓 Next Steps

After mastering these basics:

1. **Explore Advanced Techniques**:
   - Chain-of-thought prompting
   - Few-shot learning examples
   - Constitutional AI principles

2. **Specialized Applications**:
   - Domain-specific prompts (legal, medical, technical)
   - Multi-modal prompts (text + image)
   - Conversational flow design

3. **Integration Projects**:
   - Build prompt libraries for your use cases
   - Create prompt templates for teams
   - Develop prompt testing frameworks

## 🤝 Community Learning

- Share interesting prompts you discover
- Collaborate on challenging prompt engineering problems
- Document edge cases and solutions
- Create domain-specific prompt collections

Remember: System prompt engineering is both an art and a science. The more you practice and experiment, the better you'll become at crafting prompts that produce exactly the behavior you want! 