---
title: Example Research Project
date: January 2025
description: A placeholder demonstrating the research page format. Replace this with your actual project.
---

This is an example research writeup. Each research post is a standalone markdown file in the `research/` directory with its own URL at `research.html?post=<filename>`.

---

## Math Support

Inline math works as expected: $E = mc^2$, $\nabla \cdot \mathbf{B} = 0$.

Display math with double dollars:

$$
\mathcal{L} = \int d^4x \left[ -\frac{1}{4} F_{\mu\nu} F^{\mu\nu} + \bar{\psi}(i\gamma^\mu D_\mu - m)\psi \right]
$$

AMS environments are also supported:

\begin{align}
\frac{\partial \rho}{\partial t} + \nabla \cdot (\rho \mathbf{v}) &= 0 \\
\frac{\partial (\rho \mathbf{v})}{\partial t} + \nabla \cdot (\rho \mathbf{v} \otimes \mathbf{v}) &= -\nabla p + \nabla \cdot \boldsymbol{\tau}
\end{align}

## Images

Add images using standard markdown syntax. Paths should be relative to the site root:

```markdown
![Description](research/images/your_image.png)
```

Or use HTML for more control over sizing and layout:

```html
<div style="display: flex; justify-content: center; gap: 1rem;">
  <img src="research/images/image1.png" style="width: 40%;" alt="First image">
  <img src="research/images/image2.png" style="width: 40%;" alt="Second image">
</div>
```

## Code

```python
import torch
import torch.nn as nn

class FlowMatcher(nn.Module):
    def __init__(self, dim, hidden_dim=256):
        super().__init__()
        self.net = nn.Sequential(
            nn.Linear(dim + 1, hidden_dim),
            nn.SiLU(),
            nn.Linear(hidden_dim, dim),
        )

    def forward(self, x, t):
        return self.net(torch.cat([x, t], dim=-1))
```

## How to Add a New Research Post

1. Create a new `.md` file in the `research/` directory
2. Add YAML front matter with `title`, `date`, and `description`
3. Add the filename to the `researchPosts` array in `research.js`
4. The post will appear on the listing page and have its own URL
