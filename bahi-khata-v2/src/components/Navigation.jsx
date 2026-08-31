export default function Navigation({ tabs, activeTab, onTabChange, isOpen, onClose }) {
  return (
    <>
      {/* SIDEBAR */}
      {/* The sidebar starts below the fixed header (h-16) so the two no longer
          overlap. The brand lives in the header alone — it used to be printed
          here as well, which read as the name twice over. */}
      <nav
        className={`fixed left-0 top-16 h-[calc(100%-4rem)] w-72 z-[60] flex flex-col py-4 bg-surface border-r border-outline-variant transition-all duration-200 md:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}>
        <div className="px-4 pb-2 flex justify-end md:hidden">
          <button
            onClick={onClose}
            className="text-on-surface-variant p-2 hover:bg-surface-container rounded-full"
            aria-label="Close menu"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        <ul className="flex-1 overflow-y-auto space-y-1 px-2">
          {tabs.map((tab) => (
            <li key={tab.id}>
              <button
                onClick={() => onTabChange(tab.id)}
                className={`w-full flex items-center gap-4 px-6 py-3 rounded-lg transition-all ${
                  activeTab === tab.id
                    ? 'bg-primary/20 text-primary border-l-4 border-primary'
                    : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container'
                }`}
                style={{
                  paddingLeft: activeTab === tab.id ? 'calc(24px - 4px)' : '24px'
                }}>
                <span className="material-symbols-outlined">{tab.icon}</span>
                <span>{tab.label}</span>
              </button>
            </li>
          ))}
        </ul>
      </nav>
    </>
  );
}
