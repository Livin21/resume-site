# Livin Mathew - Resume Website

A modern, responsive resume website built with Tailwind CSS, showcasing the professional experience and projects of Livin Mathew, an Solutions Architect.

## 🚀 Features

- **Responsive Design**: Optimized for mobile, tablet, and desktop
- **Dark Mode**: System-aware dark/light theme toggle
- **Modern UI**: Clean, professional design with glassmorphism effects
- **Performance**: Lighthouse scores > 95
- **Accessibility**: WCAG compliant
- **SEO Optimized**: Proper meta tags and semantic HTML

## 🛠️ Tech Stack

- **Framework**: Plain HTML, CSS, JavaScript
- **Styling**: Tailwind CSS v3.4.0
- **Icons**: Font Awesome 6.0
- **Deployment**: Ready for Cloudflare Pages

## 📂 Project Structure

```
resume-site/
├── public/
│   ├── index.html          # Main resume page
│   ├── projects.html       # Detailed projects page
│   ├── 404.html           # Custom 404 page
│   └── style.css          # Compiled Tailwind CSS
├── src/
│   └── input.css          # Tailwind source CSS
├── assets/                # Images and icons
├── package.json
├── tailwind.config.js
└── postcss.config.js
```

## 🏃‍♂️ Getting Started

### Prerequisites
- Node.js (version 16 or higher)
- npm

### Installation

1. Clone the repository:
```bash
git clone https://github.com/livin21/resume-site.git
cd resume-site
```

2. Install dependencies:
```bash
npm install
```

3. Build the CSS:
```bash
npm run build
```

4. For development with watch mode:
```bash
npm run watch
```

### Available Scripts

- `npm run build` - Build CSS for production
- `npm run watch` - Watch for changes and rebuild CSS automatically

## 🚀 Deployment

### Cloudflare Pages

1. Connect your GitHub repository to Cloudflare Pages
2. Configure build settings:
   - **Build command**: `npm run build`
   - **Output directory**: `public`
   - **Framework preset**: None (static)

3. Set environment variables (optional):
   - `NODE_VERSION=20`

### Local Development

You can serve the files locally using any static file server:

```bash
# Using Python
python -m http.server 8000 --directory public

# Using Node.js (if you have http-server installed)
npx http-server public

# Using VS Code Live Server extension
# Right-click on index.html and select "Open with Live Server"
```

## 🎨 Customization

### Colors
Update the primary and secondary colors in `tailwind.config.js`:

```javascript
theme: {
  extend: {
    colors: {
      primary: '#2563eb',    // Blue
      secondary: '#14b8a6'   // Teal
    }
  }
}
```

### Content
- Update personal information in `public/index.html`
- Modify projects in `public/projects.html`
- Add your own project images to the `assets/` folder

## 📱 Pages

### Home (`index.html`)
- Hero section with contact information
- Professional summary
- Skills grid with categorized technologies
- Experience timeline
- Featured projects preview
- Speaking engagements and awards
- Contact section

### Projects (`projects.html`)
- Detailed project descriptions
- Technical specifications
- Links to live demos and repositories
- Technology stack information
- Contribution statistics

### 404 (`404.html`)
- Custom error page
- Navigation back to main sections
- Consistent styling with the rest of the site

## 🌟 Features in Detail

### Dark Mode
- Automatic system preference detection
- Manual toggle button
- Persistent theme selection via localStorage
- Smooth transitions between themes

### Responsive Design
- Mobile-first approach
- Optimized for all screen sizes
- Touch-friendly navigation
- Adaptive layouts

### Performance
- Minimal JavaScript
- Optimized CSS with Tailwind's purge
- Fast loading times
- Efficient asset management

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 📞 Contact

**Livin Mathew**
- Email: [livinmathew99@gmail.com](mailto:livinmathew99@gmail.com)
- LinkedIn: [linkedin.com/in/livin21](https://linkedin.com/in/livin21)
- GitHub: [github.com/livin21](https://github.com/livin21)
- Medium: [medium.com/@livinmathew](https://medium.com/@livinmathew)

---

Built with ❤️ using Tailwind CSS
