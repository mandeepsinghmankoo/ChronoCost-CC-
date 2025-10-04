function Container({ children, className = '' }) {
  return (
    <div className={`max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-gray-100 ${className}`}>
      {children}
    </div>
  )
}

export default Container