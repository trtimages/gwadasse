import { Link, useNavigate } from "react-router-dom";

export default function Layout({ children }) {
  const navigate = useNavigate(); // NOUVEAU : On active la navigation

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b">
        <div className="max-w-md mx-auto px-4 py-3 flex items-center justify-between">
          <Link to="/" className="flex items-center">
            <img src="/logo1.png" alt="Gwada Plages" className="h-8 block" />
          </Link>

          <button
            type="button"
            title="Mon Profil"
            className="border border-gray-200 bg-white rounded-full px-3 py-1.5 hover:bg-gray-50 transition active:scale-95"
            onClick={() => navigate('/profile')} // NOUVEAU : Redirection vers le profil
          >
            👤
          </button>
        </div>
      </header>

      <main className="max-w-md mx-auto px-4 py-4">
        {children}
      </main>
    </div>
  );
}