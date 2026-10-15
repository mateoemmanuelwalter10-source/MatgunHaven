import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { fetchUsers } from "../../services/userService";
import Loader from "../../components/common/Loader";

export default function UserList() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    async function loadUsers() {
      const { data } = await fetchUsers();
      setUsers(data || []);
      setLoading(false);
    }

    loadUsers();
  }, []);

  return (
    <section className="page-section">
      <div className="section-header">
        <div>
          <p className="eyebrow">User management</p>
          <h1>Admin users</h1>
          <p>Manage user profiles and access roles for your team.</p>
        </div>
        <Link className="primary-button" to="/users/add">
          Add new user
        </Link>
      </div>

      <div className="table-card">
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Role</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="3">
                  <Loader label="Loading users..." />
                </td>
              </tr>
            ) : users.length === 0 ? (
              <tr>
                <td colSpan="3">No users found.</td>
              </tr>
            ) : (
              users.map((user) => (
                <tr key={user.id}>
                  <td>{user.full_name || "—"}</td>
                  <td>{user.role || "user"}</td>
                  <td className="table-actions">
                    <button type="button" onClick={() => navigate(`/users/${user.id}/edit`)}>
                      Edit
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
