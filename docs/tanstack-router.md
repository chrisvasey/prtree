### Start New Project from TanStack Router Example

Source: https://tanstack.com/router/latest/docs/framework/react/examples/quickstart

Command to create a new project based on the TanStack Router quickstart example using gitpick. This command clones the specified example repository and sets it up as a new project.

```shell
npx gitpick TanStack/router/tree/main/examples/react/quickstart 
quickstart
```

--------------------------------

### Install Dependencies with pnpm

Source: https://tanstack.com/router/latest/docs/framework/react/examples/quickstart

Installs project dependencies using the pnpm package manager. This is a standard step for Node.js projects to ensure all required libraries are available.

```shell
pnpm install
```

--------------------------------

### Project Dependencies for TanStack Router React Example

Source: https://tanstack.com/router/latest/docs/framework/react/examples/quickstart

This package.json file lists the dependencies required for the TanStack Router React quickstart example. It includes React, TanStack Router, Tailwind CSS, and Vite for development.

```json
{
  "name": "tanstack-router-react-example-quickstart",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "vite --port 3000",
    "build": "vite build && tsc --noEmit",
    "preview": "vite preview",
    "start": "vite"
  },
  "dependencies": {
    "@tailwindcss/vite": "^4.1.18",
    "@tanstack/react-router": "^1.158.1",
    "@tanstack/react-router-devtools": "^1.158.1",
    "react": "^19.0.0",
    "react-dom": "^19.0.0",
    "tailwindcss": "^4.1.18"
  },
  "devDependencies": {
    "@types/react": "^19.0.8",
    "@types/react-dom": "^19.0.3",
    "@vitejs/plugin-react": "^4.3.4",
    "typescript": "^5.7.2",
    "vite": "^7.3.1"
  }
}
```

--------------------------------

### Start Development Server

Source: https://tanstack.com/router/latest/docs/framework/solid/quick-start

After setting up a new project or navigating into an existing one, start the development server to view your application. This command is common for both file-based and code-based setups.

```sh
cd your-project-name
npm run dev
```

--------------------------------

### React Router Setup with TanStack Router

Source: https://tanstack.com/router/latest/docs/framework/react/examples/quickstart

This code snippet initializes a React application using TanStack Router. It defines a root route with navigation links for 'Home' and 'About', and sets up the router for client-side navigation. It also includes TanStack Router Devtools for debugging.

```tsx
import React, { StrictMode } from 'react'
import ReactDOM from 'react-dom/client'
import {
  Link,
  Outlet,
  RouterProvider,
  createRootRoute,
  createRoute,
  createRouter,
} from '@tanstack/react-router'
import { TanStackRouterDevtools } from '@tanstack/react-router-devtools'
import './styles.css'

const rootRoute = createRootRoute({
  component: () => (
    <>
      <div className="p-2 flex gap-2">
        <Link to="/" className="[&.active]:font-bold">
          Home
        </Link>{' '}
        <Link to="/about" className="[&.active]:font-bold">
          About
        </Link>
      </div>
      <hr />
      <Outlet />
      <TanStackRouterDevtools />
    </>
  ),
})

const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/',
  component: function Index() {
    return (
      <div className="p-2">
        <h3>Welcome Home!</h3>
      </div>
    )
  },
})

const aboutRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/about',
  component: function About() {
    return <div className="p-2">Hello from About!</div>
  },
})

const routeTree = rootRoute.addChildren([indexRoute, aboutRoute])

const router = createRouter({
  routeTree,
  defaultPreload: 'intent',
  scrollRestoration: true,
})

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router
  }
}

const rootElement = document.getElementById('app')!
if (!rootElement.innerHTML) {
  const root = ReactDOM.createRoot(rootElement)
  root.render(
    <StrictMode>
      <RouterProvider router={router} />
    </StrictMode>,
  )
}
```

--------------------------------

### Scaffold New TanStack Router Project

Source: https://tanstack.com/router/latest/docs/framework/react/quick-start

Use the `create-tsrouter-app` CLI to quickly scaffold a new TanStack Router project. The CLI guides you through setup options like routing configuration, TypeScript, Tailwind CSS, and more. After setup, navigate to the project directory and start the development server.

```sh
npx create-tsrouter-app@latest
cd your-project-name
npm run dev
```

--------------------------------

### Setup TanStack Router with SolidJS

Source: https://tanstack.com/router/latest/docs/framework/solid/examples/with-framer-motion

Initializes the SolidJS application by rendering the RouterProvider with the created router instance into the root DOM element. Ensures the application starts with the defined routing structure.

```typescript
import { render } from 'solid-js/web'
import { RouterProvider } from '@tanstack/solid-router'
import { router } from './route'

const rootElement = document.getElementById('app')!

if (!rootElement.innerHTML) {
  render(() => <RouterProvider router={router} />, rootElement)
}
```

--------------------------------

### SolidJS Quickstart with TanStack Router

Source: https://tanstack.com/router/latest/docs/framework/solid/examples/quickstart

This SolidJS code snippet demonstrates how to set up TanStack Router for a simple web application. It defines a root route, child routes for 'Home' and 'About', and renders the router within the application's root element. It also includes TanStack Router Devtools for development.

```tsx
import { render } from 'solid-js/web'
import {
  Link,
  Outlet,
  RouterProvider,
  createRootRoute,
  createRoute,
  createRouter,
} from '@tanstack/solid-router'
import { TanStackRouterDevtools } from '@tanstack/solid-router-devtools'
import './styles.css'

const rootRoute = createRootRoute({
  component: () => (
    <>
      <div class="p-2 flex gap-2">
        <Link to="/" class="[&.active]:font-bold">
          Home
        </Link>{' '}
        <Link to="/about" class="[&.active]:font-bold">
          About
        </Link>
      </div>
      <hr />
      <Outlet />
      <TanStackRouterDevtools />
    </>
  ),
})

const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/',
  component: function Index() {
    return (
      <div class="p-2">
        <h3>Welcome Home!</h3>
      </div>
    )
  },
})

const aboutRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/about',
  component: function About() {
    return <div class="p-2">Hello from About!</div>
  },
})

const routeTree = rootRoute.addChildren([indexRoute, aboutRoute])

const router = createRouter({
  routeTree,
  defaultPreload: 'intent',
  scrollRestoration: true,
})

declare module '@tanstack/solid-router' {
  interface Register {
    router: typeof router
  }
}

const rootElement = document.getElementById('app')!

if (!rootElement.innerHTML) {
  render(() => <RouterProvider router={router} />, rootElement)
}
```

--------------------------------

### Setup TanStack Router with SolidJS

Source: https://tanstack.com/router/latest/docs/framework/solid/examples/basic-solid-query

Initializes the TanStack Router instance with a defined route tree, default preload settings, and context for Solid Query. It then renders the application within a QueryClientProvider and RouterProvider.

```javascript
const routeTree = rootRoute.addChildren([
  postsLayoutRoute.addChildren([postRoute, postsIndexRoute]),
  pathlessLayoutRoute.addChildren([
    nestedPathlessLayoutRoute.addChildren([
      pathlessLayoutARoute,
      pathlessLayoutBRoute,
    ]),
  ]),
  indexRoute,
])

const queryClient = new QueryClient()

// Set up a Router instance
const router = createRouter({
  routeTree,
  defaultPreload: 'intent',
  // Since we're using React Query, we don't want loader calls to ever be stale
  // This will ensure that the loader is always called when the route is preloaded or visited
  defaultPreloadStaleTime: 0,
  scrollRestoration: true,
  context: {
    queryClient,
  },
})

// Register things for typesafety
declare module '@tanstack/solid-router' {
  interface Register {
    router: typeof router
  }
}

const rootElement = document.getElementById('app')!

if (!rootElement.innerHTML) {
  render(
    () => (
      <QueryClientProvider client={queryClient}>
        <RouterProvider router={router} />
      </QueryClientProvider>
    ),
    rootElement,
  )
}
```

--------------------------------

### Install TanStack Router for SolidJS (deno)

Source: https://tanstack.com/router/latest/docs/framework/solid/quick-start

Manually install the TanStack Router package for SolidJS using deno. Deno can manage npm dependencies.

```sh
deno add npm:@tanstack/solid-router
```

--------------------------------

### Solid.js Router and Query Setup

Source: https://tanstack.com/router/latest/docs/framework/solid/examples/kitchen-sink-solid-query

Initializes the Solid.js application with TanStack Router and Solid Query. It sets up the root route, query client, and includes devtools for debugging. Dependencies include '@tanstack/solid-router', '@tanstack/solid-query', and 'solid-js'.

```tsx
/* eslint-disable @typescript-eslint/no-unnecessary-condition */
import * as Solid from 'solid-js'
import { render } from 'solid-js/web'
import {
  ErrorComponent,
  Link,
  MatchRoute,
  Outlet,
  RouterProvider,
  createRootRouteWithContext,
  createRoute,
  createRouter,
  lazyRouteComponent,
  redirect,
  retainSearchParams,
  useNavigate,
  useRouter,
  useRouterState,
  useSearch,
} from '@tanstack/solid-router'
import { TanStackRouterDevtools } from '@tanstack/solid-router-devtools'
import {
  QueryClient,
  QueryClientProvider,
  queryOptions,
  useMutation,
  useQuery,
} from '@tanstack/solid-query'
import { SolidQueryDevtools } from '@tanstack/solid-query-devtools'
import { z } from 'zod'
import {
  fetchInvoiceById,
  fetchInvoices,
  fetchUserById,
  fetchUsers,
  patchInvoice,
  postInvoice,
} from './mockTodos'
import type { Invoice } from './mockTodos'
import './styles.css'

//

type UsersViewSortBy = 'name' | 'id' | 'email'

const invoicesQueryOptions = () =>
  queryOptions({
    queryKey: ['invoices'],
    queryFn: () => fetchInvoices(),
  })

const invoiceQueryOptions = (invoiceId: number) =>
  queryOptions({
    queryKey: ['invoices', invoiceId],
    queryFn: () => fetchInvoiceById(invoiceId),
  })

const usersQueryOptions = ({
  filterBy,
  sortBy,
}: { filterBy?: string; sortBy?: UsersViewSortBy })
  =>
  queryOptions({
    queryKey: ['users', { filterBy, sortBy }],
    queryFn: () =>
      fetchUsers({
        filterBy,
        sortBy,
      }),
  })

const userQueryOptions = (userId: number) =>
  queryOptions({
    queryKey: ['users', userId],
    queryFn: async () => {
      const user = await fetchUserById(userId)
      if (!user) {
        throw new Error('User not found.')
      }
      return user
    },
  })

const useCreateInvoiceMutation = () => {
  return useMutation(() => ({
    mutationKey: ['invoices', 'create'],
    mutationFn: postInvoice,
    onSuccess: () => queryClient.invalidateQueries(),
  }))
}

const useUpdateInvoiceMutation = (invoiceId: number) => {
  return useMutation(() => ({
    mutationKey: ['invoices', 'update', invoiceId],
    mutationFn: patchInvoice,
    onSuccess: () => queryClient.invalidateQueries(),
    gcTime: 1000 * 10,
  }))
}

function RouterSpinner() {
  const isLoading = useRouterState({ select: (s) => s.status === 'pending' })
  return <Spinner show={isLoading()} />
}

// Routes

// Build our routes. We could do this in our component, too.
const rootRoute = createRootRouteWithContext<{ auth: Auth; queryClient: QueryClient }>({
  component: RootComponent,
})

function RootComponent() {
  return (
    <>
      <div class={`min-h-screen flex flex-col`}>
        <div class={`flex items-center border-b gap-2`}>
          <h1 class={`text-3xl p-2`}>Kitchen Sink</h1>
          {/* Show a global spinner when the router is transitioning */}
          <div class={`text-3xl`}>
            <RouterSpinner />
          </div>
        </div>
        <div class={`flex-1 flex`}>
          <div class={`divide-y w-56`}>
            {([
              ['/', 'Home'],
              ['/dashboard', 'Dashboard'],
              ['/expensive', 'Expensive'],
              ['/route-a', 'Pathless Layout A'],
              ['/route-b', 'Pathless Layout B'],
              ['/profile', 'Profile'],
              ['/login', 'Login'],
            ] as const).map(([to, label]) => {
              return (
                <div>
                  <Link
                    to={to}
                    activeOptions={{
                      // If the route points to the root of it's parent,
                      // make sure it's only active if it's exact
                      // exact: to === '.',
                    }}
                    preload="intent"
                    class={`block py-2 px-3 text-blue-700`}
                    // Make "active" links bold
                    activeProps={{ class: `font-bold` }}
                  >
                    {label}
                  </Link>
                </div>
              )
            })}
          </div>
          <div class={`flex-1 border-l`}>
            {/* Render our first route match */}
            <Outlet />
          </div>
        </div>
      </div>
      <TanStackRouterDevtools position="bottom-right" />
      <SolidQueryDevtools buttonPosition="top-right" />
    </>
  )
}

const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/',
  component: IndexComponent,
})

function IndexComponent() {
  return (
    <div class={`p-2`}>

```

--------------------------------

### Install TanStack Router for SolidJS (bun)

Source: https://tanstack.com/router/latest/docs/framework/solid/quick-start

Manually install the TanStack Router package for SolidJS using bun. Bun is a fast JavaScript runtime and package manager.

```sh
bun add @tanstack/solid-router
```

--------------------------------

### Install TanStack Router for SolidJS (npm)

Source: https://tanstack.com/router/latest/docs/framework/solid/quick-start

Manually install the TanStack Router package for SolidJS using npm. Ensure your project has `solid-js` v1.x.x installed as a prerequisite.

```sh
npm install @tanstack/solid-router
```

--------------------------------

### Solid.js Router Setup with View Transitions

Source: https://tanstack.com/router/latest/docs/framework/solid/examples/view-transitions

Configures the TanStack Router for a Solid.js application, enabling view transitions. It sets up the router instance with route definitions, preloading strategies, and scroll restoration. The example comments out direct `defaultViewTransition: true` and shows a more complex configuration using a function to determine transition types based on navigation history, allowing for directional slide animations.

```tsx
import { render } from 'solid-js/web'
import { RouterProvider, createRouter } from '@tanstack/solid-router'
import { routeTree } from './routeTree.gen'
import './styles.css'

// Set up a Router instance
const router = createRouter({
  routeTree,
  defaultPreload: 'intent',
  defaultStaleTime: 5000,
  scrollRestoration: true,
  /* 
  Using defaultViewTransition would prevent the need to
  manually add `viewTransition: true` to every navigation.

  If defaultViewTransition.types is a function, it will be called with the
  location change info and should return an array of view transition types.
  This is useful if you want to have different view transitions depending on
  the navigation's specifics.

  An example use case is sliding in a direction based on the index of the
  previous and next routes when navigating via browser history back and forth.
  */
  // defaultViewTransition: true
  // OR
  // defaultViewTransition: {
  //   types: ({ fromLocation, toLocation }) => {
  //     let direction = 'none'

  //     if (fromLocation) {
  //       const fromIndex = fromLocation.state.__TSR_index
  //       const toIndex = toLocation.state.__TSR_index

  //       direction = fromIndex > toIndex ? 'right' : 'left'
  //     }

  //     return [`slide-${direction}`]
  //   },
  // },
})

// Register things for typesafety
declare module '@tanstack/solid-router' {
  interface Register {
    router: typeof router
  }
}

const rootElement = document.getElementById('app')!

if (!rootElement.innerHTML) {
  render(() => <RouterProvider router={router} />, rootElement)
}

```

--------------------------------

### SolidJS App Setup with TanStack Router and Solid Query

Source: https://tanstack.com/router/latest/docs/framework/solid/examples/kitchen-sink-solid-query-file-based

Sets up the main application component, including the QueryClient, router configuration with default components and context, and session storage hooks for UI state management. It renders the RouterProvider with the configured router and context.

```javascript
import { QueryClient, QueryClientProvider } from '@tanstack/solid-query'
import { auth } from './utils/auth'
import { Spinner } from './components/Spinner'
import { routeTree } from './routeTree.gen'
import { useSessionStorage } from './hooks/useSessionStorage'
import './styles.css'
import { render } from 'solid-js/web'
import { createRouter, RouterProvider } from '@tanstack/solid-router'

export const queryClient = new QueryClient()

const router = createRouter({
  routeTree,
  defaultPendingComponent: () => (
    <div class={`p-2 text-2xl`}>
      <Spinner show={() => true} />
    </div>
  ),
  defaultErrorComponent: ({ error }) => <ErrorComponent error={error} />,
  context: {
    auth: undefined!,
    queryClient: queryClient,
  },
  defaultPreload: 'intent',
  defaultPreloadStaleTime: 0,
  scrollRestoration: true,
})

declare module '@tanstack/solid-router' {
  interface Register {
    router: typeof router
  }
}

function App() {
  const [loaderDelay, setLoaderDelay] = useSessionStorage('loaderDelay', 500)
  const [pendingMs, setPendingMs] = useSessionStorage('pendingMs', 1000)
  const [pendingMinMs, setPendingMinMs] = useSessionStorage('pendingMinMs', 500)

  return (
    <>
      <div class="text-xs fixed w-52 shadow-md shadow-black/20 rounded-sm bottom-2 left-2 bg-white dark:bg-gray-800 bg-opacity-75 border-b flex flex-col gap-1 flex-wrap items-left divide-y">
        <div class="p-2 space-y-2">
          <div class="flex gap-2">
            <button
              class="bg-blue-500 text-white rounded-sm p-1 px-2"
              onClick={() => {
                setLoaderDelay(150)
              }}
            >
              Fast
            </button>
            <button
              class="bg-blue-500 text-white rounded-sm p-1 px-2"
              onClick={() => {
                setLoaderDelay(500)
              }}
            >
              Fast 3G
            </button>
            <button
              class="bg-blue-500 text-white rounded-sm p-1 px-2"
              onClick={() => {
                setLoaderDelay(2000)
              }}
            >
              Slow 3G
            </button>
          </div>
          <div>
            <div>Loader Delay: {loaderDelay()}ms</div>
            <input
              type="range"
              min="0"
              max="5000"
              step="100"
              value={loaderDelay()}
              onChange={(e) => setLoaderDelay(e.target.valueAsNumber)}
              class="w-full"
            />
          </div>
        </div>
        <div class="p-2 space-y-2">
          <div class="flex gap-2">
            <button
              class="bg-blue-500 text-white rounded-sm p-1 px-2"
              onClick={() => {
                setPendingMs(1000)
                setPendingMinMs(500)
              }}
            >
              Reset to Default
            </button>
          </div>
          <div>
            <div>defaultPendingMs: {pendingMs()}ms</div>
            <input
              type="range"
              min="0"
              max="5000"
              step="100"
              value={pendingMs()}
              onChange={(e) => setPendingMs(e.target.valueAsNumber)}
              class="w-full"
            />
          </div>
          <div>
            <div>defaultPendingMinMs: {pendingMinMs()}ms</div>
            <input
              type="range"
              min="0"
              max="5000"
              step="100"
              value={pendingMinMs()}
              onChange={(e) => setPendingMinMs(e.target.valueAsNumber)}
              class="w-full"
            />
          </div>
        </div>
      </div>
      <RouterProvider
        router={router}
        defaultPreload="intent"
        defaultPendingMs={pendingMs()}
        defaultPendingMinMs={pendingMinMs()}
        context={{
          auth,
        }}
      />
    </>
  )
}

const rootElement = document.getElementById('app')!
if (!rootElement.innerHTML) {
  render(
    () => (
      <QueryClientProvider client={queryClient}>
        <App />
      </QueryClientProvider>
    ),
    rootElement,
  )
}

```

--------------------------------

### Vite Configuration for React and Tailwind CSS

Source: https://tanstack.com/router/latest/docs/framework/react/examples/quickstart

Configures Vite to use the React plugin for JSX transformation and the Tailwind CSS plugin for processing Tailwind directives. This setup enables efficient development with modern React features and utility-first CSS.

```javascript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [tailwindcss(), react()],
})
```

--------------------------------

### Install Auth0 SDK

Source: https://tanstack.com/router/latest/docs/framework/react/how-to/setup-auth-providers

Installs the Auth0 React SDK using npm. This is the first step to integrate Auth0 authentication into your application.

```bash
npm install @auth0/auth0-react
```

--------------------------------

### SolidJS Basic Query and Routing Setup

Source: https://tanstack.com/router/latest/docs/framework/solid/examples/basic-solid-query

Sets up the root route, query client, and basic navigation links for a SolidJS application using TanStack Router and TanStack Query. It includes devtools for debugging.

```tsx
import {
  ErrorComponent,
  HeadContent,
  Link,
  Outlet,
  RouterProvider,
  createRootRouteWithContext,
  createRoute,
  createRouter,
  useRouter,
} from '@tanstack/solid-router'
import {
  QueryClient,
  QueryClientProvider,
  useQuery,
} from '@tanstack/solid-query'
import './styles.css'
import { render } from 'solid-js/web'
import { SolidQueryDevtools } from '@tanstack/solid-query-devtools'
import { createEffect, createMemo } from 'solid-js'
import { TanStackRouterDevtools } from '@tanstack/solid-router-devtools'
import { NotFoundError, postQueryOptions, postsQueryOptions } from './posts'
import type { ErrorComponentProps } from '@tanstack/solid-router'

const rootRoute = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  component: RootComponent,
  notFoundComponent: () => {
    return (
      <div>
        <p>This is the notFoundComponent configured on root route</p>
        <Link to="/">Start Over</Link>
      </div>
    )
  },
})

function RootComponent() {
  return (
    <>
      <HeadContent />
      <div class="p-2 flex gap-2 text-lg">
        <Link
          to="/"
          activeProps={{
            class: 'font-bold',
          }}
          activeOptions={{
            exact: true,
          }}>
          Home
        </Link>{' '}
        <Link
          to="/posts"
          activeProps={{
            class: 'font-bold',
          }}>
          Posts
        </Link>{' '}
        <Link
          to="/route-a"
          activeProps={{
            class: 'font-bold',
          }}>
          Pathless Layout
        </Link>{' '}
        <Link
          // @ts-expect-error
          to="/this-route-does-not-exist"
          activeProps={{
            class: 'font-bold',
          }}>
          This Route Does Not Exist
        </Link>
      </div>
      <hr />
      <Outlet />
      <SolidQueryDevtools buttonPosition="top-right" />
      <TanStackRouterDevtools position="bottom-right" />
    </>
  )
}

const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/',
  component: IndexRouteComponent,
})

function IndexRouteComponent() {
  return (
    <div class="p-2">
      <h3>Welcome Home!</h3>
    </div>
  )
}

const postsLayoutRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: 'posts',
  loader: ({ context: { queryClient } }) =>
    queryClient.ensureQueryData(postsQueryOptions),
}).lazy(() => import('./posts.lazy').then((d) => d.Route))

const postsIndexRoute = createRoute({
  getParentRoute: () => postsLayoutRoute,
  path: '/',
  component: PostsIndexRouteComponent,
})

function PostsIndexRouteComponent() {
  return <div>Select a post.</div>
}

const postRoute = createRoute({
  getParentRoute: () => postsLayoutRoute,
  path: '$postId',
  errorComponent: PostErrorComponent,
  loader: ({ context: { queryClient }, params: { postId } }) =>
    queryClient.ensureQueryData(postQueryOptions(postId)),
  component: PostRouteComponent,
})

function PostErrorComponent({ error, reset }: ErrorComponentProps) {
  const router = useRouter()
  if (error instanceof NotFoundError) {
    return <div>{error.message}</div>
  }

  createEffect(() => {
    reset()
    queryClient.resetQueries()
  })

  return (
    <div>
      <button
        onClick={() => {
          router.invalidate()
        }}>
        retry
      </button>
      <ErrorComponent error={error} />
    </div>
  )
}

function PostRouteComponent() {
  const params = postRoute.useParams()
  const postQuery = useQuery(() => postQueryOptions(params().postId))
  const post = createMemo(() => postQuery.data)

  return (
    <div class="space-y-2">
      <h4 class="text-xl font-bold underline">{post()?.title}</h4>
      <div class="text-sm">{post()?.body}</div>
    </div>
  )
}

const pathlessLayoutRoute = createRoute({
  getParentRoute: () => rootRoute,
  id: '_pathlessLayout',
  component: PathlessLayoutComponent,
})

function PathlessLayoutComponent() {
  return (
    <div class="p-2">
      <div class="border-b">I'm a pathless layout</div>
      <div>
        <Outlet />
      </div>
    </div>
  )
}

const nestedPathlessLayoutRoute = createRoute({
  getParentRoute: () => pathlessLayoutRoute,
  id: '_nestedPathlessLayout',
  component: NestedPathlessLayoutComponent,
})

function NestedPathlessLayoutComponent() {
  return (
    <div>
      <div>I'm a nested pathless layout</div>
      <div class="flex gap-2 border-b">
        <Link
          to="/route-a"
          activeProps={{
            class: 'font-bold',
          }}>
          Go to route A
        </Link>
        <Link
          to="/route-b"
          activeProps={{
            class: 'font-bold',
          }}>

```

--------------------------------

### TanStack Router Setup and Route Definitions

Source: https://tanstack.com/router/latest/docs/framework/react/examples/kitchen-sink-react-query

Demonstrates the setup of TanStack Router, including creating a root route with context for authentication and query client. It also defines various query options for fetching invoices, users, and individual records.

```typescript
/* eslint-disable @typescript-eslint/no-unnecessary-condition */
import * as React from 'react'
import ReactDOM from 'react-dom/client'
import {
  ErrorComponent,
  Link,
  MatchRoute,
  Outlet,
  RouterProvider,
  createRootRouteWithContext,
  createRoute,
  createRouter,
  lazyRouteComponent,
  redirect,
  retainSearchParams,
  useNavigate,
  useRouter,
  useRouterState,
  useSearch,
} from '@tanstack/react-router'
import { TanStackRouterDevtools } from '@tanstack/react-router-devtools'
import {
  QueryClient,
  QueryClientProvider,
  queryOptions,
  useMutation,
  useSuspenseQuery,
} from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { z } from 'zod'
import {
  fetchInvoiceById,
  fetchInvoices,
  fetchUserById,
  fetchUsers,
  patchInvoice,
  postInvoice,
} from './mockTodos'
import type { Invoice } from './mockTodos'
import './styles.css'

//

type Auth = {
  login: (username: string) => void
  logout: () => void
  status: 'loggedOut' | 'loggedIn'
  username?: string
}

const invoicesQueryOptions = () =>
  queryOptions({
    queryKey: ['invoices'],
    queryFn: () => fetchInvoices(),
  })

const invoiceQueryOptions = (invoiceId: number) =>
  queryOptions({
    queryKey: ['invoices', invoiceId],
    queryFn: () => fetchInvoiceById(invoiceId),
  })

const usersQueryOptions = ({
  filterBy,
  sortBy,
}: {
  filterBy?: string
  sortBy?: UsersViewSortBy
}) =>
  queryOptions({
    queryKey: ['users', { filterBy, sortBy }],
    queryFn: () =>
      fetchUsers({
        filterBy,
        sortBy,
      }),
  })

const userQueryOptions = (userId: number) =>
  queryOptions({
    queryKey: ['users', userId],
    queryFn: async () => {
      const user = await fetchUserById(userId)
      if (!user) {
        throw new Error('User not found.')
      }
      return user
    },
  })

const useCreateInvoiceMutation = () => {
  return useMutation({
    mutationKey: ['invoices', 'create'],
    mutationFn: postInvoice,
    onSuccess: () => queryClient.invalidateQueries(),
  })
}

const useUpdateInvoiceMutation = (invoiceId: number) => {
  return useMutation({
    mutationKey: ['invoices', 'update', invoiceId],
    mutationFn: patchInvoice,
    onSuccess: () => queryClient.invalidateQueries(),
    gcTime: 1000 * 10,
  })
}

function RouterSpinner() {
  const isLoading = useRouterState({ select: (s) => s.status === 'pending' })
  return <Spinner show={isLoading} />
}

// Routes

// Build our routes. We could do this in our component, too.
const rootRoute = createRootRouteWithContext<{ auth: Auth
  queryClient: QueryClient
}>()({
  component: RootComponent,
})

function RootComponent() {
  return (
    <>
      <div className={`min-h-screen flex flex-col`}>
        <div className={`flex items-center border-b gap-2`}>
          <h1 className={`text-3xl p-2`}>Kitchen Sink</h1>
          {/* Show a global spinner when the router is transitioning */}
          <div className={`text-3xl`}>
            <RouterSpinner />
          </div>
        </div>
        <div className={`flex-1 flex`}>
          <div className={`divide-y w-56`}>
            {(
              [
                ['/', 'Home'],

```

--------------------------------

### TypeScript Configuration for React Projects

Source: https://tanstack.com/router/latest/docs/framework/react/examples/quickstart

Configures the TypeScript compiler for a React project. It enforces strict type checking, enables efficient ES module interop, sets the JSX factory to react-jsx, includes necessary DOM and ES2022 libraries, and skips library checks for faster builds.

```json
{
  "compilerOptions": {
    "strict": true,
    "esModuleInterop": true,
    "jsx": "react-jsx",
    "lib": ["DOM", "DOM.Iterable", "ES2022"],
    "skipLibCheck": true
  }
}
```

--------------------------------

### Pathless Layout Route Setup (TypeScript)

Source: https://tanstack.com/router/latest/docs/framework/react/examples/basic-react-query

Demonstrates setting up pathless layout routes. These routes do not have their own path segments but serve as layout containers for their children. This example shows a nested pathless layout.

```typescript
const pathlessLayoutRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/route-a',
  component: PathlessLayoutAComponent,
})

function PathlessLayoutAComponent() {
  return <div>I'm layout A!</div>
}

const pathlessLayoutBRoute = createRoute({
  getParentRoute: () => nestedPathlessLayoutRoute,
  path: '/route-b',
  component: PathlessLayoutBComponent,
})

function PathlessLayoutBComponent() {
  return <div>I'm layout B!</div>
}
```

--------------------------------

### TanStack Router Dependency in package.json

Source: https://tanstack.com/router/latest/docs/framework/solid/quick-start

Verify the installation of TanStack Router by checking your project's `package.json` file. This JSON snippet shows how the dependency should be listed.

```json
{
  "dependencies": {
    "@tanstack/solid-router": "^x.x.x"
  }
}
```

--------------------------------

### React Router Setup with TanStack Router

Source: https://tanstack.com/router/latest/docs/framework/react/examples/quickstart-file-based

This code snippet demonstrates the initialization of TanStack Router within a React application. It imports necessary components, creates a router instance using a generated route tree, and renders the RouterProvider to enable routing. Dependencies include React, ReactDOM, and @tanstack/react-router.

```tsx
import React from 'react'
import ReactDOM from 'react-dom/client'
import { RouterProvider, createRouter } from '@tanstack/react-router'
import { routeTree } from './routeTree.gen'
import './styles.css'

// Set up a Router instance
const router = createRouter({
  routeTree,
  defaultPreload: 'intent',
  scrollRestoration: true,
})

// Register things for typesafety
declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router
  }
}

const rootElement = document.getElementById('app')!

if (!rootElement.innerHTML) {
  const root = ReactDOM.createRoot(rootElement)
  root.render(<RouterProvider router={router} />)
}
```

--------------------------------

### Initialize QueryClient and Router (TanStack Router)

Source: https://tanstack.com/router/latest/docs/framework/solid/examples/kitchen-sink-solid-query

Initializes a `QueryClient` for React Query and creates a router instance using TanStack Router's `createRouter`. This setup configures default components for pending and error states, context, and preloading strategies.

```javascript
const queryClient = new QueryClient()

const router = createRouter({
  routeTree,
  defaultPendingComponent: () => (
    <div class={`p-2 text-2xl`}>
      <Spinner />
    </div>
  ),
  defaultErrorComponent: ({ error }) => <ErrorComponent error={error} />,
  context: {
    auth: undefined!, // We'll inject this when we render
    queryClient,
  },
  defaultPreload: 'intent',
  // Since we're using React Query, we don't want loader calls to ever be stale
  // This will ensure that the loader is always called when the route is preloaded or visited
  defaultPreloadStaleTime: 0,
  scrollRestoration: true,
})
```

--------------------------------

### Install Supabase Client (Bash)

Source: https://tanstack.com/router/latest/docs/framework/react/how-to/setup-auth-providers

Installs the Supabase JavaScript client library using npm. This command adds the necessary package to your project's dependencies.

```bash
npm install @supabase/supabase-js
```

--------------------------------

### Install TanStack Router for SolidJS (yarn)

Source: https://tanstack.com/router/latest/docs/framework/solid/quick-start

Manually install the TanStack Router package for SolidJS using yarn. This command is another option for managing project dependencies.

```sh
yarn add @tanstack/solid-router
```

--------------------------------

### TanStack Router and SolidJS Setup (TypeScript)

Source: https://tanstack.com/router/latest/docs/framework/solid/examples/kitchen-sink-solid-query

Imports necessary components and functions from TanStack Router and SolidJS libraries, along with Solid Query for data management. It also imports mock data functions and styles, setting up the foundation for a SolidJS application with routing and data fetching.

```typescript
/* eslint-disable @typescript-eslint/no-unnecessary-condition */
import * as Solid from 'solid-js'
import { render } from 'solid-js/web'
import {
  ErrorComponent,
  Link,
  MatchRoute,
  Outlet,
  RouterProvider,
  createRootRouteWithContext,
  createRoute,
  createRouter,
  lazyRouteComponent,
  redirect,
  retainSearchParams,
  useNavigate,
  useRouter,
  useRouterState,
  useSearch,
} from '@tanstack/solid-router'
import { TanStackRouterDevtools } from '@tanstack/solid-router-devtools'
import {
  QueryClient,
  QueryClientProvider,
  queryOptions,
  useMutation,
  useQuery,
} from '@tanstack/solid-query'
import { SolidQueryDevtools } from '@tanstack/solid-query-devtools'
import { z } from 'zod'
import {
  fetchInvoiceById,
  fetchInvoices,
  fetchUserById,
  fetchUsers,
  patchInvoice,
  postInvoice,
} from './mockTodos'
import type { Invoice } from './mockTodos'
import './styles.css'

```

--------------------------------

### SolidJS Basic Devtools Panel Setup

Source: https://tanstack.com/router/latest/docs/framework/solid/examples/basic-devtools-panel

Sets up a SolidJS application with TanStack Router, defining root, index, and about routes. It also integrates the TanStack Router Devtools Panel, rendering it within a shadow DOM for isolation. Dependencies include '@tanstack/solid-router' and 'solid-js/web'.

```tsx
import App from './App'
import {
  Outlet,
  RouterProvider,
  Link,
  createRouter,
  createRoute,
  createRootRoute,
} from '@tanstack/solid-router'
import { TanStackRouterDevtoolsPanel } from '@tanstack/solid-router-devtools'
import { render } from 'solid-js/web'

const rootRoute = createRootRoute({
  component: () => (
    <>
      <div class="p-2 flex gap-2">
        <Link to="/">Home</Link> <Link to="/about">About</Link>
      </div>
      <hr />
      <Outlet />
    </>
  ),
})

const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/',
  component: function Index() {
    return (
      <div class="p-2">
        <h3>Welcome Home!</h3>
        <App />
      </div>
    )
  },
})

const aboutRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/about',
  component: function About() {
    return <div class="p-2">Hello from About!</div>
  },
})

const routeTree = rootRoute.addChildren([indexRoute, aboutRoute])

const router = createRouter({ routeTree })

declare module '@tanstack/solid-router' {
  interface Register {
    router: typeof router
  }
}

const element = document.getElementById('app')!
const shadowContainer = element.attachShadow({ mode: 'open' })
const shadowRootElement = document.createElement('div')
shadowContainer.appendChild(shadowRootElement)

render(
  () => (
    <>
      <RouterProvider router={router} />
      <TanStackRouterDevtoolsPanel
        shadowDOMTarget={shadowContainer}
        router={router}
      />
    </>
  ),
  shadowRootElement,
)

```

--------------------------------

### Install TanStack Router for SolidJS (pnpm)

Source: https://tanstack.com/router/latest/docs/framework/solid/quick-start

Manually install the TanStack Router package for SolidJS using pnpm. This command is an alternative to npm for package management.

```sh
pnpm add @tanstack/solid-router
```

--------------------------------

### Scaffold New TanStack Router Project (SolidJS)

Source: https://tanstack.com/router/latest/docs/framework/solid/quick-start

Use the create-tsrouter-app CLI to quickly scaffold a new SolidJS project with TanStack Router pre-installed. The CLI offers customization options for routing, TypeScript, and toolchain setup.

```sh
npx create-tsrouter-app@latest --framework solid
```

--------------------------------

### Install Clerk SDK

Source: https://tanstack.com/router/latest/docs/framework/react/how-to/setup-auth-providers

Installs the Clerk React SDK using npm. This is the initial step for integrating Clerk authentication into your application.

```bash
npm install @clerk/clerk-react
```

--------------------------------

### Root Route Setup with Context - SolidJS

Source: https://tanstack.com/router/latest/docs/framework/solid/examples/kitchen-sink

Defines the root route for the application using `createRootRouteWithContext`. It establishes a context for authentication status and renders the main application layout, including navigation and the router outlet. Dependencies include `@tanstack/solid-router` and SolidJS's `createRootRouteWithContext`.

```tsx
/* eslint-disable @typescript-eslint/no-unnecessary-condition */
import {
  createRootRouteWithContext,
} from '@tanstack/solid-router'
import { createSignal } from 'solid-js'

// Assume Auth type and initial state are defined elsewhere
type Auth = {
  status: 'loggedIn' | 'loggedOut'
  userId: string | null
}

const [auth, setAuth] = createSignal<Auth>({
  status: 'loggedOut',
  userId: null,
})

const rootRoute = createRootRouteWithContext<{ auth: Auth }>()({
  component: RootComponent,
})

function RootComponent() {
  // ... component implementation using auth context
  return (
    <div>
      {/* Navigation and Outlet would be here */}
      <h1>App</h1>
      <nav>
        {/* Links based on auth status */}
      </nav>
      <main>
        <Outlet />
      </main>
    </div>
  )
}

```

--------------------------------

### Create and Configure TanStack Router Routes

Source: https://tanstack.com/router/latest/docs/framework/react/examples/quickstart

Defines the root route, an index route, and an about route using createRoute. It then builds the route tree and initializes the router with default preload and scroll restoration options. Finally, it declares the router type for module augmentation.

```typescript
import { createRootRoute, createRoute, Router } from '@tanstack/react-router'
import ReactDOM from 'react-dom/client'

import './styles.css'

const Index = () => <div>Hello from Index!</div>
const About = () => <div>Hello from About!</div>

const rootRoute = createRootRoute({
  component: () => (
    <>
      <div className="p-2 flex gap-2">
        <Link to="/">Index</Link>
        <Link to="/about">About</Link>
      </div>
      <hr />
      <Outlet />
    </>
  ),
})

const indexRoute = indexRoute({
  getParentRoute: () => rootRoute,
  path: '/',
  component: Index,
})

const aboutRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/about',
  component: About,
})

const routeTree = rootRoute.addChildren([indexRoute, aboutRoute])

const router = createRouter({
  routeTree,
  defaultPreload: 'intent',
  scrollRestoration: true,
})

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router
  }
}

const rootElement = document.getElementById('app')!

if (!rootElement.innerHTML) {
  const root = ReactDOM.createRoot(rootElement)
  root.render(<RouterProvider router={router} />)
}
```

--------------------------------

### Main Application Component with Router Setup (SolidJS)

Source: https://tanstack.com/router/latest/docs/framework/solid/examples/kitchen-sink-solid-query

The main `App` component for a SolidJS application. It sets up session storage for controlling loader and pending states, provides interactive UI elements for these settings, and renders the `RouterProvider` with the configured router and context.

```jsx
function App() {
  // This stuff is just to tweak our sandbox setup in real-time
  const [loaderDelay, setLoaderDelay] = useSessionStorage('loaderDelay', 500)
  const [pendingMs, setPendingMs] = useSessionStorage('pendingMs', 1000)
  const [pendingMinMs, setPendingMinMs] = useSessionStorage('pendingMinMs', 500)

  return (
    <>
      <div class="text-xs fixed w-52 shadow-md shadow-black/20 rounded-sm bottom-2 left-2 bg-white dark:bg-gray-800 bg-opacity-75 border-b flex flex-col gap-1 flex-wrap items-left divide-y">
        <div class="p-2 space-y-2">
          <div class="flex gap-2">
            <button
              class="bg-blue-500 text-white rounded-sm p-1 px-2"
              onClick={() => {
                setLoaderDelay(150)
              }}
            >
              Fast
            </button>
            <button
              class="bg-blue-500 text-white rounded-sm p-1 px-2"
              onClick={() => {
                setLoaderDelay(500)
              }}
            >
              Fast 3G
            </button>
            <button
              class="bg-blue-500 text-white rounded-sm p-1 px-2"
              onClick={() => {
                setLoaderDelay(2000)
              }}
            >
              Slow 3G
            </button>
          </div>
          <div>
            <div>Loader Delay: {loaderDelay()}ms</div>
            <input
              type="range"
              min="0"
              max="5000"
              step="100"
              value={loaderDelay()}
              onChange={(e) => setLoaderDelay(e.target.valueAsNumber)}
              class="w-full"
            />
          </div>
        </div>
        <div class="p-2 space-y-2">
          <div class="flex gap-2">
            <button
              class="bg-blue-500 text-white rounded-sm p-1 px-2"
              onClick={() => {
                setPendingMs(1000)
                setPendingMinMs(500)
              }}
            >
              Reset to Default
            </button>
          </div>
          <div>
            <div>defaultPendingMs: {pendingMs()}ms</div>
            <input
              type="range"
              min="0"
              max="5000"
              step="100"
              value={pendingMs()}
              onChange={(e) => setPendingMs(e.target.valueAsNumber)}
              class="w-full"
            />
          </div>
          <div>
            <div>defaultPendingMinMs: {pendingMinMs()}ms</div>
            <input
              type="range"
              min="0"
              max="5000"
              step="100"
              value={pendingMinMs()}
              onChange={(e) => setPendingMinMs(e.target.valueAsNumber)}
              class="w-full"
            />
          </div>
        </div>
      </div>
      <QueryClientProvider client={queryClient}>
        <RouterProvider
          router={router}
          defaultPreload="intent"
          defaultPendingMs={pendingMs()}
          defaultPendingMinMs={pendingMinMs()}
          context={{
            auth,
          }}
        />
      </QueryClientProvider>
    </>
  )
}
```