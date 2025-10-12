# Car Enthusiast Community Platform

A comprehensive web platform where car enthusiasts can showcase their vehicles, share build progress, and connect with the automotive community.

## 🚗 Project Vision

This is a **car enthusiast community platform** that will evolve into a full-featured social network for automotive enthusiasts. The platform will feature:

- **User Profiles**: Personal accounts where enthusiasts can showcase their collections
- **Vehicle Showcases**: Detailed car profiles with specifications, modifications, and build history
- **Build Documentation**: Track modification progress, performance upgrades, and maintenance logs
- **Community Features**: Follow other enthusiasts, discover builds, and share automotive knowledge
- **Multi-Brand Support**: Support for all car makes and models, not just specific brands

## 🎨 Design Features

- **Sporty Automotive Theme**: Deep red (#c41e3a) accent colors with charcoal headers
- **Design Tokens**: CSS custom properties for consistent styling across all pages
- **Accessible Navigation**: Breadcrumb trails and semantic HTML structure
- **Responsive Layout**: Clean, modern design with proper contrast ratios

## 📁 Project Structure

```
lab2/
├── packages/
│   └── proto/
│       ├── public/
│       │   ├── index.html              # Homepage - Car Models
│       │   ├── model-challenger.html  # Dodge Challenger details
│       │   ├── trim-challenger-sxt.html # SXT trim specifications
│       │   ├── mod-intake.html         # Cold Air Intake modification
│       │   └── styles/
│       │       ├── tokens.css          # Design token definitions
│       │       └── page.css            # Element styling
│       └── package.json
└── package.json
```

## 🚀 Getting Started

1. **Install dependencies:**

   ```bash
   npm install
   ```

2. **Start the development server:**

   ```bash
   cd packages/proto
   npm start
   ```

3. **View the website:**
   Open your browser to `http://localhost:8080`

## 🎯 Current Features

The platform currently demonstrates:

- **HTML5 Semantic Structure**: Proper use of header, main, section, article, nav elements
- **CSS Design Tokens**: Custom properties for maintainable styling
- **Hierarchical Navigation**: Breadcrumb trails and logical content flow
- **Accessibility**: ARIA labels, semantic markup, and proper contrast ratios
- **Content Organization**: Structured data presentation for automotive information

## 🔗 Current Navigation Flow

1. **Homepage** (`index.html`) → Browse available car models
2. **Model Page** (`model-challenger.html`) → View model details, trims, and modifications
3. **Trim Page** (`trim-challenger-sxt.html`) → See engine specs and compatible modifications
4. **Modification Page** (`mod-intake.html`) → Learn about specific performance parts

## 🚀 Future Roadmap

### Phase 1: Foundation (Current)

- ✅ Basic HTML structure and navigation
- ✅ CSS design system with automotive theme
- ✅ Content organization for car information

### Phase 2: User System

- 🔄 User authentication and profiles
- 🔄 Personal car collections
- 🔄 Build documentation and progress tracking

### Phase 3: Community Features

- 🔄 Social interactions (follow, like, comment)
- 🔄 Build sharing and discovery
- 🔄 Multi-brand vehicle support

### Phase 4: Advanced Features

- 🔄 Performance tracking and dyno results
- 🔄 Marketplace for parts and services
- 🔄 Event organization and meetups

## 🎨 Color Palette

- **Accent Red**: #c41e3a (racing-inspired)
- **Header Charcoal**: #2c2c2c (automotive sophistication)
- **Page Background**: #f5f5f5 (clean, modern)
- **Section Boxes**: #ffffff (content separation)
- **Text**: #333333 (high readability)

## 🛠️ Technical Stack

- **Frontend**: HTML5, CSS3 with custom properties
- **Styling**: Design tokens for consistent theming
- **Server**: Node.js with http-server for development
- **Architecture**: Modular CSS with token-based design system

## 🤝 Contributing

This is a quarter-long project that will evolve through multiple development phases. The current foundation provides a solid base for building out the full car enthusiast community platform.
