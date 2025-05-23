"use client";

import React from 'react';
import { RichMarkdown } from './RichMarkdown';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const markdownContent = `# Rich Markdown Demo

This demo showcases comprehensive markdown support with enhanced styling and functionality.

## Paragraphs and Text Formatting

This is a regular paragraph with **bold text**, *italic text*, and ~~strikethrough text~~. You can also use \`inline code\` within paragraphs.

Here's another paragraph with a [link to Google](https://google.com) and some more text to demonstrate proper spacing and formatting.

## Headings

### This is an H3 heading
#### This is an H4 heading
##### This is an H5 heading
###### This is an H6 heading

## Lists

### Unordered Lists
- First item
- Second item with **bold text**
- Third item with *italic text*
  - Nested item 1
  - Nested item 2
    - Deeply nested item

### Ordered Lists
1. First numbered item
2. Second numbered item
3. Third numbered item
   1. Nested numbered item
   2. Another nested item

### Task Lists (GitHub Flavored Markdown)
- [x] Completed task
- [x] Another completed task
- [ ] Incomplete task
- [ ] Another incomplete task

## Code Blocks

### JavaScript Example
\`\`\`javascript
function fibonacci(n) {
  if (n <= 1) return n;
  return fibonacci(n - 1) + fibonacci(n - 2);
}

const result = fibonacci(10);
console.log(\`The 10th Fibonacci number is: \${result}\`);

// ES6 Arrow function version
const fibonacciArrow = (n) => n <= 1 ? n : fibonacciArrow(n - 1) + fibonacciArrow(n - 2);
\`\`\`

### Python Example
\`\`\`python
def quick_sort(arr):
    if len(arr) <= 1:
        return arr
    
    pivot = arr[len(arr) // 2]
    left = [x for x in arr if x < pivot]
    middle = [x for x in arr if x == pivot]
    right = [x for x in arr if x > pivot]
    
    return quick_sort(left) + middle + quick_sort(right)

# Example usage
numbers = [3, 6, 8, 10, 1, 2, 1]
sorted_numbers = quick_sort(numbers)
print(f"Sorted array: {sorted_numbers}")
\`\`\`

### SQL Example
\`\`\`sql
SELECT 
    users.name,
    users.email,
    COUNT(orders.id) as order_count,
    SUM(orders.total) as total_spent
FROM users
LEFT JOIN orders ON users.id = orders.user_id
WHERE users.created_at >= '2024-01-01'
GROUP BY users.id, users.name, users.email
HAVING COUNT(orders.id) > 0
ORDER BY total_spent DESC
LIMIT 10;
\`\`\`

### Bash/Shell Example
\`\`\`bash
#!/bin/bash

# Function to deploy application
deploy_app() {
    local environment=$1
    local version=$2
    
    echo "Deploying version $version to $environment..."
    
    # Build the application
    npm run build
    
    # Run tests
    npm test
    
    # Deploy to environment
    case $environment in
        "production")
            echo "Deploying to production..."
            kubectl apply -f k8s/production/
            ;;
        "staging")
            echo "Deploying to staging..."
            kubectl apply -f k8s/staging/
            ;;
        *)
            echo "Unknown environment: $environment"
            exit 1
            ;;
    esac
    
    echo "Deployment completed successfully!"
}

deploy_app "staging" "v1.2.3"
\`\`\`

## Tables

### Simple Table
| Name | Age | City | Occupation |
|------|-----|------|------------|
| Alice | 28 | New York | Software Engineer |
| Bob | 32 | San Francisco | Data Scientist |
| Charlie | 25 | Seattle | Designer |
| Diana | 30 | Austin | Product Manager |

### Complex Table with Formatting
| Feature | **Basic Plan** | **Pro Plan** | **Enterprise** |
|---------|----------------|--------------|----------------|
| **Users** | Up to 5 | Up to 50 | Unlimited |
| **Storage** | 10 GB | 100 GB | *Custom* |
| **Support** | Email only | Email + Chat | \`24/7 Priority\` |
| **API Access** | ❌ | ✅ | ✅ |
| **Custom Domain** | ❌ | ✅ | ✅ |
| **Price/month** | $9 | $29 | *Contact us* |

## Blockquotes

> This is a simple blockquote.

> This is a **longer blockquote** that demonstrates how blockquotes can contain other markdown formatting like *italic text* and \`inline code\`.
> 
> It can also span multiple lines and contain lists:
> - Point one
> - Point two
> - Point three

## Mathematical Expressions (LaTeX)

### Inline Math
The quadratic formula is $x = \\frac{-b \\pm \\sqrt{b^2 - 4ac}}{2a}$ and the area of a circle is $A = \\pi r^2$.

### Block Math
$$
\\int_{-\\infty}^{\\infty} e^{-x^2} dx = \\sqrt{\\pi}
$$

$$
E = mc^2
$$

$$
\\sum_{n=1}^{\\infty} \\frac{1}{n^2} = \\frac{\\pi^2}{6}
$$

### Matrix Example
$$
\\begin{pmatrix}
a & b \\\\
c & d
\\end{pmatrix}
\\begin{pmatrix}
x \\\\
y
\\end{pmatrix}
=
\\begin{pmatrix}
ax + by \\\\
cx + dy
\\end{pmatrix}
$$

## Horizontal Rules

---

## Images

![Placeholder Image](https://via.placeholder.com/600x300/4f46e5/ffffff?text=Sample+Image)

---

## Mixed Content Example

Here's a complex example combining multiple features:

### Algorithm Analysis

The **time complexity** of different sorting algorithms:

| Algorithm | Best Case | Average Case | Worst Case | Space Complexity |
|-----------|-----------|--------------|------------|------------------|
| Quick Sort | $O(n \\log n)$ | $O(n \\log n)$ | $O(n^2)$ | $O(\\log n)$ |
| Merge Sort | $O(n \\log n)$ | $O(n \\log n)$ | $O(n \\log n)$ | $O(n)$ |
| Heap Sort | $O(n \\log n)$ | $O(n \\log n)$ | $O(n \\log n)$ | $O(1)$ |
| Bubble Sort | $O(n)$ | $O(n^2)$ | $O(n^2)$ | $O(1)$ |

Implementation checklist:
- [x] Quick Sort
- [x] Merge Sort  
- [x] Heap Sort
- [ ] Radix Sort
- [ ] Counting Sort

> **Note**: The choice of algorithm depends on your specific use case and data characteristics.

\`\`\`python
def merge_sort(arr):
    """
    Efficient implementation of merge sort
    Time Complexity: O(n log n)
    Space Complexity: O(n)
    """
    if len(arr) <= 1:
        return arr
    
    mid = len(arr) // 2
    left = merge_sort(arr[:mid])
    right = merge_sort(arr[mid:])
    
    return merge(left, right)
\`\`\`

This concludes our comprehensive markdown demo!`;

export const MarkdownDemo: React.FC = () => {
  return (
    <div className="container mx-auto py-8 px-4">
      <Card className="max-w-4xl mx-auto">
        <CardHeader>
          <CardTitle className="text-2xl font-bold">
            Rich Markdown Support Demo
          </CardTitle>
        </CardHeader>
        <CardContent>
          <RichMarkdown content={markdownContent} />
        </CardContent>
      </Card>
    </div>
  );
}; 