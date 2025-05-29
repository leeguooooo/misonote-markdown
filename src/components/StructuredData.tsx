interface StructuredDataProps {
  type: 'website' | 'article' | 'software';
  data: any;
}

export default function StructuredData({ type, data }: StructuredDataProps) {
  let structuredData;

  switch (type) {
    case 'website':
      structuredData = {
        "@context": "https://schema.org",
        "@type": "WebSite",
        "name": "现代化 Markdown 文档系统",
        "description": "开源的现代化 Markdown 文档预览系统，支持 Mermaid 图表、全局搜索、目录导航",
        "url": data.url,
        "potentialAction": {
          "@type": "SearchAction",
          "target": {
            "@type": "EntryPoint",
            "urlTemplate": `${data.url}/search?q={search_term_string}`
          },
          "query-input": "required name=search_term_string"
        },
        "author": {
          "@type": "Person",
          "name": "leeguoo",
          "url": "https://github.com/leeguooooo"
        }
      };
      break;

    case 'article':
      structuredData = {
        "@context": "https://schema.org",
        "@type": "Article",
        "headline": data.title,
        "description": data.description,
        "url": data.url,
        "datePublished": data.publishedTime,
        "dateModified": data.modifiedTime,
        "author": {
          "@type": "Person",
          "name": "leeguoo",
          "url": "https://github.com/leeguooooo"
        },
        "publisher": {
          "@type": "Person",
          "name": "leeguoo",
          "url": "https://github.com/leeguooooo"
        },
        "mainEntityOfPage": {
          "@type": "WebPage",
          "@id": data.url
        }
      };
      break;

    case 'software':
      structuredData = {
        "@context": "https://schema.org",
        "@type": "SoftwareApplication",
        "name": "现代化 Markdown 文档系统",
        "description": "开源的现代化 Markdown 文档预览系统",
        "url": data.url,
        "applicationCategory": "DeveloperApplication",
        "operatingSystem": "Web Browser",
        "offers": {
          "@type": "Offer",
          "price": "0",
          "priceCurrency": "USD"
        },
        "author": {
          "@type": "Person",
          "name": "leeguoo",
          "url": "https://github.com/leeguooooo"
        }
      };
      break;

    default:
      return null;
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
    />
  );
}
