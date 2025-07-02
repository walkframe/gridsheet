import * as React from "react";
import type { Meta, StoryObj } from '@storybook/react';
import ReactMarkdown from 'react-markdown';
import { request } from "@octokit/request";
import {
  GridSheet,
  oa2aa,
  Renderer,
  RendererMixinType,
  MatrixType,
  buildInitialCellsOrigin, 
  ThousandSeparatorRendererMixin,
  useHub,
  operations,
} from "@gridsheet/react-core";

const meta = {
  title: "Demo/Case2",
  tags: ["autodocs"],
} satisfies Meta<typeof GridSheet>;
export default meta;

const DESCRIPTION = [
  "This demo shows the top 30 contributors of the facebook/react repository.",
  "It uses the GitHub API to fetch contributor data and displays it in a grid.",
].join("\n\n");

const HOW_IT_WORKS = [
  '1. 🌐 The app fetches contributor data from the GitHub API using the `request` function.',
  '2. 🔄 The data is transformed into a matrix format suitable for the grid.',
  '3. 🎨 The grid is configured with custom renderers for images and links.',
  '- `ImageRendererMixin` displays contributor avatars as background images.',
  '- `LinkRendererMixin` renders profile URLs as clickable links.',
  '',
  '## Implementation Guide',
  '',
  '### 🌐 GitHub API Integration',
  'This demo demonstrates how to integrate external APIs with GridSheet for real-time data display. The implementation uses the GitHub API to fetch contributor data from the React repository, showcasing how to handle asynchronous data loading and API responses.',
  '',
  '### 📡 Data Fetching Strategy',
  'Implement efficient data fetching using React hooks and async/await patterns. The strategy includes loading states, error handling, and data transformation. Use proper state management to handle the asynchronous nature of API calls.',
  '',
  '### 🔄 Data Transformation',
  'Transform API response data into the matrix format required by GridSheet. Use utility functions to convert object arrays to matrix format, ensuring proper field mapping and data structure compatibility.',
  '',
  '### 🖼️ Custom Image Renderer',
  'Create custom renderers for displaying user avatars as circular background images. These renderers handle image URLs, apply styling for circular avatars, and include visual effects like borders and shadows for professional appearance.',
  '',
  '### 🔗 Interactive Link Renderer',
  'Implement interactive link renderers that display URLs as clickable elements. Include hover effects, visual feedback, and proper styling to enhance user experience. Handle cases where URLs might be missing or invalid.',
  '',
  '### 🔢 Number Formatting',
  'Apply custom number formatting for contribution counts using thousand separators. This improves readability of large numbers and provides consistent formatting across the application.',
  '',
  '### ⏳ Loading State Management',
  'Implement comprehensive loading states with visual indicators like spinners. Provide user feedback during data fetching operations and handle loading states gracefully to prevent layout shifts.',
  '',
  '### ⚠️ Error Handling',
  'Include robust error handling for API failures, network issues, and data processing errors. Provide meaningful error messages and fallback states to ensure application reliability.',
  '',
  '### 📱 Responsive Design',
  'Design the interface to work across different screen sizes and devices. Use responsive layouts, flexible grids, and adaptive styling to ensure optimal user experience on various platforms.',
  '',
  '### ⚡ Performance Optimization',
  'Optimize performance for large datasets by implementing efficient rendering strategies. Consider virtualization for large contributor lists and optimize image loading for better performance.',
  '',
  '### ✅ Best Practices',
  '1. **API Rate Limiting**: Respect API rate limits and implement proper caching',
  '2. **Error Boundaries**: Use React error boundaries for graceful error handling',
  '3. **Loading States**: Provide clear loading indicators for better UX',
  '4. **Data Validation**: Validate API responses before processing',
  '5. **Accessibility**: Ensure all interactive elements are accessible',
  '6. **Performance**: Optimize image loading and rendering performance',
  '7. **Security**: Handle external URLs safely and prevent XSS attacks',
  '',
  '### 🎯 Common Use Cases',
  '- **GitHub Analytics**: Display repository statistics and contributor data',
  '- **Social Media Dashboards**: Show user engagement and activity metrics',
  '- **Team Management**: Display team member information and contributions',
  '- **Open Source Projects**: Track contributor activity and project health',
  '- **Community Platforms**: Showcase community members and their contributions',
  '',
  '### 🚀 Advanced Features',
  '- **Real-time Updates**: Implement WebSocket connections for live data',
  '- **Data Filtering**: Add filtering and sorting capabilities',
  '- **Export Functionality**: Allow users to export data to various formats',
  '- **Interactive Charts**: Add visualizations for contribution trends',
  '- **User Profiles**: Link to detailed user profile pages',
  '',
  '### 🔌 API Integration Patterns',
  '- **RESTful APIs**: Standard REST API integration patterns',
  '- **Authentication**: Handle API authentication and authorization',
  '- **Caching**: Implement data caching for improved performance',
  '- **Pagination**: Handle large datasets with pagination',
  '- **Webhooks**: Real-time data updates using webhooks',
].join('\n\n');

const ImageRendererMixin: RendererMixinType = {
  string({ value }) {
    return (
      <div
        className="backface"
        style={{
          position: "absolute",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          width: "60px",
          height: "60px",
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat",
          backgroundImage: `url(${value})`,
          borderRadius: "50%",
          border: "3px solid #3498db",
          boxShadow: "0 4px 8px rgba(52, 152, 219, 0.3)",
        }}
      />
    );
  }
}

const LinkRendererMixin: RendererMixinType = {
  string({ value }) {
    if (value == null || value === "") {
      return <span style={{color: '#999', fontStyle: 'italic'}}>No URL</span>;
    }
    return (
      <a 
        target="_blank" 
        href={value} 
        style={{
          color: '#3498db',
          textDecoration: 'none',
          fontWeight: '500',
          transition: 'all 0.3s ease',
          padding: '4px 8px',
          borderRadius: '4px',
          backgroundColor: 'rgba(52, 152, 219, 0.1)',
          border: '1px solid rgba(52, 152, 219, 0.2)',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = 'rgba(52, 152, 219, 0.2)';
          e.currentTarget.style.transform = 'translateY(-1px)';
          e.currentTarget.style.boxShadow = '0 2px 8px rgba(52, 152, 219, 0.3)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = 'rgba(52, 152, 219, 0.1)';
          e.currentTarget.style.transform = 'translateY(0)';
          e.currentTarget.style.boxShadow = 'none';
        }}
      >
        {value}
      </a>
    );
  }
}

export const Case2: StoryObj = {
  render: function App() {
  const fields = ["id", "avatar_url", "login", "html_url", "contributions"];
  const [data, setData] = React.useState<MatrixType>([]);
  const [loading, setLoading] = React.useState(true);
  
  React.useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const response = await request("GET /repos/{owner}/{repo}/contributors", {
          owner: "facebook",
          repo: "react",
        });
        setData(oa2aa(response.data as { [s: string]: any }[], fields));
      } catch (error) {
        console.error('Failed to fetch data:', error);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const hub = useHub({
    renderers: {
      thousand_separator: new Renderer({mixins: [ThousandSeparatorRendererMixin]}),
      image: new Renderer({mixins: [ImageRendererMixin]}),
      link: new Renderer({mixins: [LinkRendererMixin]}),
    },
    labelers: {
      id: (n) => "ID",
      avatar: (n) => "Avatar",
      user: (n) => "user",
      url: (n) => "URL",
      contributions: (n) => "Contributions",
    },
  });

  return (
    <div className="example-app" style={{
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      minHeight: '100vh',
      padding: '20px',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    }}>
      <div style={{
        maxWidth: '1200px',
        margin: '0 auto',
        background: 'rgba(255, 255, 255, 0.95)',
        borderRadius: '16px',
        boxShadow: '0 20px 40px rgba(0, 0, 0, 0.1)',
        overflow: 'hidden',
        backdropFilter: 'blur(10px)',
      }}>
        <div style={{
          background: 'linear-gradient(135deg, #2c3e50 0%, #34495e 100%)',
          color: 'white',
          padding: '24px 32px',
          textAlign: 'center',
        }}>
          <h1 style={{
            margin: '0 0 8px 0',
            fontSize: '28px',
            fontWeight: '700',
            background: 'linear-gradient(45deg, #3498db, #9b59b6)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
          }}>
            🚀 React Contributors Dashboard
          </h1>
          <p style={{
            margin: '0',
            fontSize: '16px',
            opacity: '0.9',
            fontWeight: '300',
          }}>
            Top contributors to the Facebook/React repository
          </p>
        </div>
        
        {loading ? (
          <div style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            height: '400px',
            fontSize: '18px',
            color: '#666',
          }}>
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '16px',
            }}>
              <div style={{
                width: '40px',
                height: '40px',
                border: '4px solid #f3f3f3',
                borderTop: '4px solid #3498db',
                borderRadius: '50%',
                animation: 'spin 1s linear infinite',
              }} />
              <span>Loading contributors data...</span>
            </div>
          </div>
        ) : (
          <div style={{
            padding: '32px',
            maxHeight: '600px',
            overflow: 'auto',
          }}>
            <GridSheet
              hub={hub}
              sheetName="contributors"
              initialCells={buildInitialCellsOrigin({
                matrix: data,
                cells: {
                  default: {
                    height: 80,
                  },
                  A: {
                    labeler: "id",
                    width: 80,
                    renderer: "id",
                    justifyContent: "right",
                    alignItems: "center",
                    style: {
                      backgroundColor: 'rgba(52, 152, 219, 0.1)',
                      fontWeight: '600',
                      color: '#ffffff',
                    },
                  },
                  B: { 
                    labeler: "avatar", 
                    renderer: "image", 
                    alignItems: "center",
                    style: {
                      backgroundColor: 'rgba(52, 152, 219, 0.05)',
                    },
                  },
                  C: { 
                    labeler: "user", 
                    width: 150, 
                    alignItems: "center",
                    style: {
                      backgroundColor: 'rgba(52, 152, 219, 0.1)',
                      fontWeight: '500',
                      color: '#ffffff',
                    },
                  },
                  D: {
                    labeler: "url",
                    width: 230,
                    renderer: "link",
                    alignItems: "center",
                    style: {
                      backgroundColor: 'rgba(52, 152, 219, 0.05)',
                    },
                  },
                  E: {
                    labeler: "contributions",
                    alignItems: "center",
                    justifyContent: "right",
                    renderer: "thousand_separator",
                    style: {
                      backgroundColor: 'rgba(46, 204, 113, 0.15)',
                      fontWeight: '600',
                      color: '#2ecc71',
                    },
                  },
                },
              })}
              options={{
                mode: "dark",
                sheetHeight: 500,
                sheetWidth: 1000,
                headerHeight: 40,
                minNumCols: 5,
                maxNumCols: 5,
              }}
            />
          </div>
        )}

        {/* How it works - Markdown */}
        <div style={{
          padding: '32px',
          backgroundColor: 'rgba(255, 255, 255, 0.98)',
          borderTop: '1px solid rgba(0, 0, 0, 0.1)',
        }}>
          <h3 style={{ 
            color: '#2c3e50', 
            margin: '0 0 15px 0',
            fontSize: '18px',
            fontWeight: '600',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            📖 How it works
          </h3>
          <div style={{
            lineHeight: '1.6',
            color: '#374151'
          }}>
            <ReactMarkdown>{HOW_IT_WORKS}</ReactMarkdown>
          </div>
        </div>
      </div>
      
      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
  },
  parameters: {
    docs: {
      description: {
        story: DESCRIPTION,
      },
    },
  },
};


