'use client';
import Image from 'next/image';

export default function Order() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 text-white">
      {/* HERO */}
      <section className="hero-bg min-h-96 flex items-center justify-center text-white relative">
        <div className="text-center px-6 hero-text-animation">
          <h1 className="text-5xl md:text-6xl font-black mb-4 bg-gradient-to-r from-white to-gray-200 bg-clip-text text-transparent">
            Culinary Excellence
          </h1>
          <p className="text-xl md:text-2xl font-light mb-8 opacity-90">
            Experience flavors that tell a story
          </p>
          <button className="premium-button px-8 py-4 rounded-full text-lg font-semibold text-white shadow-2xl floating-animation">
            Explore Menu ✨
          </button>
        </div>
      </section>

      {/* MENU GRID */}
      <div className="p-6 max-w-6xl mx-auto">
        <div className="layout-grid">
          {[1, 2, 3, 4, 5].map(i => (
            <div key={i} className="menu-card card-grid">
              <div className="food-image">🌮</div>
              <h3 className="card-title">Taco {i}</h3>
              <p className="card-description">Delicious taco with fresh ingredients</p>
              <div className="card-footer">
                <div className="price-tag">$3.50</div>
                <button className="add-btn premium-button text-white">Add</button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

}

