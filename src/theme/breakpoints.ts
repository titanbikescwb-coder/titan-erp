export const breakpoints = {
  mobile: '0px',
  sm: '640px',
  tablet: '768px',
  desktop: '1024px',
  wide: '1280px',
  full: '1536px'
} as const

export const responsive = {
  page: 'px-4 sm:px-5 lg:px-6',
  section: 'space-y-4 sm:space-y-5 lg:space-y-6',
  gridCards: 'grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4',
  gridTwo: 'grid grid-cols-1 lg:grid-cols-2 gap-4',
  actions: 'flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-end',
  filters: 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3',
  modal: 'w-[calc(100vw-2rem)] sm:w-full max-w-lg max-h-[calc(100vh-2rem)] overflow-y-auto'
} as const
