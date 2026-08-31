export default function Navigation({ tabs, activeTab, onTabChange, isOpen, onClose }) {
  return (
    <>
      {/* SIDEBAR */}
      <nav
        className={`fixed left-0 top-0 h-full w-72 z-[60] flex flex-col py-6 transition-all duration-200 md:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}>
        <div className="px-6 mb-8 flex justify-between items-center">
          <h2 className="font-headline-lg text-headline-lg text-primary">Bahi-Khata</h2>
          <button
            onClick={onClose}
            className="text-on-surface-variant p-2 hover:bg-surface-container rounded-full md:hidden"
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
