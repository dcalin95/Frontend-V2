/**
 * Renders assistant/user chat text as GitHub-flavored Markdown (tables, lists, fenced code).
 * No raw HTML — react-markdown escapes by default.
 */
import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { injectOtaChatBrandAnchors } from '../../utils/otaChatBrandInject';

/** @type {import('react-markdown').Components} */
const components = {
  a: ({ href, children, ...rest }) => {
    if (href && String(href).startsWith('#ota-brand-')) {
      const slug = String(href).replace(/^#ota-brand-/, '');
      return (
        <span className="ota-chat-brand" data-ota-brand={slug}>
          {children}
        </span>
      );
    }
    return (
      <a href={href} target="_blank" rel="noopener noreferrer" className="ota-chat-md__a" {...rest}>
        {children}
      </a>
    );
  },
  img: ({ src, alt, ...rest }) => (
    <img
      src={src}
      alt={alt ?? ''}
      className="ota-chat-md__img"
      loading="lazy"
      decoding="async"
      {...rest}
    />
  ),
  pre: ({ children }) => <pre className="ota-chat-md__pre">{children}</pre>,
  code: ({ inline, className, children, ...props }) =>
    inline ? (
      <code className={`ota-chat-md__code ota-chat-md__code--inline ${className || ''}`.trim()} {...props}>
        {children}
      </code>
    ) : (
      <code className={`ota-chat-md__code ota-chat-md__code--block ${className || ''}`.trim()} {...props}>
        {children}
      </code>
    ),
  table: ({ children, ...rest }) => (
    <div className="ota-chat-md__table-scroll">
      <table className="ota-chat-md__table" {...rest}>
        {children}
      </table>
    </div>
  ),
};

/**
 * @param {{ children: string }} props
 */
export function OtaChatMarkdown({ children }) {
  const text = typeof children === 'string' ? children : '';
  if (!text.trim()) return null;
  const withBrands = injectOtaChatBrandAnchors(text);
  return (
    <div className="ota-chat-md">
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={components}>
        {withBrands}
      </ReactMarkdown>
    </div>
  );
}
