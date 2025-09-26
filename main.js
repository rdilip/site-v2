// Main JavaScript for Rohit Dilip's Personal Site

class PersonalSite {
    constructor() {
        this.currentSection = 'home';
        this.init();
    }

    init() {
        this.setupNavigation();
        this.setupSmoothScrolling();
        this.loadBlogPosts();
        this.setupEventListeners();
    }

    setupNavigation() {
        const navLinks = document.querySelectorAll('.nav-links a');
        const sections = document.querySelectorAll('section[id]');

        // Update active nav link based on scroll position
        const updateActiveNav = () => {
            let current = '';
            sections.forEach(section => {
                const sectionTop = section.offsetTop - 100;
                const sectionHeight = section.offsetHeight;
                if (window.scrollY >= sectionTop && window.scrollY < sectionTop + sectionHeight) {
                    current = section.getAttribute('id');
                }
            });

            navLinks.forEach(link => {
                link.classList.remove('active');
                if (link.getAttribute('href') === `#${current}`) {
                    link.classList.add('active');
                }
            });
        };

        window.addEventListener('scroll', updateActiveNav);
        updateActiveNav(); // Initial call
    }

    setupSmoothScrolling() {
        const links = document.querySelectorAll('a[href^="#"]');
        
        links.forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const targetId = link.getAttribute('href').substring(1);
                const targetElement = document.getElementById(targetId);
                
                if (targetElement) {
                    const offsetTop = targetElement.offsetTop - 80; // Account for fixed header
                    window.scrollTo({
                        top: offsetTop,
                        behavior: 'smooth'
                    });
                }
            });
        });
    }

    async loadBlogPosts() {
        const blogList = document.getElementById('blog-list');
        const blogPost = document.getElementById('blog-post');
        
        try {
            const response = await fetch('blog/index.json');
            const posts = await response.json();
            
            blogList.innerHTML = '';
            
            posts.forEach(post => {
                const postElement = this.createBlogPostElement(post);
                blogList.appendChild(postElement);
            });
            
        } catch (error) {
            console.error('Error loading blog posts:', error);
            blogList.innerHTML = '<p class="loading">Error loading blog posts</p>';
        }
    }

    createBlogPostElement(post) {
        const postDiv = document.createElement('div');
        postDiv.className = 'blog-item';
        postDiv.innerHTML = `
            <h3>${post.title}</h3>
            <div class="meta">${post.date} • ${post.readTime} min read</div>
            <div class="excerpt">${post.excerpt}</div>
        `;
        
        postDiv.addEventListener('click', () => {
            this.loadBlogPost(post.slug);
        });
        
        return postDiv;
    }

    async loadBlogPost(slug) {
        const blogList = document.getElementById('blog-list');
        const blogPost = document.getElementById('blog-post');
        
        // Show loading state
        blogPost.style.display = 'block';
        blogList.style.display = 'none';
        blogPost.innerHTML = '<div class="loading">Loading post...</div>';
        
        try {
            const response = await fetch(`blog/${slug}.md`);
            const markdown = await response.text();
            
            // Render markdown using the blog.js functionality
            const html = window.BlogRenderer.renderMarkdown(markdown);
            
            // Get post metadata
            const posts = await fetch('blog/index.json').then(r => r.json());
            const post = posts.find(p => p.slug === slug);
            
            blogPost.innerHTML = `
                <a href="#" class="blog-back" onclick="personalSite.showBlogList()">← Back to Blog</a>
                <h1>${post.title}</h1>
                <div class="meta">${post.date} • ${post.readTime} min read</div>
                <div class="blog-post-content">${html}</div>
            `;
            
            // Re-render MathJax
            if (window.MathJax) {
                window.MathJax.typesetPromise([blogPost]);
            }
            
            // Scroll to top of blog section
            document.getElementById('blog').scrollIntoView({ behavior: 'smooth' });
            
        } catch (error) {
            console.error('Error loading blog post:', error);
            blogPost.innerHTML = '<div class="loading">Error loading blog post</div>';
        }
    }

    showBlogList() {
        const blogList = document.getElementById('blog-list');
        const blogPost = document.getElementById('blog-post');
        
        blogList.style.display = 'block';
        blogPost.style.display = 'none';
        
        // Scroll to blog section
        document.getElementById('blog').scrollIntoView({ behavior: 'smooth' });
    }

    setupEventListeners() {
        // Handle browser back/forward buttons
        window.addEventListener('popstate', (e) => {
            if (e.state && e.state.blogPost) {
                this.loadBlogPost(e.state.blogPost);
            } else {
                this.showBlogList();
            }
        });

        // Add click handler for blog back button
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('blog-back')) {
                e.preventDefault();
                this.showBlogList();
            }
        });
    }
}

// Utility functions
const utils = {
    formatDate(dateString) {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    },

    estimateReadTime(text) {
        const wordsPerMinute = 200;
        const wordCount = text.split(/\s+/).length;
        return Math.ceil(wordCount / wordsPerMinute);
    },

    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }
};

// Initialize the site when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.personalSite = new PersonalSite();
});

// Add some interactive enhancements
document.addEventListener('DOMContentLoaded', () => {
    // Add hover effects to blog items
    const blogItems = document.querySelectorAll('.blog-item');
    blogItems.forEach(item => {
        item.addEventListener('mouseenter', () => {
            item.style.transform = 'translateY(-2px)';
        });
        
        item.addEventListener('mouseleave', () => {
            item.style.transform = 'translateY(0)';
        });
    });

    // Add typing effect to hero subtitle (optional enhancement)
    const heroSubtitle = document.querySelector('.hero-subtitle');
    if (heroSubtitle) {
        const text = heroSubtitle.textContent;
        heroSubtitle.textContent = '';
        
        let i = 0;
        const typeWriter = () => {
            if (i < text.length) {
                heroSubtitle.textContent += text.charAt(i);
                i++;
                setTimeout(typeWriter, 100);
            }
        };
        
        // Start typing effect after a short delay
        setTimeout(typeWriter, 1000);
    }
});