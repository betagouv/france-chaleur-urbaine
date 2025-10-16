# Performance Guidelines

> Performance optimization guidelines for france-chaleur-urbaine

## 🎯 Performance Goals

### Target Metrics

- **Time to First Byte (TTFB)**: < 600ms
- **First Contentful Paint (FCP)**: < 1.8s
- **Largest Contentful Paint (LCP)**: < 2.5s
- **Time to Interactive (TTI)**: < 3.8s
- **Cumulative Layout Shift (CLS)**: < 0.1
- **First Input Delay (FID)**: < 100ms

### API Performance

- **Response Time (p95)**: < 200ms
- **Response Time (p99)**: < 500ms
- **Throughput**: [requests/second target]
- **Error Rate**: < 0.1%

## 🚀 Frontend Performance

### Bundle Size Optimization

**Rules**:
- Keep main bundle < 170KB (gzipped)
- Code split routes and large components
- Tree-shake unused dependencies
- Analyze bundle with tools like `@next/bundle-analyzer`

**Example**:
```typescript
// ❌ Bad - Imports entire library
import _ from 'lodash'

// ✅ Good - Import only what you need
import debounce from 'lodash/debounce'

// ✅ Better - Use tree-shakeable alternative
import { debounce } from 'radash'
```

### Dynamic Imports

Use dynamic imports for:
- Non-critical components
- Route-based code splitting
- Heavy libraries used conditionally

```typescript
// ✅ Dynamic import for modal
const Modal = dynamic(() => import('@/components/Modal'), {
  loading: () => <Skeleton />
})

// ✅ Load library only when needed
const handleExport = async () => {
  const { default: xlsx } = await import('xlsx')
  // Use xlsx here
}
```

### Image Optimization

**Rules**:
- Use Next.js `<Image>` component or equivalent
- Provide `width` and `height` to prevent CLS
- Use WebP or AVIF format when possible
- Implement lazy loading for images below the fold
- Use appropriate sizes and srcSet

```typescript
// ✅ Optimized image
<Image
  src="/hero.jpg"
  alt="Hero image"
  width={1200}
  height={600}
  loading="lazy"
  quality={85}
/>
```

### Component Optimization

**Minimize Re-renders**:
```typescript
// ✅ Memoize expensive components
const ExpensiveComponent = memo(({ data }) => {
  return <div>{/* Heavy rendering */}</div>
})

// ✅ Memoize expensive calculations
const sortedData = useMemo(
  () => data.sort((a, b) => a.value - b.value),
  [data]
)

// ✅ Memoize callbacks passed to children
const handleClick = useCallback(() => {
  // Handle click
}, [dependencies])
```

**Avoid**:
- Inline object/array literals in props
- Anonymous functions in render
- Unnecessary `useEffect` hooks

### State Management

**Minimize React State**:
- Use local state when possible
- Avoid global state for UI-only concerns
- Consider derived state instead of storing computed values

```typescript
// ❌ Bad - Storing derived state
const [total, setTotal] = useState(0)
const [items, setItems] = useState([])

// ✅ Good - Derive from source of truth
const [items, setItems] = useState([])
const total = items.reduce((sum, item) => sum + item.price, 0)
```

### Virtualization

For long lists (> 50 items), use virtualization:

```typescript
import { FixedSizeList } from 'react-window'

// ✅ Virtualized list
<FixedSizeList
  height={600}
  itemCount={items.length}
  itemSize={50}
  width="100%"
>
  {({ index, style }) => (
    <div style={style}>{items[index].name}</div>
  )}
</FixedSizeList>
```

## 🔧 Backend Performance

### Database Query Optimization

**Rules**:
- Add indexes for frequently queried fields
- Use `SELECT` specific columns, not `SELECT *`
- Implement pagination for large result sets
- Use connection pooling
- Monitor slow queries

```typescript
// ❌ Bad - N+1 query problem
const users = await db.user.findMany()
for (const user of users) {
  user.posts = await db.post.findMany({ where: { userId: user.id } })
}

// ✅ Good - Single query with join
const users = await db.user.findMany({
  include: { posts: true }
})
```

### Caching Strategy

**Cache Layers**:
1. **CDN**: Static assets, public pages
2. **Server**: API responses, computed data
3. **Database**: Query results
4. **Client**: User-specific data

**Implementation**:
```typescript
// ✅ Cache API response
export const config = {
  revalidate: 3600 // Revalidate every hour
}

// ✅ Use Redis for session data
const cachedData = await redis.get(`user:${userId}`)
if (cachedData) return JSON.parse(cachedData)

const data = await fetchExpensiveData(userId)
await redis.set(`user:${userId}`, JSON.stringify(data), 'EX', 3600)
```

### API Response Optimization

**Rules**:
- Compress responses (gzip/brotli)
- Return only necessary data
- Use pagination for collections
- Implement field selection (`?fields=id,name`)

```typescript
// ✅ Efficient API response
return NextResponse.json({
  data: results.slice(0, limit),
  pagination: {
    page,
    limit,
    total,
    hasMore: results.length > limit
  }
})
```

### Async Processing

Move heavy operations to background jobs:

```typescript
// ❌ Bad - Blocking operation
await sendEmail(user)
await processImages(uploads)
await updateAnalytics(event)
return response

// ✅ Good - Queue for async processing
await queue.add('send-email', { userId: user.id })
await queue.add('process-images', { uploadIds })
await queue.add('update-analytics', { event })
return response
```

## 📊 Monitoring & Profiling

### Web Vitals Monitoring

```typescript
// Track Core Web Vitals
export function reportWebVitals(metric: NextWebVitalsMetric) {
  console.log(metric)
  // Send to analytics
  analytics.track(metric.name, {
    value: metric.value,
    id: metric.id,
  })
}
```

### Performance Profiling

**Tools**:
- Chrome DevTools Performance tab
- React DevTools Profiler
- `console.time()` / `console.timeEnd()`
- Server-side: `performance.now()`

```typescript
// ✅ Profile expensive operations
const start = performance.now()
const result = await expensiveOperation()
const duration = performance.now() - start

if (duration > 1000) {
  logger.warn('Slow operation', { duration, operation: 'expensiveOperation' })
}
```

## 🎨 CSS Performance

### Minimize CSS

- Remove unused CSS (use PurgeCSS with Tailwind)
- Avoid `@import` in CSS
- Inline critical CSS for above-the-fold content
- Use CSS containment when possible

### Efficient Selectors

```css
/* ❌ Bad - Complex selector */
div.container > ul li:nth-child(odd) span.text {}

/* ✅ Good - Simple class */
.item-text {}
```

## 🔍 Performance Checklist

### Before Production

- [ ] Run Lighthouse audit (score > 90)
- [ ] Check bundle size (main bundle < 170KB)
- [ ] Verify image optimization (WebP/AVIF)
- [ ] Test with slow 3G network
- [ ] Profile with React DevTools
- [ ] Check for memory leaks
- [ ] Verify caching headers
- [ ] Test database query performance
- [ ] Monitor Core Web Vitals

### Continuous Monitoring

- [ ] Set up Real User Monitoring (RUM)
- [ ] Track API response times
- [ ] Monitor database slow queries
- [ ] Alert on performance regressions
- [ ] Regular performance audits

## 📚 Resources

- [Web.dev Performance](https://web.dev/performance/)
- [React Performance](https://react.dev/learn/render-and-commit)
- [Next.js Performance](https://nextjs.org/docs/app/building-your-application/optimizing)

---

**Last updated**: [Date]
**Review frequency**: Monthly or when adding heavy features
