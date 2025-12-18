import { useEffect, useState } from 'react';
import axios from 'axios';
import './App.css';

// Configuration de l'API
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

function App() {
  const [users, setUsers] = useState([]);
  const [queryId, setQueryId] = useState('');
  const [queriedUser, setQueriedUser] = useState(null);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadUsers();
    loadComments();
  }, []);

  // Charger tous les utilisateurs
  const loadUsers = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/users`);
      setUsers(response.data);
      setError(null);
    } catch (err) {
      console.error('Error loading users:', err.message);
      setError('Impossible de charger les utilisateurs');
    }
  };

  // Charger les commentaires
  const loadComments = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/comments`);
      setComments(response.data);
      setError(null);
    } catch (err) {
      console.error('Error loading comments:', err.message);
      setError('Impossible de charger les commentaires');
    }
  };

  // Peupler la base avec des utilisateurs aléatoires
  const handlePopulate = async () => {
    setLoading(true);
    try {
      await axios.get(`${API_BASE_URL}/populate`);
      await loadUsers();
      setError(null);
      alert('3 utilisateurs ajoutés avec succès !');
    } catch (err) {
      console.error('Error populating users:', err.message);
      setError('Erreur lors du peuplement de la base');
    } finally {
      setLoading(false);
    }
  };

  // Rechercher un utilisateur par ID (méthode sécurisée)
  const handleQuery = async (e) => {
    e.preventDefault();
    
    if (!queryId || isNaN(parseInt(queryId))) {
      setError('Veuillez entrer un ID valide');
      return;
    }

    setLoading(true);
    try {
      // Méthode 1 : Via POST avec JSON (sécurisé)
      const response = await axios.post(
        `${API_BASE_URL}/user`,
        { id: parseInt(queryId) },
        { headers: { 'Content-Type': 'application/json' } }
      );
      
      setQueriedUser(response.data);
      setError(null);
    } catch (err) {
      console.error('Error querying user:', err);
      if (err.response?.status === 404) {
        setError('Utilisateur non trouvé');
      } else {
        setError('Erreur lors de la recherche');
      }
      setQueriedUser(null);
    } finally {
      setLoading(false);
    }
  };

  // Méthode alternative : via GET (encore plus sécurisé)
  const handleQueryViaGet = async (e) => {
    e.preventDefault();
    
    if (!queryId || isNaN(parseInt(queryId))) {
      setError('Veuillez entrer un ID valide');
      return;
    }

    setLoading(true);
    try {
      const response = await axios.get(`${API_BASE_URL}/user/${queryId}`);
      setQueriedUser(response.data);
      setError(null);
    } catch (err) {
      console.error('Error querying user:', err);
      if (err.response?.status === 404) {
        setError('Utilisateur non trouvé');
      } else {
        setError('Erreur lors de la recherche');
      }
      setQueriedUser(null);
    } finally {
      setLoading(false);
    }
  };

  // Soumettre un commentaire (compatible avec le backend)
  const handleCommentSubmit = async (e) => {
    e.preventDefault();
    
    if (!newComment.trim()) {
      setError('Le commentaire ne peut pas être vide');
      return;
    }

    if (newComment.length > 500) {
      setError('Le commentaire est trop long (max 500 caractères)');
      return;
    }

    setLoading(true);
    try {
      // Envoyer en JSON (recommandé)
      await axios.post(
        `${API_BASE_URL}/comment`,
        { content: newComment },
        { headers: { 'Content-Type': 'application/json' } }
      );
      
      setNewComment('');
      await loadComments();
      setError(null);
    } catch (err) {
      console.error('Error submitting comment:', err.message);
      setError('Erreur lors de l\'envoi du commentaire');
    } finally {
      setLoading(false);
    }
  };

  // Version compatible avec text/plain (ancienne méthode)
  const handleCommentSubmitLegacy = async (e) => {
    e.preventDefault();
    
    if (!newComment.trim()) {
      setError('Le commentaire ne peut pas être vide');
      return;
    }

    setLoading(true);
    try {
      await axios.post(
        `${API_BASE_URL}/comment`,
        newComment,
        { headers: { 'Content-Type': 'text/plain' } }
      );
      
      setNewComment('');
      await loadComments();
      setError(null);
    } catch (err) {
      console.error('Error submitting comment:', err.message);
      setError('Erreur lors de l\'envoi du commentaire');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="App">
      <header className="App-header">
        <h1>🔒 Serveur Web Sécurisé</h1>
        
        {/* Messages d'erreur */}
        {error && (
          <div className="error-banner">
            ⚠️ {error}
            <button onClick={() => setError(null)}>✕</button>
          </div>
        )}

        {/* Section Peuplement */}
        <section className="populate-section">
          <h2>Peupler la base de données</h2>
          <button 
            onClick={handlePopulate} 
            disabled={loading}
            className="btn-primary"
          >
            {loading ? '⏳ Chargement...' : '➕ Ajouter 3 utilisateurs'}
          </button>
        </section>

        {/* Liste des utilisateurs */}
        <section className="users-section">
          <h2>Liste des utilisateurs ({users.length})</h2>
          <div className="users-list">
            {users.length === 0 ? (
              <p>Aucun utilisateur. Cliquez sur "Ajouter 3 utilisateurs"</p>
            ) : (
              <ul>
                {users.map(user => (
                  <li key={user.id}>
                    <strong>ID:</strong> {user.id} | <strong>Nom:</strong> {user.name}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>

        {/* Recherche d'utilisateur */}
        <section className="query-section">
          <h2>Rechercher un utilisateur</h2>
          <form onSubmit={handleQueryViaGet}>
            <input
              type="number"
              value={queryId}
              onChange={(e) => setQueryId(e.target.value)}
              placeholder="Entrer un ID"
              min="1"
              disabled={loading}
            />
            <button type="submit" disabled={loading} className="btn-secondary">
              🔍 Rechercher (GET - Sécurisé)
            </button>
            <button 
              type="button" 
              onClick={handleQuery} 
              disabled={loading}
              className="btn-alternative"
            >
              🔍 Rechercher (POST)
            </button>
          </form>

          {queriedUser && queriedUser.length > 0 && (
            <div className="query-result">
              <h3>Résultat :</h3>
              {queriedUser.map(user => (
                <div key={user.id} className="user-card">
                  <p><strong>ID:</strong> {user.id}</p>
                  <p><strong>Nom:</strong> {user.name}</p>
                  {user.created_at && (
                    <p><strong>Créé le:</strong> {new Date(user.created_at).toLocaleString('fr-FR')}</p>
                  )}
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Section Commentaires */}
        <section className="comments-section">
          <h2>Commentaires ({comments.length})</h2>
          
          <form onSubmit={handleCommentSubmit}>
            <textarea
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Écrire un commentaire (max 500 caractères)"
              maxLength={500}
              disabled={loading}
              rows={4}
            />
            <div className="char-count">
              {newComment.length}/500 caractères
            </div>
            <button type="submit" disabled={loading} className="btn-primary">
              💬 Envoyer (JSON - Recommandé)
            </button>
            <button 
              type="button" 
              onClick={handleCommentSubmitLegacy} 
              disabled={loading}
              className="btn-alternative"
            >
              💬 Envoyer (Text/Plain - Legacy)
            </button>
          </form>

          <div className="comments-list">
            {comments.length === 0 ? (
              <p>Aucun commentaire pour le moment</p>
            ) : (
              comments.map(comment => (
                <div key={comment.id} className="comment-card">
                  <div className="comment-header">
                    <span className="comment-id">#{comment.id}</span>
                    {comment.created_at && (
                      <span className="comment-date">
                        {new Date(comment.created_at).toLocaleString('fr-FR')}
                      </span>
                    )}
                  </div>
                  <div 
                    className="comment-content"
                    dangerouslySetInnerHTML={{ __html: comment.content }}
                  />
                </div>
              ))
            )}
          </div>
        </section>
      </header>
    </div>
  );
}

export default App;
